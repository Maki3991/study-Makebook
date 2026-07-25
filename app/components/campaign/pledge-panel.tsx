"use client";

import { useState } from "react";
import Link from "next/link";
import { useChainId, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useCampaign,
  useMyOrder,
  useNowSec,
} from "@/app/lib/chain/hooks";
import { usePlaceOrder, useSettle } from "@/app/lib/chain/write";
import { CampaignId } from "@/app/lib/types";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { formatInj, explorerTx } from "@/app/lib/chain/format";
import { ExternalLink } from "lucide-react";
import { CAMPAIGNS, CHAIN_ID, MAX_ORDERS } from "@/app/lib/chain/config";
import { BackDrawer } from "./back-drawer";

export function PledgePanel({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingNetwork } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const campaign = useCampaign(id);
  const myOrderQuery = useMyOrder(id, address);
  const placeOrder = usePlaceOrder(id);
  const settle = useSettle(id);

  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const state = campaign.state;
  const deadline = campaign.deadline;
  const ordersLength = campaign.ordersLength;
  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];
  // Spec 009 §5-8: chips come from per-batch config (the failure batch's chips
  // are all below its retail clearing price).
  const chips = CAMPAIGNS[id].suggestedPrices;
  const isWrongNetwork = isConnected && chainId !== CHAIN_ID;

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
    setInputError(null);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (inputError) setInputError(null);
  };

  const handleSubmit = () => {
    if (!input || parseFloat(input) <= 0) {
      setInputError(copy.pledge.inputError);
      return;
    }
    setInputError(null);
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    await placeOrder.placeOrder(input);
  };

  const handleSettle = async () => {
    await settle.settle();
  };

  // Spec 009 §5-4: gate write actions behind wallet connection / correct
  // network up front, instead of letting the tx fail into a generic retry.
  const connectCta = (
    <button
      type="button"
      onClick={() => openConnectModal?.()}
      className="btn btn-primary w-full"
    >
      {copy.pledge.connectCta}
    </button>
  );
  const switchNetworkCta = (
    <button
      type="button"
      disabled={isSwitchingNetwork}
      onClick={() => switchChain?.({ chainId: CHAIN_ID })}
      className="btn btn-danger w-full"
    >
      {isSwitchingNetwork
        ? copy.global.wallet.switching
        : copy.global.wallet.wrongNetwork}
    </button>
  );

  let cta: React.ReactNode = null;
  if (isSettled) {
    cta = (
      <button type="button" className="btn btn-secondary w-full" disabled>
        {copy.pledge.resultCta}
      </button>
    );
  } else if (isPastDeadline) {
    cta = !isConnected ? (
      connectCta
    ) : isWrongNetwork ? (
      switchNetworkCta
    ) : (
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
  } else if (!isConnected) {
    cta = connectCta;
  } else if (isWrongNetwork) {
    cta = switchNetworkCta;
  } else {
    cta = (
      <button
        type="button"
        onClick={handleSubmit}
        className="btn btn-primary w-full"
      >
        {copy.pledge.cta}
      </button>
    );
  }

  return (
    <>
      <section className="surface p-5 lg:p-6">
        <h2 className="text-h2 text-ink">{copy.pledge.title}</h2>

        {!myOrder && !isSettled && !isPastDeadline && !isFull ? (
          <div className="mt-5">
            <label
              htmlFor="max-price"
              className="text-body font-medium text-ink-2"
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
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.000"
                className="num text-body text-ink"
              />
              <span className="text-body text-ink-3">test INJ</span>
            </div>

            <div className="mt-4">
              <p className="text-micro text-ink-3">{copy.pledge.chipHint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {chips.map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => handleChip(price)}
                    data-selected={input === price ? "true" : "false"}
                    aria-pressed={input === price}
                    className="chip"
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>

            {inputNum > 0 && (
              <p
                className={`mt-4 text-body font-medium ${
                  wouldClear ? "text-success" : "text-warn"
                }`}
              >
                {wouldClear ? copy.pledge.feasibleNow : copy.pledge.infeasibleNow}
              </p>
            )}
            {inputError && (
              <p role="alert" className="mt-4 text-body text-danger">
                {inputError}
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-5">{cta}</div>

        {settle.result && (
          <a
            href={explorerTx(settle.result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-body text-accent hover:underline"
          >
            {copy.orders.viewTx}
            <ExternalLink size={14} />
          </a>
        )}

        {placeOrder.error && (
          <p role="alert" className="mt-4 text-body text-danger">
            {placeOrder.error}
          </p>
        )}
        {settle.error && (
          <p role="alert" className="mt-4 text-body text-danger">
            {settle.error}
          </p>
        )}
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
