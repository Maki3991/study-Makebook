"use client";

import { Package, Scissors, Truck } from "lucide-react";
import { SectionHead, SourceTag } from "@/app/components/site/primitives";

/**
 * "Production plan" — tab 3 of the campaign page.
 *
 * Static milestone timeline (Sampling → Mass production → Shipping). Every
 * node is tagged OFF-CHAIN DEMO: the contract escrows funds and settles the
 * batch, but it does not track production — this timeline is illustrative
 * only and never presented as onchain state.
 */

const MILESTONES = [
  {
    icon: Scissors,
    name: "Sampling",
    timing: "Weeks 1–2 · after a successful settlement",
    description:
      "The selected factory produces two sample units for operator sign-off against the confirmed manifest.",
  },
  {
    icon: Package,
    name: "Mass production",
    timing: "Weeks 3–6",
    description:
      "The winning tier quantity goes into production at the uniform clearing unit price locked on-chain.",
  },
  {
    icon: Truck,
    name: "Shipping",
    timing: "Weeks 7–8",
    description:
      "Units ship to backers. Delivery addresses and tracking are collected off-chain (V1).",
  },
] as const;

export function ProductionPlan() {
  return (
    <div className="reveal flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          kicker="Production plan"
          title="From settlement to shipping"
          intro="Three milestones sit between a successful batch and bags in backers' hands."
        />
        <SourceTag tone="offchain">Off-chain demo</SourceTag>
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MILESTONES.map((milestone, index) => (
          <li
            key={milestone.name}
            className="surface flex flex-col gap-4 p-5"
          >
            {/* timeline node: square marker + hairline (CSS only) */}
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-1.5 shrink-0 bg-n-40" />
              <span className="h-px flex-1 bg-n-22" />
              <span className="font-mono text-11 font-medium tracking-[0.14em] text-n-40">
                0{index + 1}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-n-22 bg-n-04 text-n-64">
                <milestone.icon size={16} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-17 font-medium text-n-92">
                  {milestone.name}
                </h3>
                <p className="font-mono text-11 uppercase tracking-[0.14em] text-n-52">
                  {milestone.timing}
                </p>
              </div>
            </div>
            <p className="text-13 leading-relaxed text-n-64">
              {milestone.description}
            </p>
            <p className="mt-auto border-t border-n-22 pt-3">
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            </p>
          </li>
        ))}
      </ol>

      <p className="text-13 leading-relaxed text-n-52">
        Off-chain demo timeline. The contract does not track production.
      </p>
    </div>
  );
}
