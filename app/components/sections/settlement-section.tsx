"use client";

import { useState } from "react";
import { AlertTriangle, Check, ExternalLink } from "lucide-react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  type Address,
  type Hex,
} from "viem";
import { explorerAddressUrl, explorerTxUrl } from "@/app/lib/chain/chain";
import {
  formatInj,
  useCampaignData,
  useCountdown,
  type CampaignScenario,
} from "@/app/lib/chain/use-campaign";
import { campaignStateName } from "@/app/lib/chain/reads";
import { writeCampaignAction } from "@/app/lib/chain/wallet";
import { Button, SourceTag, Spinner } from "@/app/components/site/primitives";
import { useSiteWallet } from "@/app/components/site/wallet-provider";

/**
 * "How clearing works" — dark ink section (05).
 * Plain-English rules + a live preview card for either deployed campaign
 * (success/failure toggle) + the permissionless settle trigger.
 *
 * Data: useCampaignData(scenario) — onchain reads with fixture fallback
 * (fixture views are tagged OFF-CHAIN DEMO). All amounts stay wei bigint
 * until formatInj at render time.
 */

const RULES = [
  "At the deadline anyone can trigger settlement.",
  "The contract picks the tier with the most eligible orders; ties go to the lower price. Every winner pays that one price.",
  "If no tier reaches its MOQ, everyone claims a full refund.",
] as const;

/** Settle-context revert → English copy (site copy is English-only). */
function describeSettleError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const errorName = revert.data?.errorName;
      if (errorName === "DeadlineNotReached") {
        return "Not yet — settlement opens at the deadline.";
      }
      if (errorName === "CampaignNotOpen") {
        return "This campaign is not open for settlement.";
      }
      if (errorName === "WrongState") {
        return "Settlement has already run for this campaign.";
      }
    }
    const rejected = err.walk((e) => e instanceof UserRejectedRequestError);
    if (rejected instanceof UserRejectedRequestError) {
      return "You cancelled the wallet signature — no transaction was submitted.";
    }
  }
  return "Transaction failed. Please try again.";
}

function formatDeadlineUtc(deadline: bigint): string {
  const text = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(Number(deadline) * 1000));
  return `${text} UTC`;
}

/** Celadon-tinted explorer link for dark surfaces (ExplorerLink is azure, illegible on ink). */
function InkExplorerLink({
  address,
  tx,
  children,
}: {
  address?: Address;
  tx?: Hex;
  children?: React.ReactNode;
}) {
  const href = tx
    ? explorerTxUrl(tx)
    : address
      ? explorerAddressUrl(address)
      : null;
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="num inline-flex items-center gap-1.5 text-13 text-celadon underline-offset-4 transition-colors hover:text-ink-text-1 hover:underline"
    >
      <span>{children ?? href}</span>
      <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
    </a>
  );
}

type SettlePhase =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; tx: Hex }
  | { kind: "error"; message: string };

export function SettlementSection() {
  const [scenario, setScenario] = useState<CampaignScenario>("success");
  const { status, view, reload } = useCampaignData(scenario);
  const { address, connected, connect, switchNetwork, isWrongNetwork } =
    useSiteWallet();
  const [phase, setPhase] = useState<SettlePhase>({ kind: "idle" });

  // A settle tx belongs to one campaign; switching the toggle resets it.
  const onSelectScenario = (option: CampaignScenario) => {
    setScenario(option);
    setPhase({ kind: "idle" });
  };

  const { label: countdownLabel, expired } = useCountdown(
    status === "ready" && !view.settled ? view.deadline : null,
  );

  const loading = status === "loading";
  const onchain = view.source === "onchain";

  const winningTier = view.preview.feasible
    ? view.factoryTiers.find(
        (tier) =>
          tier.id === `quote-${view.preview.quoteId}-tier-${view.preview.tierIndex}`,
      )
    : undefined;

  const allTiers = view.quotes.flatMap((quote) => quote.tiers);
  const minMoq =
    allTiers.length > 0 ? Math.min(...allTiers.map((tier) => tier.minQty)) : null;

  const settlement = view.settlement;
  const settledFactoryName = settlement
    ? (view.quoteNames[Number(settlement.winningQuoteId)] ??
      view.factoryTiers.find(
        (tier) =>
          tier.id ===
          `quote-${settlement.winningQuoteId}-tier-${settlement.winningTierIndex}`,
      )?.name ??
      "Selected factory")
    : null;
  const settledTx =
    view.settledTxHash ?? (phase.kind === "success" ? phase.tx : null);

  // Allocation preview (OFF-CHAIN DEMO): the contract only ever pays the
  // factory clearingPrice × winnerCount; brand margin / platform fee are
  // zero placeholders until a real fee schedule is frozen before opening.
  const factoryCostWei =
    view.settled && settlement
      ? settlement.success
        ? settlement.clearingPrice * settlement.winnerCount
        : 0n
      : view.preview.feasible
        ? view.preview.clearingPrice * view.preview.winnerCount
        : 0n;

  const onConnect = async () => {
    try {
      await connect();
    } catch {
      // User rejected the auth prompt — stay idle.
    }
  };

  const onSwitchNetwork = async () => {
    try {
      await switchNetwork();
    } catch {
      // User rejected the switch — wrong-network state stays visible.
    }
  };

  const onSettle = async () => {
    if (!address) return;
    setPhase({ kind: "pending" });
    try {
      const tx = await writeCampaignAction("settle", view.address, address);
      setPhase({ kind: "success", tx });
      reload();
    } catch (err) {
      setPhase({ kind: "error", message: describeSettleError(err) });
    }
  };

  return (
    <div className="surface-ink reveal flex flex-col gap-10 px-5 py-10 sm:px-10 sm:py-12">
      {/* header */}
      <header className="flex flex-col gap-3">
        <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-3">
          05 / Clearing
        </p>
        <h2 className="font-display text-28 leading-[1.25] font-medium text-ink-text-1">
          How clearing works
        </h2>
        <p className="max-w-[640px] text-15 leading-relaxed text-ink-text-2">
          One public transaction at a public deadline. The contract picks the
          winning tier and a single price for every winner — no negotiation
          after the fact.
        </p>
      </header>

      {/* rules */}
      <ol className="grid gap-6 sm:grid-cols-3">
        {RULES.map((rule, index) => (
          <li
            key={rule}
            className="flex flex-col gap-2 border-t border-ink-line-strong pt-4"
          >
            <span className="font-mono text-11 font-medium tracking-[0.14em] text-ink-text-3">
              0{index + 1}
            </span>
            <p className="text-15 leading-relaxed text-ink-text-1">{rule}</p>
          </li>
        ))}
      </ol>

      <hr className="line line-on-ink" />

      {/* scenario toggle + provenance */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["success", "failure"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={scenario === option}
                onClick={() => onSelectScenario(option)}
                className={
                  scenario === option
                    ? "rounded-[2px] border border-celadon bg-celadon px-3 font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink transition-colors"
                    : "rounded-[2px] border border-ink-line-strong px-3 font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-2 transition-colors hover:border-celadon/50 hover:text-ink-text-1"
                }
              >
                {option === "success" ? "Success campaign" : "Failure campaign"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <SourceTag tone="testnet">Testnet</SourceTag>
            {onchain ? (
              <SourceTag tone="onchain">Onchain</SourceTag>
            ) : (
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            )}
          </div>
        </div>
        <p className="text-13 text-ink-text-2">
          Two campaigns are deployed on Injective testnet. Switch to preview
          either outcome against live contract state.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="skeleton h-44 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
      ) : (
        <>
          {/* preview / result card */}
          <div className="rounded-[2px] border border-ink-line-strong bg-ink-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-line px-4 py-3">
              <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-3">
                {view.settled
                  ? `Settled · ${campaignStateName(view.state)}`
                  : "If settlement ran now"}
              </span>
              <InkExplorerLink address={view.address}>
                Contract
              </InkExplorerLink>
            </div>

            {view.settled && settlement ? (
              settlement.success ? (
                <dl className="divide-y divide-ink-line">
                  <ResultRow label="Winning factory">
                    {settledFactoryName}
                  </ResultRow>
                  <ResultRow label="Clearing price">
                    {formatInj(settlement.clearingPrice)} test INJ
                    <span className="ml-2 text-13 text-ink-text-3">
                      every winner pays this
                    </span>
                  </ResultRow>
                  <ResultRow label="Winners">
                    {Number(settlement.winnerCount)} of {view.ordersLength}{" "}
                    orders
                  </ResultRow>
                  <ResultRow label="Factory receivable">
                    {formatInj(settlement.factoryReceivable)} test INJ
                  </ResultRow>
                  {settledTx ? (
                    <ResultRow label="Settlement tx">
                      <InkExplorerLink tx={settledTx}>
                        View on Blockscout
                      </InkExplorerLink>
                    </ResultRow>
                  ) : null}
                </dl>
              ) : (
                <dl className="divide-y divide-ink-line">
                  <ResultRow label="Outcome">Batch failed</ResultRow>
                  <ResultRow label="Reason">
                    No tier reached its MOQ ({view.ordersLength} orders
                    {minMoq !== null ? `, lowest MOQ ${minMoq}` : ""})
                  </ResultRow>
                  <ResultRow label="Refunds">
                    Every backer claims a full refund
                  </ResultRow>
                  {settledTx ? (
                    <ResultRow label="Settlement tx">
                      <InkExplorerLink tx={settledTx}>
                        View on Blockscout
                      </InkExplorerLink>
                    </ResultRow>
                  ) : null}
                </dl>
              )
            ) : view.preview.feasible ? (
              <dl className="divide-y divide-ink-line">
                <ResultRow label="Leading tier">
                  {winningTier?.name ?? "Factory"} · {winningTier?.quantity ?? "—"}+
                  units @ {winningTier?.price ?? formatInj(view.preview.clearingPrice)}
                </ResultRow>
                <ResultRow label="Orders that clear">
                  {Number(view.preview.winnerCount)} of {view.ordersLength}
                </ResultRow>
                <ResultRow label="Factory would receive">
                  {formatInj(view.preview.clearingPrice * view.preview.winnerCount)}{" "}
                  test INJ
                </ResultRow>
                <ResultRow label="Every winner pays">
                  {formatInj(view.preview.clearingPrice)} test INJ
                  <span className="ml-2 text-13 text-ink-text-3">
                    higher escrows claim the difference
                  </span>
                </ResultRow>
              </dl>
            ) : (
              <dl className="divide-y divide-ink-line">
                <ResultRow label="Outcome">Would fail</ResultRow>
                <ResultRow label="Orders on the books">
                  {view.ordersLength}
                  {minMoq !== null ? (
                    <span className="ml-2 text-13 text-ink-text-3">
                      lowest MOQ is {minMoq}
                    </span>
                  ) : null}
                </ResultRow>
                <ResultRow label="Refunds">
                  No tier reaches its MOQ — everyone claims a full refund
                </ResultRow>
              </dl>
            )}
          </div>

          {/* allocation preview — where the escrow would go (off-chain demo) */}
          <div className="rounded-[2px] border border-ink-line bg-ink-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-line px-4 py-3">
              <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-3">
                Allocation preview
              </span>
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            </div>
            <dl className="divide-y divide-ink-line">
              <ResultRow label="Factory cost">
                {formatInj(factoryCostWei)} test INJ
                <span className="ml-2 text-13 text-ink-text-3">
                  clearing price × winners
                </span>
              </ResultRow>
              <ResultRow label="Brand margin">
                0 test INJ
                <span className="ml-2 text-13 text-ink-text-3">placeholder</span>
              </ResultRow>
              <ResultRow label="Platform fee">0 test INJ</ResultRow>
            </dl>
            <p className="border-t border-ink-line px-4 py-3 text-13 leading-relaxed text-ink-text-2">
              P0 platform fee is 0 by design; real fees would be frozen before
              opening.
            </p>
          </div>

          {/* settle action / claims pointer */}
          {view.settled ? (
            <div className="flex flex-col gap-3 rounded-[2px] border border-ink-line bg-ink-1 p-5">
              <p className="flex items-center gap-2 text-15 text-ink-text-1">
                <Check size={15} className="shrink-0 text-celadon" aria-hidden="true" />
                Settlement is final and onchain.
              </p>
              <p className="text-13 leading-relaxed text-ink-text-2">
                Refunds for backers and the payout for the winning factory are
                claimed from{" "}
                <a
                  href="#pledge"
                  className="text-celadon underline underline-offset-4 transition-colors hover:text-ink-text-1"
                >
                  the pledge panel
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-[2px] border border-ink-line bg-ink-1 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-3">
                    Settlement trigger
                  </span>
                  <p className="text-13 text-ink-text-2">
                    Permissionless — anyone can send it once the deadline
                    passes.
                  </p>
                </div>
                {!expired ? (
                  <div className="flex flex-col gap-1 text-right">
                    <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-3">
                      Opens in
                    </span>
                    <span className="num text-21 leading-none text-ink-text-1" role="timer">
                      {countdownLabel}
                    </span>
                  </div>
                ) : null}
              </div>

              {!expired ? (
                <>
                  <Button variant="primary" disabled>
                    Trigger settlement
                  </Button>
                  <p className="text-13 text-ink-text-3">
                    Not yet — settlement opens {formatDeadlineUtc(view.deadline)}.
                  </p>
                </>
              ) : !connected ? (
                <Button variant="primary" onClick={onConnect}>
                  Connect wallet to settle
                </Button>
              ) : isWrongNetwork ? (
                <Button
                  variant="primary"
                  className="btn-danger"
                  onClick={onSwitchNetwork}
                >
                  Switch to Injective testnet
                </Button>
              ) : (
                <Button
                  variant="primary"
                  state={phase.kind === "pending" ? "loading" : "idle"}
                  onClick={onSettle}
                >
                  Trigger settlement
                </Button>
              )}

              {phase.kind === "error" ? (
                <p className="flex items-start gap-2 rounded-[2px] border border-danger/40 bg-danger/10 px-3 py-2 text-13 text-ink-text-1">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  {phase.message}
                </p>
              ) : null}

              {phase.kind === "success" ? (
                <p className="flex flex-wrap items-center gap-2 text-13 text-ink-text-1">
                  <Spinner size={13} className="text-celadon" />
                  Settlement transaction confirmed — refreshing results.
                  <InkExplorerLink tx={phase.tx}>View tx</InkExplorerLink>
                </p>
              ) : null}
            </div>
          )}
        </>
      )}

      <p className="font-mono text-11 tracking-[0.06em] text-ink-text-3">
        Hackathon scaled test data · Testnet INJ has no value.
      </p>
    </div>
  );
}

function ResultRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3">
      <dt className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-ink-text-3">
        {label}
      </dt>
      <dd className="num text-15 text-ink-text-1">{children}</dd>
    </div>
  );
}
