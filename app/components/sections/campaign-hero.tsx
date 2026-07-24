"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { createInjPublicClient } from "@/app/lib/chain/chain";
import { successDeployment } from "@/app/lib/chain/deployments";
import { readOperator } from "@/app/lib/chain/reads";
import { useCampaignData } from "@/app/lib/chain/use-campaign";
import { shortenAddress } from "@/app/lib/chain/wallet";
import { useCampaignStateLabel, useLang } from "@/app/lib/i18n";
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
 *   Spec VALUES stay untranslated data; only the UI labels go through t().
 */

const PRODUCT_SPECS = [
  { labelKey: "hero.spec.capacity", value: "8L" },
  { labelKey: "hero.spec.color", value: "Black" },
  { labelKey: "hero.spec.insert", value: "Removable" },
  { labelKey: "hero.spec.load", value: "1 body + 2 lenses" },
] as const;

export function CampaignHero() {
  const { status, view } = useCampaignData("success");
  const { t } = useLang();
  const stateLabel = useCampaignStateLabel();
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
          {t("hero.kicker")}
        </p>
        <h1 className="font-display text-40 leading-[1.1] font-medium text-n-92 lg:text-64">
          Black 8L Modular Camera Sling Bag
        </h1>
        <p className="max-w-[560px] text-17 leading-relaxed text-n-64">
          {t("hero.positioning")}
        </p>

        {loading ? (
          <div
            className="skeleton h-[132px] w-full"
            role="status"
            aria-label={t("hero.loadingAria")}
          />
        ) : (
          <div className="surface reveal flex flex-col">
            <div className="grid grid-cols-3 divide-x divide-n-22">
              <div className="flex min-w-0 flex-col gap-1 p-4">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  {t("hero.status")}
                </span>
                <span className="text-15 font-medium text-n-92">
                  {stateLabel(view.state)}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1 p-4">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  {t("common.ordersEscrowed")}
                </span>
                <span className="num text-15 font-medium text-n-92">
                  {view.ordersLength}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1 p-4">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  {t("common.closesIn")}
                </span>
                <Countdown
                  deadline={view.deadline}
                  className="text-15 font-medium text-n-92"
                />
              </div>
            </div>
            <hr className="line" />
            <p className="p-4 text-13 leading-relaxed text-n-64">
              {viableTier
                ? t("hero.tierViable", {
                    name: viableTier.name,
                    quantity: viableTier.quantity,
                    eligible: viableTier.eligible,
                    price: viableTier.price,
                  })
                : view.ordersLength === 0
                  ? t("hero.noOrders")
                  : t("hero.noMoq")}
            </p>
          </div>
        )}
        <p className="-mt-4 text-11 text-n-40">
          {t("hero.figuresNote")}
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
            {t("common.manifestHash")}
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
                {t("hero.operator")}
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
                  aria-label={t("hero.operatorLoadingAria")}
                />
              ) : (
                <span className="font-mono text-11 text-n-40">
                  {t("hero.operatorOffline")}
                </span>
              )}
            </div>
            <p className="text-11 leading-relaxed text-n-40">
              {t("hero.operatorNote")}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a href="#pledge" className="btn btn-primary">
            {t("common.backThisBatch")}
          </a>
        </div>
      </div>

      {/* ------------------------------------------------------- product visual */}
      <figure className="reveal reveal-delay-1 flex min-w-0 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] border border-n-22 bg-n-08">
          <Image
            src="/frame-01-hero.webp"
            alt={t("hero.imgAlt")}
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
              key={spec.labelKey}
              className="flex min-w-0 flex-col gap-0.5 bg-n-00 px-3 py-2.5"
            >
              <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                {t(spec.labelKey)}
              </span>
              <span className="num text-13 text-n-86">{spec.value}</span>
            </div>
          ))}
        </figcaption>
      </figure>
    </div>
  );
}
