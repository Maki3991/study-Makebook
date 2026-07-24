"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { createInjPublicClient } from "@/app/lib/chain/chain";
import { successDeployment } from "@/app/lib/chain/deployments";
import { campaignStateName, readOperator } from "@/app/lib/chain/reads";
import { useCampaignData } from "@/app/lib/chain/use-campaign";
import { shortenAddress } from "@/app/lib/chain/wallet";
import { CopyValue, Countdown, SourceTag } from "../site/primitives";

/**
 * Campaign hero: product story left, product visual right.
 *
 * Data sources:
 * - Live campaign state (state / deadline / order count / viable tier preview)
 *   comes from useCampaignData("success") — ONCHAIN when the RPC reads succeed,
 *   fixtures otherwise (the third source tag then flips to OFF-CHAIN DEMO).
 * - Title, positioning copy, and the spec strip are the human-confirmed
 *   manifest values (public/manifests/frame-01.json: capacity 8L, color black,
 *   insert removable) plus the loadout line from comment c01.
 */

const POSITIONING =
  "A crowdfunding campaign where your maximum price is escrowed on-chain, and a factory's MOQ quote decides production — by public rule, at a public deadline.";

const PRODUCT_SPECS = [
  { label: "Capacity", value: "8L" },
  { label: "Color", value: "Black" },
  { label: "Insert", value: "Removable" },
  { label: "Load", value: "1 body + 2 lenses" },
] as const;

export function CampaignHero() {
  const { status, view } = useCampaignData("success");
  const loading = status === "loading";

  // The currently winning tier, identified by the on-chain preview's
  // quoteId/tierIndex against buildTierEligibility's stable ids.
  const previewTierId = view.preview.feasible
    ? `quote-${Number(view.preview.quoteId)}-tier-${Number(view.preview.tierIndex)}`
    : null;
  const viableTier = previewTierId
    ? view.factoryTiers.find((tier) => tier.id === previewTierId)
    : undefined;

  // Operator address: read operator() from the contract on the onchain path;
  // on failure or fixture fallback use the deployments metadata (which may be
  // absent — the card then shows an honest placeholder instead of inventing
  // an address).
  const [operator, setOperator] = useState<Address | null>(null);
  const [operatorFailed, setOperatorFailed] = useState(false);

  useEffect(() => {
    if (status !== "ready" || view.source !== "onchain") return;
    let cancelled = false;
    readOperator(createInjPublicClient(), view.address)
      .then((value) => {
        if (!cancelled) {
          setOperator(value);
          setOperatorFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setOperatorFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status, view.source, view.address]);

  const operatorAddress =
    view.source === "onchain" ? operator : (successDeployment.operator ?? null);
  const operatorPending =
    status === "ready" &&
    view.source === "onchain" &&
    operator === null &&
    !operatorFailed;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      {/* -------------------------------------------------- copy + campaign state */}
      <div className="reveal flex min-w-0 flex-col gap-6">
        <p className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
          FRAME-01 · Production demand campaign
        </p>
        <h1 className="font-display text-40 leading-[1.1] font-medium text-n-92 lg:text-64">
          Black 8L Modular Camera Sling Bag
        </h1>
        <p className="max-w-[560px] text-17 leading-relaxed text-n-64">
          {POSITIONING}
        </p>

        {loading ? (
          <div
            className="skeleton h-[132px] w-full"
            role="status"
            aria-label="Loading campaign state"
          />
        ) : (
          <div className="surface reveal flex flex-col">
            <div className="grid grid-cols-3 divide-x divide-n-22">
              <div className="flex min-w-0 flex-col gap-1 p-4">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  Status
                </span>
                <span className="text-15 font-medium text-n-92">
                  {campaignStateName(view.state)}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1 p-4">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  Orders escrowed
                </span>
                <span className="num text-15 font-medium text-n-92">
                  {view.ordersLength}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1 p-4">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  Closes in
                </span>
                <Countdown
                  deadline={view.deadline}
                  className="text-15 font-medium text-n-92"
                />
              </div>
            </div>
            <hr className="line" />
            <p className="p-4 text-13 leading-relaxed text-n-64">
              {viableTier ? (
                <>
                  {`${viableTier.name}'s ${viableTier.quantity}-unit tier is currently viable — `}
                  {`${viableTier.eligible} orders qualify at ${viableTier.price} test INJ per unit.`}
                </>
              ) : view.ordersLength === 0 ? (
                "No orders yet — the first backers set the demand curve."
              ) : (
                "No factory tier currently reaches its MOQ — if that holds, every order is refunded in full."
              )}
            </p>
          </div>
        )}
        <p className="-mt-4 text-11 text-n-40">
          Campaign figures: Hackathon scaled test data.
        </p>

        {loading ? (
          <div className="skeleton h-5 w-72" aria-hidden="true" />
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <SourceTag tone="human">Human confirmed</SourceTag>
            <SourceTag tone="testnet">Testnet</SourceTag>
            {view.source === "onchain" ? (
              <SourceTag tone="onchain">Onchain</SourceTag>
            ) : (
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
            Manifest hash
          </span>
          <CopyValue value={view.manifestHash} />
        </div>

        {/* Operator card — who runs this batch. The named identity is a demo
            (OFF-CHAIN DEMO); the address itself is read from the contract. */}
        {loading ? (
          <div
            className="skeleton h-[108px] w-full max-w-[440px]"
            aria-hidden="true"
          />
        ) : (
          <div className="surface-flat flex w-full max-w-[440px] flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                Campaign Operator
              </span>
              <SourceTag tone="offchain">Off-chain demo</SourceTag>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-15 font-medium text-n-92">
                FRAME-01 Studio
              </span>
              {operatorAddress ? (
                <CopyValue
                  value={operatorAddress}
                  display={shortenAddress(operatorAddress)}
                />
              ) : operatorPending ? (
                <span
                  className="skeleton h-4 w-28"
                  aria-label="Loading operator address"
                />
              ) : (
                <span className="font-mono text-11 text-n-40">
                  address unavailable offline
                </span>
              )}
            </div>
            <p className="text-11 leading-relaxed text-n-40">
              Demo operator identity for the hackathon. The operator registers
              factory quotes and opens the batch — escrowed funds never touch
              this wallet.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a href="#pledge" className="btn btn-primary">
            Back this batch
          </a>
        </div>
      </div>

      {/* ------------------------------------------------------- product visual */}
      <figure className="reveal reveal-delay-1 flex min-w-0 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] border border-n-22 bg-n-08">
          <Image
            src="/frame-01-hero.webp"
            alt="FRAME-01 — black 8L modular camera sling bag with removable insert"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            // The vinext dev worker has no ASSETS binding, so the
            // /_vinext/image optimizer 500s; serve the file directly.
            unoptimized
            className="object-cover"
          />
        </div>
        <figcaption className="grid grid-cols-2 gap-px border border-t-0 border-n-22 bg-n-22 sm:grid-cols-4">
          {PRODUCT_SPECS.map((spec) => (
            <div
              key={spec.label}
              className="flex min-w-0 flex-col gap-0.5 bg-n-00 px-3 py-2.5"
            >
              <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                {spec.label}
              </span>
              <span className="num text-13 text-n-86">{spec.value}</span>
            </div>
          ))}
        </figcaption>
      </figure>
    </div>
  );
}
