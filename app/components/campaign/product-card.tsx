"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CAMPAIGNS, BATCH_COPY_KEY, type CampaignId } from "@/app/lib/chain/config";
import { useCampaign, useManifest } from "@/app/lib/chain/hooks";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { ProvenanceTag } from "@/app/components/site/provenance-tag";

function ProductDimensionLines({
  id,
  batchName,
  copy,
}: {
  id: CampaignId;
  batchName: string;
  copy: ReturnType<typeof useCopy>;
}) {
  if (id === "bracelet") return null;

  const values = copy.product.spec.value as Record<string, string>;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Width line */}
      <div className="absolute left-[8%] right-[8%] top-[6%] h-px bg-rule-2">
        <div className="absolute left-0 top-[-2px] h-1 w-px bg-rule-2" />
        <div className="absolute right-0 top-[-2px] h-1 w-px bg-rule-2" />
      </div>

      {/* Height line */}
      <div className="absolute bottom-[8%] right-[6%] top-[8%] w-px bg-rule-2">
        <div className="absolute left-[-2px] top-0 h-px w-1 bg-rule-2" />
        <div className="absolute bottom-0 left-[-2px] h-px w-1 bg-rule-2" />
      </div>

      {/* Labels */}
      <span className="num absolute left-[8%] top-[9%] text-label text-ink-3">
        8L
      </span>
      <span className="num absolute right-[8%] top-[36%] text-label text-ink-3">
        {values.black ?? "Black"}
      </span>
      <span className="num absolute left-[10%] top-[58%] text-label text-ink-3">
        {values.removable ?? "Removable"}
      </span>
      <span className="num absolute right-[10%] top-[78%] text-label text-ink-3">
        {batchName}
      </span>
    </div>
  );
}

export function ProductCard({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const manifest = useManifest(id, campaign.manifestHash);
  const meta = CAMPAIGNS[id];
  // Spec 009 §2.2: the display name comes from the copy dictionary — the
  // bracelet batch is 社区批次, no longer a second "Batch A".
  const batchName = copy.batch[BATCH_COPY_KEY[id]].name;

  const data = manifest.data;
  const specs = data?.manifest.specs ?? [];

  // Expandable trust panel (spec 008 §6 Owner-B #3): presentation only — the
  // manifest/hash verification logic above is untouched. Opening fades the
  // panel in over 150ms (opacity); closing is immediate.
  const [trustOpen, setTrustOpen] = useState(false);

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
          <ProductDimensionLines id={id} batchName={batchName} copy={copy} />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div>
            <h1 className="text-h2 text-ink lg:text-h1">
              {meta.product}
            </h1>
            <p className="num mt-1 text-body text-ink-2">{batchName}</p>
          </div>

          <div className="mt-6">
            <p className="text-label text-ink-3">
              {copy.product.specsTitle}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 xl:grid-cols-3">
              {specs.map((spec, idx) => {
                const keyLabel =
                  (copy.product.spec.key as Record<string, string>)[spec.key] ??
                  spec.key;
                const valueLabel =
                  (copy.product.spec.value as Record<string, string>)[
                    spec.value
                  ] ?? spec.value;
                // Long prose values (bracelet manifest) take a full row —
                // a 118px grid track shreds them into one-word lines.
                const fullRow = valueLabel.length > 24;
                return (
                  <div key={idx} className={fullRow ? "col-span-full" : ""}>
                    <dt className="text-micro text-ink-3">{keyLabel}</dt>
                    {/* N-7: spec values are mono + tabular like every other
                        numeric/factual readout on the page. */}
                    <dd className="num mt-0.5 text-body font-medium text-ink">
                      {valueLabel}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {/* Spec 009 §6-2: FRAME-01 detail shots under the spec grid.
                Bracelet skips this — its detail set is a different product.
                aspect + intrinsic dimensions keep the boxes from collapsing. */}
            {id !== "bracelet" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/products/frame-01/detail-strap.png"
                  alt={copy.product.detailStrapAlt}
                  width={896}
                  height={1184}
                  className="aspect-[3/4] w-full object-cover object-center"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/products/frame-01/detail-insert.png"
                  alt={copy.product.detailInsertAlt}
                  width={896}
                  height={1184}
                  className="aspect-[3/4] w-full object-cover object-center"
                />
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-line pt-4 lg:pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <ProvenanceTag type="AI GENERATED" />
              <ProvenanceTag type="HUMAN CONFIRMED" />
              {data ? (
                <>
                  {data.hashOk ? (
                    <ProvenanceTag type="ONCHAIN" />
                  ) : (
                    <p className="flex items-center gap-1.5 text-micro text-danger">
                      <AlertTriangle size={14} />
                      {copy.product.hashBad}
                    </p>
                  )}
                </>
              ) : manifest.isLoading ? (
                <span className="text-micro text-ink-3">
                  {copy.product.manifestLoading}
                </span>
              ) : manifest.isError ? (
                <span className="text-micro text-danger">
                  {copy.product.manifestError}
                </span>
              ) : null}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setTrustOpen((v) => !v)}
                aria-expanded={trustOpen}
                className="btn btn-secondary"
              >
                {trustOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                {copy.product.trust.toggle}
              </button>

              {trustOpen ? (
                <div className="animate-fade-in mt-3 border border-line p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-label text-ink-3">
                        {copy.product.trust.manifestTitle}
                      </p>
                      <pre className="num mt-2 max-h-64 overflow-auto bg-canvas p-3 text-micro text-ink-2">
                        {data
                          ? JSON.stringify(data.manifest, null, 2)
                          : manifest.isError
                            ? copy.product.manifestError
                            : copy.product.manifestLoading}
                      </pre>
                    </div>

                    <div>
                      <p className="text-micro text-ink-2">
                        {copy.product.trust.canonicalNote}
                      </p>
                      <pre className="num mt-1 overflow-x-auto text-micro text-ink">
                        {data?.canonicalHash ?? "—"}
                      </pre>
                    </div>

                    <div>
                      <p className="text-micro text-ink-2">
                        {copy.product.trust.onchainNote}
                      </p>
                      <pre className="num mt-1 overflow-x-auto text-micro text-ink">
                        {campaign.manifestHash ?? "—"}
                      </pre>
                    </div>

                    <div className="flex items-center gap-2 text-body font-medium">
                      {data ? (
                        data.hashOk ? (
                          <>
                            <Check size={16} className="text-success" />
                            <span className="text-success">
                              {copy.product.trust.match}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} className="text-danger" />
                            <span className="text-danger">
                              {copy.product.hashBad}
                            </span>
                          </>
                        )
                      ) : manifest.isLoading ? (
                        <span className="text-ink-3">
                          {copy.product.manifestLoading}
                        </span>
                      ) : manifest.isError ? (
                        <>
                          <AlertTriangle size={16} className="text-danger" />
                          <span className="text-danger">
                            {copy.product.manifestError}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
