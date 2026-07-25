"use client";

import { useCampaign } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj } from "@/app/lib/chain/format";

const BPS_DENOMINATOR = 10000n;

// Spec 009 §6-1: compact "where your money goes" card under the pledge panel,
// filling the right rail's empty space. The split math is the same wei-exact
// C2 logic as funds-split.tsx / the C3 drawer breakdown:
//   retail   = tier * (10000 + marginBps) / 10000 (floor)
//   platform = retail * feeBps / 10000 (floor)
//   creator  = retail - tier - platform
// Same hiding rule as the C3 drawer: when the preview is infeasible there is
// no uniform price, so amounts are hidden and only the explainer stays.
export function PledgeSplitCard({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);

  const state = campaign.state;
  const marginBps = campaign.marginBps;
  const feeBps = campaign.feeBps;

  // P0 batches expose no fee config; reads still in flight -> stay hidden
  // entirely rather than flash an amount-less card that later gains amounts.
  if (marginBps === undefined || feeBps === undefined) {
    return null;
  }

  let tierPriceWei: bigint | undefined;
  if (state === "Open") {
    const preview = campaign.preview;
    if (preview === undefined) return null;
    if (preview[0]) {
      const quoteId = Number(preview[1]);
      const tierIndex = Number(preview[2]);
      tierPriceWei = campaign.quotes.find((q) => q.quoteId === quoteId)?.tiers[
        tierIndex
      ]?.unitPriceWei;
    }
  } else if (state === "Succeeded" || state === "PaidOut") {
    const winningQuoteId = campaign.winningQuoteId;
    const winningTierIndex = campaign.winningTierIndex;
    if (winningQuoteId !== undefined && winningTierIndex !== undefined) {
      tierPriceWei = campaign.quotes.find(
        (q) => BigInt(q.quoteId) === winningQuoteId,
      )?.tiers[Number(winningTierIndex)]?.unitPriceWei;
    }
  } else {
    // Failed / Draft / still loading: nothing to split yet.
    return null;
  }

  let split:
    | { factory: bigint; creator: bigint; platform: bigint }
    | undefined;
  if (tierPriceWei !== undefined) {
    const retail =
      (tierPriceWei * (BPS_DENOMINATOR + BigInt(marginBps))) / BPS_DENOMINATOR;
    const platform = (retail * BigInt(feeBps)) / BPS_DENOMINATOR;
    split = {
      factory: tierPriceWei,
      creator: retail - tierPriceWei - platform,
      platform,
    };
  }

  const rows = split
    ? [
        { role: copy.fundsSplit.roles.factory, amount: split.factory },
        { role: copy.fundsSplit.roles.creator, amount: split.creator },
        { role: copy.fundsSplit.roles.platform, amount: split.platform },
      ]
    : [];

  return (
    <section className="surface p-5">
      <h2 className="text-body font-semibold text-ink">
        {copy.fundsSplit.cardTitle}
      </h2>

      {split !== undefined && (
        <div className="mt-3 divide-y divide-line">
          {rows.map((row) => (
            <div
              key={row.role}
              className="flex items-baseline justify-between gap-4 py-2"
            >
              <span className="text-body text-ink-2">{row.role}</span>
              <span>
                <span className="num text-body text-ink">
                  {formatInj(row.amount)}
                </span>
                <span className="text-micro text-ink-3"> test INJ</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-micro text-ink-3">{copy.fundsSplit.note}</p>
    </section>
  );
}
