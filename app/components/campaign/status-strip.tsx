"use client";

import { Clock } from "lucide-react";
import { useCampaign, useNowSec } from "@/app/lib/chain/hooks";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { CampaignId } from "@/app/lib/types";
import { formatCountdownSpan, getCountdownParts } from "@/app/lib/chain/format";
import { MAX_ORDERS } from "@/app/lib/chain/config";
import {
  ClearingMonument,
  StatMonument,
} from "@/app/components/campaign/stat-monument";

export function StatusStrip({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const now = useNowSec();

  // Spec 009 §5-5: while the first reads are in flight, render placeholders —
  // never fall through to the default green "Accepting orders".
  if (campaign.isLoading) {
    return (
      <section role="status" aria-label={copy.global.a11y.loading}>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-10 w-16" />
        </div>
        <div className="skeleton mt-6 h-24 w-72 max-w-full lg:mt-8" />
      </section>
    );
  }

  const state = campaign.state;
  const deadline = campaign.deadline;

  const isPastDeadline =
    state === "Open" && deadline !== undefined && now >= Number(deadline);

  // N-9: one badge grammar everywhere — uppercase, 0.12em tracking, 1px
  // outline, semantic colors only.
  let statusLabel: string = copy.status.open;
  let statusClass: string = "tag-success";

  if (campaign.isError) {
    // Spec 009 §5-9: surface RPC failure instead of a false green state.
    statusLabel = copy.errors.RpcError;
    statusClass = "tag-danger";
  } else if (state === "Draft") {
    statusLabel = copy.notOpen.title;
    statusClass = "tag-neutral";
  } else if (state === "Succeeded" || state === "PaidOut") {
    statusLabel = copy.status.succeeded;
    statusClass = "tag-success";
  } else if (state === "Failed") {
    statusLabel = copy.status.failed;
    statusClass = "tag-danger";
  } else if (isPastDeadline) {
    statusLabel = copy.status.closed;
    statusClass = "tag-neutral";
  }

  const countdownParts =
    deadline !== undefined ? getCountdownParts(deadline, now) : null;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`tag ${statusClass}`}>
            {state === "Open" && !isPastDeadline ? <Clock size={12} /> : null}
            {statusLabel}
          </span>

          {state === "Open" && countdownParts && !countdownParts.expired ? (
            <span className="num text-body text-ink-2">
              {copy.status.countdownUntil.replace(
                "{span}",
                formatCountdownSpan(countdownParts, copy.status.countdown),
              )}
            </span>
          ) : null}
        </div>

        <StatMonument
          size="stat"
          label={copy.status.ordersLabel}
          value={campaign.ordersLength?.toString() ?? "—"}
          unit={`/ ${MAX_ORDERS}`}
        />
      </div>

      <ClearingMonument id={id} />
    </section>
  );
}
