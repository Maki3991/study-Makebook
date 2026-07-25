"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { StatusStrip } from "@/app/components/campaign/status-strip";
import { BrandByline } from "@/app/components/campaign/brand-byline";
import { ProductCard } from "@/app/components/campaign/product-card";
import { QuoteTable } from "@/app/components/campaign/quote-table";
import { DemandCurve } from "@/app/components/campaign/demand-curve";
import { ResultBlock } from "@/app/components/campaign/result-block";
import { FundsSplit } from "@/app/components/campaign/funds-split";
import { EvidenceBlock } from "@/app/components/campaign/evidence-block";
import { PledgePanel } from "@/app/components/campaign/pledge-panel";
import { PledgeSplitCard } from "@/app/components/campaign/pledge-split-card";

const VALID_IDS: CampaignId[] = ["success", "failure", "bracelet"];

export default function CampaignPage() {
  const copy = useCopy();
  const params = useParams();
  const id = params.id as string;

  if (!VALID_IDS.includes(id as CampaignId)) {
    notFound();
  }

  const campaignId = id as CampaignId;
  const meta = CAMPAIGNS[campaignId];

  if (!meta.deployed) {
    return (
      <main className="page py-20 text-center">
        <h1 className="text-h1 text-ink">{copy.notOpen.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-2">{copy.notOpen.body}</p>
      </main>
    );
  }

  return (
    <main className="page py-10 lg:py-16">
      <StatusStrip id={campaignId} />
      <BrandByline id={campaignId} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <ProductCard id={campaignId} />

          {/* Spec 009 §6-5: 96px (--spacing-7) from the product card's bottom
              edge to the first hairline, matching the .section rhythm below.
              Mobile tightens to --spacing-6 (64px), cf. the hero's py-5. */}
          <div className="mt-6 lg:mt-7">
            <QuoteTable id={campaignId} />
            <DemandCurve id={campaignId} />
            <ResultBlock id={campaignId} />
            <FundsSplit id={campaignId} />
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <PledgePanel id={campaignId} />
          <PledgeSplitCard id={campaignId} />
        </div>
      </div>

      <EvidenceBlock id={campaignId} />

      {/* Spec 009 §6-2: scene-desk as the page's secondary visual, after the
          evidence block so it never squeezes the main flow. FRAME-01 batches
          only — the bracelet batch has no desk-scene shot. aspect + intrinsic
          width/height keep the container from collapsing (N-3). */}
      {campaignId !== "bracelet" && (
        <div className="mt-6 lg:mt-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products/frame-01/scene-desk.png"
            alt={copy.product.sceneAlt}
            width={768}
            height={1360}
            className="aspect-[4/3] w-full object-cover object-[center_68%] lg:aspect-[21/9]"
          />
        </div>
      )}

      <footer className="mt-6 border-t border-line pt-6 text-micro text-ink-3 lg:mt-7">
        <p className="font-mono">
          {copy.campaign.contractLabel} {meta.deployment?.address}
        </p>
      </footer>
    </main>
  );
}
