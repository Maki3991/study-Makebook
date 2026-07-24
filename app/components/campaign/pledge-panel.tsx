"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useCampaign,
  useMyOrder,
  useNowSec,
} from "@/app/lib/chain/hooks";
import { usePlaceOrder, useSettle } from "@/app/lib/chain/write";
import { CampaignId } from "@/app/lib/types";
import { copy } from "@/app/lib/copy";
import { formatInj } from "@/app/lib/chain/format";
import { MAX_ORDERS } from "@/app/lib/chain/config";
import { BackDrawer } from "./back-drawer";

const CHIPS = ["0.019", "0.024", "0.026"];

export function PledgePanel({ id }: { id: CampaignId }) {
  const { address } = useAccount();
  const campaign = useCampaign(id);
  const myOrderQuery = useMyOrder(id, address);
  const placeOrder = usePlaceOrder(id);
  const settle = useSettle(id);

  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const state = campaign.state;
  const deadline = campaign.deadline;
  const ordersLength = campaign.ordersLength;
  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];

  const myOrder = myOrderQuery.data as
    | { buyer: `0x${string}`; variantHash: `0x${string}`; maxPriceWei: bigint; refundClaimed: boolean }
    | undefined;

  const now = useNowSec();
  const isPastDeadline =
    state === "Open" && deadline !== undefined && now >= Number(deadline);
  const isSettled = state === "Succeeded" || state === "Failed" || state === "PaidOut";
  const isFull = ordersLength !== undefined && ordersLength >= BigInt(MAX_ORDERS);

  const inputNum = parseFloat(input || "0");
  const clearingNum = clearingPrice ? Number(formatInj(clearingPrice)) : undefined;
  const wouldClear = Boolean(
    feasible && clearingNum !== undefined && inputNum >= clearingNum && inputNum > 0,
  );

  const handleChip = (price: string) => {
    setInput(price);
  };

  const handleSubmit = () => {
    if (!input || parseFloat(input) <= 0) return;
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    await placeOrder.placeOrder(input);
  };

  const handleSettle = async () => {
    await settle.settle();
  };

  let cta: React.ReactNode = null;
  if (isSettled) {
    cta = (
      <button type="button" className="btn btn-secondary w-full" disabled>
        {copy.pledge.resultCta}
      </button>
    );
  } else if (isPastDeadline) {
    cta = (
      <button
        type="button"
        onClick={handleSettle}
        disabled={settle.stage === "signing" || settle.stage === "confirming"}
        className="btn btn-primary w-full"
      >
        {settle.stage === "signing"
          ? copy.drawer.signing
          : settle.stage === "confirming"
            ? copy.drawer.confirming
            : copy.pledge.settleCta}
      </button>
    );
  } else if (isFull) {
    cta = (
      <button type="button" className="btn btn-secondary w-full" disabled>
        {copy.pledge.full}
      </button>
    );
  } else if (myOrder) {
    cta = (
      <Link href="/orders" className="btn btn-secondary w-full">
        {copy.pledge.ordered.replace(
          "{price}",
          formatInj(myOrder.maxPriceWei),
        )}
      </Link>
    );
  } else {
    cta = (
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!input || parseFloat(input) <= 0}
        className="btn btn-primary w-full"
      >
        {copy.pledge.cta}
      </button>
    );
  }

  return (
    <>
      <section className="surface p-5 lg:p-6">
        <h2 className="text-base font-semibold text-ink">{copy.pledge.title}</h2>

        {!myOrder && !isSettled && !isPastDeadline && !isFull ? (
          <div className="mt-5">
            <label
              htmlFor="max-price"
              className="text-sm font-medium text-ink-2"
            >
              {copy.pledge.inputLabel}
            </label>
            <div className="input mt-1.5">
              <input
                id="max-price"
                type="number"
                step="0.001"
                min="0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="0.000"
                className="num text-base text-ink"
              />
              <span className="text-sm text-ink-3">test INJ</span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-ink-3">{copy.pledge.chipHint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CHIPS.map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => handleChip(price)}
                    data-selected={input === price ? "true" : "false"}
                    className="chip"
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>

            {inputNum > 0 && (
              <p
                className={`mt-4 text-sm font-medium ${
                  wouldClear ? "text-success" : "text-warn"
                }`}
              >
                {wouldClear ? copy.pledge.feasibleNow : copy.pledge.infeasibleNow}
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-5">{cta}</div>

        {placeOrder.error && (
          <p className="mt-4 text-sm text-danger">{placeOrder.error}</p>
        )}
        {settle.error && <p className="mt-4 text-sm text-danger">{settle.error}</p>}
      </section>

      <BackDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        id={id}
        maxPrice={input}
        stage={placeOrder.stage}
        error={placeOrder.error}
        result={placeOrder.result}
        onSubmit={handleDrawerSubmit}
        onReset={placeOrder.reset}
      />
    </>
  );
}
