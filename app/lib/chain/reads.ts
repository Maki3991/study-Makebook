import {
  BaseError,
  ContractFunctionRevertedError,
  formatUnits,
  parseAbiItem,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { makebookAbi } from "./abi";
import { INJ_DECIMALS } from "./chain";

/**
 * Campaign 只读访问层（接口文档 2.2 / 第 4 节）。
 * 金额一律 wei bigint；INJ 字符串只经 formatUnits 产出，禁止浮点。
 */

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** state() uint8 → 枚举名（接口文档第 3 节）。 */
export const CAMPAIGN_STATE_NAMES = ["Draft", "Open", "Succeeded", "Failed", "PaidOut"] as const;
export type CampaignStateName = (typeof CAMPAIGN_STATE_NAMES)[number];

export function campaignStateName(state: number): CampaignStateName {
  return CAMPAIGN_STATE_NAMES[state] ?? "Draft";
}

export interface QuoteTier {
  /** uint32 → number */
  minQty: number;
  /** uint256 → bigint（wei） */
  unitPriceWei: bigint;
}

export interface Quote {
  factory: Address;
  quoteHash: Hex;
  tiers: QuoteTier[];
}

export interface SettlementPreview {
  /** false 时其余字段链上全为 0（接口文档 2.2）。 */
  feasible: boolean;
  quoteId: bigint;
  tierIndex: bigint;
  /** wei */
  clearingPrice: bigint;
  winnerCount: bigint;
}

export interface CampaignSummary {
  /** uint8：0 Draft / 1 Open / 2 Succeeded / 3 Failed / 4 PaidOut */
  state: number;
  /** uint64 秒级 Unix 时间 */
  deadline: bigint;
  manifestHash: Hex;
  manifestURI: string;
  ordersLength: bigint;
  quotes: Quote[];
  preview: SettlementPreview;
}

export interface OrderPlacedEvent {
  buyer: Address;
  /** 买家最高愿付价（wei） */
  maxPrice: bigint;
  variantHash: Hex;
  transactionHash: Hex;
  blockNumber: bigint;
}

export interface Order {
  buyer: Address;
  variantHash: Hex;
  /** wei */
  maxPriceWei: bigint;
  refundClaimed: boolean;
}

// ---------------------------------------------------------------------------
// 读函数
// ---------------------------------------------------------------------------

/**
 * 读取构造时写入的 immutable operator 地址（主理人卡展示用）。
 * 读取失败照常抛出，由调用方决定降级展示（fixture 场景无链上可读）。
 */
export async function readOperator(
  client: PublicClient,
  address: Address,
): Promise<Address> {
  return client.readContract({
    address,
    abi: makebookAbi,
    functionName: "operator",
  });
}

/**
 * 一次拉取 Campaign 概览：基础字段 + 全部 quote + 实时清算预览。
 * previewSettlement 在 Open 期间是实时预览，settle 后是已写入的唯一结果。
 */
export async function readCampaignSummary(
  client: PublicClient,
  address: Address,
): Promise<CampaignSummary> {
  const base = { address, abi: makebookAbi } as const;
  const [state, deadline, manifestHash, manifestURI, ordersLength, quotesLength, preview] =
    await Promise.all([
      client.readContract({ ...base, functionName: "state" }),
      client.readContract({ ...base, functionName: "deadline" }),
      client.readContract({ ...base, functionName: "manifestHash" }),
      client.readContract({ ...base, functionName: "manifestURI" }),
      client.readContract({ ...base, functionName: "ordersLength" }),
      client.readContract({ ...base, functionName: "quotesLength" }),
      client.readContract({ ...base, functionName: "previewSettlement" }),
    ]);

  const quotes = await Promise.all(
    Array.from({ length: Number(quotesLength) }, (_, i) =>
      client.readContract({ ...base, functionName: "getQuote", args: [BigInt(i)] }),
    ),
  );

  return {
    state,
    deadline,
    manifestHash,
    manifestURI,
    ordersLength,
    quotes: quotes.map((q) => ({
      factory: q.factory,
      quoteHash: q.quoteHash,
      tiers: q.tiers.map((t) => ({ minQty: t.minQty, unitPriceWei: t.unitPriceWei })),
    })),
    preview: {
      feasible: preview[0],
      quoteId: preview[1],
      tierIndex: preview[2],
      clearingPrice: preview[3],
      winnerCount: preview[4],
    },
  };
}

const orderPlacedEvent = parseAbiItem(
  "event OrderPlaced(address indexed buyer, uint256 maxPrice, bytes32 variantHash)",
);

/**
 * Injective testnet RPC 对 eth_getLogs 的区间限制：
 * "maximum [from, to] blocks distance: 10000"（实测）。必须分块拉取。
 */
export const GET_LOGS_BLOCK_CHUNK = 10_000n;

/**
 * OrderPlaced 事件日志：买家地址列表的唯一链上来源（接口文档 2.2 / 第 4 节）。
 * 买家地址列表 = 返回值 .map((e) => e.buyer)。
 *
 * 注意：该测试网已出块上亿，fromBlock 默认 0 会产生上万次分块请求，
 * 生产调用请传入 Campaign 部署块（或近端块）作为 fromBlock。
 */
export async function listOrderPlacedEvents(
  client: PublicClient,
  address: Address,
  fromBlock: bigint = 0n,
  toBlock?: bigint,
): Promise<OrderPlacedEvent[]> {
  const latest = toBlock ?? (await client.getBlockNumber());
  const events: OrderPlacedEvent[] = [];
  for (let from = fromBlock; from <= latest; from += GET_LOGS_BLOCK_CHUNK) {
    const to =
      from + GET_LOGS_BLOCK_CHUNK - 1n > latest ? latest : from + GET_LOGS_BLOCK_CHUNK - 1n;
    const logs = await client.getLogs({
      address,
      event: orderPlacedEvent,
      fromBlock: from,
      toBlock: to,
      strict: true,
    });
    for (const log of logs) {
      events.push({
        buyer: log.args.buyer,
        maxPrice: log.args.maxPrice,
        variantHash: log.args.variantHash,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    }
  }
  return events;
}

/**
 * 包装 getOrder：该买家没有订单时合约 revert NoOrder，此处返回 null 而非抛错；
 * 其它 revert / RPC 故障照常抛出（由上层决定降级 fixtures）。
 */
export async function readOrder(
  client: PublicClient,
  address: Address,
  buyer: Address,
): Promise<Order | null> {
  try {
    const order = await client.readContract({
      address,
      abi: makebookAbi,
      functionName: "getOrder",
      args: [buyer],
    });
    return {
      buyer: order.buyer,
      variantHash: order.variantHash,
      maxPriceWei: order.maxPriceWei,
      refundClaimed: order.refundClaimed,
    };
  } catch (err) {
    if (isNoOrderRevert(err)) return null;
    throw err;
  }
}

function isNoOrderRevert(err: unknown): boolean {
  if (!(err instanceof BaseError)) return false;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  return (
    revert instanceof ContractFunctionRevertedError && revert.data?.errorName === "NoOrder"
  );
}

// ---------------------------------------------------------------------------
// 清算结果与链上证据（接口文档 2.2 / 第 4 节）
// ---------------------------------------------------------------------------

/** state ≥ Succeeded 后已写入链上的唯一清算结果（接口文档第 3 节）。 */
export interface SettlementResult {
  /** state 为 Succeeded/PaidOut → true；Failed → false。 */
  success: boolean;
  winningQuoteId: bigint;
  winningTierIndex: bigint;
  /** wei */
  clearingPrice: bigint;
  winnerCount: bigint;
  selectedFactory: Address;
  /** wei */
  factoryReceivable: bigint;
  factoryPayoutClaimed: boolean;
}

/**
 * 读取已写入的清算结果。仅在 state ≥ Succeeded(2) 后调用；
 * Open 期间请用 previewSettlement（readCampaignSummary 已含）。
 */
export async function readSettlementResult(
  client: PublicClient,
  address: Address,
): Promise<SettlementResult> {
  const base = { address, abi: makebookAbi } as const;
  const [state, winningQuoteId, winningTierIndex, clearingPrice, winnerCount, selectedFactory, factoryReceivable, factoryPayoutClaimed] =
    await Promise.all([
      client.readContract({ ...base, functionName: "state" }),
      client.readContract({ ...base, functionName: "winningQuoteId" }),
      client.readContract({ ...base, functionName: "winningTierIndex" }),
      client.readContract({ ...base, functionName: "clearingPrice" }),
      client.readContract({ ...base, functionName: "winnerCount" }),
      client.readContract({ ...base, functionName: "selectedFactory" }),
      client.readContract({ ...base, functionName: "factoryReceivable" }),
      client.readContract({ ...base, functionName: "factoryPayoutClaimed" }),
    ]);
  return {
    success: state === 2 || state === 4,
    winningQuoteId,
    winningTierIndex,
    clearingPrice,
    winnerCount,
    selectedFactory,
    factoryReceivable,
    factoryPayoutClaimed,
  };
}

/** CampaignOpened / CampaignSettled 事件的 tx 证据（接口文档第 4 节：Batch Receipt 深链）。 */
export interface CampaignTxEvidence {
  /** openCampaign 交易哈希；未开盘或超出扫描区间时为 null。 */
  openedTxHash: Hex | null;
  /** settle 交易哈希；未清算时为 null。 */
  settledTxHash: Hex | null;
  /** CampaignSettled 事件内容（未清算为 null）。 */
  settled: {
    success: boolean;
    winningQuoteId: bigint;
    tierIndex: bigint;
    clearingPrice: bigint;
    winnerCount: bigint;
  } | null;
}

const campaignOpenedEvent = parseAbiItem(
  "event CampaignOpened(bytes32 manifestHash, uint64 deadline)",
);
const campaignSettledEvent = parseAbiItem(
  "event CampaignSettled(bool success, uint256 winningQuoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount)",
);

/**
 * CampaignOpened / CampaignSettled 事件扫描。与 listOrderPlacedEvents 一样
 * 受 RPC "maximum [from, to] blocks distance: 10000" 限制，必须分块。
 */
export async function listCampaignTxEvidence(
  client: PublicClient,
  address: Address,
  fromBlock: bigint = 0n,
  toBlock?: bigint,
): Promise<CampaignTxEvidence> {
  const latest = toBlock ?? (await client.getBlockNumber());
  const evidence: CampaignTxEvidence = {
    openedTxHash: null,
    settledTxHash: null,
    settled: null,
  };
  for (let from = fromBlock; from <= latest; from += GET_LOGS_BLOCK_CHUNK) {
    const to =
      from + GET_LOGS_BLOCK_CHUNK - 1n > latest ? latest : from + GET_LOGS_BLOCK_CHUNK - 1n;
    const logs = await client.getLogs({
      address,
      events: [campaignOpenedEvent, campaignSettledEvent],
      fromBlock: from,
      toBlock: to,
      strict: true,
    });
    for (const log of logs) {
      if (log.eventName === "CampaignOpened") {
        evidence.openedTxHash = log.transactionHash;
      } else if (log.eventName === "CampaignSettled") {
        evidence.settledTxHash = log.transactionHash;
        evidence.settled = {
          success: log.args.success,
          winningQuoteId: log.args.winningQuoteId,
          tierIndex: log.args.tierIndex,
          clearingPrice: log.args.clearingPrice,
          winnerCount: log.args.winnerCount,
        };
      }
    }
  }
  return evidence;
}

// ---------------------------------------------------------------------------
// 纯函数：链上数据 → 组件数据形状（对齐 app/lib/mock-data.ts，可直接替换）
// ---------------------------------------------------------------------------

/** buildDemandCurve / buildTierEligibility 的最小订单输入。 */
export interface DemandOrder {
  /** wei */
  maxPriceWei: bigint;
}

/** 对齐 mock-data.ts demandPoints：price 为 INJ 字符串，orders 为该价位可成交订单数。 */
export interface DemandPoint {
  price: string;
  orders: number;
}

/**
 * 需求曲线：取所有出现过的价位（升序），每个价位的订单数 = maxPrice ≥ 该价位的订单数
 * （统一清算下愿付 ≥ 价位即参与成交）。输出形状与 mock demandPoints 一致，
 * 例如 5 笔订单（0.026/0.024/0.021/0.019/0.017）→
 * [{ price: "0.017", orders: 5 }, …, { price: "0.026", orders: 1 }]。
 */
export function buildDemandCurve(orders: readonly DemandOrder[]): DemandPoint[] {
  const prices = [...new Set(orders.map((o) => o.maxPriceWei))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return prices.map((price) => ({
    price: formatUnits(price, INJ_DECIMALS),
    orders: orders.filter((o) => o.maxPriceWei >= price).length,
  }));
}

/** 对齐 mock-data.ts factoryTiers 的字段形状。 */
export interface TierEligibility {
  /** 链上无工厂名/短 id，用 quote/tier 下标生成稳定 id（quoteId 即 quotes 数组下标）。 */
  id: string;
  /** 链上无工厂名，用截断地址占位（如 "Factory 0x378b…b03d"）。 */
  name: string;
  /** = tier.minQty */
  quantity: number;
  /** INJ 字符串，formatUnits(unitPriceWei, 18) */
  price: string;
  /** eligible >= minQty */
  feasible: boolean;
  /** maxPriceWei >= unitPriceWei 的订单数 */
  eligible: number;
}

/**
 * 工厂阶梯可行性：对每个 quote 的每个 tier，统计 maxPrice ≥ 单价的订单数（eligible），
 * eligible ≥ minQty 即可行。输出形状与 mock factoryTiers 一致，组件可直接替换。
 */
export function buildTierEligibility(
  orders: readonly DemandOrder[],
  quotes: readonly Quote[],
): TierEligibility[] {
  return quotes.flatMap((quote, quoteIndex) =>
    quote.tiers.map((tier, tierIndex) => {
      const eligible = orders.filter((o) => o.maxPriceWei >= tier.unitPriceWei).length;
      return {
        id: `quote-${quoteIndex}-tier-${tierIndex}`,
        name: `Factory ${shortenAddress(quote.factory)}`,
        quantity: tier.minQty,
        price: formatUnits(tier.unitPriceWei, INJ_DECIMALS),
        feasible: eligible >= tier.minQty,
        eligible,
      };
    }),
  );
}

function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
