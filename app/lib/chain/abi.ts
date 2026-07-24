import { parseAbi } from "viem";

/**
 * MakebookCampaign ABI（接口文档第 2 节写/读函数 + 第 4 节事件，
 * 与 contracts/abi/MakebookCampaign.json 逐项核对一致）。
 * custom errors 一并收录：前端用 viem 捕获 ContractFunctionRevertedError
 * 按 errorName 映射接口文档 2.1 节文案，错误必须进 ABI 才能解码。
 */
export const makebookAbi = parseAbi([
  // 构造（仅部署脚本用）
  "constructor(address operator, bytes32 manifestHash, string manifestURI, uint64 deadline)",

  // ---- 写函数（7 个，谁可调/revert 对照见接口文档 2.1）----
  "function registerFactory(address factory, bytes32 profileHash)",
  "function submitQuote(bytes32 quoteHash, (uint32 minQty, uint256 unitPriceWei)[] tiers)",
  "function openCampaign()",
  "function placeOrder(bytes32 variantHash, uint256 maxPrice) payable",
  "function settle()",
  "function claimRefund()",
  "function claimPayout()",

  // ---- 读函数 ----
  "function previewSettlement() view returns (bool feasible, uint256 quoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount)",
  "function getOrder(address buyer) view returns ((address buyer, bytes32 variantHash, uint256 maxPriceWei, bool refundClaimed))",
  "function getQuote(uint256 quoteId) view returns ((address factory, bytes32 quoteHash, (uint32 minQty, uint256 unitPriceWei)[] tiers))",
  "function ordersLength() view returns (uint256)",
  "function quotesLength() view returns (uint256)",
  "function registeredFactoriesLength() view returns (uint256)",
  "function registeredFactories(uint256) view returns (address)",
  "function isRegisteredFactory(address) view returns (bool)",
  "function factoryProfileHash(address) view returns (bytes32)",
  "function hasQuoted(address) view returns (bool)",
  "function state() view returns (uint8)",
  "function operator() view returns (address)",
  "function manifestHash() view returns (bytes32)",
  "function manifestURI() view returns (string)",
  "function deadline() view returns (uint64)",
  "function settlementFeasible() view returns (bool)",
  "function winningQuoteId() view returns (uint256)",
  "function winningTierIndex() view returns (uint256)",
  "function clearingPrice() view returns (uint256)",
  "function winnerCount() view returns (uint256)",
  "function selectedFactory() view returns (address)",
  "function factoryReceivable() view returns (uint256)",
  "function factoryPayoutClaimed() view returns (bool)",
  "function MAX_ORDERS() view returns (uint256)", // 50
  "function MAX_FACTORIES() view returns (uint256)", // 2
  "function MAX_TIERS() view returns (uint256)", // 3

  // ---- 事件（接口文档第 4 节，7 个）----
  "event CampaignOpened(bytes32 manifestHash, uint64 deadline)",
  "event FactoryRegistered(address indexed factory, bytes32 profileHash)",
  "event QuoteSubmitted(uint256 indexed quoteId, address indexed factory, bytes32 quoteHash)",
  "event OrderPlaced(address indexed buyer, uint256 maxPrice, bytes32 variantHash)",
  "event CampaignSettled(bool success, uint256 winningQuoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount)",
  "event RefundClaimed(address indexed buyer, uint256 amount)",
  "event FactoryPayoutClaimed(address indexed factory, uint256 amount)",

  // ---- custom errors（接口文档 2.1 revert 映射用，与合约源码一致）----
  "error ZeroAddress()",
  "error DeadlineNotInFuture()",
  "error NotOperator()",
  "error WrongState(uint8 expected, uint8 actual)",
  "error FactoryAlreadyRegistered()",
  "error TooManyFactories()",
  "error FactoryNotRegistered()",
  "error AlreadyQuoted()",
  "error InvalidTiers()",
  "error NoQuotes()",
  "error CampaignNotOpen()",
  "error DeadlinePassed()",
  "error DeadlineNotReached()",
  "error InvalidPayment()",
  "error DuplicateOrder()",
  "error OrderLimitReached()",
  "error NoOrder()",
  "error AlreadyClaimed()",
  "error NotSelectedFactory()",
  "error TransferFailed()",
  "error ReentrancyGuardReentrantCall()",
]);
