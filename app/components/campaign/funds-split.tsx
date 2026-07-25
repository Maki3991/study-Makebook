"use client";

import { useCampaign } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj } from "@/app/lib/chain/format";

const BPS_DENOMINATOR = 10000n;

export function FundsSplit({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);

  const state = campaign.state;
  const marginBps = campaign.marginBps;
  const feeBps = campaign.feeBps;

  // P0 batches expose no fee config — the whole block stays hidden.
  if (marginBps === undefined || feeBps === undefined) {
    return null;
  }

  // Factory tier price for the winning (or previewed) quote/tier.
  let tierPriceWei: bigint | undefined;
  if (state === "Open") {
    const preview = campaign.preview;
    if (preview?.[0]) {
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
  }

  // Per-unit split, wei-exact with the contract:
  // retail = tier * (10000 + marginBps) / 10000 (floor)
  // platformUnit = retail * feeBps / 10000 (floor)
  // creatorUnit = retail - tierPrice - platformUnit
  let unitSplitText: string | undefined;
  if (tierPriceWei !== undefined) {
    const retail =
      (tierPriceWei * (BPS_DENOMINATOR + BigInt(marginBps))) / BPS_DENOMINATOR;
    const platformUnit = (retail * BigInt(feeBps)) / BPS_DENOMINATOR;
    const creatorUnit = retail - tierPriceWei - platformUnit;
    unitSplitText = copy.fundsSplit.unitSplit
      .replace("{retail}", formatInj(retail))
      .replace("{factory}", formatInj(tierPriceWei))
      .replace("{creator}", formatInj(creatorUnit))
      .replace("{platform}", formatInj(platformUnit));
  }

  // Totals, straight from on-chain receivables (settled batches only).
  const showTotals =
    (state === "Succeeded" || state === "PaidOut") &&
    campaign.factoryReceivable !== undefined &&
    campaign.creatorReceivable !== undefined &&
    campaign.platformFee !== undefined &&
    campaign.winnerCount !== undefined;

  if (unitSplitText === undefined && !showTotals) {
    return null;
  }

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-ink">
        {copy.fundsSplit.title}
      </h2>

      {unitSplitText !== undefined && (
        <p className="mt-2 text-sm text-ink">{unitSplitText}</p>
      )}

      {showTotals && (
        <p className="mt-2 text-sm text-ink-2">
          {copy.fundsSplit.totals
            .replace("{count}", campaign.winnerCount!.toString())
            .replace("{factory}", formatInj(campaign.factoryReceivable!))
            .replace("{creator}", formatInj(campaign.creatorReceivable!))
            .replace("{platform}", formatInj(campaign.platformFee!))}
        </p>
      )}
    </section>
  );
}
