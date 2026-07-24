"use client";

import { useCampaign, useOrders, eligibleCount } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { copy } from "@/app/lib/copy";
import { formatInj } from "@/app/lib/chain/format";

const FACTORY_LABELS = ["Factory A", "Factory B"];

export function QuoteTable({ id }: { id: CampaignId }) {
  const campaign = useCampaign(id);
  const orders = useOrders(id);

  const quotes = campaign.quotes ?? [];
  const orderList = orders.data ?? [];

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-ink">{copy.quotes.title}</h2>

      <div className="mt-4">
        {quotes.length === 0 ? (
          <p className="text-sm text-ink-3">No factory quotes yet.</p>
        ) : (
          <div className="min-w-full">
            <div className="hidden grid-cols-5 gap-4 border-b border-line pb-2 text-xs uppercase tracking-wide text-ink-3 md:grid">
              <span>Factory</span>
              <span>MOQ</span>
              <span>Unit price</span>
              <span>Eligible</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-line">
              {quotes.map((quote, idx) => {
                const tier = quote.tiers[0];
                if (!tier) return null;
                const eligible = eligibleCount(orderList, tier.unitPriceWei);
                const short = Math.max(0, tier.minQty - eligible);
                const canClear = short === 0;
                const label = FACTORY_LABELS[idx] ?? `Factory ${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 items-baseline gap-x-4 gap-y-2 py-3 md:grid-cols-5 md:items-center"
                  >
                    <span className="text-sm font-medium text-ink md:text-xs md:uppercase md:tracking-wide">
                      {label}
                    </span>

                    <div className="text-right md:text-left">
                      <span className="text-xs text-ink-3 md:hidden">MOQ </span>
                      <span className="num text-sm text-ink">
                        {tier.minQty}
                      </span>
                    </div>

                    <div className="text-right md:text-left">
                      <span className="text-xs text-ink-3 md:hidden">
                        Unit price{" "}
                      </span>
                      <span className="num text-sm text-ink">
                        {formatInj(tier.unitPriceWei)}
                      </span>
                      <span className="text-xs text-ink-3"> test INJ</span>
                    </div>

                    <div className="text-right md:text-left">
                      <span className="text-xs text-ink-3 md:hidden">
                        Eligible{" "}
                      </span>
                      <span className="num text-sm text-ink">{eligible}</span>
                      <span className="text-xs text-ink-3"> orders</span>
                    </div>

                    <div className="col-span-2 text-right md:col-span-1">
                      {canClear ? (
                        <span className="text-sm font-medium text-success">
                          can clear
                        </span>
                      ) : (
                        <span className="text-sm text-warn">
                          {copy.quotes.rowShort.replace("{n}", String(short))}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
