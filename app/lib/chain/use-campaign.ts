"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseUnits, type Address, type Hex } from "viem";
import failureFixture from "../../../fixtures/failure.json";
import successFixture from "../../../fixtures/success.json";
import { INJ_DECIMALS, createInjPublicClient } from "./chain";
import {
  ZERO_ADDRESS,
  failureDeployment,
  isDemoMode,
  successDeployment,
  type CampaignDeployment,
} from "./deployments";
import {
  buildDemandCurve,
  buildTierEligibility,
  listCampaignTxEvidence,
  listOrderPlacedEvents,
  readCampaignSummary,
  readOrder,
  readSettlementResult,
  type DemandPoint,
  type Order,
  type Quote,
  type SettlementPreview,
  type SettlementResult,
  type TierEligibility,
} from "./reads";
import { shortenAddress } from "./wallet";

/**
 * Campaign 数据 hook：链上实时读取 + fixtures 降级（spec 003 第 1/3 节）。
 * - 数据源优先级：合约（ONCHAIN）→ fixtures/*.json（OFF-CHAIN DEMO）
 * - deployments 零地址（isDemoMode）或任何 RPC/读取失败 → fixtures 兜底
 * - success/failure 两套合约地址由 demo-panel 的清算场景开关选择
 * - 金额全程 wei bigint，显示层才 formatUnits（INV-09，无浮点）
 */

export type CampaignScenario = "success" | "failure";

const ZERO_HASH: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/** 订单都是部署当天产生的；再往前扫会被 RPC 的 10000 块 getLogs 上限拖垮。 */
const EVENT_LOOKBACK_BLOCKS = 200_000n;

/** 订单（OrderPlaced 事件 + getOrder 合并，附下单 tx 哈希）。 */
export interface CampaignOrder extends Order {
  txHash: Hex | null;
}

/** 组件消费的统一视图：链上与 fixtures 两条路径产出同一形状。 */
export interface CampaignView {
  /** onchain = 合约实读；fixture = fixtures 兜底（UI 标 OFF-CHAIN DEMO）。 */
  source: "onchain" | "fixture";
  scenario: CampaignScenario;
  address: Address;
  /** uint8：0 Draft / 1 Open / 2 Succeeded / 3 Failed / 4 PaidOut。 */
  state: number;
  /** 秒级 Unix 时间。 */
  deadline: bigint;
  manifestHash: Hex;
  manifestURI: string;
  ordersLength: number;
  /** 报价工厂数（quotes.length）。 */
  factoriesCount: number;
  quotes: Quote[];
  /** 与 quotes 同序的展示名（fixtures 具名工厂；未知工厂为 undefined，退化为截断地址）。 */
  quoteNames: (string | undefined)[];
  orders: CampaignOrder[];
  demandPoints: DemandPoint[];
  /** 按单价升序（低价档在前），工厂名已解析。 */
  factoryTiers: TierEligibility[];
  /** Open 期间为实时预览；settle 后为已写入的唯一结果。 */
  preview: SettlementPreview;
  /** state ≥ Succeeded。 */
  settled: boolean;
  /** 仅 settled 时有值。 */
  settlement: SettlementResult | null;
  openedTxHash: Hex | null;
  settledTxHash: Hex | null;
}

function deploymentFor(scenario: CampaignScenario): CampaignDeployment {
  return scenario === "success" ? successDeployment : failureDeployment;
}

function fixtureFor(scenario: CampaignScenario) {
  return scenario === "success" ? successFixture : failureFixture;
}

// ---------------------------------------------------------------------------
// 视图组装（链上 / fixtures 共用）
// ---------------------------------------------------------------------------

function buildView(args: {
  scenario: CampaignScenario;
  source: "onchain" | "fixture";
  address: Address;
  state: number;
  deadline: bigint;
  manifestHash: Hex;
  manifestURI: string;
  quotes: Quote[];
  quoteNames: (string | undefined)[];
  orders: CampaignOrder[];
  preview: SettlementPreview;
  settlement: SettlementResult | null;
  openedTxHash: Hex | null;
  settledTxHash: Hex | null;
}): CampaignView {
  const {
    quotes,
    quoteNames,
    orders,
    scenario,
    source,
    address,
    state,
    deadline,
    manifestHash,
    manifestURI,
    preview,
    settlement,
    openedTxHash,
    settledTxHash,
  } = args;
  // buildTierEligibility 按 quotes.flatMap(tiers) 顺序输出，展示名按同序对齐。
  const flatNames = quotes.flatMap((quote, quoteIndex) =>
    quote.tiers.map(
      () => quoteNames[quoteIndex] ?? `Factory ${shortenAddress(quote.factory)}`,
    ),
  );
  const factoryTiers = buildTierEligibility(orders, quotes)
    .map((tier, index) => ({ ...tier, name: flatNames[index] ?? tier.name }))
    .sort((a, b) => {
      const pa = parseUnits(a.price, INJ_DECIMALS);
      const pb = parseUnits(b.price, INJ_DECIMALS);
      return pa < pb ? -1 : pa > pb ? 1 : 0;
    });
  return {
    scenario,
    source,
    address,
    state,
    deadline,
    manifestHash,
    manifestURI,
    ordersLength: orders.length,
    factoriesCount: quotes.length,
    quotes,
    quoteNames,
    orders,
    demandPoints: buildDemandCurve(orders),
    factoryTiers,
    preview,
    settled: state >= 2,
    settlement,
    openedTxHash,
    settledTxHash,
  };
}

/** fixtures/*.json → CampaignView（spec 003 附录 A 场景，OFF-CHAIN DEMO 兜底）。 */
export function buildFixtureView(scenario: CampaignScenario): CampaignView {
  const fixture = fixtureFor(scenario);
  const deployment = deploymentFor(scenario);
  const quotes: Quote[] = fixture.quotes.map((quote) => ({
    factory: ZERO_ADDRESS,
    quoteHash: ZERO_HASH,
    tiers: quote.tiers.map((tier) => ({
      minQty: tier.minQty,
      unitPriceWei: parseUnits(tier.unitPrice, INJ_DECIMALS),
    })),
  }));
  const orders: CampaignOrder[] = fixture.orders.map((order) => ({
    buyer: ZERO_ADDRESS,
    variantHash: ZERO_HASH,
    maxPriceWei: parseUnits(order.maxPrice, INJ_DECIMALS),
    refundClaimed: false,
    txHash: null,
  }));
  const success = scenario === "success";
  const preview: SettlementPreview = success
    ? {
        feasible: true,
        quoteId: BigInt(successFixture.settlement.winningQuoteId),
        tierIndex: BigInt(successFixture.settlement.tierIndex),
        clearingPrice: parseUnits(successFixture.settlement.clearingPrice, INJ_DECIMALS),
        winnerCount: BigInt(successFixture.settlement.winnerCount),
      }
    : { feasible: false, quoteId: 0n, tierIndex: 0n, clearingPrice: 0n, winnerCount: 0n };
  const settlement: SettlementResult = success
    ? {
        success: true,
        winningQuoteId: BigInt(successFixture.settlement.winningQuoteId),
        winningTierIndex: BigInt(successFixture.settlement.tierIndex),
        clearingPrice: parseUnits(successFixture.settlement.clearingPrice, INJ_DECIMALS),
        winnerCount: BigInt(successFixture.settlement.winnerCount),
        selectedFactory: ZERO_ADDRESS,
        factoryReceivable: parseUnits(
          successFixture.settlement.factoryReceivable,
          INJ_DECIMALS,
        ),
        factoryPayoutClaimed: false,
      }
    : {
        success: false,
        winningQuoteId: 0n,
        winningTierIndex: 0n,
        clearingPrice: 0n,
        winnerCount: 0n,
        selectedFactory: ZERO_ADDRESS,
        factoryReceivable: 0n,
        factoryPayoutClaimed: false,
      };
  return buildView({
    scenario,
    source: "fixture",
    address: deployment.address,
    // fixtures 描述的是附录 A 的清算后场景。
    state: success ? 2 : 3,
    deadline: BigInt(deployment.deadline),
    manifestHash: deployment.manifestHash,
    manifestURI: deployment.manifestURI,
    quotes,
    quoteNames: fixture.quotes.map((quote) => quote.factory),
    orders,
    preview,
    settlement,
    openedTxHash: null,
    settledTxHash: null,
  });
}

// ---------------------------------------------------------------------------
// 链上拉取（带模块级缓存与并发去重：hero / Campaign / Settlement 共享一次读取）
// ---------------------------------------------------------------------------

async function fetchOnchainView(scenario: CampaignScenario): Promise<CampaignView> {
  const deployment = deploymentFor(scenario);
  const client = createInjPublicClient();
  const summary = await readCampaignSummary(client, deployment.address);
  const latest = await client.getBlockNumber();
  const fromBlock = latest > EVENT_LOOKBACK_BLOCKS ? latest - EVENT_LOOKBACK_BLOCKS : 0n;
  const [orderEvents, evidence] = await Promise.all([
    listOrderPlacedEvents(client, deployment.address, fromBlock, latest),
    listCampaignTxEvidence(client, deployment.address, fromBlock, latest),
  ]);
  const orders = (
    await Promise.all(
      orderEvents.map(async (event): Promise<CampaignOrder | null> => {
        const order = await readOrder(client, deployment.address, event.buyer);
        return order ? { ...order, txHash: event.transactionHash } : null;
      }),
    )
  ).filter((order): order is CampaignOrder => order !== null);
  const settled = summary.state >= 2;
  const settlement = settled
    ? await readSettlementResult(client, deployment.address)
    : null;
  const fixture = fixtureFor(scenario);
  return buildView({
    scenario,
    source: "onchain",
    address: deployment.address,
    state: summary.state,
    deadline: summary.deadline,
    manifestHash: summary.manifestHash,
    manifestURI: summary.manifestURI,
    quotes: summary.quotes,
    quoteNames: summary.quotes.map(
      (_, quoteIndex) => fixture.quotes[quoteIndex]?.factory,
    ),
    orders,
    preview: summary.preview,
    settlement,
    openedTxHash: evidence.openedTxHash,
    settledTxHash: evidence.settledTxHash,
  });
}

const CACHE_TTL_MS = 15_000;
const cache = new Map<CampaignScenario, { at: number; view: CampaignView }>();
const inflight = new Map<CampaignScenario, Promise<CampaignView>>();

/**
 * 拉取 Campaign 视图。任何 RPC/读取失败静默回落 fixtures（标 OFF-CHAIN DEMO），
 * 不向组件抛错——错误三态演示由 demo-panel 的 readState 开关负责。
 */
export async function fetchCampaignView(
  scenario: CampaignScenario,
  force = false,
): Promise<CampaignView> {
  if (isDemoMode) return buildFixtureView(scenario);
  if (!force) {
    const hit = cache.get(scenario);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.view;
    const pending = inflight.get(scenario);
    if (pending) return pending;
  }
  const promise = fetchOnchainView(scenario)
    .then((view) => {
      cache.set(scenario, { at: Date.now(), view });
      return view;
    })
    .catch(() => buildFixtureView(scenario))
    .finally(() => {
      inflight.delete(scenario);
    });
  inflight.set(scenario, promise);
  return promise;
}

export interface CampaignDataResult {
  /** loading = 首次读取中（界面走 skeleton）；ready 后 view 恒有值。 */
  status: "loading" | "ready";
  view: CampaignView;
  /** 强制绕过缓存重新读取（settle/claim 交易确认后调用）。 */
  reload: () => void;
}

/**
 * Campaign 数据 hook。
 * status 由"已取数是否与当前 scenario 匹配"派生，effect 内不做同步 setState；
 * 首屏及 scenario 切换期间为 loading（界面走 skeleton），就绪后 view 恒有值。
 * @param enabled demo-panel readState ≠ ready 时置 false，暂停读取（演示三态用）。
 */
export function useCampaignData(
  scenario: CampaignScenario,
  enabled = true,
): CampaignDataResult {
  const [fetched, setFetched] = useState<{
    scenario: CampaignScenario;
    view: CampaignView;
  } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchCampaignView(scenario, nonce > 0).then((view) => {
      if (!cancelled) setFetched({ scenario, view });
    });
    return () => {
      cancelled = true;
    };
  }, [scenario, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const ready = fetched !== null && fetched.scenario === scenario;
  return {
    status: ready ? "ready" : "loading",
    view: ready ? fetched.view : buildFixtureView(scenario),
    reload,
  };
}

// ---------------------------------------------------------------------------
// deadline 倒计时
// ---------------------------------------------------------------------------

export interface Countdown {
  /** "HH : MM : SS"；未挂载或缺 deadline 时为 "-- : -- : --"。 */
  label: string;
  /** now ≥ deadline。 */
  expired: boolean;
}

/** deadline（秒）倒计时，每秒刷新。SSR 安全：挂载前渲染占位符。 */
export function useCountdown(deadlineSeconds: bigint | null): Countdown {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (deadlineSeconds === null || now === null) {
    return { label: "-- : -- : --", expired: false };
  }
  const remaining = Number(deadlineSeconds) - now;
  if (remaining <= 0) return { label: "00 : 00 : 00", expired: true };
  const pad = (value: number) => String(value).padStart(2, "0");
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return { label: `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`, expired: false };
}

/** 金额显示辅助：wei → INJ 字符串（formatUnits，无浮点）。 */
export function formatInj(wei: bigint): string {
  return formatUnits(wei, INJ_DECIMALS);
}
