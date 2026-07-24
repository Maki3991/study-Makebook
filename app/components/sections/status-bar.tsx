"use client";

import { ArrowRight } from "lucide-react";
import {
  formatInj,
  useCampaignData,
  useCountdown,
} from "@/app/lib/chain/use-campaign";
import {
  useCampaignStateLabel,
  useLang,
  type Translate,
} from "@/app/lib/i18n";
import {
  Button,
  Countdown,
  SourceTag,
} from "@/app/components/site/primitives";

/**
 * Batch status bar — the crowdfunding strip under the hero.
 *
 * Cells: escrowed orders / orders still short of the nearest MOQ / current
 * clearing price (preview while Open, final once settled) / countdown, plus
 * the state-machine primary button:
 *   Open (before deadline) → "Back this batch"     → #pledge
 *   Open (deadline passed) → "Trigger settlement"  → #settlement tab
 *   Succeeded              → "Claim your refund"   → #pledge claims card
 *   Failed                 → "Claim full refund"   → #pledge claims card
 *   PaidOut                → "View receipt"        → #settlement tab
 *   Draft                  → disabled, nothing to back yet.
 *
 * Data: useCampaignData("success") — the Demo Panel scenario override can
 * remode every consumer to failure/playground; fixture fallback views are
 * tagged OFF-CHAIN DEMO here as everywhere else.
 */

const CELL_LABEL =
  "font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40";

function moqGapLabel(
  view: ReturnType<typeof useCampaignData>["view"],
  t: Translate,
): string {
  if (view.factoryTiers.length === 0) return "—";
  // Distance to the closest unmet MOQ across every factory tier.
  const gaps = view.factoryTiers
    .map((tier) => tier.quantity - tier.eligible)
    .filter((gap) => gap > 0);
  if (gaps.length === 0) return t("statusbar.moqMet");
  return t("statusbar.ordersShort", { count: Math.min(...gaps) });
}

export function StatusBar() {
  const { status, view } = useCampaignData("success");
  const { t } = useLang();
  const stateLabel = useCampaignStateLabel();
  const { expired } = useCountdown(view.deadline);

  if (status === "loading") {
    return (
      <div
        className="skeleton h-[164px] w-full lg:h-[92px]"
        role="status"
        aria-label={t("statusbar.loadingAria")}
      />
    );
  }

  const settled = view.settled;
  const settlement = view.settlement;

  const priceCell = settled
    ? settlement?.success
      ? `${formatInj(settlement.clearingPrice)} test INJ`
      : "—"
    : view.preview.feasible
      ? `${formatInj(view.preview.clearingPrice)} test INJ`
      : "—";

  // State-machine primary button.
  let cta: React.ReactNode;
  if (view.state === 0) {
    cta = (
      <Button variant="primary" className="w-full" disabled>
        {t("statusbar.ctaNotOpen")}
      </Button>
    );
  } else if (view.state === 1 && !expired) {
    cta = (
      <a href="#pledge" className="btn btn-primary w-full">
        <span>{t("common.backThisBatch")}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    );
  } else if (view.state === 1) {
    cta = (
      <a href="#settlement" className="btn btn-primary w-full">
        <span>{t("common.triggerSettlement")}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    );
  } else if (view.state === 2) {
    cta = (
      <a href="#pledge" className="btn btn-primary w-full">
        <span>{t("statusbar.ctaClaimRefund")}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    );
  } else if (view.state === 3) {
    cta = (
      <a href="#pledge" className="btn btn-primary w-full">
        <span>{t("statusbar.ctaClaimFull")}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    );
  } else {
    cta = (
      <a href="#settlement" className="btn btn-dark w-full">
        <span>{t("statusbar.ctaViewReceipt")}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    );
  }

  return (
    <section aria-label={t("statusbar.title")} className="reveal flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className={CELL_LABEL}>{t("statusbar.title")}</span>
        {view.source === "onchain" ? (
          <SourceTag tone="onchain">Onchain</SourceTag>
        ) : (
          <SourceTag tone="offchain">Off-chain demo</SourceTag>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px rounded-[2px] border border-n-22 bg-n-22 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <div className="flex min-w-0 flex-col gap-1 bg-n-08 p-4">
          <span className={CELL_LABEL}>{t("common.ordersEscrowed")}</span>
          <span className="num text-21 leading-tight font-medium text-n-92">
            {view.ordersLength}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 bg-n-08 p-4">
          <span className={CELL_LABEL}>{t("statusbar.toNearestMoq")}</span>
          <span className="num text-21 leading-tight font-medium text-n-92">
            {settled ? stateLabel(view.state) : moqGapLabel(view, t)}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 bg-n-08 p-4">
          <span className={CELL_LABEL}>
            {settled ? t("common.clearingPrice") : t("common.clearingPreview")}
          </span>
          <span className="num truncate text-21 leading-tight font-medium text-n-92">
            {priceCell}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 bg-n-08 p-4">
          <span className={CELL_LABEL}>
            {settled ? t("common.outcome") : t("common.closesIn")}
          </span>
          {settled ? (
            <span className="num text-21 leading-tight font-medium text-n-92">
              {stateLabel(view.state)}
            </span>
          ) : (
            <Countdown
              deadline={view.deadline}
              className="text-21 leading-tight font-medium text-n-92"
            />
          )}
        </div>
        <div className="col-span-2 flex items-stretch bg-n-08 p-4 lg:col-span-1 lg:min-w-[220px]">
          {cta}
        </div>
      </div>

      <p className="text-11 leading-relaxed text-n-40">
        {t("statusbar.note")}
      </p>
    </section>
  );
}
