"use client";

import { useEffect, useState } from "react";
import { useCampaign, useOrders, eligibleCount } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj } from "@/app/lib/chain/format";

export function DemandCurve({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const orders = useOrders(id);

  const orderList = orders.data ?? [];

  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];
  const previewWinnerCount = preview?.[4];
  const clearingPriceNum = clearingPrice
    ? Number(formatInj(clearingPrice))
    : undefined;
  const winningQuoteId = campaign.winningQuoteId;
  const winningTierIndex = campaign.winningTierIndex;

  const quotes = campaign.quotes ?? [];

  // P1 (spec 008): eligibility is priced at retail = factory tier price ×
  // (10000 + marginBps) / 10000 (floor), wei-exact with the contract. Falls
  // back to factory pricing on P0 batches where marginBps is not readable.
  const marginBps = campaign.marginBps;
  const retailPriceWei = (unitPriceWei: bigint): bigint =>
    marginBps === undefined
      ? unitPriceWei
      : (unitPriceWei * (10000n + BigInt(marginBps))) / 10000n;

  // X-axis ticks derive from real data: order maxPrices ∪ retail tier prices
  // ∪ clearing price (when feasible), deduped and sorted. The domain then
  // always covers the clearing line and the factory tier annotations.
  const tickSet = new Set<number>();
  for (const o of orderList) {
    tickSet.add(Number(formatInj(o.maxPriceWei)));
  }
  for (const quote of quotes) {
    for (const tier of quote.tiers) {
      tickSet.add(Number(formatInj(retailPriceWei(tier.unitPriceWei))));
    }
  }
  if (feasible && clearingPriceNum !== undefined) {
    tickSet.add(clearingPriceNum);
  }
  const priceTicks = Array.from(tickSet).sort((a, b) => a - b);

  // Count orders with maxPrice >= each tick.
  const points = priceTicks.map((price) => ({
    price,
    count: orderList.filter(
      (o) => Number(formatInj(o.maxPriceWei)) >= price,
    ).length,
  }));

  const maxCount = Math.max(1, ...points.map((p) => p.count), 5);
  const maxPrice = priceTicks.length > 0 ? priceTicks[priceTicks.length - 1] : 1;
  const minPrice = priceTicks.length > 0 ? priceTicks[0] : 0;
  const priceRange = maxPrice - minPrice || 1;

  const width = 520;
  const height = 280;
  const padding = { top: 28, right: 16, bottom: 56, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xForPrice = (price: number) =>
    padding.left + ((price - minPrice) / priceRange) * chartWidth;

  const yForCount = (count: number) =>
    padding.top + chartHeight - (count / maxCount) * chartHeight;

  // Build right-continuous step path.
  let pathD = "";
  points.forEach((point, i) => {
    const x = xForPrice(point.price);
    const y = yForCount(point.count);
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${yForCount(points[i - 1].count)}`;
      pathD += ` L ${x} ${y}`;
    }
  });

  // Factory tier lines: horizontal at the eligible order count, priced at the
  // retail tier price (P1) so the annotation matches buyer-side eligibility.
  const tierLines = quotes.flatMap((quote) =>
    quote.tiers.map((tier, tierIdx) => {
      const retailWei = retailPriceWei(tier.unitPriceWei);
      const eligible = eligibleCount(orderList, retailWei);
      const isFeasible = eligible >= tier.minQty;
      const isWinner =
        winningQuoteId !== undefined &&
        winningTierIndex !== undefined &&
        BigInt(quote.quoteId) === winningQuoteId &&
        BigInt(tierIdx) === winningTierIndex;
      return {
        quoteId: quote.quoteId,
        tierIdx,
        unitPriceWei: retailWei,
        unitPrice: Number(formatInj(retailWei)),
        minQty: tier.minQty,
        eligible,
        isFeasible,
        isWinner,
        label: quote.quoteId === 0 ? "Factory A" : "Factory B",
      };
    }),
  );

  // Hover tooltip + data-change feedback (spec 008 §6 Owner-B #2). The only
  // motion allowed here: points that appear after the first render fade in
  // over 200ms (opacity). No entrance animation for the initial dataset.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [enteredPrices, setEnteredPrices] = useState<Set<number>>(
    () => new Set(points.map((p) => p.price)),
  );
  useEffect(() => {
    const unseen = points
      .map((p) => p.price)
      .filter((price) => !enteredPrices.has(price));
    if (unseen.length === 0) return;
    const id = requestAnimationFrame(() => {
      setEnteredPrices((prev) => {
        const next = new Set(prev);
        for (const price of unseen) next.add(price);
        return next;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [points, enteredPrices]);

  // Tooltip content derives from the same preview/orders data as the chart.
  // A point clears when the batch is feasible and its price reaches the
  // preview clearing price (same rule as the pledge panel's wouldClear).
  const hovered = hoveredIndex !== null ? (points[hoveredIndex] ?? null) : null;
  const hoveredX = hovered ? xForPrice(hovered.price) : 0;
  const hoveredY = hovered ? yForCount(hovered.count) : 0;
  let tooltipStatus: { text: string; className: string } | null = null;
  if (hovered && feasible !== undefined) {
    if (!feasible || clearingPriceNum === undefined) {
      tooltipStatus = {
        text: copy.curve.tooltip.infeasible,
        className: "text-warn",
      };
    } else if (hovered.price >= clearingPriceNum) {
      tooltipStatus = {
        text: copy.curve.tooltip.clears,
        className: "text-success",
      };
    } else {
      tooltipStatus = {
        text: copy.curve.tooltip.below,
        className: "text-warn",
      };
    }
  }

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-ink">{copy.curve.title}</h2>

      <div className="mt-4 overflow-x-auto">
        <div className="relative max-w-[600px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[600px]"
          role="img"
          aria-label={copy.curve.title}
        >
          {/* Grid lines for counts */}
          {Array.from({ length: maxCount + 1 }).map((_, i) => {
            const y = yForCount(i);
            return (
              <line
                key={`grid-${i}`}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--color-line)"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            );
          })}

          {/* Factory tier horizontal lines at the eligible order count */}
          {tierLines.map((tier) => {
            const y = yForCount(tier.eligible);
            return (
              <g key={`tier-${tier.quoteId}-${tier.tierIdx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={
                    tier.isWinner
                      ? "var(--color-success)"
                      : tier.isFeasible
                        ? "var(--color-success)"
                        : "var(--color-ink-3)"
                  }
                  strokeWidth={tier.isWinner ? 3 : 1.5}
                  strokeDasharray={tier.isFeasible ? "none" : "4 4"}
                  opacity={tier.isWinner ? 1 : 0.7}
                />
                <text
                  x={width - padding.right - 4}
                  y={y + 12}
                  textAnchor="end"
                  className="num"
                  fontSize={10}
                  fill={
                    tier.isWinner
                      ? "var(--color-success)"
                      : tier.isFeasible
                        ? "var(--color-success)"
                        : "var(--color-ink-3)"
                  }
                  fontWeight={tier.isWinner ? 600 : 400}
                >
                  {tier.label} {tier.unitPrice}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="var(--color-ink-2)"
            strokeWidth={1}
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="var(--color-ink-2)"
            strokeWidth={1}
          />

          {/* Step path */}
          {points.length > 0 && points.some((p) => p.count > 0) && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2}
            />
          )}

          {/* Data points and labels */}
          {points.map((point, i) => {
            const x = xForPrice(point.price);
            const y = yForCount(point.count);
            // Label above the point; nudge rightward for the first point so it
            // does not overlap the Y-axis title.
            const labelX = i === 0 ? x + 14 : x;
            const anchor = i === 0 ? "start" : "middle";
            const labelY = y - 10;
            return (
              <g
                key={point.price}
                style={{
                  opacity: enteredPrices.has(point.price) ? 1 : 0,
                  transition: "opacity 200ms ease-out",
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="var(--color-canvas)"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  className="num"
                  fontSize={11}
                  fill="var(--color-ink)"
                  fontWeight={500}
                >
                  {point.count}
                </text>
                {/* Invisible hit area driving the HTML tooltip below */}
                <circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill="var(--color-canvas)"
                  fillOpacity={0}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Clearing price line */}
          {feasible && clearingPriceNum !== undefined ? (
            <g>
              <line
                x1={xForPrice(clearingPriceNum)}
                y1={padding.top}
                x2={xForPrice(clearingPriceNum)}
                y2={height - padding.bottom}
                stroke="var(--color-success)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <text
                x={
                  xForPrice(clearingPriceNum) > width - padding.right - 190
                    ? xForPrice(clearingPriceNum) - 6
                    : xForPrice(clearingPriceNum) + 6
                }
                y={padding.top + 10}
                textAnchor={
                  xForPrice(clearingPriceNum) > width - padding.right - 190
                    ? "end"
                    : "start"
                }
                className="num"
                fontSize={10}
                fill="var(--color-success)"
                fontWeight={600}
              >
                {copy.curve.clearingLabel
                  .replace("{price}", String(clearingPriceNum))
                  .replace("{count}", previewWinnerCount?.toString() ?? "—")}
              </text>
            </g>
          ) : null}

          {/* X-axis labels */}
          {priceTicks.map((price) => (
            <text
              key={price}
              x={xForPrice(price)}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              className="num"
              fontSize={11}
              fill="var(--color-ink-2)"
            >
              {price}
            </text>
          ))}

          {/* X-axis title */}
          <text
            x={width - padding.right}
            y={height - 12}
            textAnchor="end"
            fontSize={11}
            fill="var(--color-ink-3)"
          >
            {copy.curve.xAxis}
          </text>

          {/* Y-axis labels */}
          {Array.from({ length: maxCount + 1 }).map((_, i) => (
            <text
              key={`ylabel-${i}`}
              x={padding.left - 10}
              y={yForCount(i) + 4}
              textAnchor="end"
              className="num"
              fontSize={11}
              fill="var(--color-ink-3)"
            >
              {i}
            </text>
          ))}

          {/* Y-axis title */}
          <text
            x={padding.left}
            y={padding.top - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-ink-3)"
          >
            {copy.curve.yAxis}
          </text>
        </svg>

        {/* Hover tooltip: HTML overlay positioned over the SVG point. Stays
            inside the chart box (clamped translate, flips below near the top)
            so the scrollable wrapper never gains scrollbars. */}
        {hovered ? (
          <div
            className="surface pointer-events-none absolute px-3 py-2"
            style={{
              left: `${(hoveredX / width) * 100}%`,
              top: `${(hoveredY / height) * 100}%`,
              transform: `translate(${
                hoveredX < 100 ? "-15%" : hoveredX > width - 100 ? "-85%" : "-50%"
              }, ${hoveredY > 84 ? "calc(-100% - 10px)" : "10px"})`,
            }}
          >
            <p className="num text-xs font-medium text-ink">
              {copy.curve.tooltip.price.replace("{price}", String(hovered.price))}
            </p>
            <p className="num mt-0.5 text-xs text-ink-2">
              {copy.curve.tooltip.orders.replace("{count}", String(hovered.count))}
            </p>
            {tooltipStatus ? (
              <p className={`mt-0.5 text-xs ${tooltipStatus.className}`}>
                {tooltipStatus.text}
              </p>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-4 bg-accent" />
          <span>{copy.curve.legendDemand}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-success" />
          <span>{copy.curve.legendClearing}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0 w-4 border-t border-success" />
          <span>{copy.curve.legendFeasible}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0 w-4 border-t border-dashed border-ink-3" />
          <span>{copy.curve.legendInfeasible}</span>
        </div>
      </div>
    </section>
  );
}
