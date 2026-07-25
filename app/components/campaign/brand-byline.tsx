"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { truncateAddress } from "@/app/lib/chain/format";
import { ProvenanceTag } from "@/app/components/site/provenance-tag";

// Spec 009 §3.2 C1: brand attribution line. The brand (creator) sells the
// batch; the platform (MAKEBOOK) only runs it. Deliberately no "supplied by
// FACTORY X" here — the supplier is only a preview until settle, and the
// quote table already carries that information.
export function BrandByline({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const meta = CAMPAIGNS[id];
  const [copied, setCopied] = useState(false);

  const creator = meta.deployment?.creator;
  if (!creator) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(creator);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave state unchanged.
    }
  };

  return (
    <section className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-body text-ink-2">
        {copy.campaign.brand.byline.replace("{brand}", meta.brandName)}
      </p>
      <ProvenanceTag type="DEMO BRAND" />
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
      >
        <span className="num">{truncateAddress(creator)}</span>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied
          ? copy.campaign.evidence.copied
          : copy.campaign.evidence.copyAddress}
      </button>
    </section>
  );
}
