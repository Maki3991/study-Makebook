"use client";

import { useCampaign } from "@/app/lib/chain/hooks";
import { CAMPAIGNS, DEPLOYED_CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { copy } from "@/app/lib/copy";
import { formatInj, formatCountdown } from "@/app/lib/chain/format";
import { Clock } from "lucide-react";

function AdminRow({ id }: { id: CampaignId }) {
  const campaign = useCampaign(id);
  const meta = CAMPAIGNS[id];
  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];
  const winnerCount = preview?.[4];

  const quotes = campaign.quotes ?? [];
  const quoteText = quotes
    .map((q) => {
      const tier = q.tiers[0];
      if (!tier) return "";
      return `${formatInj(tier.unitPriceWei)} @ ${tier.minQty}`;
    })
    .filter(Boolean)
    .join("; ");

  const stateLabel =
    campaign.state === "Open"
      ? copy.status.open
      : campaign.state === "Succeeded" || campaign.state === "PaidOut"
        ? copy.status.succeeded
        : campaign.state === "Failed"
          ? copy.status.failed
          : campaign.state ?? "—";

  return (
    <tr className="border-b border-line">
      <td className="py-3 pr-4 text-sm font-medium text-ink">
        {meta.product}
        <span className="ml-2 text-ink-3">{meta.batchName}</span>
      </td>
      <td className="py-3 pr-4 text-sm">
        <span
          className={`tag ${
            campaign.state === "Open"
              ? "tag-success"
              : campaign.state === "Succeeded" || campaign.state === "PaidOut"
                ? "tag-accent"
                : campaign.state === "Failed"
                  ? "tag-danger"
                  : "tag-neutral"
          }`}
        >
          {stateLabel}
        </span>
      </td>
      <td className="num py-3 pr-4 text-sm text-ink">
        {campaign.ordersLength?.toString() ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-ink-2">
        {quoteText || "No quotes"}
      </td>
      <td className="py-3 pr-4 text-sm">
        {campaign.state === "Open" ? (
          feasible ? (
            <span className="text-success">
              {formatInj(clearingPrice ?? 0n)} · {winnerCount?.toString() ?? "—"} clearing
            </span>
          ) : (
            <span className="text-warn">{copy.batch.card.previewInfeasible}</span>
          )
        ) : campaign.state === "Succeeded" || campaign.state === "PaidOut" ? (
          <span className="text-accent">
            {formatInj(campaign.clearingPrice ?? 0n)} ·{" "}
            {campaign.winnerCount?.toString() ?? "—"} cleared
          </span>
        ) : campaign.state === "Failed" ? (
          <span className="text-danger">{copy.result.failure}</span>
        ) : (
          <span className="text-ink-3">—</span>
        )}
      </td>
      <td className="num py-3 text-sm text-ink-2">
        {campaign.deadline ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            {formatCountdown(campaign.deadline)}
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

export function AdminTable() {
  return (
    <section className="surface p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">
        {copy.console.admin.title}
      </h2>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-3">
              <th className="pb-2 pr-4 font-medium">Batch</th>
              <th className="pb-2 pr-4 font-medium">State</th>
              <th className="pb-2 pr-4 font-medium">Orders</th>
              <th className="pb-2 pr-4 font-medium">Factory quotes</th>
              <th className="pb-2 pr-4 font-medium">Current preview</th>
              <th className="pb-2 font-medium">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {DEPLOYED_CAMPAIGNS.map((id) => (
              <AdminRow key={id} id={id} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-3">{copy.console.admin.note}</p>
    </section>
  );
}
