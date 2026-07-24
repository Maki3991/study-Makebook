"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { createInjPublicClient } from "@/app/lib/chain/chain";
import {
  campaignStateName,
  readCampaignSummary,
} from "@/app/lib/chain/reads";
import { useCampaignData } from "@/app/lib/chain/use-campaign";
import { SourceTag } from "@/app/components/site/primitives";

/**
 * 证据页合约卡的实时状态行（state · orders）。
 * success/failure 走 useCampaignData：链上实读，fixture 降级时诚实标 OFF-CHAIN DEMO。
 */
export function LiveStateChip({
  scenario,
}: {
  scenario: "success" | "failure";
}) {
  const { status, view } = useCampaignData(scenario);
  if (status === "loading") {
    return <div className="skeleton h-5 w-44" aria-busy="true" />;
  }
  return (
    <span className="flex flex-wrap items-center gap-3">
      {view.source === "onchain" ? (
        <SourceTag tone="onchain">Onchain</SourceTag>
      ) : (
        <SourceTag tone="offchain">Off-chain demo</SourceTag>
      )}
      <span className="num text-13 text-n-64">
        {campaignStateName(view.state)} · {view.ordersLength} orders
      </span>
    </span>
  );
}

/**
 * playground 卡：RPC 直读（无 fixtures 可降级——读不到就如实报错 + 重试，
 * 绝不拿演示数据冒充实时状态）。
 */
export function PlaygroundLiveChip({ address }: { address: Address }) {
  const [nonce, setNonce] = useState(0);
  const [fetched, setFetched] = useState<{
    key: number;
    result:
      | { kind: "ready"; state: number; ordersLength: number }
      | { kind: "error" };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    readCampaignSummary(createInjPublicClient(), address)
      .then((summary) => {
        if (!cancelled) {
          setFetched({
            key: nonce,
            result: {
              kind: "ready",
              state: summary.state,
              ordersLength: Number(summary.ordersLength),
            },
          });
        }
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: nonce, result: { kind: "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [address, nonce]);

  const current = fetched && fetched.key === nonce ? fetched.result : null;
  if (current === null) {
    return <div className="skeleton h-5 w-44" aria-busy="true" />;
  }
  if (current.kind === "error") {
    return (
      <span className="flex items-center gap-3 text-13 text-n-52">
        Live read failed
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="min-h-0 min-w-0 text-azure underline underline-offset-4 transition-colors hover:text-azure-deep"
        >
          Retry
        </button>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-3">
      <SourceTag tone="onchain">Onchain</SourceTag>
      <span className="num text-13 text-n-64">
        {campaignStateName(current.state)} · {current.ordersLength} orders
      </span>
    </span>
  );
}
