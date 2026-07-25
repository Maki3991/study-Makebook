// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MakebookPredictionMarket} from "../src/MakebookPredictionMarket.sol";
import {MakebookCampaign} from "../src/MakebookCampaign.sol";

/// @dev 可控 mock campaign：状态机由测试直接拨动；settle() 模拟"任何人触发清算"。
contract MockCampaign {
    uint8 public state; // 0 Draft, 1 Open, 2 Succeeded, 3 Failed, 4 PaidOut
    uint64 public deadline;
    bool public settlementFeasible;
    uint256 public winningQuoteId;
    uint256 public winningTierIndex;
    bool public settleCalled;

    constructor(uint64 deadline_) {
        state = 1; // Open
        deadline = deadline_;
    }

    function settle() external {
        settleCalled = true;
        state = settlementFeasible ? 2 : 3; // 模拟真实清算落态
    }

    function setState(uint8 s) external {
        state = s;
    }

    function setResult(bool feasible, uint256 quoteId, uint256 tierIndex) external {
        settlementFeasible = feasible;
        winningQuoteId = quoteId;
        winningTierIndex = tierIndex;
    }
}

contract MakebookPredictionMarketTest is Test {
    uint256 internal constant B = 0.05e18; // 0.05 INJ 流动性参数
    uint64 internal constant DEADLINE = 1_800_000_000;

    MockCampaign internal campaign;
    MakebookPredictionMarket internal market;

    address internal operator = makeAddr("operator");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    // 3 个清算档位 + 流团 = 4 结果
    uint256[] internal quoteIds = [uint256(0), 0, 1];
    uint256[] internal tierIds = [uint256(0), 1, 0];
    uint256 internal constant N = 4;
    uint256 internal constant FAIL_OUTCOME = N - 1;

    function setUp() public {
        campaign = new MockCampaign(DEADLINE);
        uint256 seed = _minSeed(B, N);
        vm.deal(operator, 100 ether);
        vm.startPrank(operator);
        market = new MakebookPredictionMarket{value: seed}(address(campaign), B, quoteIds, tierIds);
        vm.stopPrank();

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
        vm.warp(DEADLINE - 1 days);
    }

    function _minSeed(uint256 b, uint256 n) internal pure returns (uint256) {
        // b·ln(n)，与合约同算法（测试里只用手算值做交叉验证）
        uint256[5] memory lnTable = [uint256(0), 693147180559945309, 1098612288668109692, 1386294361119890619, 1609437912434100375];
        return (b * lnTable[n - 1]) / 1e18;
    }

    // ---------------------------------------------------------------------
    // 构造
    // ---------------------------------------------------------------------

    function test_constructor_setsUpOutcomes() public view {
        assertEq(market.outcomesLength(), N);
        assertEq(market.outcomeQuoteIds(2), 1);
        assertEq(market.outcomeTierIds(2), 0);
        assertEq(market.b(), B);
        assertEq(market.deadline(), DEADLINE);
        assertEq(market.operator(), operator);
    }

    /// @dev 外部部署助手：让构造 revert 发生在更低调用深度，expectRevert 才能捕获。
    function deployMarket(uint256 seed) external returns (address) {
        return address(new MakebookPredictionMarket{value: seed}(address(campaign), B, quoteIds, tierIds));
    }

    function test_constructor_revertInsufficientSeed() public {
        uint256 seed = _minSeed(B, N);
        vm.deal(address(this), seed);
        vm.expectRevert(MakebookPredictionMarket.InsufficientSeed.selector);
        this.deployMarket(seed - 1);
    }

    function test_initialPrices_uniform() public view {
        uint256[] memory p = market.prices();
        uint256 sum;
        for (uint256 i = 0; i < N; i++) {
            assertApproxEqAbs(p[i], 0.25e18, 1e12, "uniform init");
            sum += p[i];
        }
        assertApproxEqAbs(sum, 1e18, 1e12, "prices sum to 1");
    }

    // ---------------------------------------------------------------------
    // 交易
    // ---------------------------------------------------------------------

    function test_buy_movesPriceUp() public {
        uint256 before_ = market.price(0);
        uint256 cost = market.calcBuyCost(0, 0.02e18);
        vm.prank(alice);
        market.buy{value: cost}(0, 0.02e18, cost);
        uint256 after_ = market.price(0);
        assertGt(after_, before_, "bought outcome price up");

        uint256[] memory p = market.prices();
        uint256 sum;
        for (uint256 i = 0; i < N; i++) sum += p[i];
        assertApproxEqAbs(sum, 1e18, 1e12, "prices sum to 1 after trade");
        for (uint256 i = 1; i < N; i++) {
            assertLt(p[i], 0.25e18 + 1e12, "other outcomes price down");
        }
    }

    function test_buy_refundsExcess() public {
        uint256 cost = market.calcBuyCost(1, 0.01e18);
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        market.buy{value: cost + 0.005e18}(1, 0.01e18, cost + 0.005e18);
        assertEq(alice.balance, balBefore - cost, "excess refunded");
        assertEq(market.sharesOf(alice, 1), 0.01e18);
    }

    function test_buy_revertSlippage() public {
        uint256 cost = market.calcBuyCost(0, 0.02e18);
        vm.prank(alice);
        vm.expectRevert(MakebookPredictionMarket.SlippageExceeded.selector);
        market.buy{value: cost}(0, 0.02e18, cost - 1);
    }

    function test_buySell_roundTrip() public {
        uint256 shares = 0.02e18;
        uint256 cost = market.calcBuyCost(2, shares);
        vm.startPrank(alice);
        market.buy{value: cost}(2, shares, cost);

        uint256 ret = market.calcSellReturn(2, shares);
        market.sell(2, shares, ret);
        vm.stopPrank();

        assertEq(market.sharesOf(alice, 2), 0);
        // 往返损耗仅为定点舍入尘埃（< 0.1% 本金）
        assertApproxEqRel(ret, cost, 0.001e18, "round trip ~= principal");
        assertApproxEqAbs(market.price(2), 0.25e18, 1e12, "price back to uniform");
    }

    function test_sell_revertInsufficientShares() public {
        vm.prank(alice);
        vm.expectRevert(MakebookPredictionMarket.InsufficientShares.selector);
        market.sell(0, 1e18, 0);
    }

    function test_tradingClosed_afterDeadline() public {
        vm.warp(DEADLINE);
        vm.prank(alice);
        vm.expectRevert(MakebookPredictionMarket.TradingClosed.selector);
        market.buy{value: 0.01e18}(0, 0.01e18, type(uint256).max);
    }

    // ---------------------------------------------------------------------
    // 开奖与领取
    // ---------------------------------------------------------------------

    function test_resolve_failedCampaign_failOutcomeWins() public {
        // alice 买流团，bob 买档位 0
        uint256 costA = market.calcBuyCost(FAIL_OUTCOME, 0.02e18);
        vm.prank(alice);
        market.buy{value: costA}(FAIL_OUTCOME, 0.02e18, costA);
        uint256 costB = market.calcBuyCost(0, 0.03e18);
        vm.prank(bob);
        market.buy{value: costB}(0, 0.03e18, costB);

        vm.warp(DEADLINE + 1);
        campaign.setState(3); // Failed
        market.resolve();

        assertTrue(market.resolved());
        assertEq(market.winningOutcome(), FAIL_OUTCOME);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        market.redeem();
        assertEq(alice.balance, balBefore + 0.02e18, "1 share = 1 INJ");

        vm.prank(bob);
        vm.expectRevert(MakebookPredictionMarket.NothingToRedeem.selector);
        market.redeem();
    }

    function test_resolve_succeededCampaign_mapsTierOutcome() public {
        uint256 cost = market.calcBuyCost(2, 0.02e18);
        vm.prank(alice);
        market.buy{value: cost}(2, 0.02e18, cost);

        vm.warp(DEADLINE + 1);
        campaign.setResult(true, 1, 0); // quoteId=1, tierIndex=0 → outcome 2
        campaign.setState(2);
        market.resolve();
        assertEq(market.winningOutcome(), 2);

        vm.prank(alice);
        market.redeem();
        assertEq(market.sharesOf(alice, 2), 0);
    }

    function test_resolve_triggersSettle_whenStillOpen() public {
        uint256 cost = market.calcBuyCost(0, 0.01e18);
        vm.prank(alice);
        market.buy{value: cost}(0, 0.01e18, cost);

        vm.warp(DEADLINE + 1);
        campaign.setResult(true, 0, 0); // settle 后将清算到 (0,0) → outcome 0
        // state 仍是 Open：resolve 应代为调用 settle()，mock settle 会落态 Succeeded
        market.resolve();

        assertTrue(campaign.settleCalled(), "resolve triggers campaign.settle()");
        assertEq(campaign.state(), 2);
        assertTrue(market.resolved());
        assertEq(market.winningOutcome(), 0);
    }

    function test_resolve_revertBeforeDeadline() public {
        vm.expectRevert(MakebookPredictionMarket.DeadlineNotReached.selector);
        market.resolve();
    }

    function test_resolve_idempotent() public {
        vm.warp(DEADLINE + 1);
        campaign.setState(3);
        market.resolve();
        uint64 at = market.resolvedAt();
        vm.warp(DEADLINE + 100);
        market.resolve(); // 不 revert、不改状态
        assertEq(market.resolvedAt(), at);
    }

    function test_redeem_revertBeforeResolve() public {
        vm.prank(alice);
        vm.expectRevert(MakebookPredictionMarket.NotResolved.selector);
        market.redeem();
    }

    // ---------------------------------------------------------------------
    // 不变式：最坏结果下合约依然有偿付能力（LMSR + 种子金）
    // ---------------------------------------------------------------------

    function testFuzz_solvency_worstOutcomeRedeemable(uint256[6] memory amounts, uint256[6] memory outcomePicks) public {
        address[3] memory users = [alice, bob, carol];
        for (uint256 i = 0; i < 6; i++) {
            uint256 outcome = outcomePicks[i] % N;
            uint256 amt = bound(amounts[i], 0.001e18, 0.05e18);
            uint256 cost = market.calcBuyCost(outcome, amt);
            address u = users[i % 3];
            vm.prank(u);
            market.buy{value: cost}(outcome, amt, cost);
        }

        // 找到 q 最大的结果 = 最坏情况，让 campaign 清算到它
        uint256 worst;
        int256 maxQ = market.q(0);
        for (uint256 i = 1; i < N; i++) {
            if (market.q(i) > maxQ) {
                maxQ = market.q(i);
                worst = i;
            }
        }
        vm.warp(DEADLINE + 1);
        if (worst == FAIL_OUTCOME) {
            campaign.setState(3);
        } else {
            campaign.setResult(true, quoteIds[worst], tierIds[worst]);
            campaign.setState(2);
        }
        market.resolve();
        assertEq(market.winningOutcome(), worst);

        // 所有赢家全额领取不破产
        for (uint256 i = 0; i < 3; i++) {
            if (market.sharesOf(users[i], worst) > 0) {
                vm.prank(users[i]);
                market.redeem();
            }
        }
        assertEq(market.winningSharesOutstanding(), 0);
        // 剩余余额 = 种子金 ± LMSR 损益，恒 ≥ 0
        assertGe(address(market).balance, 0);
    }

    // ---------------------------------------------------------------------
    // Fork：真实 success 批次端到端（Open → 交易 → warp → settle → resolve → redeem）
    // ---------------------------------------------------------------------

    /// @dev 枚举 campaign 全部 (quoteId, tierIndex) 档位。独立函数避免 stack too deep。
    function _enumerateTiers(MakebookCampaign real)
        internal
        view
        returns (uint256[] memory qIds, uint256[] memory tIds)
    {
        uint256 nQuotes = real.quotesLength();
        uint256 k;
        for (uint256 i = 0; i < nQuotes; i++) {
            k += real.getQuote(i).tiers.length;
        }
        qIds = new uint256[](k);
        tIds = new uint256[](k);
        uint256 idx;
        for (uint256 i = 0; i < nQuotes; i++) {
            uint256 nTiers = real.getQuote(i).tiers.length;
            for (uint256 t = 0; t < nTiers; t++) {
                qIds[idx] = i;
                tIds[idx] = t;
                idx++;
            }
        }
    }

    function test_fork_successCampaign_endToEnd() public {
        string memory rpc = vm.envOr("INJ_RPC", string("https://k8s.testnet.json-rpc.injective.network/"));
        vm.createSelectFork(rpc);

        MakebookCampaign real = MakebookCampaign(payable(0x260A9C9075B09B5950385fEB1AEa7d83a25E556e));
        assertEq(uint8(real.state()), 1, "campaign Open");

        (uint256[] memory qIds, uint256[] memory tIds) = _enumerateTiers(real);
        uint256 n = qIds.length + 1;

        uint256 seed = (B * 16e17) / 1e18; // 宽松种子：b·1.6 ≥ b·ln(7)
        vm.deal(operator, 10 ether);
        vm.prank(operator);
        MakebookPredictionMarket m = new MakebookPredictionMarket{value: seed}(address(real), B, qIds, tIds);
        assertEq(m.outcomesLength(), n);

        // 开盘均匀概率
        uint256[] memory p = m.prices();
        uint256 sum;
        for (uint256 i = 0; i < n; i++) sum += p[i];
        assertApproxEqAbs(sum, 1e18, 1e12);

        // alice 买"算法预览结果"，bob 买流团
        (bool feasible, uint256 pq, uint256 pt, , ) = real.previewSettlement();
        assertTrue(feasible, "success batch feasible");
        uint256 algoOutcome = type(uint256).max;
        for (uint256 i = 0; i < qIds.length; i++) {
            if (qIds[i] == pq && tIds[i] == pt) algoOutcome = i;
        }
        assertTrue(algoOutcome != type(uint256).max, "preview outcome must be in market");

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
        uint256 costA = m.calcBuyCost(algoOutcome, 0.02e18);
        vm.prank(alice);
        m.buy{value: costA}(algoOutcome, 0.02e18, costA);
        uint256 costB = m.calcBuyCost(n - 1, 0.01e18);
        vm.prank(bob);
        m.buy{value: costB}(n - 1, 0.01e18, costB);

        // 推进到 deadline 后：resolve 代为触发真实 settle
        vm.warp(real.deadline() + 1);
        m.resolve();

        assertTrue(m.resolved());
        assertEq(uint8(real.state()), 2, "campaign settled to Succeeded");
        assertEq(m.winningOutcome(), algoOutcome, "market resolves to clearing tier");

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        m.redeem();
        assertEq(alice.balance, balBefore + 0.02e18);

        vm.prank(bob);
        vm.expectRevert(MakebookPredictionMarket.NothingToRedeem.selector);
        m.redeem();
    }
}
