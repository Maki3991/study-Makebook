"use client";

import { FAUCET_URL } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { ProvenanceTag } from "./provenance-tag";

export function TestnetBanner() {
  const copy = useCopy();

  return (
    <div className="bg-accent-soft text-accent">
      {/* N-6: the faucet link never wraps mid-text; when space runs out the
          link drops to a second line (flex-wrap). N-4: horizontal padding
          comes from .page only, so it matches every other container. */}
      <div className="page flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-1 py-1 text-center text-micro font-medium sm:text-body">
        <ProvenanceTag type="TESTNET" />
        <span className="text-ink-2">{copy.global.banner.testnet.message}</span>
        <span className="hidden sm:inline">·</span>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center whitespace-nowrap underline underline-offset-2 hover:text-accent-hover"
        >
          {copy.global.banner.testnet.cta}
        </a>
      </div>
    </div>
  );
}
