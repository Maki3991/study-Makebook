"use client";

import { Clock } from "lucide-react";
import { useCampaign, useNowSec } from "@/app/lib/chain/hooks";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { CampaignId } from "@/app/lib/types";
import { formatInj, getCountdownParts } from "@/app/lib/chain/format";

export function StatusStrip({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const now = useNowSec();

  const state = campaign.state;
  const deadline = campaign.deadline;
  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];
  const winnerCount = preview?.[4];

  const isPastDeadline =
    state === "Open" && deadline !== undefined && now >= Number(deadline);

  let statusLabel: string = copy.status.open;
  let statusClass: string = "tag-success";

  if (state === "Succeeded" || state === "PaidOut") {
    statusLabel = copy.status.succeeded;
    statusClass = "tag-accent";
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
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`tag ${statusClass}`}>
          {state === "Open" && !isPastDeadline ? <Clock size={12} /> : null}
          {statusLabel}
        </span>

        {state === "Open" && countdownParts && !countdownParts.expired ? (
          <span className="text-sm text-ink-2">
            {copy.status.countdown
              .replace("{dd}", String(countdownParts.dd))
              .replace("{hh}", String(countdownParts.hh))
              .replace("{mm}", String(countdownParts.mm))}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-3">
            {copy.status.ordersLabel}
          </p>
          <p className="num mt-0.5 text-h2 font-semibold text-ink">
            {campaign.ordersLength?.toString() ?? "—"}
            <span className="text-base font-normal text-ink-3"> / 50</span>
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink-3">
            {copy.status.currentPreviewLabel}
          </p>
          {state === "Open" ? (
            feasible ? (
              <p className="num mt-0.5 text-sm font-medium text-success">
                {copy.batch.card.preview
                  .replace("{price}", formatInj(clearingPrice ?? 0n))
                  .replace("{count}", winnerCount?.toString() ?? "—")}
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-medium text-warn">
                {copy.batch.card.previewInfeasible}
              </p>
            )
          ) : state === "Succeeded" || state === "PaidOut" ? (
            <p className="num mt-0.5 text-sm font-medium text-accent">
              {copy.result.success
                .replace("{price}", formatInj(campaign.clearingPrice ?? 0n))
                .replace("{count}", campaign.winnerCount?.toString() ?? "—")}
            </p>
          ) : state === "Failed" ? (
            <p className="mt-0.5 text-sm font-medium text-danger">
              {copy.result.failure}
            </p>
          ) : (
            <p className="num mt-0.5 text-sm text-ink-3">—</p>
          )}
        </div>
      </div>
    </section>
  );
}
