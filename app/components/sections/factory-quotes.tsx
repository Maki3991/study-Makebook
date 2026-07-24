"use client";

import { Check, X } from "lucide-react";
import {
  CopyValue,
  SectionHead,
  SourceTag,
} from "@/app/components/site/primitives";
import { isZeroAddress } from "@/app/lib/chain/deployments";
import type { Quote, TierEligibility } from "@/app/lib/chain/reads";
import {
  useCampaignData,
  type CampaignView,
} from "@/app/lib/chain/use-campaign";
import { shortenAddress } from "@/app/lib/chain/wallet";

/**
 * "Factory MOQ quotes" — one card per factory quote.
 *
 * Data source: useCampaignData("success") →
 *   - view.quotes / view.quoteNames (names mapped from fixtures; ONCHAIN)
 *   - view.factoryTiers (buildTierEligibility over escrowed orders; ONCHAIN)
 * RPC failure falls back to fixtures inside the hook → labeled OFF-CHAIN DEMO.
 * Known fixture factories are team-controlled demo wallets → DEMO FACTORY tag.
 * Lead time is not onchain → OFF-CHAIN DEMO small print per card.
 */

const TH =
  "py-2 pr-4 text-left font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40";

/**
 * view.factoryTiers is sorted by price across all quotes; regroup the tiers
 * of one quote via their stable ids ("quote-{i}-tier-{j}", set by
 * buildTierEligibility) and restore the onchain tier order.
 */
function tiersOfQuote(view: CampaignView, quoteIndex: number): TierEligibility[] {
  const prefix = `quote-${quoteIndex}-tier-`;
  return view.factoryTiers
    .filter((tier) => tier.id.startsWith(prefix))
    .sort(
      (a, b) =>
        Number(a.id.slice(prefix.length)) - Number(b.id.slice(prefix.length)),
    );
}

function QuoteCard({
  quote,
  name,
  isDemoFactory,
  tiers,
}: {
  quote: Quote;
  name: string;
  isDemoFactory: boolean;
  tiers: TierEligibility[];
}) {
  return (
    <article className="surface flex min-w-0 flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="text-17 font-medium text-n-92">{name}</h3>
          {isDemoFactory ? (
            <SourceTag tone="factory">Demo Factory</SourceTag>
          ) : null}
        </div>
        {!isZeroAddress(quote.factory) ? (
          <CopyValue
            value={quote.factory}
            display={shortenAddress(quote.factory)}
          />
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-n-22">
              <th className={TH}>Tier</th>
              <th className={TH}>Min qty</th>
              <th className={TH}>Unit price</th>
              <th className={TH}>Eligible</th>
              <th className={TH}>Feasible</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, index) => (
              <tr
                key={tier.id}
                className="border-b border-n-16 last:border-b-0"
              >
                <td className="num py-2.5 pr-4 text-13 text-n-52">
                  #{index + 1}
                </td>
                <td className="num py-2.5 pr-4 text-13 text-n-92">
                  {tier.quantity}
                </td>
                <td className="num py-2.5 pr-4 text-13 whitespace-nowrap text-n-92">
                  {tier.price} <span className="text-n-40">test INJ</span>
                </td>
                <td className="num py-2.5 pr-4 text-13 whitespace-nowrap text-n-92">
                  {tier.eligible} orders
                </td>
                <td className="py-2.5 text-13">
                  {tier.feasible ? (
                    <span className="inline-flex items-center gap-1.5 text-signal-onchain">
                      <Check size={14} aria-hidden="true" />
                      Viable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-n-40">
                      <X size={14} aria-hidden="true" />
                      Not met
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-n-22 pt-4">
        <p className="text-13 leading-relaxed text-n-52">
          Quotes are frozen once the campaign opened. No one can change them
          now.
        </p>
        <p className="flex flex-wrap items-center gap-2 font-mono text-11 text-n-40">
          <SourceTag tone="offchain">Off-chain Demo</SourceTag>
          <span>Lead time 35 days · off-chain note</span>
        </p>
      </div>
    </article>
  );
}

export function FactoryQuotes() {
  const { status, view } = useCampaignData("success");
  const ready = status === "ready";

  return (
    <div className="reveal flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          kicker="Factory quotes · MOQ ladders"
          title="Factory MOQ quotes"
          intro="Each factory submitted a price ladder before the campaign opened. A tier is viable when at least its minimum quantity of escrowed orders bid the unit price or higher — the contract enforces that at settlement."
        />
        {ready ? (
          view.source === "onchain" ? (
            <SourceTag tone="onchain">Onchain</SourceTag>
          ) : (
            <SourceTag tone="offchain">Off-chain Demo</SourceTag>
          )
        ) : null}
      </div>

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="skeleton h-[260px] w-full" aria-label="Loading" />
          <div className="skeleton h-[260px] w-full" aria-label="Loading" />
        </div>
      ) : view.quotes.length === 0 ? (
        <div className="surface-flat flex min-h-[200px] items-center justify-center p-8 text-center text-13 text-n-52">
          No factory quotes on this campaign yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {view.quotes.map((quote, quoteIndex) => {
            const knownName = view.quoteNames[quoteIndex];
            return (
              <QuoteCard
                key={`quote-${quoteIndex}`}
                quote={quote}
                name={knownName ?? `Factory ${shortenAddress(quote.factory)}`}
                isDemoFactory={knownName !== undefined}
                tiers={tiersOfQuote(view, quoteIndex)}
              />
            );
          })}
        </div>
      )}

      <p className="font-mono text-11 text-n-40">Hackathon scaled test data</p>
    </div>
  );
}
