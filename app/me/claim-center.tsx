"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ExternalLink } from "lucide-react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  type Address,
  type Hex,
} from "viem";
import { createInjPublicClient } from "@/app/lib/chain/chain";
import {
  deployments,
  isZeroAddress,
  type CampaignDeployment,
} from "@/app/lib/chain/deployments";
import {
  campaignStateName,
  readCampaignSummary,
  readOrder,
  readSettlementResult,
  type Order,
  type SettlementPreview,
  type SettlementResult,
} from "@/app/lib/chain/reads";
import {
  formatInj,
  useCampaignData,
  type CampaignScenario,
} from "@/app/lib/chain/use-campaign";
import { writeCampaignAction } from "@/app/lib/chain/wallet";
import {
  Button,
  CopyValue,
  ExplorerLink,
  SourceTag,
} from "@/app/components/site/primitives";
import { TopBar } from "@/app/components/site/top-bar";
import { useSiteWallet } from "@/app/components/site/wallet-provider";

/**
 * /me 领取中心（"My batch"）。
 * 连接钱包后列出本人在 success / failure（playground 部署后三套）Campaign 的订单：
 * - 本人订单 = view.orders 事件扫描命中，缺失时 getOrder(buyer) 直读兜底
 * - 可领金额沿用 pledge-panel 的清算规则：失败/落选退全额 maxPrice，
 *   赢家退差额 maxPrice - clearingPrice（可为 0 → "mark as claimed"）
 * - 领取走 writeCampaignAction("claimRefund")，已领取置灰
 * 诚实边界：fixture 降级（view.source === "fixture"）的槽位绝不用于订单与领取，
 * 显示"live read unavailable"警告卡 + 重试（与 pledge-panel 的 canWrite 口径一致）。
 * 金额全程 wei bigint，显示层才 formatInj。
 */

type CampaignKey = CampaignScenario | "playground";

interface SlotOrder {
  maxPriceWei: bigint;
  refundClaimed: boolean;
  txHash: Hex | null;
}

/** 一套 Campaign 与本人订单的统一视图（success/failure 走 useCampaignData，playground 走直读）。 */
interface OrderSlot {
  key: CampaignKey;
  label: string;
  campaignAddress: Address;
  status: "loading" | "ready" | "error";
  /** onchain = 链上实读；fixture = 静默降级（该槽位不参与订单/领取）。 */
  source: "onchain" | "fixture";
  state: number;
  deadline: bigint;
  preview: SettlementPreview | null;
  settlement: SettlementResult | null;
  order: SlotOrder | null;
  reload: () => void;
}

const playgroundDeployment = (deployments as { playground?: CampaignDeployment })
  .playground;
const hasPlayground = Boolean(
  playgroundDeployment && !isZeroAddress(playgroundDeployment.address),
);

// ---------------------------------------------------------------------------
// 每套 Campaign 的本人订单
// ---------------------------------------------------------------------------

function useScenarioSlot(
  scenario: CampaignScenario,
  label: string,
  address: Address | null,
  enabled: boolean,
): OrderSlot {
  const { status, view, reload } = useCampaignData(scenario, enabled);
  const [fallback, setFallback] = useState<{
    key: string;
    order: Order | null;
  } | null>(null);
  const [nonce, setNonce] = useState(0);

  const viewOrder = address
    ? view.orders.find(
        (order) => order.buyer.toLowerCase() === address.toLowerCase(),
      )
    : undefined;

  // getOrder(buyer) 是单买家权威读取；view.orders 的事件扫描可能漏掉窗口外的
  // 订单，本人订单不在视图内时直读兜底。读取失败静默——视图数据原样保留。
  useEffect(() => {
    if (!enabled || !address || status !== "ready") return;
    if (view.source !== "onchain" || viewOrder) return;
    let cancelled = false;
    readOrder(createInjPublicClient(), view.address, address)
      .then((order) => {
        if (!cancelled)
          setFallback({ key: `${view.address}:${address}`, order });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, address, status, view.source, view.address, viewOrder, nonce]);

  const fallbackOrder =
    fallback && fallback.key === `${view.address}:${address}`
      ? fallback.order
      : null;

  const order: SlotOrder | null = viewOrder
    ? {
        maxPriceWei: viewOrder.maxPriceWei,
        refundClaimed: viewOrder.refundClaimed,
        txHash: viewOrder.txHash,
      }
    : fallbackOrder
      ? {
          maxPriceWei: fallbackOrder.maxPriceWei,
          refundClaimed: fallbackOrder.refundClaimed,
          txHash: null,
        }
      : null;

  return {
    key: scenario,
    label,
    campaignAddress: view.address,
    status: status === "ready" ? "ready" : "loading",
    source: view.source,
    state: view.state,
    deadline: view.deadline,
    preview: view.preview,
    settlement: view.settlement,
    order,
    reload: () => {
      reload();
      setNonce((n) => n + 1);
    },
  };
}

type PlaygroundResult =
  | { kind: "error" }
  | {
      kind: "ready";
      state: number;
      deadline: bigint;
      preview: SettlementPreview;
      settlement: SettlementResult | null;
      order: Order | null;
    };

/** playground 无 fixtures 可降级——summary/getOrder/清算结果直读，失败如实报错 + 重试。 */
function usePlaygroundSlot(
  address: Address | null,
  enabled: boolean,
): OrderSlot | null {
  const [nonce, setNonce] = useState(0);
  const [fetched, setFetched] = useState<{
    key: string;
    result: PlaygroundResult;
  } | null>(null);
  const fetchKey = `${address ?? "disconnected"}:${nonce}`;

  useEffect(() => {
    if (!enabled || !address || !playgroundDeployment) return;
    let cancelled = false;
    const client = createInjPublicClient();
    const campaignAddress = playgroundDeployment.address;
    (async (): Promise<PlaygroundResult> => {
      const summary = await readCampaignSummary(client, campaignAddress);
      const [order, settlement] = await Promise.all([
        readOrder(client, campaignAddress, address),
        summary.state >= 2
          ? readSettlementResult(client, campaignAddress)
          : Promise.resolve(null),
      ]);
      return {
        kind: "ready",
        state: summary.state,
        deadline: summary.deadline,
        preview: summary.preview,
        settlement,
        order,
      };
    })()
      .then((result) => {
        if (!cancelled) setFetched({ key: fetchKey, result });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: fetchKey, result: { kind: "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [address, enabled, nonce, fetchKey]);

  if (!playgroundDeployment) return null;
  const current =
    fetched && fetched.key === fetchKey ? fetched.result : null;
  const ready = current?.kind === "ready" ? current : null;
  return {
    key: "playground",
    label: "Playground campaign",
    campaignAddress: playgroundDeployment.address,
    status: current === null ? "loading" : ready ? "ready" : "error",
    source: "onchain",
    state: ready?.state ?? 1,
    deadline:
      ready?.deadline ?? BigInt(playgroundDeployment.deadline),
    preview: ready?.preview ?? null,
    settlement: ready?.settlement ?? null,
    order: ready?.order
      ? {
          maxPriceWei: ready.order.maxPriceWei,
          refundClaimed: ready.order.refundClaimed,
          txHash: null,
        }
      : null,
    reload: () => setNonce((n) => n + 1),
  };
}

// ---------------------------------------------------------------------------
// 订单状态与可领金额（沿用 pledge-panel 的清算规则）
// ---------------------------------------------------------------------------

interface OrderOutcome {
  statusLabel: string;
  reason: string;
  /** null = 尚未可领（未清算）。 */
  claimableWei: bigint | null;
}

function deriveOutcome(slot: OrderSlot, order: SlotOrder): OrderOutcome {
  const settlement = slot.settlement;
  if (slot.state >= 2 && settlement) {
    if (!settlement.success) {
      return {
        statusLabel: "Batch failed — full refund",
        reason:
          "No factory tier reached its MOQ, so your full escrow comes back.",
        claimableWei: order.maxPriceWei,
      };
    }
    if (order.maxPriceWei < settlement.clearingPrice) {
      return {
        statusLabel: "Outbid — full refund",
        reason: `Your max price was below the clearing price (${formatInj(
          settlement.clearingPrice,
        )} test INJ) — you claim a full refund.`,
        claimableWei: order.maxPriceWei,
      };
    }
    const difference = order.maxPriceWei - settlement.clearingPrice;
    return {
      statusLabel:
        difference > 0n
          ? "Winner — uniform price difference"
          : "Winner — paid exactly the clearing price",
      reason:
        difference > 0n
          ? `Every winner pays one clearing price (${formatInj(
              settlement.clearingPrice,
            )} test INJ) — the difference above it comes back.`
          : "You win at exactly your max price — no refund due; marking claimed closes your receipt.",
      claimableWei: difference,
    };
  }
  const expired = Number(slot.deadline) * 1000 <= Date.now();
  const statusLabel =
    slot.state === 1
      ? expired
        ? "Open — past the deadline, settlement pending"
        : "Open — settles at the deadline"
      : `${campaignStateName(slot.state)} — not settled yet`;
  let reason = "Refunds open after settlement runs.";
  const preview = slot.preview;
  if (preview) {
    if (preview.feasible && order.maxPriceWei >= preview.clearingPrice) {
      reason = `Current preview: on track to win at ${formatInj(
        preview.clearingPrice,
      )} test INJ — you would claim back ${formatInj(
        order.maxPriceWei - preview.clearingPrice,
      )}.`;
    } else if (preview.feasible) {
      reason = `Current preview: below the clearing price (${formatInj(
        preview.clearingPrice,
      )} test INJ) — you would claim a full refund.`;
    } else {
      reason =
        "Current preview: no tier reaches its MOQ — a full refund if that holds at settlement.";
    }
  }
  return { statusLabel, reason, claimableWei: null };
}

/** claimRefund 语境的 custom error → 英文人话（与 settlement-section 同口径）。 */
function describeClaimError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const errorName = revert.data?.errorName;
      if (errorName === "AlreadyClaimed") {
        return "Already claimed — this order is settled.";
      }
      if (errorName === "WrongState") {
        return "Refunds open after settlement runs.";
      }
      if (errorName === "NoOrder") {
        return "No order found for this wallet on this campaign.";
      }
      if (errorName === "TransferFailed") {
        return "The transfer failed — your claim state is unchanged. Please try again.";
      }
    }
    const rejected = err.walk((e) => e instanceof UserRejectedRequestError);
    if (rejected instanceof UserRejectedRequestError) {
      return "You cancelled the wallet signature — no transaction was submitted.";
    }
  }
  return "Transaction failed. Please try again.";
}

// ---------------------------------------------------------------------------
// 页面
// ---------------------------------------------------------------------------

type ClaimFeedback =
  | { kind: "pending" }
  | { kind: "confirmed"; hash: Hex }
  | { kind: "error"; message: string };

export function ClaimCenter() {
  const {
    address,
    connected,
    connecting,
    connect,
    switchNetwork,
    isWrongNetwork,
  } = useSiteWallet();
  const successSlot = useScenarioSlot(
    "success",
    "Success campaign",
    address,
    connected,
  );
  const failureSlot = useScenarioSlot(
    "failure",
    "Failure campaign",
    address,
    connected,
  );
  const playgroundSlot = usePlaygroundSlot(address, connected && hasPlayground);
  const [feedback, setFeedback] = useState<
    Partial<Record<CampaignKey, ClaimFeedback>>
  >({});
  const [switching, setSwitching] = useState(false);

  const slots: OrderSlot[] = [
    successSlot,
    failureSlot,
    ...(playgroundSlot ? [playgroundSlot] : []),
  ];
  // 只有全部槽位都完成链上实读，"无订单"结论才成立；loading/fixture/error
  // 期间分别由 skeleton 与警告卡占位，不抢跑空态。
  const lookupComplete = slots.every(
    (slot) => slot.status === "ready" && slot.source === "onchain",
  );
  const hasAnyOrder = slots.some((slot) => slot.order !== null);

  const onConnect = async () => {
    try {
      await connect();
    } catch {
      // 用户拒绝授权——保持未连接态。
    }
  };

  const onSwitchNetwork = async () => {
    setSwitching(true);
    try {
      await switchNetwork();
    } catch {
      // 用户拒绝切换——错误网络提示保留。
    } finally {
      setSwitching(false);
    }
  };

  const runClaim = async (slot: OrderSlot) => {
    if (!address) return;
    setFeedback((prev) => ({ ...prev, [slot.key]: { kind: "pending" } }));
    try {
      const hash = await writeCampaignAction(
        "claimRefund",
        slot.campaignAddress,
        address,
      );
      setFeedback((prev) => ({
        ...prev,
        [slot.key]: { kind: "confirmed", hash },
      }));
      slot.reload();
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [slot.key]: { kind: "error", message: describeClaimError(err) },
      }));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 py-10 lg:py-16">
          <header className="flex flex-col gap-3">
            <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
              Me / Claim center
            </p>
            <h1 className="font-display text-28 leading-[1.25] font-medium text-n-92">
              My batch
            </h1>
            <p className="max-w-[640px] text-15 leading-relaxed text-n-64">
              Your FRAME-01 orders across every deployed campaign, what each
              one can claim after settlement, and where to top up test INJ.
            </p>
          </header>

          {!connected ? (
            <section className="surface flex flex-col items-start gap-5 p-6 sm:p-10">
              <SourceTag tone="testnet">Testnet</SourceTag>
              <h2 className="font-display text-21 font-medium text-n-92">
                Connect your wallet
              </h2>
              <p className="max-w-[560px] text-15 leading-relaxed text-n-64">
                Connect the wallet you backed FRAME-01 with. Your orders,
                claimable refunds, and your faucet address show up here.
              </p>
              <Button
                variant="primary"
                state={connecting ? "loading" : "idle"}
                onClick={onConnect}
              >
                Connect Wallet
              </Button>
            </section>
          ) : (
            <section className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  Connected wallet
                </span>
                {address ? <CopyValue value={address} /> : null}
              </div>

              {isWrongNetwork ? (
                <div className="flex flex-wrap items-center gap-3 rounded-[2px] border border-danger/40 bg-danger/10 px-4 py-3">
                  <AlertTriangle
                    size={15}
                    className="shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 text-13 text-n-92">
                    Wrong network — claims run on Injective EVM Testnet (chain
                    1439).
                  </p>
                  <Button
                    variant="primary"
                    className="btn-danger"
                    state={switching ? "loading" : "idle"}
                    onClick={onSwitchNetwork}
                  >
                    Switch network
                  </Button>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {slots.map((slot) => {
                  if (slot.status === "loading") {
                    return <SlotSkeleton key={slot.key} label={slot.label} />;
                  }
                  if (slot.status === "error" || slot.source === "fixture") {
                    return <UnavailableCard key={slot.key} slot={slot} />;
                  }
                  if (!slot.order) return null;
                  return (
                    <OrderCard
                      key={slot.key}
                      slot={slot}
                      order={slot.order}
                      feedback={feedback[slot.key]}
                      isWrongNetwork={isWrongNetwork}
                      switching={switching}
                      onSwitchNetwork={onSwitchNetwork}
                      onClaim={() => runClaim(slot)}
                    />
                  );
                })}
              </div>

              {lookupComplete && !hasAnyOrder ? (
                <div className="surface-flat flex flex-col items-start gap-4 p-6 sm:p-10">
                  <h2 className="font-display text-21 font-medium text-n-92">
                    No orders yet — back FRAME-01
                  </h2>
                  <p className="max-w-[560px] text-15 leading-relaxed text-n-64">
                    This wallet has no order on any deployed campaign. Pledge a
                    max price on the campaign page — your order and every
                    refund show up here.
                  </p>
                  <Link href="/#pledge" className="btn btn-primary">
                    Back FRAME-01
                  </Link>
                </div>
              ) : null}
            </section>
          )}

          <FaucetCard address={address} />
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 卡片
// ---------------------------------------------------------------------------

function OrderCard({
  slot,
  order,
  feedback,
  isWrongNetwork,
  switching,
  onSwitchNetwork,
  onClaim,
}: {
  slot: OrderSlot;
  order: SlotOrder;
  feedback: ClaimFeedback | undefined;
  isWrongNetwork: boolean;
  switching: boolean;
  onSwitchNetwork: () => void;
  onClaim: () => void;
}) {
  const outcome = deriveOutcome(slot, order);
  return (
    <article className="surface reveal flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
            {slot.label}
          </span>
          <ExplorerLink address={slot.campaignAddress}>
            Contract
          </ExplorerLink>
        </div>
        <div className="flex items-center gap-4">
          <SourceTag tone="testnet">Testnet</SourceTag>
          <SourceTag tone="onchain">Onchain</SourceTag>
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-n-22 border-y border-n-22">
        <Row label="Campaign state">{campaignStateName(slot.state)}</Row>
        <Row label="Your max price">
          {formatInj(order.maxPriceWei)} test INJ
        </Row>
        <Row label="Order status">{outcome.statusLabel}</Row>
        {order.txHash ? (
          <Row label="Order tx">
            <ExplorerLink tx={order.txHash} />
          </Row>
        ) : null}
      </dl>

      <p className="text-13 leading-relaxed text-n-64">{outcome.reason}</p>

      {order.refundClaimed ? (
        <p className="flex items-center gap-2 text-15 text-n-92">
          <Check
            size={15}
            className="shrink-0 text-signal-onchain"
            aria-hidden="true"
          />
          Claimed — nothing left on this order.
        </p>
      ) : outcome.claimableWei === null ? (
        <p className="text-13 text-n-52">
          Refunds open after settlement — check back at the deadline.
        </p>
      ) : isWrongNetwork ? (
        <Button
          variant="primary"
          className="btn-danger"
          state={switching ? "loading" : "idle"}
          onClick={onSwitchNetwork}
        >
          Switch to Injective testnet
        </Button>
      ) : (
        <Button
          variant={outcome.claimableWei > 0n ? "primary" : "ghost"}
          state={feedback?.kind === "pending" ? "loading" : "idle"}
          onClick={onClaim}
        >
          {outcome.claimableWei > 0n
            ? `Claim ${formatInj(outcome.claimableWei)} test INJ`
            : "No refund due · mark as claimed"}
        </Button>
      )}

      {feedback?.kind === "confirmed" ? (
        <p className="flex flex-wrap items-center gap-2 text-13 text-n-64">
          <Check
            size={14}
            className="shrink-0 text-signal-onchain"
            aria-hidden="true"
          />
          Claim confirmed — refreshing your order.
          <ExplorerLink tx={feedback.hash}>View tx</ExplorerLink>
        </p>
      ) : null}
      {feedback?.kind === "error" ? (
        <p className="flex items-start gap-2 rounded-[2px] border border-danger/40 bg-danger/10 px-3 py-2 text-13 text-n-92">
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0 text-danger"
            aria-hidden="true"
          />
          {feedback.message}
        </p>
      ) : null}
    </article>
  );
}

function UnavailableCard({ slot }: { slot: OrderSlot }) {
  return (
    <article className="surface-flat flex flex-col items-start gap-3 p-5">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
          {slot.label}
        </span>
        {slot.status !== "error" ? (
          <SourceTag tone="offchain">Off-chain demo</SourceTag>
        ) : null}
      </div>
      <p className="flex items-start gap-2 text-13 leading-relaxed text-n-64">
        <AlertTriangle
          size={14}
          className="mt-0.5 shrink-0 text-n-40"
          aria-hidden="true"
        />
        Live reads for this campaign are unavailable right now — demo data is
        never used for your orders or claims.
      </p>
      <Button variant="ghost" onClick={slot.reload}>
        Retry
      </Button>
    </article>
  );
}

function SlotSkeleton({ label }: { label: string }) {
  return (
    <div
      className="surface flex flex-col gap-5 p-5 sm:p-6"
      aria-busy="true"
      aria-label={`${label} loading`}
    >
      <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
        {label}
      </span>
      <div className="skeleton h-5 w-44" />
      <div className="skeleton h-28 w-full" />
      <div className="skeleton h-11 w-48" />
    </div>
  );
}

function FaucetCard({ address }: { address: Address | null }) {
  return (
    <section className="surface-flat flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
          Faucet
        </span>
        <SourceTag tone="testnet">Testnet</SourceTag>
      </div>
      <h2 className="font-display text-21 font-medium text-n-92">
        Need test INJ?
      </h2>
      <p className="max-w-[560px] text-15 leading-relaxed text-n-64">
        New wallets get 1 free test INJ after hCaptcha — enough to back
        FRAME-01 and claim refunds afterwards.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <a
          href="https://testnet.faucet.injective.network/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          <span>Open the Injective faucet</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
        {address ? (
          <span className="flex min-w-0 items-center gap-2 text-13 text-n-64">
            Your wallet:
            <CopyValue value={address} />
          </span>
        ) : (
          <span className="text-13 text-n-40">
            Connect your wallet to copy its address.
          </span>
        )}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
        {label}
      </dt>
      <dd className="num text-15 text-n-92">{children}</dd>
    </div>
  );
}
