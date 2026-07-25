"use client";

import { useCampaign, useOrders, eligibleCount } from "@/app/lib/chain/hooks";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj } from "@/app/lib/chain/format";
import { ProvenanceTag } from "@/app/components/site/provenance-tag";

const FACTORY_LABELS = ["Factory A", "Factory B"];

function factoryLabel(quoteId: number): string {
  return FACTORY_LABELS[quoteId] ?? `Factory ${quoteId + 1}`;
}

export function QuoteTable({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const orders = useOrders(id);

  const quotes = campaign.quotes ?? [];
  const orderList = orders.data ?? [];

  // Spec 009 §4.2: eligibility is priced at retail = factory tier price ×
  // (10000 + marginBps) / 10000 (floor) — the same dimension the demand
  // curve uses. marginBps comes from the deployments JSON (frozen in the
  // constructor), falling back to the on-chain read.
  const marginBps = CAMPAIGNS[id].deployment?.marginBps ?? campaign.marginBps;
  const retailPriceWei = (unitPriceWei: bigint): bigint =>
    marginBps === undefined
      ? unitPriceWei
      : (unitPriceWei * (10000n + BigInt(marginBps))) / 10000n;

  // Winning tier: the on-chain result once settled, otherwise the current
  // preview (what settle would record if triggered now).
  const state = campaign.state;
  const preview = campaign.preview;
  let winner: { quoteId: number; tierIndex: number } | undefined;
  if (state === "Succeeded" || state === "PaidOut") {
    if (
      campaign.winningQuoteId !== undefined &&
      campaign.winningTierIndex !== undefined
    ) {
      winner = {
        quoteId: Number(campaign.winningQuoteId),
        tierIndex: Number(campaign.winningTierIndex),
      };
    }
  } else if (preview?.[0]) {
    winner = { quoteId: Number(preview[1]), tierIndex: Number(preview[2]) };
  }
  const winnerLabel = winner ? factoryLabel(winner.quoteId) : undefined;

  const rows = quotes.flatMap((quote) =>
    quote.tiers.map((tier, tierIndex) => ({ quote, tier, tierIndex })),
  );

  return (
    <section className="section">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-ink">{copy.quotes.title}</h2>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-3">{copy.quotes.empty}</p>
        ) : (
          <div className="min-w-full">
            <div className="hidden grid-cols-6 gap-4 bg-paper-2 p-2 text-micro uppercase tracking-wide text-ink-3 md:grid">
              <span>{copy.quotes.headers.factory}</span>
              <span className="text-right">{copy.quotes.headers.moq}</span>
              <span className="text-right">{copy.quotes.headers.factoryPrice}</span>
              <span className="text-right">{copy.quotes.headers.retailPrice}</span>
              <span className="text-right">{copy.quotes.headers.eligible}</span>
              <span className="text-right">{copy.quotes.headers.status}</span>
            </div>

            <div className="divide-y divide-line">
              {rows.map(({ quote, tier, tierIndex }) => {
                const retailWei = retailPriceWei(tier.unitPriceWei);
                const eligible = eligibleCount(orderList, retailWei);
                const isWinner =
                  winner !== undefined &&
                  winner.quoteId === quote.quoteId &&
                  winner.tierIndex === tierIndex;

                let statusText: string;
                let statusClass: string;
                let reasonText: string;
                if (isWinner) {
                  statusText = copy.quotes.result.win;
                  statusClass = "text-sm font-medium text-success";
                  reasonText = copy.quotes.reason.win
                    .replace("{n}", String(eligible))
                    .replace("{moq}", String(tier.minQty));
                } else if (eligible < tier.minQty) {
                  statusText = copy.quotes.result.lost;
                  statusClass = "text-sm text-ink-3";
                  reasonText = copy.quotes.reason.infeasible
                    .replace("{n}", String(eligible))
                    .replace("{moq}", String(tier.minQty));
                } else {
                  statusText = copy.quotes.result.lost;
                  statusClass = "text-sm text-ink-3";
                  reasonText = copy.quotes.reason.lost
                    .replace("{n}", String(eligible))
                    .replace("{moq}", String(tier.minQty))
                    .replace("{winner}", winnerLabel ?? "—");
                }

                return (
                  <div
                    key={`${quote.quoteId}-${tierIndex}`}
                    className="grid grid-cols-2 items-baseline gap-x-4 gap-y-2 py-3 md:grid-cols-6 md:items-center"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium text-ink md:text-xs md:uppercase md:tracking-wide">
                        {factoryLabel(quote.quoteId)}
                      </span>
                      <ProvenanceTag type="DEMO FACTORY" />
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-3 md:hidden">
                        {copy.quotes.headers.moq}{" "}
                      </span>
                      <span className="num text-sm text-ink">
                        {tier.minQty}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-3 md:hidden">
                        {copy.quotes.headers.factoryPrice}{" "}
                      </span>
                      <span className="num text-sm text-ink">
                        {formatInj(tier.unitPriceWei)}
                      </span>
                      <span className="text-xs text-ink-3"> test INJ</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-3 md:hidden">
                        {copy.quotes.headers.retailPrice}{" "}
                      </span>
                      <span className="num text-sm text-ink">
                        {formatInj(retailWei)}
                      </span>
                      <span className="text-xs text-ink-3"> test INJ</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-3 md:hidden">
                        {copy.quotes.headers.eligible}{" "}
                      </span>
                      <span className="num text-sm text-ink">{eligible}</span>
                      <span className="text-xs text-ink-3">
                        {" "}
                        {copy.quotes.ordersSuffix}
                      </span>
                    </div>

                    <div className="col-span-2 text-right md:col-span-1">
                      <span className={statusClass}>{statusText}</span>
                      <p className="mt-0.5 text-xs text-ink-3">{reasonText}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-ink-3">{copy.quotes.tiebreak}</p>
          </div>
        )}
      </div>
    </section>
  );
}
