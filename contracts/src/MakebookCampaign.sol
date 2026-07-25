// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MakebookCampaign
/// @notice MAKEBOOK（造物簿）单个 Campaign 的托管与确定性统一清算合约。
///         一个部署 = 一个 Campaign。无 proxy / delegatecall / selfdestruct / ownerWithdraw。
///         清算规则见 PRD 第 09 章 R-01 ~ R-10；不变量见 13A INV-01 ~ INV-10。
///         P1（spec 008）：零售价 = 出厂价 × (1 + marginBps/10000)，eligibility 与统一清算价
///         一律用零售价；settle 记三笔账（工厂出厂价 / 平台费 / 品牌差价），三路各自 pull 领取。
contract MakebookCampaign is ReentrancyGuard {
    // ---------------------------------------------------------------------
    // 类型与常量（PRD 13.2）
    // ---------------------------------------------------------------------

    enum State {
        Draft, // 0
        Open, // 1
        Succeeded, // 2
        Failed, // 3
        PaidOut // 4
    }

    struct Tier {
        uint32 minQty;
        uint256 unitPriceWei;
    }

    struct FactoryQuote {
        address factory;
        bytes32 quoteHash;
        Tier[] tiers; // 1..3
    }

    struct Order {
        address buyer;
        bytes32 variantHash; // P0 固定 SKU，仅作完整性字段
        uint256 maxPriceWei; // == deposit == msg.value
        bool refundClaimed;
    }

    uint256 public constant MAX_ORDERS = 50;
    uint256 public constant MAX_FACTORIES = 2;
    uint256 public constant MAX_TIERS = 3;
    /// @dev 零售加价系数上限（spec 008 §1）
    uint32 public constant MAX_MARGIN_BPS = 5000;

    // ---------------------------------------------------------------------
    // 不可变参数（部署时冻结，INV-04）
    // ---------------------------------------------------------------------

    address public immutable operator;
    /// @dev 品牌应收唯一领取方（P1）
    address public immutable creator;
    /// @dev 平台费唯一领取方（P1）；≠ operator，守住 INV-06
    address public immutable feeRecipient;
    bytes32 public immutable manifestHash;
    string public manifestURI;
    uint64 public immutable deadline;
    /// @dev 零售加价系数：零售价 = 出厂价 × (10000 + marginBps) / 10000（floor）
    uint32 public immutable marginBps;
    /// @dev 平台费率：平台费 = 成交 GMV（零售口径）× feeBps / 10000，封顶差价池
    uint32 public immutable feeBps;

    // ---------------------------------------------------------------------
    // 可变状态
    // ---------------------------------------------------------------------

    State public state;

    address[] public registeredFactories;
    mapping(address => bool) public isRegisteredFactory;
    mapping(address => bytes32) public factoryProfileHash;

    FactoryQuote[] private _quotes;
    mapping(address => bool) public hasQuoted;

    Order[] private _orders;
    /// @dev buyer => orders 数组下标 + 1；0 表示未下单
    mapping(address => uint256) private _orderIndexOf;

    // 清算结果（settle 后写入，唯一）
    bool public settlementFeasible;
    uint256 public winningQuoteId;
    uint256 public winningTierIndex;
    /// @dev 统一清算价（P1 起为零售价口径）
    uint256 public clearingPrice;
    uint256 public winnerCount;
    address public selectedFactory;
    /// @dev 工厂应收 = winnerCount × 出厂价（R-09，P1 不改量纲）
    uint256 public factoryReceivable;
    bool public factoryPayoutClaimed;
    /// @dev 品牌应收 = 差价池 − 平台费（P1）
    uint256 public creatorReceivable;
    /// @dev 平台费 = min(winnerCount × 零售清算价 × feeBps / 10000, 差价池)（P1）
    uint256 public platformFee;
    bool public creatorPayoutClaimed;
    bool public platformFeeClaimed;

    // ---------------------------------------------------------------------
    // 事件（PRD 13.4）
    // ---------------------------------------------------------------------

    event CampaignOpened(bytes32 manifestHash, uint64 deadline);
    event FactoryRegistered(address indexed factory, bytes32 profileHash);
    event QuoteSubmitted(uint256 indexed quoteId, address indexed factory, bytes32 quoteHash);
    event OrderPlaced(address indexed buyer, uint256 maxPrice, bytes32 variantHash);
    event CampaignSettled(
        bool success, uint256 winningQuoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount
    );
    event RefundClaimed(address indexed buyer, uint256 amount);
    event FactoryPayoutClaimed(address indexed factory, uint256 amount);
    event CreatorPayoutClaimed(address indexed creator, uint256 amount);
    event PlatformFeeClaimed(address indexed feeRecipient, uint256 amount);

    // ---------------------------------------------------------------------
    // 自定义错误（前端按名字映射人话文案）
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error DeadlineNotInFuture();
    error NotOperator();
    error WrongState(State expected, State actual);
    error FactoryAlreadyRegistered();
    error TooManyFactories();
    error FactoryNotRegistered();
    error AlreadyQuoted();
    error InvalidTiers();
    error NoQuotes();
    error CampaignNotOpen();
    error DeadlinePassed();
    error DeadlineNotReached();
    error InvalidPayment();
    error DuplicateOrder();
    error OrderLimitReached();
    error NoOrder();
    error AlreadyClaimed();
    error NotSelectedFactory();
    error TransferFailed();
    error NotCreator();
    error NotFeeRecipient();
    error InvalidFeeConfig();

    // ---------------------------------------------------------------------
    // 修饰器
    // ---------------------------------------------------------------------

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    modifier inState(State expected) {
        if (state != expected) revert WrongState(expected, state);
        _;
    }

    // ---------------------------------------------------------------------
    // 构造
    // ---------------------------------------------------------------------

    constructor(
        address operator_,
        address creator_,
        address feeRecipient_,
        bytes32 manifestHash_,
        string memory manifestURI_,
        uint64 deadline_,
        uint32 marginBps_,
        uint32 feeBps_
    ) {
        if (operator_ == address(0) || creator_ == address(0) || feeRecipient_ == address(0)) revert ZeroAddress();
        if (deadline_ <= block.timestamp) revert DeadlineNotInFuture();
        if (marginBps_ > MAX_MARGIN_BPS || feeBps_ > marginBps_) revert InvalidFeeConfig();
        operator = operator_;
        creator = creator_;
        feeRecipient = feeRecipient_;
        manifestHash = manifestHash_;
        manifestURI = manifestURI_;
        deadline = deadline_;
        marginBps = marginBps_;
        feeBps = feeBps_;
        state = State.Draft;
    }

    // ---------------------------------------------------------------------
    // Draft 阶段：工厂与报价
    // ---------------------------------------------------------------------

    /// @notice Draft 期登记工厂，仅 operator，最多 MAX_FACTORIES 个。
    function registerFactory(address factory, bytes32 profileHash) external onlyOperator inState(State.Draft) {
        if (factory == address(0)) revert ZeroAddress();
        if (isRegisteredFactory[factory]) revert FactoryAlreadyRegistered();
        if (registeredFactories.length >= MAX_FACTORIES) revert TooManyFactories();
        isRegisteredFactory[factory] = true;
        factoryProfileHash[factory] = profileHash;
        registeredFactories.push(factory);
        emit FactoryRegistered(factory, profileHash);
    }

    /// @notice Draft 期已登记工厂提交唯一一份报价；tiers 1~3，minQty 递增、price 严格递减。
    function submitQuote(bytes32 quoteHash, Tier[] memory tiers) external inState(State.Draft) {
        if (!isRegisteredFactory[msg.sender]) revert FactoryNotRegistered();
        if (hasQuoted[msg.sender]) revert AlreadyQuoted();
        _validateTiers(tiers);

        uint256 quoteId = _quotes.length;
        FactoryQuote storage q = _quotes.push();
        q.factory = msg.sender;
        q.quoteHash = quoteHash;
        for (uint256 i = 0; i < tiers.length; i++) {
            q.tiers.push(tiers[i]);
        }
        hasQuoted[msg.sender] = true;
        emit QuoteSubmitted(quoteId, msg.sender, quoteHash);
    }

    /// @notice 开盘：至少 1 份 quote，之后 manifest/报价/deadline 一切冻结（INV-04）。
    function openCampaign() external onlyOperator inState(State.Draft) {
        if (_quotes.length == 0) revert NoQuotes();
        state = State.Open;
        emit CampaignOpened(manifestHash, deadline);
    }

    // ---------------------------------------------------------------------
    // Open 阶段：消费者下单
    // ---------------------------------------------------------------------

    /// @notice 下单：Open 且未截止；msg.value == maxPrice > 0；每地址 1 单；上限 MAX_ORDERS。
    function placeOrder(bytes32 variantHash, uint256 maxPrice) external payable {
        if (state != State.Open) revert CampaignNotOpen();
        if (block.timestamp >= deadline) revert DeadlinePassed();
        if (maxPrice == 0 || msg.value != maxPrice) revert InvalidPayment();
        if (_orderIndexOf[msg.sender] != 0) revert DuplicateOrder();
        if (_orders.length >= MAX_ORDERS) revert OrderLimitReached();

        _orders.push(Order({buyer: msg.sender, variantHash: variantHash, maxPriceWei: maxPrice, refundClaimed: false}));
        _orderIndexOf[msg.sender] = _orders.length; // 存 index+1
        emit OrderPlaced(msg.sender, maxPrice, variantHash);
    }

    // ---------------------------------------------------------------------
    // 清算（PRD 第 09 章 R-01 ~ R-10）
    // ---------------------------------------------------------------------

    /// @notice 预览当前候选清算结果；与 settle 使用同一算法，不改状态。
    /// @dev settle 后返回已写入的唯一结果。clearingPrice 为零售价口径（P1）。
    function previewSettlement()
        external
        view
        returns (bool feasible, uint256 quoteId, uint256 tierIndex, uint256 clearingPrice_, uint256 winnerCount_)
    {
        if (state == State.Succeeded || state == State.Failed || state == State.PaidOut) {
            return (settlementFeasible, winningQuoteId, winningTierIndex, clearingPrice, winnerCount);
        }
        (feasible, quoteId, tierIndex, clearingPrice_, winnerCount_) = _computeSettlement();
        if (!feasible) return (false, 0, 0, 0, 0); // 不可行时一律返回零值，避免占位 max uint
    }

    /// @notice 截止后任何人可调；只成功一次（R-01）。只计算与记录，不转账（INV-08）。
    function settle() external {
        if (state != State.Open) revert CampaignNotOpen();
        if (block.timestamp < deadline) revert DeadlineNotReached();

        (bool feasible, uint256 quoteId, uint256 tierIndex, uint256 price, uint256 count) = _computeSettlement();

        settlementFeasible = feasible;
        if (feasible) {
            winningQuoteId = quoteId;
            winningTierIndex = tierIndex;
            clearingPrice = price; // 零售清算价（P1）
            winnerCount = count;
            selectedFactory = _quotes[quoteId].factory;
            // P1 三方分账（spec 008 §2）：工厂出厂价 + 平台费 + 品牌差价
            uint256 tierPrice = _quotes[quoteId].tiers[tierIndex].unitPriceWei; // 出厂价
            uint256 marginPool = count * (price - tierPrice); // 零售差价池（price ≥ tierPrice 恒成立）
            uint256 fee = (count * price * feeBps) / 10000;
            if (fee > marginPool) fee = marginPool; // min 兜底，永不下溢
            factoryReceivable = count * tierPrice; // R-09：出厂价量纲不变
            platformFee = fee;
            creatorReceivable = marginPool - fee;
            state = State.Succeeded;
        } else {
            // R-10：无可行 tier → Failed；无成功批次、无工厂应收
            state = State.Failed;
        }
        emit CampaignSettled(feasible, quoteId, tierIndex, feasible ? price : 0, feasible ? count : 0);
    }

    // ---------------------------------------------------------------------
    // Pull payment：Buyer 退款与工厂/品牌/平台三笔应收（INV-02 / INV-07）
    // ---------------------------------------------------------------------

    /// @notice Buyer 主动领取退款：赢家退 maxPrice-clearingPrice（可为 0），落选/失败退全额。仅本人一次。
    function claimRefund() external nonReentrant {
        State s = state;
        if (s != State.Succeeded && s != State.Failed && s != State.PaidOut) {
            revert WrongState(State.Succeeded, s);
        }
        uint256 idxPlusOne = _orderIndexOf[msg.sender];
        if (idxPlusOne == 0) revert NoOrder();
        Order storage order = _orders[idxPlusOne - 1];
        if (order.refundClaimed) revert AlreadyClaimed();

        uint256 amount;
        if (s == State.Failed) {
            amount = order.maxPriceWei; // R-08：失败全额
        } else if (order.maxPriceWei >= clearingPrice) {
            amount = order.maxPriceWei - clearingPrice; // R-08：赢家差额（可为 0）
        } else {
            amount = order.maxPriceWei; // R-08：落选全额
        }

        // 先置状态再转账（INV-07）
        order.refundClaimed = true;
        emit RefundClaimed(msg.sender, amount);

        if (amount > 0) {
            (bool ok,) = msg.sender.call{value: amount}("");
            if (!ok) revert TransferFailed();
        }
    }

    /// @notice 仅中标工厂领取应收 = winnerCount × 出厂价，一次（R-09）。成功后进入 PaidOut。
    function claimPayout() external nonReentrant {
        State s = state;
        if (s != State.Succeeded) revert WrongState(State.Succeeded, s);
        if (msg.sender != selectedFactory) revert NotSelectedFactory();
        if (factoryPayoutClaimed) revert AlreadyClaimed();

        uint256 amount = factoryReceivable;
        // 先置状态再转账（INV-07）；PaidOut 后 Buyer 仍可领取退款
        factoryPayoutClaimed = true;
        state = State.PaidOut;
        emit FactoryPayoutClaimed(msg.sender, amount);

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice 仅 creator 领取品牌应收 = 差价池 − 平台费，一次（P1）。
    ///         Succeeded 与 PaidOut 均可调用；金额 0 也允许（与 refund-0 同模式，幂等防卡）。
    function claimCreatorPayout() external nonReentrant {
        State s = state;
        if (s != State.Succeeded && s != State.PaidOut) revert WrongState(State.Succeeded, s);
        if (msg.sender != creator) revert NotCreator();
        if (creatorPayoutClaimed) revert AlreadyClaimed();

        uint256 amount = creatorReceivable;
        // 先置状态再转账（INV-07）
        creatorPayoutClaimed = true;
        emit CreatorPayoutClaimed(msg.sender, amount);

        if (amount > 0) {
            (bool ok,) = msg.sender.call{value: amount}("");
            if (!ok) revert TransferFailed();
        }
    }

    /// @notice 仅 feeRecipient 领取平台费，一次（P1）。
    ///         Succeeded 与 PaidOut 均可调用；金额 0 也允许（与 refund-0 同模式，幂等防卡）。
    function claimPlatformFee() external nonReentrant {
        State s = state;
        if (s != State.Succeeded && s != State.PaidOut) revert WrongState(State.Succeeded, s);
        if (msg.sender != feeRecipient) revert NotFeeRecipient();
        if (platformFeeClaimed) revert AlreadyClaimed();

        uint256 amount = platformFee;
        // 先置状态再转账（INV-07）
        platformFeeClaimed = true;
        emit PlatformFeeClaimed(msg.sender, amount);

        if (amount > 0) {
            (bool ok,) = msg.sender.call{value: amount}("");
            if (!ok) revert TransferFailed();
        }
    }

    // ---------------------------------------------------------------------
    // 读取接口（前端遍历用）
    // ---------------------------------------------------------------------

    function getOrder(address buyer) external view returns (Order memory) {
        uint256 idxPlusOne = _orderIndexOf[buyer];
        if (idxPlusOne == 0) revert NoOrder();
        return _orders[idxPlusOne - 1];
    }

    function getQuote(uint256 quoteId) external view returns (FactoryQuote memory) {
        return _quotes[quoteId];
    }

    function ordersLength() external view returns (uint256) {
        return _orders.length;
    }

    function quotesLength() external view returns (uint256) {
        return _quotes.length;
    }

    function registeredFactoriesLength() external view returns (uint256) {
        return registeredFactories.length;
    }

    // ---------------------------------------------------------------------
    // 内部：清算算法（R-02 ~ R-06）与报价校验
    // ---------------------------------------------------------------------

    /// @dev 有界循环：最多 MAX_FACTORIES × MAX_TIERS × MAX_ORDERS = 300 次比较（INV-08）。
    ///      P1（R-V1-01/02）：每个 tier 先折算零售价 retailTierPrice = 出厂价 × (10000+marginBps)/10000（floor），
    ///      eligibility（R-02）、R-04~R-06 选择与返回价格一律用零售价。marginBps=0 时 retailTierPrice == 出厂价，
    ///      逐字退化为 P0。
    function _computeSettlement()
        internal
        view
        returns (bool feasible, uint256 bestQuoteId, uint256 bestTierIndex, uint256 bestPrice, uint256 bestCount)
    {
        bestPrice = type(uint256).max;
        uint256 nQuotes = _quotes.length;
        uint256 nOrders = _orders.length;

        for (uint256 q = 0; q < nQuotes; q++) {
            FactoryQuote storage quote = _quotes[q];
            uint256 nTiers = quote.tiers.length;
            for (uint256 t = 0; t < nTiers; t++) {
                Tier memory tier = quote.tiers[t];
                uint256 retailTierPrice = (tier.unitPriceWei * (10000 + marginBps)) / 10000;
                uint256 count = 0;
                for (uint256 i = 0; i < nOrders; i++) {
                    if (_orders[i].maxPriceWei >= retailTierPrice) count++; // R-02（P1：按零售价判定）
                }
                if (count < tier.minQty) continue; // R-03：不可行
                // R-04 先取 eligibleCount 最大；R-05 并列取价低；
                // R-06 完全并列时保留先遇到的（循环顺序保证 quoteId/tierIndex 更小者优先）。
                if (!feasible || count > bestCount || (count == bestCount && retailTierPrice < bestPrice)) {
                    feasible = true;
                    bestQuoteId = q;
                    bestTierIndex = t;
                    bestPrice = retailTierPrice;
                    bestCount = count;
                }
            }
        }
    }

    function _validateTiers(Tier[] memory tiers) internal pure {
        if (tiers.length == 0 || tiers.length > MAX_TIERS) revert InvalidTiers();
        for (uint256 i = 0; i < tiers.length; i++) {
            if (tiers[i].minQty == 0 || tiers[i].unitPriceWei == 0) revert InvalidTiers();
            if (i > 0) {
                // minQty 必须严格递增，price 必须严格递减（FR-FAC-03）
                if (tiers[i].minQty <= tiers[i - 1].minQty) revert InvalidTiers();
                if (tiers[i].unitPriceWei >= tiers[i - 1].unitPriceWei) revert InvalidTiers();
            }
        }
    }
}
