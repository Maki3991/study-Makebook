"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Wallet,
  Droplets,
  Gavel,
  Check,
  ArrowRight,
  Clock,
  Tag,
} from "lucide-react";
import { useCampaign, useNowSec } from "@/app/lib/chain/hooks";
import { CAMPAIGNS, DEPLOYED_CAMPAIGNS, type CampaignId } from "@/app/lib/chain/config";
import { ProvenanceTag } from "@/app/components/site/provenance-tag";
import { LiveTicker } from "@/app/components/site/live-ticker";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { FIXTURE_RESULT } from "@/lib/ai/fixture";
import { formatInj, getCountdownParts } from "@/app/lib/chain/format";
import { FAUCET_URL } from "@/app/lib/chain/config";

function StatusTag({
  state,
  deadline,
}: {
  state: ReturnType<typeof useCampaign>["state"];
  deadline: bigint | undefined;
}) {
  const copy = useCopy();
  const now = useNowSec();
  const isPastDeadline =
    state === "Open" && deadline !== undefined && now >= Number(deadline);

  let label: string = copy.status.open;
  let variant: string = "tag-success";

  if (state === "Succeeded" || state === "PaidOut") {
    label = copy.status.succeeded;
    variant = "tag-accent";
  } else if (state === "Failed") {
    label = copy.status.failed;
    variant = "tag-danger";
  } else if (isPastDeadline) {
    label = copy.status.closed;
    variant = "tag-neutral";
  }

  return (
    <span className={`tag ${variant}`}>
      {state === "Open" && !isPastDeadline ? <Clock size={12} /> : null}
      {label}
    </span>
  );
}

function BatchCard({ id }: { id: CampaignId }) {
  const copy = useCopy();
  const campaign = useCampaign(id);
  const now = useNowSec();
  const meta = CAMPAIGNS[id];

  const preview = campaign.preview;
  const feasible = preview?.[0];
  const clearingPrice = preview?.[3];
  const winnerCount = preview?.[4];

  return (
    <Link
      href={meta.route}
      className="surface group flex flex-col overflow-hidden transition-colors hover:border-rule-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.heroImage}
          alt={meta.product}
          className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">{meta.product}</h3>
            <p className="mt-0.5 text-sm text-ink-2">
              {meta.batchName}
              {id === "failure" && (
                <span className="ml-2 text-ink-3">({copy.batch.b.note})</span>
              )}
            </p>
          </div>
          <StatusTag state={campaign.state} deadline={campaign.deadline} />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-ink-2">
            {copy.batch.card.orders.replace(
              "{n}",
              campaign.ordersLength?.toString() ?? "—",
            )}
          </p>

          {campaign.state === "Open" &&
          campaign.deadline !== undefined &&
          !getCountdownParts(campaign.deadline, now).expired ? (
            <p className="text-sm text-ink-3">
              <Clock size={14} className="mr-1 inline-block" />
              {(() => {
                const parts = getCountdownParts(campaign.deadline, now);
                return copy.status.countdown
                  .replace("{dd}", String(parts.dd))
                  .replace("{hh}", String(parts.hh))
                  .replace("{mm}", String(parts.mm));
              })()}
            </p>
          ) : null}

          {campaign.state === "Open" ? (
            feasible ? (
              <p className="text-sm text-success">
                {copy.batch.card.preview
                  .replace("{price}", formatInj(clearingPrice ?? 0n))
                  .replace("{count}", winnerCount?.toString() ?? "—")}
              </p>
            ) : (
              <p className="text-sm text-warn">
                {copy.batch.card.previewInfeasible}
              </p>
            )
          ) : (
            <p className="text-sm text-ink-3">{copy.batch.card.closed}</p>
          )}
        </div>

        <div className="mt-auto pt-5">
          <span className="btn btn-secondary w-full">
            {copy.home.hero.cta}
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PreviewCard({
  title,
  image,
  commentIds,
}: {
  title: string;
  image: string;
  commentIds: string[];
}) {
  const copy = useCopy();

  return (
    <div className="surface flex flex-col overflow-hidden">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute left-3 top-3">
          <span className="tag tag-warn">
            <Tag size={12} />
            {copy.preview.status}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <ProvenanceTag type="AI GENERATED" />
        </div>
        <p className="mt-4 text-xs text-ink-3">
          {copy.preview.from.replace("{ids}", commentIds.join(", "))}
        </p>
      </div>
    </div>
  );
}

function StepBar() {
  const copy = useCopy();
  const { isConnected } = useAccount();

  const steps = [
    {
      number: 1,
      icon: Wallet,
      text: copy.home.steps.step1,
      done: isConnected,
    },
    {
      number: 2,
      icon: Droplets,
      text: copy.home.steps.step2,
      href: FAUCET_URL,
    },
    {
      number: 3,
      icon: Gavel,
      text: copy.home.steps.step3,
    },
  ];

  return (
    <div className="border-y border-line">
      <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {steps.map((step, idx) => {
          const content = (
            <div
              className={`flex items-start gap-4 px-5 py-5 md:px-6 md:py-6 ${
                step.done ? "bg-success-soft/40" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                  step.done
                    ? "bg-success text-paper-1"
                    : "bg-accent-soft text-accent"
                }`}
              >
                {step.done ? <Check size={20} /> : <step.icon size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-3">
                  {copy.home.steps.stepLabel.replace("{n}", String(step.number))}
                </p>
                <p className="mt-0.5 text-sm font-medium text-ink">
                  {step.text}
                </p>
              </div>
            </div>
          );

          if (step.href) {
            return (
              <a
                key={idx}
                href={step.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-colors hover:bg-surface"
              >
                {content}
              </a>
            );
          }
          return (
            <div
              key={idx}
              className={`${
                step.done ? "bg-success-soft/40" : ""
              }`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeroDimensionLines({ copy }: { copy: ReturnType<typeof useCopy> }) {
  const values = copy.product.spec.value as Record<string, string>;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Width line */}
      <div className="absolute left-[10%] right-[10%] top-[6%] h-px bg-rule-2">
        <div className="absolute left-0 top-[-2px] h-1 w-px bg-rule-2" />
        <div className="absolute right-0 top-[-2px] h-1 w-px bg-rule-2" />
      </div>
      <span className="num absolute left-1/2 top-[3%] -translate-x-1/2 text-micro text-ink-3">
        280 mm
      </span>

      {/* Height line */}
      <div className="absolute bottom-[10%] right-[6%] top-[10%] w-px bg-rule-2">
        <div className="absolute left-[-2px] top-0 h-px w-1 bg-rule-2" />
        <div className="absolute bottom-0 left-[-2px] h-px w-1 bg-rule-2" />
      </div>
      <span className="num absolute right-[2%] top-1/2 -translate-y-1/2 text-micro text-ink-3 [writing-mode:vertical-rl]">
        190 mm
      </span>

      {/* Feature callouts — use the same localized spec values as the product card. */}
      <span className="num absolute left-[8%] top-[28%] text-micro text-ink-3">
        8L
      </span>
      <span className="num absolute right-[10%] top-[62%] text-micro text-ink-3">
        {values.black ?? "Black"}
      </span>
      <span className="num absolute left-[10%] top-[78%] text-micro text-ink-3">
        {values.removable ?? "Removable"}
      </span>
    </div>
  );
}

export default function Home() {
  const copy = useCopy();

  return (
    <main className="page">
      {/* Hero */}
      <section className="section relative overflow-hidden">
        <div className="ambient-grid" aria-hidden="true" />
        <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h1 className="max-w-xl text-h1">{copy.home.hero.title}</h1>
            <p className="mt-5 max-w-lg text-body text-ink-2">
              {copy.home.hero.sub}
            </p>
            <Link
              href="/campaigns/success"
              className="btn btn-primary mt-8 inline-flex"
            >
              {copy.home.hero.cta}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/frame-01/hero.png"
              alt="FRAME-01 Camera Sling"
              className="h-full w-full object-cover object-center"
            />
            <HeroDimensionLines copy={copy} />
          </div>
        </div>
      </section>

      {/* Live on-chain ticker */}
      <LiveTicker />

      {/* Steps */}
      <section className="section">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-ink">
            {copy.home.steps.title}
          </h2>
        </div>
        <StepBar />
      </section>

      {/* Active batches */}
      <section className="section">
        <h2 className="text-base font-semibold text-ink">
          {copy.home.batches.title}
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPLOYED_CAMPAIGNS.map((id) => (
            <BatchCard key={id} id={id} />
          ))}
        </div>
      </section>

      {/* Preview — kept to 2 columns so the row is balanced */}
      <section className="section">
        <h2 className="text-base font-semibold text-ink">{copy.preview.title}</h2>
        <p className="mt-1 text-sm text-ink-2">{copy.preview.note}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <PreviewCard
            title={FIXTURE_RESULT.candidates[1].title}
            image="/products/preview/backpack-10l.png"
            commentIds={["c10"]}
          />
          <PreviewCard
            title={FIXTURE_RESULT.candidates[2].title}
            image="/products/preview/commuter-tote.png"
            commentIds={["c13"]}
          />
        </div>
      </section>
    </main>
  );
}
