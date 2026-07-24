"use client";

import { Check, AlertTriangle } from "lucide-react";
import { CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { useCampaign, useManifest } from "@/app/lib/chain/hooks";
import { copy } from "@/app/lib/copy";

export function ProductCard({ id }: { id: CampaignId }) {
  const campaign = useCampaign(id);
  const manifest = useManifest(id, campaign.manifestHash);
  const meta = CAMPAIGNS[id];

  const data = manifest.data;
  const specs = data?.manifest.specs ?? [];

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="relative aspect-[3/4] bg-surface lg:aspect-auto lg:w-[45%] lg:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.heroImage}
            alt={meta.product}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col p-5 lg:p-6">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink lg:text-[30px]">
              {meta.product}
            </h1>
            <p className="mt-1 text-sm text-ink-2">{meta.batchName}</p>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
              Specs
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {specs.map((spec, idx) => {
                const keyLabel =
                  (copy.product.spec.key as Record<string, string>)[spec.key] ??
                  spec.key;
                const valueLabel =
                  (copy.product.spec.value as Record<string, string>)[
                    spec.value
                  ] ?? spec.value;
                return (
                  <div key={idx}>
                    <dt className="text-xs text-ink-3">{keyLabel}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink">
                      {valueLabel}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="mt-auto border-t border-line pt-4 lg:pt-5">
            <p className="text-xs leading-relaxed text-ink-3">
              {copy.product.specsFrom}
            </p>
            {data ? (
              <p
                className={`mt-2 flex items-center gap-1.5 text-xs ${
                  data.hashOk ? "text-success" : "text-danger"
                }`}
              >
                {data.hashOk ? (
                  <Check size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}
                {data.hashOk ? copy.product.hashOk : copy.product.hashBad}
              </p>
            ) : manifest.isLoading ? (
              <p className="mt-2 text-xs text-ink-3">Loading manifest…</p>
            ) : manifest.isError ? (
              <p className="mt-2 text-xs text-danger">
                Failed to load manifest: {manifest.error?.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
