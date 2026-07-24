"use client";

import { useCampaign, useOrders } from "@/app/lib/chain/hooks";
import { CampaignId } from "@/app/lib/types";
import { copy } from "@/app/lib/copy";
import { formatInj } from "@/app/lib/chain/format";

const PRICE_TICKS = [0.017, 0.019, 0.021, 0.024, 0.026];

export function DemandCurve({ id }: { id: CampaignId }) {
  const campaign = useCampaign(id);
  const orders = useOrders(id);

  const orderList = orders.data ?? [];

  // Count orders with maxPrice >= each fixed tick.
  const points = PRICE_TICKS.map((price) => ({
    price,
    count: orderList.filter(
      (o) => Number(formatInj(o.maxPriceWei)) >= price,
    ).length,
  }));

  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];
  const clearingPriceNum = clearingPrice
    ? Number(formatInj(clearingPrice))
    : undefined;

  const maxCount = Math.max(1, ...points.map((p) => p.count), 5);
  const maxPrice = Math.max(...PRICE_TICKS);
  const minPrice = Math.min(...PRICE_TICKS);
  const priceRange = maxPrice - minPrice || 1;

  const width = 420;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 44, left: 40 };
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

  return (
    <section className="section">
      <h2 className="text-base font-semibold text-ink">{copy.curve.title}</h2>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[520px]"
          role="img"
          aria-label="Demand curve"
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

          {/* Data points */}
          {points.map((point, i) => {
            const x = xForPrice(point.price);
            const y = yForCount(point.count);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="var(--color-canvas)"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="num"
                  fontSize={11}
                  fill="var(--color-ink)"
                  fontWeight={500}
                >
                  {point.count}
                </text>
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
                x={xForPrice(clearingPriceNum) + 4}
                y={padding.top + 12}
                className="num"
                fontSize={10}
                fill="var(--color-success)"
                fontWeight={500}
              >
                {clearingPriceNum}
              </text>
            </g>
          ) : null}

          {/* X-axis labels */}
          {PRICE_TICKS.map((price) => (
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
            y={height - 8}
            textAnchor="end"
            fontSize={10}
            fill="var(--color-ink-3)"
          >
            Price (test INJ)
          </text>

          {/* Y-axis labels */}
          {Array.from({ length: maxCount + 1 }).map((_, i) => (
            <text
              key={`ylabel-${i}`}
              x={padding.left - 8}
              y={yForCount(i) + 3}
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
            x={10}
            y={padding.top}
            textAnchor="start"
            fontSize={10}
            fill="var(--color-ink-3)"
          >
            Orders
          </text>
        </svg>
      </div>
    </section>
  );
}
