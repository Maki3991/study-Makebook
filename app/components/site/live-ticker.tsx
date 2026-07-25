"use client";

import {
  useCampaign,
  useNowSec,
  useTotalEscrow,
} from "@/app/lib/chain/hooks";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, getCountdownParts } from "@/app/lib/chain/format";

const TICKER_IDS: CampaignId[] = ["success", "failure", "bracelet"];

function TickerCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-5 py-5 md:px-6 md:py-6">
      <p className="text-xs uppercase tracking-wide text-ink-3">{label}</p>
      <p className="num mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export function LiveTicker() {
  const copy = useCopy();
  const now = useNowSec();

  // Call hooks for every campaign in fixed order to obey the Rules of Hooks
  // (same pattern as useConsoleRole).
  const success = useCampaign("success");
  const failure = useCampaign("failure");
  const bracelet = useCampaign("bracelet");
  const escrow = useTotalEscrow();

  const reads = [success, failure, bracelet];
  const deployedReads = reads.filter(
    (_, idx) => CAMPAIGNS[TICKER_IDS[idx]].deployed,
  );

  const statesReady = deployedReads.every((r) => r.state !== undefined);
  const openCount = deployedReads.filter((r) => r.state === "Open").length;

  const ordersReady = deployedReads.every((r) => r.ordersLength !== undefined);
  const totalOrders = ordersReady
    ? deployedReads.reduce((sum, r) => sum + (r.ordersLength ?? 0n), 0n)
    : undefined;

  // All deployed batches share the same deadline; take the first one loaded.
  const deadline = deployedReads
    .map((r) => r.deadline)
    .find((d) => d !== undefined);

  let countdownValue = "—";
  if (deadline !== undefined) {
    const parts = getCountdownParts(deadline, now);
    countdownValue = parts.expired
      ? copy.status.closed
      : copy.home.ticker.countdown
          .replace("{dd}", String(parts.dd))
          .replace("{hh}", String(parts.hh))
          .replace("{mm}", String(parts.mm));
  }

  return (
    <div className="border-t border-line">
      <div className="flex flex-col divide-y divide-line lg:flex-row lg:divide-x lg:divide-y-0">
        <TickerCell
          label={copy.home.ticker.openBatches}
          value={statesReady ? String(openCount) : "—"}
        />
        <TickerCell
          label={copy.home.ticker.orders}
          value={totalOrders !== undefined ? totalOrders.toString() : "—"}
        />
        <TickerCell
          label={copy.home.ticker.escrowed}
          value={
            escrow.data !== undefined
              ? copy.home.ticker.escrowedValue.replace(
                  "{amount}",
                  formatInj(escrow.data),
                )
              : "—"
          }
        />
        <TickerCell
          label={copy.home.ticker.untilDeadline}
          value={countdownValue}
        />
      </div>
    </div>
  );
}
