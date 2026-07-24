"use client";

import { SectionHead, SourceTag } from "@/app/components/site/primitives";
import type { DemandPoint, TierEligibility } from "@/app/lib/chain/reads";
import { useCampaignData } from "@/app/lib/chain/use-campaign";

/**
 * "The demand curve is real money" — funded-demand step chart.
 *
 * Data source: useCampaignData("success") →
 *   - view.demandPoints  (buildDemandCurve over escrowed orders; ONCHAIN)
 *   - view.factoryTiers  (MOQ tier lines; ONCHAIN)
 * RPC failure falls back to fixtures inside the hook → labeled OFF-CHAIN DEMO.
 * AI interest samples (72) are rendered separately and never enter clearing.
 *
 * Amounts stay wei bigint upstream; this file renders formatted strings only.
 * Number() conversions below are SVG geometry (pixel positions), never amounts.
 */

/** Interview/comment interest samples — shown for context, never cleared. */
const AI_SAMPLE_COUNT = 72;

// viewBox geometry; every plotted coordinate derives from data.
const W = 720;
const H = 340;
const MARGIN = { top: 30, right: 24, bottom: 46, left: 44 };
const PLOT_W = W - MARGIN.left - MARGIN.right;
const PLOT_H = H - MARGIN.top - MARGIN.bottom;
const PLOT_RIGHT = MARGIN.left + PLOT_W;
const PLOT_BOTTOM = MARGIN.top + PLOT_H;

function yTicks(max: number): number[] {
  if (max <= 0) return [0];
  const step = max <= 8 ? 1 : Math.ceil(max / 8);
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

/** "Factory North" → "North"; "Factory 0x378b…b03d" → "0x378b…b03d". */
function shortTierName(name: string): string {
  return name.startsWith("Factory ") ? name.slice("Factory ".length) : name;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function DemandChart({
  points,
  tiers,
}: {
  points: DemandPoint[];
  tiers: TierEligibility[];
}) {
  // X axis: uniform price ascending, proportional to actual price values.
  const prices = points.map((p) => Number(p.price));
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad = (maxP - minP) * 0.15 || maxP * 0.05 || 0.001;
  const x0 = minP - pad;
  const x1 = maxP + pad;
  // Y axis: cumulative escrowed orders (maxPrice >= price).
  const yMax = Math.max(...points.map((p) => p.orders), 1);

  const x = (price: number) =>
    MARGIN.left + ((price - x0) / (x1 - x0)) * PLOT_W;
  const y = (orders: number) => PLOT_BOTTOM - (orders / yMax) * PLOT_H;

  // Step line: the cumulative count drops exactly at each price point.
  const stepTop =
    `M ${MARGIN.left} ${y(points[0].orders)}` +
    points
      .slice(1)
      .map(
        (p, i) =>
          ` L ${x(Number(p.price))} ${y(points[i].orders)}` +
          ` L ${x(Number(p.price))} ${y(p.orders)}`,
      )
      .join("") +
    ` L ${PLOT_RIGHT} ${y(points[points.length - 1].orders)}`;
  const areaPath = `${stepTop} L ${PLOT_RIGHT} ${PLOT_BOTTOM} L ${MARGIN.left} ${PLOT_BOTTOM} Z`;

  // Tiers that share a MOQ would overlap exactly; fan them out a few px.
  const qtyTotals = new Map<number, number>();
  for (const tier of tiers) {
    qtyTotals.set(tier.quantity, (qtyTotals.get(tier.quantity) ?? 0) + 1);
  }
  const qtySeen = new Map<number, number>();
  const tierOffsets = tiers.map((tier) => {
    const total = qtyTotals.get(tier.quantity) ?? 1;
    const index = qtySeen.get(tier.quantity) ?? 0;
    qtySeen.set(tier.quantity, index + 1);
    return (index - (total - 1) / 2) * 5;
  });

  const ariaLabel =
    `Escrowed demand curve: ` +
    points.map((p) => `${p.orders} orders at ${p.price} test INJ`).join(", ") +
    `. Factory MOQ tiers: ` +
    tiers
      .map(
        (t) =>
          `${t.name} minimum ${t.quantity} at ${t.price} test INJ, ` +
          (t.feasible ? "viable" : "short of MOQ"),
      )
      .join("; ") +
    ".";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {/* horizontal grid + y tick labels */}
      {yTicks(yMax).map((tick) => (
        <g key={tick}>
          <line
            x1={MARGIN.left}
            x2={PLOT_RIGHT}
            y1={y(tick)}
            y2={y(tick)}
            className={tick === 0 ? "stroke-n-30" : "stroke-n-22"}
            strokeWidth={1}
          />
          <text
            x={MARGIN.left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={11}
            className="num fill-n-40"
          >
            {tick}
          </text>
        </g>
      ))}

      {/* axis captions */}
      <text x={MARGIN.left} y={14} fontSize={11} className="num fill-n-40">
        ESCROWED ORDERS
      </text>
      <text
        x={PLOT_RIGHT}
        y={H - 6}
        textAnchor="end"
        fontSize={11}
        className="num fill-n-40"
      >
        UNIFORM PRICE · TEST INJ
      </text>

      {/* funded demand: step area + outline */}
      <path d={areaPath} className="fill-azure" opacity={0.12} />
      <path d={stepTop} fill="none" className="stroke-azure" strokeWidth={2} />

      {/* price points: marker + order count + x tick label */}
      {points.map((p) => {
        const px = x(Number(p.price));
        const py = y(p.orders);
        return (
          <g key={p.price}>
            <circle cx={px} cy={py} r={3.5} className="fill-azure" />
            <text
              x={px}
              y={py - 10}
              textAnchor="middle"
              fontSize={11}
              className="num fill-n-64"
            >
              {p.orders}
            </text>
            <text
              x={px}
              y={PLOT_BOTTOM + 20}
              textAnchor="middle"
              fontSize={11}
              className="num fill-n-40"
            >
              {p.price}
            </text>
          </g>
        );
      })}

      {/* factory MOQ tiers: solid celadon = viable, dashed gray = short */}
      {tiers.map((tier, i) => {
        const tx = clamp(x(Number(tier.price)), MARGIN.left, PLOT_RIGHT);
        const ty = y(Math.min(tier.quantity, yMax)) + tierOffsets[i];
        const label = `${shortTierName(tier.name)} · MOQ ${tier.quantity} @ ${tier.price}`;
        return (
          <g key={tier.id}>
            <line
              x1={tx}
              x2={PLOT_RIGHT}
              y1={ty}
              y2={ty}
              strokeWidth={2}
              strokeDasharray={tier.feasible ? undefined : "5 4"}
              className={tier.feasible ? "stroke-celadon-dim" : "stroke-n-40"}
            />
            <rect
              x={tx - 4.5}
              y={ty - 4.5}
              width={9}
              height={9}
              className={tier.feasible ? "fill-celadon-dim" : "fill-n-40"}
            />
            <text
              x={Math.min(tx + 8, PLOT_RIGHT - 4)}
              y={tier.feasible ? ty - 7 : ty + 15}
              fontSize={11}
              className={`num ${tier.feasible ? "fill-celadon-dim" : "fill-n-40"}`}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DemandCurve() {
  const { status, view } = useCampaignData("success");
  const ready = status === "ready";
  const hasOrders = view.demandPoints.length > 0;

  return (
    <div className="reveal flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          kicker="Funded demand · the order book"
          title="The demand curve is real money"
          intro="Every point counts wallets that escrowed at least that price in the campaign contract. No likes, no sign-ups — locked test INJ only."
        />
        {ready ? (
          view.source === "onchain" ? (
            <SourceTag tone="onchain">Onchain</SourceTag>
          ) : (
            <SourceTag tone="offchain">Off-chain Demo</SourceTag>
          )
        ) : null}
      </div>

      {!ready ? (
        <div
          className="skeleton h-[340px] w-full"
          aria-label="Loading demand curve"
        />
      ) : !hasOrders ? (
        <div className="surface-flat flex min-h-[200px] items-center justify-center p-8 text-center text-13 text-n-52">
          No escrowed orders yet — the curve draws itself as soon as the first
          order lands.
        </div>
      ) : (
        <div className="surface p-4 sm:p-6">
          <DemandChart points={view.demandPoints} tiers={view.factoryTiers} />
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-11 text-n-52">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0 w-6 border-t-2 border-azure"
              />
              escrowed demand
            </span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0 w-6 border-t-2 border-celadon-dim"
              />
              viable tier (MOQ met)
            </span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0 w-6 border-t-2 border-dashed border-n-40"
              />
              tier short of MOQ
            </span>
          </div>
        </div>
      )}

      {ready && hasOrders ? (
        <>
          <p className="text-13 leading-relaxed text-n-52">
            Each bar counts wallets that escrowed at least this price. AI
            interest samples (72) are shown separately and never enter
            clearing.
          </p>
          <hr className="line" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <SourceTag tone="ai">AI Generated</SourceTag>
              <p className="text-13 text-n-52">
                {AI_SAMPLE_COUNT} interest samples · interviews and comments
              </p>
            </div>
            <div className="flex flex-wrap gap-[3px]" aria-hidden="true">
              {Array.from({ length: AI_SAMPLE_COUNT }, (_, i) => (
                <span key={i} className="h-1.5 w-1.5 bg-n-30" />
              ))}
            </div>
          </div>
        </>
      ) : null}

      <p className="font-mono text-11 text-n-40">Hackathon scaled test data</p>
    </div>
  );
}
