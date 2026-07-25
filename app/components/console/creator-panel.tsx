"use client";

import { useAccount } from "wagmi";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  useCampaign,
  useConsoleRole,
  useNowSec,
} from "@/app/lib/chain/hooks";
import {
  useClaimCreatorPayout,
  useClaimPlatformFee,
} from "@/app/lib/chain/write";
import { CAMPAIGNS, DEPLOYED_CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, explorerTx, truncateAddress } from "@/app/lib/chain/format";

// Spec 009 §3.2 C4: the brand's operating view — one card per batch with the
// preview retail price, the expected brand receivable (contract-exact
// aggregate formula), the final receivable once settled, and the claim CTA.
function CreatorBatchCard({
  id,
  address,
}: {
  id: CampaignId;
  address: `0x${string}`;
}) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const claim = useClaimCreatorPayout(id);
  const meta = CAMPAIGNS[id];
  const now = useNowSec();

  const state = campaign.state;
  const creator = campaign.creator;

  // P0 batches have no creator getter — skip the card entirely.
  if (creator === undefined) {
    return null;
  }
  if (creator.toLowerCase() !== address.toLowerCase()) {
    return null;
  }

  const preview = campaign.preview;
  const feeBps = campaign.feeBps ?? meta.deployment?.feeBps;

  // Expected brand receivable, mirroring settle()'s aggregate accounting
  // wei-for-wei: marginPool = count × (retail − tierPrice);
  // fee = min(count × retail × feeBps / 10000, marginPool);
  // creator = marginPool − fee.
  let expected: bigint | undefined;
  if (state === "Open" && preview?.[0] && feeBps !== undefined) {
    const quoteId = Number(preview[1]);
    const tierIndex = Number(preview[2]);
    const tierWei = campaign.quotes.find((q) => q.quoteId === quoteId)?.tiers[
      tierIndex
    ]?.unitPriceWei;
    if (tierWei !== undefined) {
      const count = preview[4];
      const retail = preview[3];
      const marginPool = count * (retail - tierWei);
      let fee = (count * retail * BigInt(feeBps)) / 10000n;
      if (fee > marginPool) fee = marginPool;
      expected = marginPool - fee;
    }
  }

  const settled = state === "Succeeded" || state === "PaidOut";
  const receivable = campaign.creatorReceivable ?? 0n;
  const claimed = campaign.creatorPayoutClaimed ?? false;
  const isPastDeadline =
    state === "Open" &&
    campaign.deadline !== undefined &&
    now >= Number(campaign.deadline);

  const stateLabel =
    state === "Succeeded" || state === "PaidOut"
      ? copy.status.succeeded
      : state === "Failed"
        ? copy.status.failed
        : state === "Draft"
          ? copy.notOpen.title
          : isPastDeadline
            ? copy.status.closed
            : copy.status.open;
  const stateClass =
    state === "Succeeded" || state === "PaidOut"
      ? "tag-success"
      : state === "Failed"
        ? "tag-danger"
        : state === "Open" && !isPastDeadline
          ? "tag-success"
          : "tag-neutral";

  const handleClaim = async () => {
    await claim.claimCreatorPayout();
  };
  const isBusy = claim.stage === "signing" || claim.stage === "confirming";

  return (
    <article className="border border-line rounded-md p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body font-semibold text-ink">{meta.product}</h3>
            <span className={`tag ${stateClass}`}>{stateLabel}</span>
          </div>
          <p className="num mt-0.5 text-micro text-ink-2">{meta.batchName}</p>

          <dl className="mt-3 space-y-1">
            {state === "Open" && !isPastDeadline && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-micro text-ink-3">
                  {copy.console.creator.previewPrice}
                </dt>
                <dd className="num text-body text-ink">
                  {preview?.[0] ? (
                    <>
                      {formatInj(preview[3])}
                      <span className="text-micro text-ink-3"> test INJ</span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            )}
            {state === "Open" && !isPastDeadline && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-micro text-ink-3">
                  {copy.console.creator.expected}
                </dt>
                <dd className="num text-body text-ink">
                  {expected !== undefined ? (
                    <>
                      {formatInj(expected)}
                      <span className="text-micro text-ink-3"> test INJ</span>
                    </>
                  ) : (
                    <span className="text-micro text-ink-3">
                      {copy.console.creator.previewInfeasible}
                    </span>
                  )}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-micro text-ink-3">
                {copy.console.creator.actual}
              </dt>
              <dd className="num text-body text-ink">
                {settled ? (
                  <>
                    {formatInj(receivable)}
                    <span className="text-micro text-ink-3"> test INJ</span>
                  </>
                ) : state === "Failed" ? (
                  <span className="text-micro text-ink-3">
                    {copy.console.creator.failed}
                  </span>
                ) : (
                  <span className="text-micro text-ink-3">
                    {copy.console.creator.awaitingSettle}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {settled && !claimed && (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isBusy || receivable === 0n}
              className="btn btn-primary inline-flex"
            >
              {isBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {copy.drawer.confirming}
                </>
              ) : (
                copy.console.creator.claim.replace(
                  "{amount}",
                  formatInj(receivable),
                )
              )}
            </button>
          )}

          {settled && claimed && (
            <span className="tag tag-neutral">
              {copy.console.creator.claimed}
            </span>
          )}

          {claim.result && (
            <a
              href={explorerTx(claim.result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-body text-accent hover:underline"
            >
              {copy.orders.viewTx}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {claim.error && (
        <p className="mt-3 text-body text-danger">{claim.error}</p>
      )}
    </article>
  );
}

// Platform fee view (unchanged behavior): one card per batch for the
// feeRecipient address.
function PlatformFeeCard({
  id,
  address,
}: {
  id: CampaignId;
  address: `0x${string}`;
}) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const claim = useClaimPlatformFee(id);
  const meta = CAMPAIGNS[id];

  const state = campaign.state;
  const feeRecipient = campaign.feeRecipient;
  const receivable = campaign.platformFee ?? 0n;
  const claimed = campaign.platformFeeClaimed ?? false;

  // P0 batches have no feeRecipient getter — skip the card entirely.
  if (feeRecipient === undefined) {
    return null;
  }
  if (feeRecipient.toLowerCase() !== address.toLowerCase()) {
    return null;
  }

  const handleClaim = async () => {
    await claim.claimPlatformFee();
  };
  const isBusy = claim.stage === "signing" || claim.stage === "confirming";

  let resultText: string;
  if (state === "Failed") {
    resultText = copy.console.platform.failed;
  } else if (state === "Succeeded" || state === "PaidOut") {
    resultText = copy.console.platform.win.replace(
      "{amount}",
      formatInj(receivable),
    );
  } else {
    resultText = copy.console.platform.pending;
  }

  return (
    <article className="border border-line rounded-md p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-body font-semibold text-ink">{meta.product}</h3>
          <p className="num mt-0.5 text-micro text-ink-2">{meta.batchName}</p>
          <p className="mt-3 text-body text-ink-2">
            {copy.console.platform.address}:{" "}
            <span className="num text-ink">{truncateAddress(address)}</span>
          </p>
          <p
            className={`mt-2 text-body font-medium ${
              state === "Succeeded" || state === "PaidOut"
                ? "text-success"
                : state === "Failed"
                  ? "text-warn"
                  : "text-ink-2"
            }`}
          >
            {resultText}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {(state === "Succeeded" || state === "PaidOut") && !claimed && (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isBusy || receivable === 0n}
              className="btn btn-primary inline-flex"
            >
              {isBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {copy.drawer.confirming}
                </>
              ) : (
                copy.console.platform.claim.replace(
                  "{amount}",
                  formatInj(receivable),
                )
              )}
            </button>
          )}

          {claimed && (
            <span className="tag tag-neutral">
              {copy.console.platform.claimed}
            </span>
          )}

          {claim.result && (
            <a
              href={explorerTx(claim.result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-body text-accent hover:underline"
            >
              {copy.orders.viewTx}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {claim.error && (
        <p className="mt-3 text-body text-danger">{claim.error}</p>
      )}
    </article>
  );
}

export function CreatorPanel() {
  const copy = useCopy();
  const { address, isConnected } = useAccount();
  const { roles } = useConsoleRole(address);

  if (!isConnected || !address) {
    return null;
  }

  const isCreator = roles.includes("creator");
  const isPlatform = roles.includes("platform");
  if (!isCreator && !isPlatform) {
    return null;
  }

  return (
    <>
      {isCreator && (
        <section className="surface p-5 lg:p-6">
          <h2 className="text-h2 text-ink">
            {copy.console.creator.title}
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {DEPLOYED_CAMPAIGNS.map((id) => (
              <CreatorBatchCard key={id} id={id} address={address} />
            ))}
          </div>
        </section>
      )}

      {isPlatform && (
        <section className="surface p-5 lg:p-6">
          <h2 className="text-h2 text-ink">
            {copy.console.platform.title}
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {DEPLOYED_CAMPAIGNS.map((id) => (
              <PlatformFeeCard key={id} id={id} address={address} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
