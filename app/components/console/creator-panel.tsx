"use client";

import { useAccount } from "wagmi";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  useCampaign,
  useConsoleRole,
} from "@/app/lib/chain/hooks";
import {
  useClaimCreatorPayout,
  useClaimPlatformFee,
} from "@/app/lib/chain/write";
import { CAMPAIGNS, DEPLOYED_CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, explorerTx, truncateAddress } from "@/app/lib/chain/format";

type SplitMode = "creator" | "platform";

function SplitClaimCard({
  id,
  address,
  mode,
}: {
  id: CampaignId;
  address: `0x${string}`;
  mode: SplitMode;
}) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const creatorClaim = useClaimCreatorPayout(id);
  const platformClaim = useClaimPlatformFee(id);
  const meta = CAMPAIGNS[id];

  const copySet = mode === "creator" ? copy.console.creator : copy.console.platform;
  const claim = mode === "creator" ? creatorClaim : platformClaim;

  const state = campaign.state;
  const counterparty = mode === "creator" ? campaign.creator : campaign.feeRecipient;
  const receivable =
    (mode === "creator" ? campaign.creatorReceivable : campaign.platformFee) ?? 0n;
  const claimed =
    (mode === "creator"
      ? campaign.creatorPayoutClaimed
      : campaign.platformFeeClaimed) ?? false;

  // P0 batches have no creator/feeRecipient getters — skip the card entirely.
  if (counterparty === undefined) {
    return null;
  }
  const isCounterparty = counterparty.toLowerCase() === address.toLowerCase();
  if (!isCounterparty) {
    return null;
  }

  const handleClaim = async () => {
    if (mode === "creator") {
      await creatorClaim.claimCreatorPayout();
    } else {
      await platformClaim.claimPlatformFee();
    }
  };

  const isBusy = claim.stage === "signing" || claim.stage === "confirming";

  let resultText: string;
  if (state === "Failed") {
    resultText = copySet.failed;
  } else if (state === "Succeeded" || state === "PaidOut") {
    resultText = copySet.win.replace("{amount}", formatInj(receivable));
  } else {
    resultText = copySet.pending;
  }

  return (
    <article className="border border-line rounded-md p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">{meta.product}</h3>
          <p className="mt-0.5 text-xs text-ink-2">{meta.batchName}</p>
          <p className="mt-3 text-sm text-ink-2">
            {copySet.address}:{" "}
            <span className="num text-ink">{truncateAddress(address)}</span>
          </p>
          <p
            className={`mt-2 text-sm font-medium ${
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
                copySet.claim.replace("{amount}", formatInj(receivable))
              )}
            </button>
          )}

          {claimed && (
            <span className="tag tag-neutral">
              {copySet.claimed}
            </span>
          )}

          {claim.result && (
            <a
              href={explorerTx(claim.result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              {copy.orders.viewTx}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {claim.error && (
        <p className="mt-3 text-sm text-danger">{claim.error}</p>
      )}
    </article>
  );
}

export function CreatorPanel() {
  const copy = useCopy();
  const { address, isConnected } = useAccount();
  const { role } = useConsoleRole(address);

  if (!isConnected || !address || (role !== "creator" && role !== "platform")) {
    return null;
  }

  const mode: SplitMode = role === "creator" ? "creator" : "platform";
  const title = mode === "creator" ? copy.console.creator.title : copy.console.platform.title;

  return (
    <section className="surface p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">
        {title}
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {DEPLOYED_CAMPAIGNS.map((id) => (
          <SplitClaimCard key={id} id={id} address={address} mode={mode} />
        ))}
      </div>
    </section>
  );
}
