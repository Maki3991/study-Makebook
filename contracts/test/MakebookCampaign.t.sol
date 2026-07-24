// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MakebookCampaign} from "../src/MakebookCampaign.sol";

/// @dev 恶意接收者：receive() 永远 revert，用于 CT-10 验证单个恶意 Buyer 不阻塞他人 claim。
contract RevertingReceiver {
    receive() external payable {
        revert("I always revert");
    }

    function placeOrder(MakebookCampaign c, bytes32 variantHash, uint256 maxPrice) external payable {
        c.placeOrder{value: msg.value}(variantHash, maxPrice);
    }

    function claim(MakebookCampaign c) external {
        c.claimRefund();
    }
}

contract MakebookCampaignTest is Test {
    MakebookCampaign internal campaign;

    address internal operator = makeAddr("operator");
    address internal north = makeAddr("factoryNorth");
    address internal loom = makeAddr("factoryLoom");
    address internal outsider = makeAddr("outsider");

    address internal buyerA = makeAddr("buyerA");
    address internal buyerB = makeAddr("buyerB");
    address internal buyerC = makeAddr("buyerC");
    address internal buyerD = makeAddr("buyerD");
    address internal buyerE = makeAddr("buyerE");

    bytes32 internal constant MANIFEST_HASH = keccak256("makebook.manifest.v1/FRAME-01");
    string internal constant MANIFEST_URI = "https://example.com/manifests/frame-01.json";
    bytes32 internal constant VARIANT = keccak256("FRAME-01/default");

    uint64 internal deadline;

    function setUp() public {
        deadline = uint64(block.timestamp + 1 days);
        campaign = new MakebookCampaign(operator, MANIFEST_HASH, MANIFEST_URI, deadline);
        vm.deal(buyerA, 10 ether);
        vm.deal(buyerB, 10 ether);
        vm.deal(buyerC, 10 ether);
        vm.deal(buyerD, 10 ether);
        vm.deal(buyerE, 10 ether);
    }

    // ------------------------------------------------------------------
    // 辅助函数
    // ------------------------------------------------------------------

    function _tier(uint32 minQty, uint256 price) internal pure returns (MakebookCampaign.Tier memory) {
        return MakebookCampaign.Tier({minQty: minQty, unitPriceWei: price});
    }

    function _tiers1(uint32 minQty, uint256 price) internal pure returns (MakebookCampaign.Tier[] memory t) {
        t = new MakebookCampaign.Tier[](1);
        t[0] = _tier(minQty, price);
    }

    function _tiers2(uint32 m1, uint256 p1, uint32 m2, uint256 p2)
        internal
        pure
        returns (MakebookCampaign.Tier[] memory t)
    {
        t = new MakebookCampaign.Tier[](2);
        t[0] = _tier(m1, p1);
        t[1] = _tier(m2, p2);
    }

    function _tiers3(uint32 m1, uint256 p1, uint32 m2, uint256 p2, uint32 m3, uint256 p3)
        internal
        pure
        returns (MakebookCampaign.Tier[] memory t)
    {
        t = new MakebookCampaign.Tier[](3);
        t[0] = _tier(m1, p1);
        t[1] = _tier(m2, p2);
        t[2] = _tier(m3, p3);
    }

    function _registerNorthAndLoom() internal {
        vm.startPrank(operator);
        campaign.registerFactory(north, keccak256("north-profile"));
        campaign.registerFactory(loom, keccak256("loom-profile"));
        vm.stopPrank();
    }

    /// @dev 附录 A.1 缩放版报价：North min3@0.024；Loom min3@0.019。
    function _appendixAQuotes() internal {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("north-quote"), _tiers1(3, 0.024 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("loom-quote"), _tiers1(3, 0.019 ether));
    }

    function _open() internal {
        vm.prank(operator);
        campaign.openCampaign();
    }

    function _order(address buyer, uint256 maxPrice) internal {
        vm.prank(buyer);
        campaign.placeOrder{value: maxPrice}(VARIANT, maxPrice);
    }

    /// @dev 附录 A.1 缩放版 5 个 Buyer：0.026 / 0.024 / 0.021 / 0.019 / 0.017。
    function _appendixAOrders() internal {
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        _order(buyerD, 0.019 ether);
        _order(buyerE, 0.017 ether);
    }

    function _settleAfterDeadline() internal {
        vm.warp(deadline);
        campaign.settle();
    }

    // ------------------------------------------------------------------
    // 构造参数校验
    // ------------------------------------------------------------------

    function testConstructorZeroOperatorReverts() public {
        vm.expectRevert(MakebookCampaign.ZeroAddress.selector);
        new MakebookCampaign(address(0), MANIFEST_HASH, MANIFEST_URI, deadline);
    }

    function testConstructorPastDeadlineReverts() public {
        vm.expectRevert(MakebookCampaign.DeadlineNotInFuture.selector);
        new MakebookCampaign(operator, MANIFEST_HASH, MANIFEST_URI, uint64(block.timestamp));
    }

    function testInitialState() public view {
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Draft));
        assertEq(campaign.operator(), operator);
        assertEq(campaign.manifestHash(), MANIFEST_HASH);
        assertEq(campaign.manifestURI(), MANIFEST_URI);
        assertEq(campaign.deadline(), deadline);
        assertEq(campaign.MAX_ORDERS(), 50);
        assertEq(campaign.MAX_FACTORIES(), 2);
        assertEq(campaign.MAX_TIERS(), 3);
    }

    // ------------------------------------------------------------------
    // CT-01：Draft/Open 权限
    // ------------------------------------------------------------------

    function testCT01_RegisterFactoryOnlyOperator() public {
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NotOperator.selector);
        campaign.registerFactory(north, keccak256("p"));
    }

    function testCT01_SubmitQuoteOnlyRegisteredFactory() public {
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.FactoryNotRegistered.selector);
        campaign.submitQuote(keccak256("q"), _tiers1(3, 0.02 ether));
    }

    function testCT01_OpenCampaignOnlyOperator() public {
        _appendixAQuotes();
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NotOperator.selector);
        campaign.openCampaign();
    }

    function testCT01_OpenCampaignRequiresQuote() public {
        vm.prank(operator);
        vm.expectRevert(MakebookCampaign.NoQuotes.selector);
        campaign.openCampaign();
    }

    function testCT01_RegisterFactoryMaxTwo() public {
        _registerNorthAndLoom();
        vm.prank(operator);
        vm.expectRevert(MakebookCampaign.TooManyFactories.selector);
        campaign.registerFactory(outsider, keccak256("p3"));
    }

    function testCT01_RegisterFactoryDuplicateReverts() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(operator);
        vm.expectRevert(MakebookCampaign.FactoryAlreadyRegistered.selector);
        campaign.registerFactory(north, keccak256("p2"));
    }

    function testCT01_DraftActionsFrozenAfterOpen() public {
        _appendixAQuotes();
        _open();
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Draft, MakebookCampaign.State.Open));
        campaign.registerFactory(outsider, keccak256("p"));
        vm.prank(north);
        vm.expectRevert(abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Draft, MakebookCampaign.State.Open));
        campaign.submitQuote(keccak256("q2"), _tiers1(3, 0.02 ether));
    }

    function testCT01_EventsOnRegisterAndQuote() public {
        vm.prank(operator);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.FactoryRegistered(north, keccak256("north-profile"));
        campaign.registerFactory(north, keccak256("north-profile"));

        vm.prank(north);
        vm.expectEmit(true, true, false, true);
        emit MakebookCampaign.QuoteSubmitted(0, north, keccak256("north-quote"));
        campaign.submitQuote(keccak256("north-quote"), _tiers1(3, 0.024 ether));
    }

    // ------------------------------------------------------------------
    // CT-02：报价校验边界
    // ------------------------------------------------------------------

    function testCT02_ZeroTiersReverts() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        MakebookCampaign.Tier[] memory t = new MakebookCampaign.Tier[](0);
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), t);
    }

    function testCT02_FourTiersReverts() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        MakebookCampaign.Tier[] memory t = new MakebookCampaign.Tier[](4);
        t[0] = _tier(1, 0.04 ether);
        t[1] = _tier(2, 0.03 ether);
        t[2] = _tier(3, 0.02 ether);
        t[3] = _tier(4, 0.01 ether);
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), t);
    }

    function testCT02_ZeroMinQtyOrPriceReverts() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), _tiers1(0, 0.02 ether));
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), _tiers1(3, 0));
    }

    function testCT02_MinQtyMustIncrease() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), _tiers2(3, 0.03 ether, 3, 0.02 ether)); // 并列不允许
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), _tiers2(5, 0.03 ether, 3, 0.02 ether)); // 递减不允许
    }

    function testCT02_PriceMustStrictlyDecrease() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), _tiers2(3, 0.02 ether, 5, 0.02 ether)); // 同价不允许
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.InvalidTiers.selector);
        campaign.submitQuote(keccak256("q"), _tiers2(3, 0.02 ether, 5, 0.03 ether)); // 涨价不允许
    }

    function testCT02_ValidOneAndThreeTiersAccepted() public {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q1"), _tiers1(3, 0.024 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("q2"), _tiers3(3, 0.024 ether, 5, 0.021 ether, 10, 0.018 ether));
        assertEq(campaign.quotesLength(), 2);
        MakebookCampaign.FactoryQuote memory q = campaign.getQuote(1);
        assertEq(q.factory, loom);
        assertEq(q.tiers.length, 3);
        assertEq(q.tiers[2].minQty, 10);
        assertEq(q.tiers[2].unitPriceWei, 0.018 ether);
    }

    function testCT02_SecondQuoteFromSameFactoryReverts() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(north);
        campaign.submitQuote(keccak256("q1"), _tiers1(3, 0.024 ether));
        vm.prank(north);
        vm.expectRevert(MakebookCampaign.AlreadyQuoted.selector);
        campaign.submitQuote(keccak256("q2"), _tiers1(5, 0.02 ether));
    }

    // ------------------------------------------------------------------
    // CT-03：下单
    // ------------------------------------------------------------------

    function testCT03_OrderValueMismatchReverts() public {
        _appendixAQuotes();
        _open();
        vm.prank(buyerA);
        vm.expectRevert(MakebookCampaign.InvalidPayment.selector);
        campaign.placeOrder{value: 0.02 ether}(VARIANT, 0.026 ether);
    }

    function testCT03_ZeroValueOrderReverts() public {
        _appendixAQuotes();
        _open();
        vm.prank(buyerA);
        vm.expectRevert(MakebookCampaign.InvalidPayment.selector);
        campaign.placeOrder{value: 0}(VARIANT, 0);
    }

    function testCT03_DuplicateOrderReverts() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        vm.prank(buyerA);
        vm.expectRevert(MakebookCampaign.DuplicateOrder.selector);
        campaign.placeOrder{value: 0.01 ether}(VARIANT, 0.01 ether);
    }

    function testCT03_OrderBeforeOpenReverts() public {
        _appendixAQuotes();
        vm.prank(buyerA);
        vm.expectRevert(MakebookCampaign.CampaignNotOpen.selector);
        campaign.placeOrder{value: 0.026 ether}(VARIANT, 0.026 ether);
    }

    function testCT03_OrderAtAndAfterDeadlineReverts() public {
        _appendixAQuotes();
        _open();
        // deadline 前 1 秒仍可下单
        vm.warp(deadline - 1);
        _order(buyerA, 0.026 ether);
        // 恰好到 deadline 即停止接单
        vm.warp(deadline);
        vm.prank(buyerB);
        vm.expectRevert(MakebookCampaign.DeadlinePassed.selector);
        campaign.placeOrder{value: 0.024 ether}(VARIANT, 0.024 ether);
    }

    function testCT03_FiftyFirstOrderReverts() public {
        _appendixAQuotes();
        _open();
        for (uint256 i = 0; i < 50; i++) {
            address b = address(uint160(0x1000 + i));
            vm.deal(b, 1 ether);
            vm.prank(b);
            campaign.placeOrder{value: 0.02 ether}(VARIANT, 0.02 ether);
        }
        assertEq(campaign.ordersLength(), 50);
        vm.deal(outsider, 1 ether);
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.OrderLimitReached.selector);
        campaign.placeOrder{value: 0.02 ether}(VARIANT, 0.02 ether);
    }

    function testCT03_OrderRecordedAndEventEmitted() public {
        _appendixAQuotes();
        _open();
        vm.prank(buyerA);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.OrderPlaced(buyerA, 0.026 ether, VARIANT);
        campaign.placeOrder{value: 0.026 ether}(VARIANT, 0.026 ether);

        MakebookCampaign.Order memory o = campaign.getOrder(buyerA);
        assertEq(o.buyer, buyerA);
        assertEq(o.maxPriceWei, 0.026 ether);
        assertEq(o.variantHash, VARIANT);
        assertFalse(o.refundClaimed);
        assertEq(campaign.ordersLength(), 1);
        assertEq(address(campaign).balance, 0.026 ether);
    }

    // ------------------------------------------------------------------
    // CT-04：MOQ 失败（附录 A.2）
    // ------------------------------------------------------------------

    function testCT04_MoqFailureGoesToFailed() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether); // 只有 2 单，MOQ = 3

        (bool feasible,,,,) = campaign.previewSettlement();
        assertFalse(feasible);

        vm.expectEmit(false, false, false, true);
        emit MakebookCampaign.CampaignSettled(false, 0, 0, 0, 0);
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Failed));
        assertFalse(campaign.settlementFeasible());
        assertEq(campaign.winnerCount(), 0);
        assertEq(campaign.factoryReceivable(), 0); // INV-10
        assertEq(campaign.selectedFactory(), address(0));
    }

    function testCT04_FailedFullRefunds() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _settleAfterDeadline();

        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + 0.026 ether);

        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.024 ether);
        assertEq(address(campaign).balance, 0);
    }

    function testCT04_FailedFactoryCannotClaimPayout() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _settleAfterDeadline();
        vm.prank(loom);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.Failed)
        );
        campaign.claimPayout();
    }

    // ------------------------------------------------------------------
    // CT-05：精确 MOQ 边界（eligibleCount == minQty 可行）
    // ------------------------------------------------------------------

    function testCT05_ExactMoqBoundaryFeasible() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether); // Loom eligibleCount 恰好 = 3 = minQty

        _settleAfterDeadline();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
        assertEq(campaign.winningQuoteId(), 1); // Loom
        assertEq(campaign.clearingPrice(), 0.019 ether);
        assertEq(campaign.winnerCount(), 3);
        assertEq(campaign.factoryReceivable(), 3 * 0.019 ether);
    }

    function testCT05_OneBelowMoqInfeasible() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether); // 2 < 3，全部不可行
        _settleAfterDeadline();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Failed));
    }

    // ------------------------------------------------------------------
    // CT-06：多 tier 选择与 tie-break
    // ------------------------------------------------------------------

    /// @dev R-04：feasible tiers 中 eligibleCount 最大者胜出（count 较小的可行档落选）。
    function testCT06_MaxEligibleCountWins() public {
        _registerNorthAndLoom();
        // North：min2 @ 0.022（count=2 可行）
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers1(2, 0.022 ether));
        // Loom：min3 @ 0.020（count=3 可行）
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers1(3, 0.020 ether));
        _open();
        _order(buyerA, 0.025 ether);
        _order(buyerB, 0.022 ether);
        _order(buyerC, 0.020 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 1); // Loom 以 count=3 胜出
        assertEq(campaign.clearingPrice(), 0.020 ether);
        assertEq(campaign.winnerCount(), 3);
    }

    /// @dev R-05：eligibleCount 并列时取价低者（跨工厂）。
    function testCT06_CountTieBreaksByLowerPrice() public {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers1(3, 0.020 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers1(3, 0.015 ether));
        _open();
        _order(buyerA, 0.025 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 1); // count 同为 3，Loom 价低
        assertEq(campaign.clearingPrice(), 0.015 ether);
    }

    /// @dev R-06：count 与 price 完全并列时取 quoteId 更小者。
    function testCT06_FullTieBreaksBySmallerQuoteId() public {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers1(3, 0.020 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers1(3, 0.020 ether));
        _open();
        _order(buyerA, 0.025 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 0); // North 先提交
        assertEq(campaign.selectedFactory(), north);
    }

    /// @dev 多 tier 报价内部选择：满足更大 MOQ 的低价档若 count 并列更小档，按价低胜出。
    function testCT06_MultiTierWithinSingleQuote() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers2(3, 0.024 ether, 5, 0.019 ether));
        _open();
        // 5 人全部 ≥ 0.019：tier0 count=5(min3,0.024)，tier1 count=5(min5,0.019)
        // count 并列 5 → 价低者 tier1 胜
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        _order(buyerD, 0.019 ether);
        _order(buyerE, 0.019 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 0);
        assertEq(campaign.winningTierIndex(), 1);
        assertEq(campaign.clearingPrice(), 0.019 ether);
        assertEq(campaign.winnerCount(), 5);
    }

    // ------------------------------------------------------------------
    // CT-07：边界价格 —— maxPrice == clearingPrice 为赢家，少 1 wei 落选
    // ------------------------------------------------------------------

    function testCT07_MaxPriceEqualClearingPriceIsWinner() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerD, 0.019 ether); // 恰好等于 clearingPrice
        _settleAfterDeadline();
        assertEq(campaign.winnerCount(), 3);

        // 赢家差额为 0：优雅处理，标记已领取、发出 0 金额事件、不转账
        vm.prank(buyerD);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.RefundClaimed(buyerD, 0);
        campaign.claimRefund();
        assertTrue(campaign.getOrder(buyerD).refundClaimed);
    }

    function testCT07_OneWeiBelowClearingPriceLoses() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        address dust = makeAddr("dustBuyer");
        vm.deal(dust, 1 ether);
        _order(dust, 0.019 ether - 1); // 少 1 wei → 落选
        _settleAfterDeadline();
        assertEq(campaign.winnerCount(), 3); // dust 不计入

        uint256 bal = dust.balance;
        vm.prank(dust);
        campaign.claimRefund();
        assertEq(dust.balance, bal + 0.019 ether - 1); // 全额退款
    }

    // ------------------------------------------------------------------
    // CT-08：退款 —— 赢家差额 / 落选全额 / 失败全额 / 重复领取拒绝
    // ------------------------------------------------------------------

    function testCT08_RefundAmountsAppendixA() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();

        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + 0.007 ether); // 0.026 - 0.019

        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.005 ether);

        uint256 balC = buyerC.balance;
        vm.prank(buyerC);
        campaign.claimRefund();
        assertEq(buyerC.balance, balC + 0.002 ether);

        uint256 balE = buyerE.balance;
        vm.prank(buyerE);
        campaign.claimRefund();
        assertEq(buyerE.balance, balE + 0.017 ether); // 落选全额
    }

    function testCT08_DoubleClaimReverts() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();
        vm.prank(buyerA);
        campaign.claimRefund();
        vm.prank(buyerA);
        vm.expectRevert(MakebookCampaign.AlreadyClaimed.selector);
        campaign.claimRefund();
    }

    function testCT08_NonBuyerClaimReverts() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NoOrder.selector);
        campaign.claimRefund();
    }

    function testCT08_ClaimBeforeSettleReverts() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        vm.prank(buyerA);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.Open)
        );
        campaign.claimRefund();
    }

    // ------------------------------------------------------------------
    // CT-09：Payout —— 仅中标工厂、金额正确、只能一次
    // ------------------------------------------------------------------

    function testCT09_FactoryPayoutExactAmountOnce() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();

        uint256 bal = loom.balance;
        vm.prank(loom);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.FactoryPayoutClaimed(loom, 0.076 ether);
        campaign.claimPayout();
        assertEq(loom.balance, bal + 0.076 ether); // 4 × 0.019
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));

        // 第二次：状态已是 PaidOut，拒绝
        vm.prank(loom);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.PaidOut)
        );
        campaign.claimPayout();
    }

    function testCT09_OnlySelectedFactoryCanClaim() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();
        vm.prank(north); // 未中标工厂
        vm.expectRevert(MakebookCampaign.NotSelectedFactory.selector);
        campaign.claimPayout();
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NotSelectedFactory.selector);
        campaign.claimPayout();
    }

    function testCT09_BuyersCanStillRefundAfterPaidOut() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));

        uint256 balE = buyerE.balance;
        vm.prank(buyerE);
        campaign.claimRefund();
        assertEq(buyerE.balance, balE + 0.017 ether);
    }

    // ------------------------------------------------------------------
    // CT-10：幂等 / 恶意接收者不阻塞他人
    // ------------------------------------------------------------------

    function testCT10_SettleBeforeDeadlineReverts() public {
        _appendixAQuotes();
        _open();
        vm.expectRevert(MakebookCampaign.DeadlineNotReached.selector);
        campaign.settle();
    }

    function testCT10_DoubleSettleReverts() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();
        vm.expectRevert(MakebookCampaign.CampaignNotOpen.selector);
        campaign.settle();
    }

    function testCT10_SettleCallableByAnyone() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        vm.warp(deadline);
        vm.prank(outsider); // 非 operator / 非 factory
        campaign.settle();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
    }

    function testCT10_MaliciousReceiverDoesNotBlockOthers() public {
        _appendixAQuotes();
        _open();
        RevertingReceiver evil = new RevertingReceiver();
        vm.deal(address(evil), 1 ether);
        evil.placeOrder{value: 0.026 ether}(campaign, VARIANT, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        _settleAfterDeadline();

        // 恶意合约的 claim 失败（receive  revert → TransferFailed），状态回滚
        vm.expectRevert(MakebookCampaign.TransferFailed.selector);
        evil.claim(campaign);
        assertFalse(campaign.getOrder(address(evil)).refundClaimed);

        // 其他 Buyer 不受影响
        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.005 ether);

        // 工厂 payout 也不受影响
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));
    }

    // ------------------------------------------------------------------
    // CT-11：余额不变量 fuzz（INV-01）
    // ------------------------------------------------------------------

    /// @dev fuzz：随机订单数与价格，settle 后合约余额 ≥ 全部未领 liabilities；全部领取后余额归零。
    function testFuzzCT11_BalanceCoversLiabilities(uint8 orderCountSeed, bytes32 priceSeed) public {
        uint256 n = bound(orderCountSeed, 0, 50);

        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers2(3, 0.024 ether, 10, 0.020 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers2(3, 0.019 ether, 20, 0.015 ether));
        _open();

        address[] memory buyers = new address[](n);
        uint256[] memory prices = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 price = bound(uint256(keccak256(abi.encode(priceSeed, i))), 0.001 ether, 0.05 ether);
            address b = address(uint160(0xBEEF00 + i));
            buyers[i] = b;
            prices[i] = price;
            vm.deal(b, 1 ether);
            vm.prank(b);
            campaign.placeOrder{value: price}(VARIANT, price);
        }
        assertEq(address(campaign).balance, _sum(prices)); // INV-03

        vm.warp(deadline);
        campaign.settle();

        // 计算全部未领 liabilities
        MakebookCampaign.State s = campaign.state();
        uint256 liabilities = 0;
        if (s == MakebookCampaign.State.Failed) {
            liabilities = _sum(prices);
        } else {
            uint256 cp = campaign.clearingPrice();
            for (uint256 i = 0; i < n; i++) {
                liabilities += prices[i] >= cp ? prices[i] - cp : prices[i];
            }
            liabilities += campaign.factoryReceivable();
        }
        assertGe(address(campaign).balance, liabilities); // INV-01

        // 全部领取后余额必须归零（金额守恒）
        for (uint256 i = 0; i < n; i++) {
            vm.prank(buyers[i]);
            campaign.claimRefund();
        }
        if (s == MakebookCampaign.State.Succeeded) {
            vm.prank(loom.balance >= 0 ? campaign.selectedFactory() : loom);
            campaign.claimPayout();
        }
        assertEq(address(campaign).balance, 0);
    }

    function _sum(uint256[] memory xs) internal pure returns (uint256 total) {
        for (uint256 i = 0; i < xs.length; i++) total += xs[i];
    }

    // ------------------------------------------------------------------
    // CT-12：50 orders × 6 tiers 的 settle gas 实测
    // ------------------------------------------------------------------

    function testCT12_SettleGasWith50OrdersAnd6Tiers() public {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers3(3, 0.024 ether, 20, 0.021 ether, 40, 0.018 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers3(3, 0.019 ether, 20, 0.017 ether, 40, 0.014 ether));
        _open();

        // 50 个订单，价格覆盖全部档位
        for (uint256 i = 0; i < 50; i++) {
            address b = address(uint160(0xCAFE00 + i));
            uint256 price = 0.012 ether + (uint256(i) * 0.0003 ether);
            vm.deal(b, 1 ether);
            vm.prank(b);
            campaign.placeOrder{value: price}(VARIANT, price);
        }
        assertEq(campaign.ordersLength(), 50);

        vm.warp(deadline);
        uint256 gasBefore = gasleft();
        campaign.settle();
        uint256 gasUsed = gasBefore - gasleft();

        console.log("CT-12 settle gas (50 orders x 6 tiers):", gasUsed);
        // 部署 gas-limit 上限 2,000,000 的参考阈值；settle 必须远低于它
        assertLt(gasUsed, 2_000_000);
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
    }

    // ------------------------------------------------------------------
    // 端到端：附录 A.1 成功 Campaign
    // ------------------------------------------------------------------

    function testE2E_AppendixA_Success() public {
        _appendixAQuotes();
        _open();

        // previewSettlement 与 settle 同算法（CT-06 前的预览一致性）
        (bool pf, uint256 pq, uint256 pt, uint256 pc, uint256 pw) = campaign.previewSettlement();
        _appendixAOrders();
        (bool pf2, uint256 pq2, uint256 pt2, uint256 pc2, uint256 pw2) = campaign.previewSettlement();
        assertFalse(pf); // 无订单时不可行
        assertTrue(pf2);
        assertEq(pq2, 1);
        assertEq(pt2, 0);
        assertEq(pc2, 0.019 ether);
        assertEq(pw2, 4);

        vm.expectEmit(false, false, false, true);
        emit MakebookCampaign.CampaignSettled(true, 1, 0, 0.019 ether, 4);
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
        assertEq(campaign.winningQuoteId(), 1); // Loom
        assertEq(campaign.clearingPrice(), 0.019 ether);
        assertEq(campaign.winnerCount(), 4);
        assertEq(campaign.selectedFactory(), loom);
        assertEq(campaign.factoryReceivable(), 0.076 ether); // INV-10

        // settle 后 preview 返回已写入结果
        (bool sf, uint256 sq,, uint256 sc, uint256 sw) = campaign.previewSettlement();
        assertTrue(sf);
        assertEq(sq, 1);
        assertEq(sc, 0.019 ether);
        assertEq(sw, 4);

        // 赢家与落选退款
        vm.prank(buyerA);
        campaign.claimRefund();
        vm.prank(buyerB);
        campaign.claimRefund();
        vm.prank(buyerC);
        campaign.claimRefund();
        vm.prank(buyerD);
        campaign.claimRefund(); // 差额 0，优雅处理
        vm.prank(buyerE);
        campaign.claimRefund();

        // 工厂领取
        uint256 balLoom = loom.balance;
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(loom.balance, balLoom + 0.076 ether);
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));
        assertEq(address(campaign).balance, 0); // 全部结清
        assertTrue(pq == 0 && pt == 0 && pc == 0 && pw == 0); // 无订单 preview 返回全零（feasible=false）
    }

    // ------------------------------------------------------------------
    // 端到端：附录 A.2 失败 Campaign
    // ------------------------------------------------------------------

    function testE2E_AppendixA_Failure() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether); // MOQ 3，仅 2 单
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Failed));
        assertEq(campaign.factoryReceivable(), 0);

        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + 0.026 ether);

        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.024 ether);
        assertEq(address(campaign).balance, 0);
    }
}
