"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { CAMPAIGNS } from "@/app/lib/chain/config";
import { useNowSec, useRecentOrderActivity } from "@/app/lib/chain/hooks";
import type { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import {
  explorerAddress,
  explorerTx,
  formatInj,
  truncateAddress,
} from "@/app/lib/chain/format";

function formatRelativeTime(
  time: ReturnType<typeof useCopy>["campaign"]["evidence"]["time"],
  nowSec: number,
  timestampSec: number,
): string {
  const diff = Math.max(0, nowSec - timestampSec);
  if (diff < 60) return time.justNow;
  if (diff < 3600) {
    return time.minutesAgo.replace("{n}", String(Math.floor(diff / 60)));
  }
  if (diff < 86400) {
    return time.hoursAgo.replace("{n}", String(Math.floor(diff / 3600)));
  }
  return time.daysAgo.replace("{n}", String(Math.floor(diff / 86400)));
}

export function EvidenceBlock({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const now = useNowSec();
  const meta = CAMPAIGNS[id];
  const activity = useRecentOrderActivity(id, 8);
  const [copied, setCopied] = useState(false);

  const address = meta.deployment?.address;
  const deployTx = meta.deployTx;

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave state unchanged.
    }
  };

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-ink">
        {copy.campaign.evidence.title}
      </h2>

      <div className="mt-4 space-y-3">
        {/* Contract address */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs uppercase tracking-wide text-ink-3">
            {copy.campaign.contractLabel}
          </span>
          {address ? <span className="num text-xs text-ink">{address}</span> : null}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied
              ? copy.campaign.evidence.copied
              : copy.campaign.evidence.copyAddress}
          </button>
          {address ? (
            <a
              href={explorerAddress(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              {copy.campaign.evidence.viewAddress}
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>

        {/* Deploy transaction */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs uppercase tracking-wide text-ink-3">
            {copy.campaign.evidence.deployTxLabel}
          </span>
          <a
            href={explorerTx(deployTx)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <span className="num">{truncateAddress(deployTx)}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Recent OrderPlaced activity */}
      <h3 className="mt-6 text-sm font-medium text-ink">
        {copy.campaign.evidence.activityTitle}
      </h3>
      {activity.data === undefined ? (
        <p className="mt-2 text-sm text-ink-3">{copy.product.manifestLoading}</p>
      ) : activity.data.length === 0 ? (
        <p className="mt-2 text-sm text-ink-3">
          {copy.campaign.evidence.activityEmpty}
        </p>
      ) : (
        <div className="mt-2 divide-y divide-line">
          {activity.data.map((item) => (
            <div
              key={`${item.buyer}-${item.blockNumber}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-2"
            >
              <span className="num text-sm text-ink">
                {truncateAddress(item.buyer)}
              </span>
              <span className="flex items-baseline gap-3">
                <span className="num text-sm text-ink">
                  {copy.campaign.evidence.bid.replace(
                    "{amount}",
                    formatInj(item.maxPrice),
                  )}
                </span>
                <span className="text-xs text-ink-3">
                  {formatRelativeTime(
                    copy.campaign.evidence.time,
                    now,
                    item.timestamp,
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
