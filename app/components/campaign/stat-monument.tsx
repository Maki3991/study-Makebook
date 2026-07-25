"use client";

import { useCampaign } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj } from "@/app/lib/chain/format";

const FACTORY_LABELS = ["Factory A", "Factory B"];

function factoryLabel(quoteId: number): string {
  return FACTORY_LABELS[quoteId] ?? `Factory ${quoteId + 1}`;
}

// Spec 009 §11.2 N-2: reusable "big number + small grey context" block.
// size="monument" is the 96px clearing-price hero (clamped to ≤72px on mobile
// via .monument-value); size="stat" is the smaller key-metric variant
// (ORDERS 5 / 50 and the like).
export function StatMonument({
  label,
  value,
  unit,
  context,
  size = "monument",
  className = "",
}: {
  label: React.ReactNode;
  value: string;
  unit?: string;
  context?: React.ReactNode;
  size?: "monument" | "stat";
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-label text-ink-3">{label}</p>
      <p className="num mt-2 flex flex-wrap items-baseline gap-x-3 text-ink">
        <span className={size === "monument" ? "monument-value" : "stat-value"}>
          {value}
        </span>
        {unit ? <span className="monument-unit text-ink-3">{unit}</span> : null}
      </p>
      {context ? (
        <p className="num mt-2 text-micro text-ink-3">{context}</p>
      ) : null}
    </div>
  );
}

// The clearing price is the hero number of the campaign page. Before settle
// it is only a preview — the label always carries the "if it closed now"
// framing, and an infeasible preview never shows an invented price.
export function ClearingMonument({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);

  const state = campaign.state;
  const preview = campaign.preview;
  const settled = state === "Succeeded" || state === "PaidOut";

  // Winning tier: the on-chain result once settled, otherwise the preview.
  let winner: { quoteId: number; tierIndex: number } | undefined;
  if (settled) {
    if (
      campaign.winningQuoteId !== undefined &&
      campaign.winningTierIndex !== undefined
    ) {
      winner = {
        quoteId: Number(campaign.winningQuoteId),
        tierIndex: Number(campaign.winningTierIndex),
      };
    }
  } else if (state === "Open" && preview?.[0]) {
    winner = { quoteId: Number(preview[1]), tierIndex: Number(preview[2]) };
  }
  const tier = winner
    ? campaign.quotes.find((q) => q.quoteId === winner.quoteId)?.tiers[
        winner.tierIndex
      ]
    : undefined;

  const priceWei = settled
    ? campaign.clearingPrice
    : state === "Open" && preview?.[0]
      ? preview[3]
      : undefined;
  const count = settled
    ? campaign.winnerCount
    : state === "Open" && preview?.[0]
      ? preview[4]
      : undefined;

  // No honest number to monumentalize: badge + micro explanation instead.
  if (campaign.isError || state === undefined) {
    return (
      <StatMonument
        className="mt-6 lg:mt-8"
        label={copy.monument.previewLabel}
        value="—"
      />
    );
  }
  if (state === "Draft") {
    return (
      <div className="mt-6 lg:mt-8">
        <span className="tag tag-neutral">{copy.notOpen.title}</span>
      </div>
    );
  }
  if (state === "Failed") {
    return (
      <div className="mt-6 lg:mt-8">
        <span className="tag tag-danger">{copy.status.failed}</span>
        <p className="mt-2 text-micro text-ink-3">{copy.result.failure}</p>
      </div>
    );
  }
  if (priceWei === undefined) {
    // Open but below MOQ at current orders.
    return (
      <div className="mt-6 lg:mt-8">
        <span className="tag tag-warn">{copy.status.badge.belowMoq}</span>
        <p className="mt-2 text-micro text-ink-3">
          {copy.batch.card.previewInfeasible}
        </p>
      </div>
    );
  }

  const context = (
    settled ? copy.monument.contextSettled : copy.monument.context
  )
    .replace("{winners}", count?.toString() ?? "—")
    .replace("{orders}", campaign.ordersLength?.toString() ?? "—")
    .replace("{factory}", winner ? factoryLabel(winner.quoteId) : "—")
    .replace("{moq}", tier ? String(tier.minQty) : "—");

  return (
    <StatMonument
      className="mt-6 lg:mt-8"
      label={settled ? copy.monument.settledLabel : copy.monument.previewLabel}
      value={formatInj(priceWei)}
      unit={copy.monument.unit}
      context={context}
    />
  );
}
