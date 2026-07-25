"use client";

import { FAUCET_URL } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { ProvenanceTag } from "./provenance-tag";

export function TestnetBanner() {
  const copy = useCopy();

  return (
    <div className="bg-accent-soft text-accent">
      <div className="page flex min-h-9 items-center justify-center gap-2 px-5 py-2 text-center text-xs font-medium sm:text-sm">
        <ProvenanceTag type="TESTNET" />
        <span className="text-ink-2">{copy.global.banner.testnet.message}</span>
        <span className="hidden sm:inline">·</span>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center underline underline-offset-2 hover:text-accent-hover"
        >
          {copy.global.banner.testnet.cta}
        </a>
      </div>
    </div>
  );
}
