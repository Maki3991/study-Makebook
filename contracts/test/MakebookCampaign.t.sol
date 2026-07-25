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

    function claimCreator(MakebookCampaign c) external {
        c.claimCreatorPayout();
    }
}

contract MakebookCampaignTest is Test {
    MakebookCampaign internal campaign;

    address internal operator = makeAddr("operator");
    address internal creator = makeAddr("creator"); // P1：品牌应收领取方
    address internal platform = makeAddr("platform"); // P1：平台费领取方（feeRecipient）
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

    // P1 冻结参数（spec 008 §1）：零售价 = 出厂价 × 1.25；平台费 = 零售 GMV × 2%
    uint32 internal constant MARGIN_BPS = 2500;
    uint32 internal constant FEE_BPS = 200;

    uint64 internal deadline;

    function setUp() public {
        deadline = uint64(block.timestamp + 1 days);
        campaign = new MakebookCampaign(operator, creator, platform, MANIFEST_HASH, MANIFEST_URI, deadline, MARGIN_BPS, FEE_BPS);
        vm.deal(buyerA, 10 ether);
        vm.deal(buyerB, 10 ether);
        vm.deal(buyerC, 10 ether);
        vm.deal(buyerD, 10 ether);
        vm.deal(buyerE, 10 ether);
    }

    // ------------------------------------------------------------------
    // 辅助函数
    // ------------------------------------------------------------------

    /// @dev 以自定义 P1 费率配置部署新实例（并替换 campaign 引用）。
    function _deployWith(uint32 margin, uint32 fee) internal returns (MakebookCampaign) {
        return new MakebookCampaign(operator, creator, platform, MANIFEST_HASH, MANIFEST_URI, deadline, margin, fee);
    }

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

    /// @dev 附录 A.1 缩放版报价（出厂价）：North min3@0.024；Loom min3@0.019。
    ///      P1 零售口径 ×1.25：North 0.030；Loom 0.02375。
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

    /// @dev spec 008 §1 手算例 5 个 Buyer：0.034 / 0.032 / 0.028 / 0.026 / 0.022。
    ///      Loom 零售档 0.02375：前 4 单成团；末单 0.022（≥ 出厂价 0.019 但 < 零售价）落选全退。
    function _appendixAOrders() internal {
        _order(buyerA, 0.034 ether);
        _order(buyerB, 0.032 ether);
        _order(buyerC, 0.028 ether);
        _order(buyerD, 0.026 ether);
        _order(buyerE, 0.022 ether);
    }

    function _settleAfterDeadline() internal {
        vm.warp(deadline);
        campaign.settle();
    }

    /// @dev 直接跑到 Succeeded 的附录手算例场景（4 赢家 + 1 落选，Loom 中标）。
    function _appendixSucceeded() internal {
        _appendixAQuotes();
        _open();
        _appendixAOrders();
        _settleAfterDeadline();
    }

    // ------------------------------------------------------------------
    // 构造参数校验
    // ------------------------------------------------------------------

    function testConstructorZeroOperatorReverts() public {
        vm.expectRevert(MakebookCampaign.ZeroAddress.selector);
        new MakebookCampaign(address(0), creator, platform, MANIFEST_HASH, MANIFEST_URI, deadline, MARGIN_BPS, FEE_BPS);
    }

    function testConstructorPastDeadlineReverts() public {
        vm.expectRevert(MakebookCampaign.DeadlineNotInFuture.selector);
        new MakebookCampaign(
            operator, creator, platform, MANIFEST_HASH, MANIFEST_URI, uint64(block.timestamp), MARGIN_BPS, FEE_BPS
        );
    }

    function testInitialState() public view {
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Draft));
        assertEq(campaign.operator(), operator);
        assertEq(campaign.creator(), creator);
        assertEq(campaign.feeRecipient(), platform);
        assertEq(campaign.manifestHash(), MANIFEST_HASH);
        assertEq(campaign.manifestURI(), MANIFEST_URI);
        assertEq(campaign.deadline(), deadline);
        assertEq(campaign.marginBps(), MARGIN_BPS);
        assertEq(campaign.feeBps(), FEE_BPS);
        assertEq(campaign.MAX_MARGIN_BPS(), 5000);
        assertEq(campaign.MAX_ORDERS(), 50);
        assertEq(campaign.MAX_FACTORIES(), 2);
        assertEq(campaign.MAX_TIERS(), 3);
        // P1 三笔账与领取标记初始为零
        assertEq(campaign.creatorReceivable(), 0);
        assertEq(campaign.platformFee(), 0);
        assertFalse(campaign.creatorPayoutClaimed());
        assertFalse(campaign.platformFeeClaimed());
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
        _order(buyerB, 0.024 ether); // 只有 2 单 ≥ 零售 0.02375，MOQ = 3

        (bool feasible,,,,) = campaign.previewSettlement();
        assertFalse(feasible);

        vm.expectEmit(false, false, false, true);
        emit MakebookCampaign.CampaignSettled(false, 0, 0, 0, 0);
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Failed));
        assertFalse(campaign.settlementFeasible());
        assertEq(campaign.winnerCount(), 0);
        assertEq(campaign.factoryReceivable(), 0); // INV-10
        assertEq(campaign.creatorReceivable(), 0); // P1：失败批次无品牌应收
        assertEq(campaign.platformFee(), 0); // P1：失败批次无平台费
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
        _order(buyerA, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether); // Loom 零售口径 eligibleCount 恰好 = 3 = minQty

        _settleAfterDeadline();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
        assertEq(campaign.winningQuoteId(), 1); // Loom
        assertEq(campaign.clearingPrice(), 0.02375 ether); // 零售清算价 = 0.019 × 1.25
        assertEq(campaign.winnerCount(), 3);
        assertEq(campaign.factoryReceivable(), 3 * 0.019 ether); // 出厂价量纲不变
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
    // CT-06：多 tier 选择与 tie-break（P1：一律按零售价比较）
    // ------------------------------------------------------------------

    /// @dev R-04：feasible tiers 中 eligibleCount 最大者胜出（count 较小的可行档落选）。
    function testCT06_MaxEligibleCountWins() public {
        _registerNorthAndLoom();
        // North：min2 @ 出厂 0.022 → 零售 0.0275（count=2 可行）
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers1(2, 0.022 ether));
        // Loom：min3 @ 出厂 0.020 → 零售 0.025（count=3 可行）
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers1(3, 0.020 ether));
        _open();
        _order(buyerA, 0.03125 ether);
        _order(buyerB, 0.0275 ether);
        _order(buyerC, 0.025 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 1); // Loom 以 count=3 胜出
        assertEq(campaign.clearingPrice(), 0.025 ether); // 零售清算价
        assertEq(campaign.winnerCount(), 3);
    }

    /// @dev R-05：eligibleCount 并列时取价低者（跨工厂，P1 按零售价比较）。
    function testCT06_CountTieBreaksByLowerPrice() public {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers1(3, 0.020 ether)); // 零售 0.025
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers1(3, 0.015 ether)); // 零售 0.01875
        _open();
        _order(buyerA, 0.03125 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 1); // count 同为 3，Loom 零售价比低
        assertEq(campaign.clearingPrice(), 0.01875 ether);
    }

    /// @dev R-06：count 与 price 完全并列时取 quoteId 更小者。
    function testCT06_FullTieBreaksBySmallerQuoteId() public {
        _registerNorthAndLoom();
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers1(3, 0.020 ether));
        vm.prank(loom);
        campaign.submitQuote(keccak256("q-l"), _tiers1(3, 0.020 ether));
        _open();
        _order(buyerA, 0.03125 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 0); // North 先提交
        assertEq(campaign.selectedFactory(), north);
    }

    /// @dev 多 tier 报价内部选择：5 人全部 ≥ 零售 0.02375 → tier1（min5）count=5 胜出；
    ///      tier0 零售 0.030 仅 2 单合格，MOQ 不达。
    function testCT06_MultiTierWithinSingleQuote() public {
        vm.prank(operator);
        campaign.registerFactory(north, keccak256("p"));
        vm.prank(north);
        campaign.submitQuote(keccak256("q-n"), _tiers2(3, 0.024 ether, 5, 0.019 ether));
        _open();
        _order(buyerA, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether);
        _order(buyerD, 0.02375 ether);
        _order(buyerE, 0.02375 ether);
        _settleAfterDeadline();
        assertEq(campaign.winningQuoteId(), 0);
        assertEq(campaign.winningTierIndex(), 1);
        assertEq(campaign.clearingPrice(), 0.02375 ether);
        assertEq(campaign.winnerCount(), 5);
    }

    // ------------------------------------------------------------------
    // CT-07：边界价格 —— maxPrice == clearingPrice（零售价）为赢家，少 1 wei 落选
    // ------------------------------------------------------------------

    function testCT07_MaxPriceEqualClearingPriceIsWinner() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerD, 0.02375 ether); // 恰好等于零售清算价
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
        _order(buyerA, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether);
        address dust = makeAddr("dustBuyer");
        vm.deal(dust, 1 ether);
        _order(dust, 0.02375 ether - 1); // 比零售清算价少 1 wei → 落选
        _settleAfterDeadline();
        assertEq(campaign.winnerCount(), 3); // dust 不计入

        uint256 bal = dust.balance;
        vm.prank(dust);
        campaign.claimRefund();
        assertEq(dust.balance, bal + 0.02375 ether - 1); // 全额退款
    }

    // ------------------------------------------------------------------
    // CT-08：退款 —— 赢家差额（零售口径）/ 落选全额 / 失败全额 / 重复领取拒绝
    // ------------------------------------------------------------------

    function testCT08_RefundAmountsAppendixA() public {
        _appendixSucceeded();

        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + 0.01025 ether); // 0.034 - 0.02375

        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.00825 ether); // 0.032 - 0.02375

        uint256 balC = buyerC.balance;
        vm.prank(buyerC);
        campaign.claimRefund();
        assertEq(buyerC.balance, balC + 0.00425 ether); // 0.028 - 0.02375

        uint256 balE = buyerE.balance;
        vm.prank(buyerE);
        campaign.claimRefund();
        assertEq(buyerE.balance, balE + 0.022 ether); // 落选全额
    }

    function testCT08_DoubleClaimReverts() public {
        _appendixSucceeded();
        vm.prank(buyerA);
        campaign.claimRefund();
        vm.prank(buyerA);
        vm.expectRevert(MakebookCampaign.AlreadyClaimed.selector);
        campaign.claimRefund();
    }

    function testCT08_NonBuyerClaimReverts() public {
        _appendixSucceeded();
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
    // CT-09：Payout —— 仅中标工厂、金额正确（出厂价口径）、只能一次
    // ------------------------------------------------------------------

    function testCT09_FactoryPayoutExactAmountOnce() public {
        _appendixSucceeded();

        uint256 bal = loom.balance;
        vm.prank(loom);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.FactoryPayoutClaimed(loom, 0.076 ether);
        campaign.claimPayout();
        assertEq(loom.balance, bal + 0.076 ether); // 4 × 0.019（出厂价，P1 量纲不变）
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));

        // 第二次：状态已是 PaidOut，拒绝
        vm.prank(loom);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.PaidOut)
        );
        campaign.claimPayout();
    }

    function testCT09_OnlySelectedFactoryCanClaim() public {
        _appendixSucceeded();
        vm.prank(north); // 未中标工厂
        vm.expectRevert(MakebookCampaign.NotSelectedFactory.selector);
        campaign.claimPayout();
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NotSelectedFactory.selector);
        campaign.claimPayout();
    }

    function testCT09_BuyersCanStillRefundAfterPaidOut() public {
        _appendixSucceeded();
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));

        uint256 balE = buyerE.balance;
        vm.prank(buyerE);
        campaign.claimRefund();
        assertEq(buyerE.balance, balE + 0.022 ether);
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
        _appendixSucceeded();
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
        evil.placeOrder{value: 0.0325 ether}(campaign, VARIANT, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether);
        _settleAfterDeadline();

        // 恶意合约的 claim 失败（receive  revert → TransferFailed），状态回滚
        vm.expectRevert(MakebookCampaign.TransferFailed.selector);
        evil.claim(campaign);
        assertFalse(campaign.getOrder(address(evil)).refundClaimed);

        // 其他 Buyer 不受影响
        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.00625 ether); // 0.03 - 0.02375

        // 工厂 payout 也不受影响
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));
    }

    // ------------------------------------------------------------------
    // CT-11：余额不变量 fuzz（INV-01；P1 负债含三笔应收）
    // ------------------------------------------------------------------

    /// @dev fuzz：随机订单数与价格，settle 后合约余额 ≥ 全部未领 liabilities（含工厂/品牌/平台三笔）；
    ///      全部领取后余额归零（三笔之和 == winnerCount × 零售清算价，金额守恒）。
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

        // 计算全部未领 liabilities（P1：工厂 + 品牌 + 平台三笔）
        MakebookCampaign.State s = campaign.state();
        uint256 liabilities = 0;
        if (s == MakebookCampaign.State.Failed) {
            liabilities = _sum(prices);
        } else {
            uint256 cp = campaign.clearingPrice();
            for (uint256 i = 0; i < n; i++) {
                liabilities += prices[i] >= cp ? prices[i] - cp : prices[i];
            }
            liabilities += campaign.factoryReceivable() + campaign.creatorReceivable() + campaign.platformFee();
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
            vm.prank(creator);
            campaign.claimCreatorPayout();
            vm.prank(platform);
            campaign.claimPlatformFee();
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
    // 端到端：spec 008 §1 手算例成功 Campaign（P1 五路领取）
    // ------------------------------------------------------------------

    function testE2E_AppendixA_Success() public {
        _appendixAQuotes();
        _open();

        // previewSettlement 与 settle 同算法（CT-06 前的预览一致性）
        {
            (bool pf, uint256 pq, uint256 pt, uint256 pc, uint256 pw) = campaign.previewSettlement();
            assertFalse(pf); // 无订单时不可行
            assertTrue(pq == 0 && pt == 0 && pc == 0 && pw == 0); // 无订单 preview 返回全零（feasible=false）
        }
        _appendixAOrders();
        (bool pf2, uint256 pq2, uint256 pt2, uint256 pc2, uint256 pw2) = campaign.previewSettlement();
        assertTrue(pf2);
        assertEq(pq2, 1);
        assertEq(pt2, 0);
        assertEq(pc2, 0.02375 ether); // 预览即零售价
        assertEq(pw2, 4);

        vm.expectEmit(false, false, false, true);
        emit MakebookCampaign.CampaignSettled(true, 1, 0, 0.02375 ether, 4);
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
        assertEq(campaign.winningQuoteId(), 1); // Loom
        assertEq(campaign.clearingPrice(), 0.02375 ether); // 零售清算价 = 0.019 × 1.25
        assertEq(campaign.winnerCount(), 4); // buyerE 0.022 ≥ 出厂价但 < 零售价 → 落选（验收锚点⑧）
        assertEq(campaign.selectedFactory(), loom);
        // spec 008 §1 手算例三笔账（INV-10）
        assertEq(campaign.factoryReceivable(), 0.076 ether); // 4 × 0.019
        assertEq(campaign.platformFee(), 0.0019 ether); // 4 × 0.02375 × 2%
        assertEq(campaign.creatorReceivable(), 0.0171 ether); // 4 × 0.00475 − 0.0019

        // settle 后 preview 返回已写入结果
        (bool sf, uint256 sq,, uint256 sc, uint256 sw) = campaign.previewSettlement();
        assertTrue(sf);
        assertEq(sq, 1);
        assertEq(sc, 0.02375 ether);
        assertEq(sw, 4);

        // 赢家与落选退款（零售口径差额）
        vm.prank(buyerA);
        campaign.claimRefund(); // 0.034 − 0.02375 = 0.01025
        vm.prank(buyerB);
        campaign.claimRefund(); // 0.00825
        vm.prank(buyerC);
        campaign.claimRefund(); // 0.00425
        vm.prank(buyerD);
        campaign.claimRefund(); // 0.00225
        vm.prank(buyerE);
        campaign.claimRefund(); // 落选全额 0.022

        // 工厂领取（出厂价口径）
        uint256 balLoom = loom.balance;
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(loom.balance, balLoom + 0.076 ether);
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));

        // 品牌与平台领取（PaidOut 后仍可领，验收锚点⑤；两地址此前余额为 0）
        vm.prank(creator);
        campaign.claimCreatorPayout();
        assertEq(creator.balance, 0.0171 ether);
        vm.prank(platform);
        campaign.claimPlatformFee();
        assertEq(platform.balance, 0.0019 ether);

        assertEq(address(campaign).balance, 0); // 五路全部结清，金额守恒
    }

    // ------------------------------------------------------------------
    // 端到端：附录 A.2 失败 Campaign
    // ------------------------------------------------------------------

    function testE2E_AppendixA_Failure() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether); // MOQ 3，仅 2 单 ≥ 零售 0.02375
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Failed));
        assertEq(campaign.factoryReceivable(), 0);
        assertEq(campaign.creatorReceivable(), 0);
        assertEq(campaign.platformFee(), 0);

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

    // ------------------------------------------------------------------
    // P1：三方分账（spec 008）
    // ------------------------------------------------------------------

    // ⑨ 构造校验：InvalidFeeConfig / 零地址 / 上限边界

    function testP1_ConstructorZeroCreatorReverts() public {
        vm.expectRevert(MakebookCampaign.ZeroAddress.selector);
        new MakebookCampaign(operator, address(0), platform, MANIFEST_HASH, MANIFEST_URI, deadline, MARGIN_BPS, FEE_BPS);
    }

    function testP1_ConstructorZeroFeeRecipientReverts() public {
        vm.expectRevert(MakebookCampaign.ZeroAddress.selector);
        new MakebookCampaign(operator, creator, address(0), MANIFEST_HASH, MANIFEST_URI, deadline, MARGIN_BPS, FEE_BPS);
    }

    function testP1_ConstructorMarginAboveMaxReverts() public {
        vm.expectRevert(MakebookCampaign.InvalidFeeConfig.selector);
        new MakebookCampaign(operator, creator, platform, MANIFEST_HASH, MANIFEST_URI, deadline, 5001, 0);
    }

    function testP1_ConstructorFeeAboveMarginReverts() public {
        vm.expectRevert(MakebookCampaign.InvalidFeeConfig.selector);
        new MakebookCampaign(operator, creator, platform, MANIFEST_HASH, MANIFEST_URI, deadline, 2500, 2501);
        // marginBps = 0 时 feeBps 也必须为 0
        vm.expectRevert(MakebookCampaign.InvalidFeeConfig.selector);
        new MakebookCampaign(operator, creator, platform, MANIFEST_HASH, MANIFEST_URI, deadline, 0, 1);
    }

    function testP1_ConstructorMarginBoundary5000Deploys() public {
        MakebookCampaign c = _deployWith(5000, 5000); // 上限边界可部署
        assertEq(c.marginBps(), 5000);
        assertEq(c.feeBps(), 5000);
        assertEq(c.MAX_MARGIN_BPS(), 5000);
        assertEq(c.creator(), creator);
        assertEq(c.feeRecipient(), platform);
        assertEq(uint256(c.state()), uint256(MakebookCampaign.State.Draft));
    }

    // ⑧ 验收锚点：出价 ≥ 出厂价但 < 零售价不算赢家（eligibility 用零售价，防下溢回归）

    /// @dev ⑧ 关键回归：3 单全部 ≥ Loom 出厂价 0.019，但第 3 单恰为出厂价、< 零售 0.02375
    ///      → 零售口径仅 2 单合格 < MOQ 3 → Failed。若 eligibility 退回出厂价口径，此测试必红。
    function testP1_BidAtFactoryPriceBelowRetailNotWinner() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.019 ether); // == 出厂价，< 零售 0.02375 → 不是赢家
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Failed));
        assertEq(campaign.winnerCount(), 0);
        assertEq(campaign.factoryReceivable(), 0);
        assertEq(campaign.creatorReceivable(), 0);
        assertEq(campaign.platformFee(), 0);

        // 无赢家、无三笔账：三人全额退款后合约归零（不存在赢家付不起/退款下溢面）
        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + 0.0325 ether);
        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.03 ether);
        uint256 balC = buyerC.balance;
        vm.prank(buyerC);
        campaign.claimRefund();
        assertEq(buyerC.balance, balC + 0.019 ether);
        assertEq(address(campaign).balance, 0);
    }

    /// @dev ⑧ success 路径：夹单（出厂价 ≤ 出价 < 零售价）不计入 winnerCount，落选全额退款。
    function testP1_BidBetweenFactoryAndRetailFullRefundOnSuccess() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.0325 ether);
        _order(buyerB, 0.03 ether);
        _order(buyerC, 0.02625 ether);
        _order(buyerD, 0.022 ether); // 0.019 ≤ 0.022 < 0.02375 → 不是赢家
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
        assertEq(campaign.winnerCount(), 3); // D 不计入
        assertEq(campaign.clearingPrice(), 0.02375 ether);

        uint256 balD = buyerD.balance;
        vm.prank(buyerD);
        campaign.claimRefund();
        assertEq(buyerD.balance, balD + 0.022 ether); // 落选全额
    }

    // ① 三笔应收逐 wei 对 spec 008 §1 手算例

    function testP1_SettlementThreeWaySplitExact() public {
        _appendixSucceeded();
        assertEq(campaign.clearingPrice(), 0.02375 ether); // 0.019 × 1.25
        assertEq(campaign.winnerCount(), 4);
        assertEq(campaign.factoryReceivable(), 0.076 ether); // 4 × 0.019（出厂价）
        assertEq(campaign.platformFee(), 0.0019 ether); // 4 × 0.02375 × 2%
        assertEq(campaign.creatorReceivable(), 0.0171 ether); // 4 × 0.00475 − 0.0019
        // 恒等式：三笔之和 == winnerCount × 零售清算价
        assertEq(
            campaign.factoryReceivable() + campaign.platformFee() + campaign.creatorReceivable(),
            campaign.winnerCount() * campaign.clearingPrice()
        );
    }

    // ⑦ 买家差额按零售价计算（maxPrice − 零售清算价）

    function testP1_WinnerRefundUsesRetailClearing() public {
        _appendixSucceeded();
        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + (0.034 ether - 0.02375 ether)); // 0.01025，而非 0.034 − 0.019
    }

    // ② 领取成功 + 事件

    function testP1_ClaimCreatorPayoutSuccess() public {
        _appendixSucceeded();
        uint256 bal = creator.balance;
        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.CreatorPayoutClaimed(creator, 0.0171 ether);
        campaign.claimCreatorPayout();
        assertEq(creator.balance, bal + 0.0171 ether);
        assertTrue(campaign.creatorPayoutClaimed());
        // creator 领取不推进状态机（PaidOut 仅由工厂领取触发）
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
    }

    function testP1_ClaimPlatformFeeSuccess() public {
        _appendixSucceeded();
        uint256 bal = platform.balance;
        vm.prank(platform);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.PlatformFeeClaimed(platform, 0.0019 ether);
        campaign.claimPlatformFee();
        assertEq(platform.balance, bal + 0.0019 ether);
        assertTrue(campaign.platformFeeClaimed());
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
    }

    // ③ 非本人调用 revert（INV-06：operator 也无资金权限）

    function testP1_ClaimCreatorOnlyCreatorReverts() public {
        _appendixSucceeded();
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NotCreator.selector);
        campaign.claimCreatorPayout();
        vm.prank(operator); // INV-06
        vm.expectRevert(MakebookCampaign.NotCreator.selector);
        campaign.claimCreatorPayout();
        vm.prank(platform); // feeRecipient 也不能领品牌应收
        vm.expectRevert(MakebookCampaign.NotCreator.selector);
        campaign.claimCreatorPayout();
        vm.prank(loom);
        vm.expectRevert(MakebookCampaign.NotCreator.selector);
        campaign.claimCreatorPayout();
    }

    function testP1_ClaimPlatformOnlyFeeRecipientReverts() public {
        _appendixSucceeded();
        vm.prank(outsider);
        vm.expectRevert(MakebookCampaign.NotFeeRecipient.selector);
        campaign.claimPlatformFee();
        vm.prank(operator); // INV-06
        vm.expectRevert(MakebookCampaign.NotFeeRecipient.selector);
        campaign.claimPlatformFee();
        vm.prank(creator);
        vm.expectRevert(MakebookCampaign.NotFeeRecipient.selector);
        campaign.claimPlatformFee();
    }

    // ④ 重复领取 revert

    function testP1_ClaimCreatorDoubleReverts() public {
        _appendixSucceeded();
        vm.prank(creator);
        campaign.claimCreatorPayout();
        vm.prank(creator);
        vm.expectRevert(MakebookCampaign.AlreadyClaimed.selector);
        campaign.claimCreatorPayout();
    }

    function testP1_ClaimPlatformDoubleReverts() public {
        _appendixSucceeded();
        vm.prank(platform);
        campaign.claimPlatformFee();
        vm.prank(platform);
        vm.expectRevert(MakebookCampaign.AlreadyClaimed.selector);
        campaign.claimPlatformFee();
    }

    // ⑤ PaidOut 后 creator / platform 仍可领

    function testP1_ClaimCreatorAndPlatformAfterPaidOut() public {
        _appendixSucceeded();
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));

        uint256 balC = creator.balance;
        vm.prank(creator);
        campaign.claimCreatorPayout();
        assertEq(creator.balance, balC + 0.0171 ether);

        uint256 balP = platform.balance;
        vm.prank(platform);
        campaign.claimPlatformFee();
        assertEq(platform.balance, balP + 0.0019 ether);
        //  escrow 0.142 − 工厂 0.076 − 品牌 0.0171 − 平台 0.0019 = 0.047（恰为 5 笔未领买家退款）
        assertEq(address(campaign).balance, 0.047 ether);
    }

    // 状态门槛：Open / Failed 下三笔 claim 均不可调

    function testP1_SplitClaimsBeforeSettleRevert() public {
        _appendixAQuotes();
        _open();
        _appendixAOrders(); // Open 未 settle
        vm.prank(creator);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.Open)
        );
        campaign.claimCreatorPayout();
        vm.prank(platform);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.Open)
        );
        campaign.claimPlatformFee();
    }

    function testP1_FailedCampaignSplitClaimsRevert() public {
        _appendixAQuotes();
        _open();
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether); // MOQ 不达 → Failed
        _settleAfterDeadline();
        assertEq(campaign.creatorReceivable(), 0);
        assertEq(campaign.platformFee(), 0);
        vm.prank(creator);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.Failed)
        );
        campaign.claimCreatorPayout();
        vm.prank(platform);
        vm.expectRevert(
            abi.encodeWithSelector(MakebookCampaign.WrongState.selector, MakebookCampaign.State.Succeeded, MakebookCampaign.State.Failed)
        );
        campaign.claimPlatformFee();
    }

    // ⑥ marginBps = 0 且 feeBps = 0：逐字退化为 P0

    /// @dev ⑥ P0 退化：零售价 == 出厂价，eligibility 与退款口径与 P0 附录 A.1 完全一致；
    ///      品牌/平台应收为 0（仍可领 0，发 0 金额事件，幂等防卡）。
    function testP1_ZeroMarginDegeneratesToP0() public {
        campaign = _deployWith(0, 0);
        _appendixAQuotes();
        _open();
        // P0 附录 A.1 原始出价（出厂价口径即可成团）
        _order(buyerA, 0.026 ether);
        _order(buyerB, 0.024 ether);
        _order(buyerC, 0.021 ether);
        _order(buyerD, 0.019 ether);
        _order(buyerE, 0.017 ether);
        _settleAfterDeadline();

        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.Succeeded));
        assertEq(campaign.winningQuoteId(), 1); // Loom
        assertEq(campaign.clearingPrice(), 0.019 ether); // 零售价 == 出厂价
        assertEq(campaign.winnerCount(), 4);
        assertEq(campaign.factoryReceivable(), 0.076 ether); // 4 × 0.019
        assertEq(campaign.creatorReceivable(), 0);
        assertEq(campaign.platformFee(), 0);

        // P0 退款口径（与旧 CT-08 数值逐字一致）
        uint256 balA = buyerA.balance;
        vm.prank(buyerA);
        campaign.claimRefund();
        assertEq(buyerA.balance, balA + 0.007 ether); // 0.026 − 0.019
        uint256 balB = buyerB.balance;
        vm.prank(buyerB);
        campaign.claimRefund();
        assertEq(buyerB.balance, balB + 0.005 ether);
        uint256 balC = buyerC.balance;
        vm.prank(buyerC);
        campaign.claimRefund();
        assertEq(buyerC.balance, balC + 0.002 ether);
        vm.prank(buyerD);
        campaign.claimRefund(); // 差额 0，优雅处理
        uint256 balE = buyerE.balance;
        vm.prank(buyerE);
        campaign.claimRefund();
        assertEq(buyerE.balance, balE + 0.017 ether); // 落选全额

        // 品牌/平台领 0：允许调用、发 0 金额事件、不转账（幂等防卡）
        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.CreatorPayoutClaimed(creator, 0);
        campaign.claimCreatorPayout();
        vm.prank(platform);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.PlatformFeeClaimed(platform, 0);
        campaign.claimPlatformFee();

        // 工厂领取不变（仍触发 PaidOut）
        uint256 balLoom = loom.balance;
        vm.prank(loom);
        campaign.claimPayout();
        assertEq(loom.balance, balLoom + 0.076 ether);
        assertEq(uint256(campaign.state()), uint256(MakebookCampaign.State.PaidOut));
        assertEq(address(campaign).balance, 0);
    }

    // min 兜底：平台费封顶差价池，creatorReceivable 为 0 也可领取（永不下溢）

    function testP1_PlatformFeeCappedByMarginPool() public {
        campaign = _deployWith(2500, 2500); // feeBps == marginBps 合法
        _appendixSucceeded();

        assertEq(campaign.winnerCount(), 4);
        // 理论平台费 4 × 0.02375 × 25% = 0.02375 > 差价池 4 × 0.00475 = 0.019 → 封顶为差价池
        assertEq(campaign.platformFee(), 0.019 ether);
        assertEq(campaign.creatorReceivable(), 0);
        assertEq(campaign.factoryReceivable(), 0.076 ether);

        // creator 领 0：允许调用、发 0 金额事件、不转账
        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit MakebookCampaign.CreatorPayoutClaimed(creator, 0);
        campaign.claimCreatorPayout();
        assertTrue(campaign.creatorPayoutClaimed());

        uint256 balP = platform.balance;
        vm.prank(platform);
        campaign.claimPlatformFee();
        assertEq(platform.balance, balP + 0.019 ether);
    }

    // P1 版 CT-10：creator 为恶意接收者时不阻塞工厂/平台/买家

    function testP1_RevertingCreatorDoesNotBlockOthers() public {
        RevertingReceiver evil = new RevertingReceiver();
        campaign = new MakebookCampaign(
            operator, address(evil), platform, MANIFEST_HASH, MANIFEST_URI, deadline, MARGIN_BPS, FEE_BPS
        );
        _appendixSucceeded();

        // 恶意 creator 的 claim 失败（receive revert → TransferFailed），状态回滚
        vm.expectRevert(MakebookCampaign.TransferFailed.selector);
        evil.claimCreator(campaign);
        assertFalse(campaign.creatorPayoutClaimed());

        // 工厂 / 平台 / 买家不受影响
        vm.prank(loom);
        campaign.claimPayout();
        vm.prank(platform);
        campaign.claimPlatformFee();
        uint256 balE = buyerE.balance;
        vm.prank(buyerE);
        campaign.claimRefund();
        assertEq(buyerE.balance, balE + 0.022 ether);
    }

    // ⑩ fuzz 扩展：任意合法 (marginBps, feeBps) 配置下三笔账恒等式成立、五路领取后归零

    /// @dev fuzz：margin ∈ [0,5000]、fee ∈ [0,margin] 全空间，settle 不产生下溢；
    ///      三笔恒等式 factory+creator+platform == winnerCount × 零售清算价 恒成立；
    ///      买家退款 + 工厂 + 品牌 + 平台五路全部领取后合约余额归零。
    function testFuzzP1_SplitConservationAcrossFeeConfigs(uint16 marginSeed, uint16 feeSeed) public {
        // forge-lint: disable-next-line(unsafe-typecast) -- bound 结果 ≤ 5000，截断安全
        uint32 margin = uint32(bound(marginSeed, 0, 5000));
        // forge-lint: disable-next-line(unsafe-typecast) -- bound 结果 ≤ margin ≤ 5000，截断安全
        uint32 fee = uint32(bound(feeSeed, 0, margin));
        campaign = _deployWith(margin, fee);
        _appendixSucceeded();

        if (campaign.state() == MakebookCampaign.State.Succeeded) {
            uint256 count = campaign.winnerCount();
            uint256 clearing = campaign.clearingPrice();
            uint256 tierPrice = campaign.getQuote(campaign.winningQuoteId()).tiers[campaign.winningTierIndex()].unitPriceWei;
            assertGe(clearing, tierPrice); // 零售 ≥ 出厂，无下溢
            assertEq(campaign.factoryReceivable(), count * tierPrice);
            uint256 pool = count * (clearing - tierPrice);
            assertLe(campaign.platformFee(), pool); // min 兜底
            assertEq(campaign.creatorReceivable(), pool - campaign.platformFee());
            assertEq(campaign.factoryReceivable() + campaign.platformFee() + campaign.creatorReceivable(), count * clearing);
        }

        // 五路领取：买家退款（赢家差额 / 落选或失败全额）+ 工厂 + 品牌 + 平台
        address[5] memory buyers = [buyerA, buyerB, buyerC, buyerD, buyerE];
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(buyers[i]);
            campaign.claimRefund();
        }
        if (campaign.state() == MakebookCampaign.State.Succeeded) {
            vm.prank(campaign.selectedFactory());
            campaign.claimPayout();
            vm.prank(creator);
            campaign.claimCreatorPayout();
            vm.prank(platform);
            campaign.claimPlatformFee();
        }
        assertEq(address(campaign).balance, 0); // 金额守恒，无残留
    }
}
