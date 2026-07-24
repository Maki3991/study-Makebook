// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MakebookCampaign
/// @notice MAKEBOOK（造物簿）单个 Campaign 的托管与确定性统一清算合约。
///         一个部署 = 一个 Campaign。无 proxy / delegatecall / selfdestruct / ownerWithdraw。
///         清算规则见 PRD 第 09 章 R-01 ~ R-10；不变量见 13A INV-01 ~ INV-10。
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

    // ---------------------------------------------------------------------
    // 不可变参数（部署时冻结，INV-04）
    // ---------------------------------------------------------------------

    address public immutable operator;
    bytes32 public immutable manifestHash;
    string public manifestURI;
    uint64 public immutable deadline;

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
    uint256 public clearingPrice;
    uint256 public winnerCount;
    address public selectedFactory;
    uint256 public factoryReceivable;
    bool public factoryPayoutClaimed;

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

    constructor(address operator_, bytes32 manifestHash_, string memory manifestURI_, uint64 deadline_) {
        if (operator_ == address(0)) revert ZeroAddress();
        if (deadline_ <= block.timestamp) revert DeadlineNotInFuture();
        operator = operator_;
        manifestHash = manifestHash_;
        manifestURI = manifestURI_;
        deadline = deadline_;
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
    /// @dev settle 后返回已写入的唯一结果。
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
            clearingPrice = price;
            winnerCount = count;
            selectedFactory = _quotes[quoteId].factory;
            factoryReceivable = count * price; // R-09
            state = State.Succeeded;
        } else {
            // R-10：无可行 tier → Failed；无成功批次、无工厂应收
            state = State.Failed;
        }
        emit CampaignSettled(feasible, quoteId, tierIndex, feasible ? price : 0, feasible ? count : 0);
    }

    // ---------------------------------------------------------------------
    // Pull payment：Buyer 退款与工厂应收（INV-02 / INV-07）
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

    /// @notice 仅中标工厂领取应收 = winnerCount × clearingPrice，一次（R-09）。成功后进入 PaidOut。
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
                uint256 count = 0;
                for (uint256 i = 0; i < nOrders; i++) {
                    if (_orders[i].maxPriceWei >= tier.unitPriceWei) count++; // R-02
                }
                if (count < tier.minQty) continue; // R-03：不可行
                // R-04 先取 eligibleCount 最大；R-05 并列取价低；
                // R-06 完全并列时保留先遇到的（循环顺序保证 quoteId/tierIndex 更小者优先）。
                if (!feasible || count > bestCount || (count == bestCount && tier.unitPriceWei < bestPrice)) {
                    feasible = true;
                    bestQuoteId = q;
                    bestTierIndex = t;
                    bestPrice = tier.unitPriceWei;
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
