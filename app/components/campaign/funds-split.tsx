"use client";

import { useCampaign } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj } from "@/app/lib/chain/format";

const BPS_DENOMINATOR = 10000n;

function sharePct(part: bigint, total: bigint): string {
  if (total === 0n) return "0%";
  const pct = (Number(part) / Number(total)) * 100;
  return `${Math.round(pct * 10) / 10}%`;
}

function shareWidth(part: bigint, total: bigint): string {
  if (total === 0n) return "0%";
  return `${(Number(part) / Number(total)) * 100}%`;
}

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
  let split:
    | { retail: bigint; factory: bigint; creator: bigint; platform: bigint }
    | undefined;
  if (tierPriceWei !== undefined) {
    const retail =
      (tierPriceWei * (BPS_DENOMINATOR + BigInt(marginBps))) / BPS_DENOMINATOR;
    const platform = (retail * BigInt(feeBps)) / BPS_DENOMINATOR;
    const creator = retail - tierPriceWei - platform;
    split = { retail, factory: tierPriceWei, creator, platform };
  }

  // Totals, straight from on-chain receivables (settled batches only).
  const showTotals =
    (state === "Succeeded" || state === "PaidOut") &&
    campaign.factoryReceivable !== undefined &&
    campaign.creatorReceivable !== undefined &&
    campaign.platformFee !== undefined &&
    campaign.winnerCount !== undefined;

  if (split === undefined && !showTotals) {
    return null;
  }

  const segments = split
    ? [
        {
          role: copy.fundsSplit.roles.factory,
          amount: split.factory,
          barClass: "bg-paper-2",
        },
        {
          role: copy.fundsSplit.roles.creator,
          amount: split.creator,
          barClass: "bg-accent-w",
        },
        {
          role: copy.fundsSplit.roles.platform,
          amount: split.platform,
          barClass: "bg-rule-2",
        },
      ]
    : [];

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-ink">
        {copy.fundsSplit.title}
      </h2>

      {split !== undefined && (
        <div className="mt-4">
          {/* Segmented bar, factory / brand / platform by actual amount */}
          <div className="flex h-3 w-full gap-px bg-canvas">
            {segments.map((seg) => (
              <div
                key={seg.role}
                className={seg.barClass}
                style={{ width: shareWidth(seg.amount, split.retail) }}
              />
            ))}
          </div>
          {/* Scale ticks at 0/25/50/75/100% */}
          <div className="relative mt-1 h-1">
            {[0, 25, 50, 75, 100].map((tick) => (
              <span
                key={tick}
                className="absolute top-0 h-1 w-px bg-rule-2"
                style={{ left: `${tick}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-micro text-ink-3">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          {/* Role / amount / share columns */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-4 text-micro uppercase tracking-wide text-ink-3">
              <span>{copy.fundsSplit.columns.role}</span>
              <span className="text-right">{copy.fundsSplit.columns.amount}</span>
              <span className="text-right">{copy.fundsSplit.columns.share}</span>
            </div>
            <div className="divide-y divide-line">
              {segments.map((seg) => (
                <div
                  key={seg.role}
                  className="grid grid-cols-3 items-baseline gap-4 py-2"
                >
                  <span className="text-sm text-ink">{seg.role}</span>
                  <span className="text-right">
                    <span className="num text-sm text-ink">
                      {formatInj(seg.amount)}
                    </span>
                    <span className="text-xs text-ink-3"> test INJ</span>
                  </span>
                  <span className="num text-right text-sm text-ink-2">
                    {sharePct(seg.amount, split.retail)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-ink-3">
            {state === "Succeeded" || state === "PaidOut"
              ? copy.fundsSplit.basisSettled
              : copy.fundsSplit.basisPreview}
          </p>
          <p className="mt-2 text-sm text-ink-2">{copy.fundsSplit.note}</p>
        </div>
      )}

      {showTotals && (
        <p className="mt-4 text-sm text-ink-2">
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
