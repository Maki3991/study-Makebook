"use client";

import { useAccount } from "wagmi";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  useCampaign,
  useConsoleRole,
} from "@/app/lib/chain/hooks";
import { useClaimPayout } from "@/app/lib/chain/write";
import { CAMPAIGNS, DEPLOYED_CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, explorerTx, truncateAddress } from "@/app/lib/chain/format";

function FactoryCampaignCard({
  id,
  address,
}: {
  id: CampaignId;
  address: `0x${string}`;
}) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const claim = useClaimPayout(id);
  const meta = CAMPAIGNS[id];

  const state = campaign.state;
  const selectedFactory = campaign.selectedFactory;
  const isSelected =
    selectedFactory?.toLowerCase() === address.toLowerCase();
  const receivable = campaign.factoryReceivable ?? 0n;
  const claimed = campaign.factoryPayoutClaimed ?? false;

  const handleClaim = async () => {
    await claim.claimPayout();
  };

  const isBusy = claim.stage === "signing" || claim.stage === "confirming";

  let resultText: string;
  if (state === "Failed") {
    resultText = copy.console.factory.failed;
  } else if (state === "Succeeded" || state === "PaidOut") {
    if (isSelected) {
      resultText = copy.console.factory.win.replace(
        "{amount}",
        formatInj(receivable),
      );
    } else {
      resultText = copy.console.factory.lose;
    }
  } else {
    resultText = copy.console.factory.none;
  }

  return (
    <article className="border border-line rounded-md p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">{meta.product}</h3>
          <p className="mt-0.5 text-xs text-ink-2">{meta.batchName}</p>
          <p className="mt-3 text-sm text-ink-2">
            {copy.console.factory.title}:{" "}
            <span className="num text-ink">{truncateAddress(address)}</span>
          </p>
          <p
            className={`mt-2 text-sm font-medium ${
              state === "Succeeded" || state === "PaidOut"
                ? isSelected
                  ? "text-success"
                  : "text-ink-3"
                : state === "Failed"
                  ? "text-warn"
                  : "text-ink-2"
            }`}
          >
            {resultText}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {(state === "Succeeded" || state === "PaidOut") && isSelected && !claimed && (
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
                copy.console.factory.claim.replace(
                  "{amount}",
                  formatInj(receivable),
                )
              )}
            </button>
          )}

          {claimed && (
            <span className="tag tag-neutral">
              {copy.console.factory.claimed}
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

export function FactoryPanel() {
  const copy = useCopy();
  const { address, isConnected } = useAccount();
  const { roles } = useConsoleRole(address);

  if (!isConnected || !address || !roles.includes("factory")) {
    return null;
  }

  return (
    <section className="surface p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">
        {copy.console.factory.title}
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {DEPLOYED_CAMPAIGNS.map((id) => (
          <FactoryCampaignCard key={id} id={id} address={address} />
        ))}
      </div>
    </section>
  );
}
