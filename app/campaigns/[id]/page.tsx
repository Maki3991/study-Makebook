"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { StatusStrip } from "@/app/components/campaign/status-strip";
import { ProductCard } from "@/app/components/campaign/product-card";
import { QuoteTable } from "@/app/components/campaign/quote-table";
import { DemandCurve } from "@/app/components/campaign/demand-curve";
import { ResultBlock } from "@/app/components/campaign/result-block";
import { FundsSplit } from "@/app/components/campaign/funds-split";
import { EvidenceBlock } from "@/app/components/campaign/evidence-block";
import { PledgePanel } from "@/app/components/campaign/pledge-panel";

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
        <h1 className="text-h1 font-semibold text-ink">{copy.notOpen.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-2">{copy.notOpen.body}</p>
      </main>
    );
  }

  return (
    <main className="page py-10 lg:py-16">
      <StatusStrip id={campaignId} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <ProductCard id={campaignId} />

          <div className="mt-2">
            <QuoteTable id={campaignId} />
            <DemandCurve id={campaignId} />
            <ResultBlock id={campaignId} />
            <FundsSplit id={campaignId} />
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <PledgePanel id={campaignId} />
        </div>
      </div>

      <EvidenceBlock id={campaignId} />

      <footer className="mt-12 border-t border-line pt-6 text-xs text-ink-3">
        <p className="font-mono">
          {copy.campaign.contractLabel} {meta.deployment?.address}
        </p>
      </footer>
    </main>
  );
}
