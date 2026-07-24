"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { successDeployment } from "@/app/lib/chain/deployments";
import {
  compileCommentsViaApi,
  defaultComments,
  type CommentInput,
  type CompileOutput,
  type CompileStats,
  type ProductCandidate,
} from "@/app/lib/compile-client";
import manifestJson from "@/public/manifests/frame-01.json";
import { useLang } from "@/app/lib/i18n";
import { CopyValue, SectionHead, SourceTag } from "../site/primitives";

/**
 * "How this product was born": Comments → AI compile → Human confirm → Manifest hash.
 *
 * Data sources:
 * - AI candidate cards: POST /api/compile via compileCommentsViaApi() with the
 *   default 20-comment fixture input — AI GENERATED, plus a Fixture mark and
 *   the degradation reason whenever the route reports fixture:true.
 * - If the route itself is unreachable (non-200 / network / timeout), the
 *   section falls back to the static snapshot below (marked Fixture), because
 *   lib/ai/fixture.ts is a server-only module and must not be imported here.
 * - Confirmed spec sheet: public/manifests/frame-01.json (static import) +
 *   the deployment manifest hash from app/lib/chain/deployments.ts — HUMAN CONFIRMED.
 */

interface ConfirmedManifest {
  schemaVersion: string;
  campaignCode: string;
  title: string;
  specs: Array<{ key: string; value: string; sourceCommentIds: string[] }>;
  unknowns: string[];
  aiGenerated: boolean;
  humanConfirmedAt: string;
}

const confirmedManifest = manifestJson as ConfirmedManifest;

/**
 * Static snapshot of lib/ai/fixture.ts FIXTURE_RESULT.candidates (deterministic
 * fallback output). Rendered only when /api/compile cannot be reached at all.
 */
const STATIC_FIXTURE_CANDIDATES: ProductCandidate[] = [
  {
    schemaVersion: "makebook.candidate.v1",
    title: "Black 8L Modular Camera Sling Bag",
    problem:
      "Photography commuters cannot find a sling that nails capacity, looks, and insert flexibility at once",
    targetUser:
      "Hobbyist photographers shooting street and commuting daily in the city",
    specs: [
      { key: "capacity", value: "8L", sourceCommentIds: ["c01", "c03", "c11"], operationalAssumption: false },
      { key: "color", value: "black", sourceCommentIds: ["c04", "c05"], operationalAssumption: false },
      { key: "insert", value: "removable", sourceCommentIds: ["c02", "c09"], operationalAssumption: false },
      { key: "strap", value: "wide quick-release", sourceCommentIds: ["c07", "c14"], operationalAssumption: false },
    ],
    priceSignals: [
      { signal: "Anything under $240 works for me", currency: "USD", sourceCommentIds: ["c06"], disclaimer: "非资金承诺" },
      { signal: "I'd place an order at around $250", currency: "USD", sourceCommentIds: ["c08"], disclaimer: "非资金承诺" },
      { signal: "$220-260 all sounds reasonable to me", currency: "USD", sourceCommentIds: ["c12"], disclaimer: "非资金承诺" },
    ],
    evidence: [
      { commentId: "c03", excerpt: "8L is perfect for everyday street shooting" },
      { commentId: "c02", excerpt: "Removable insert is non-negotiable, otherwise commuting with it is dumb" },
    ],
    unknowns: ["Final fabric weight", "Actual mass-production lead time"],
    confidence: "high",
  },
  {
    schemaVersion: "makebook.candidate.v1",
    title: "Black 10L Urban Short-trip Backpack",
    problem:
      "The same users want a bigger backpack for short trips with a consistent look",
    targetUser: "Urban commuters taking short trips",
    specs: [
      { key: "capacity", value: "10L", sourceCommentIds: ["c10"], operationalAssumption: false },
      { key: "color", value: "black", sourceCommentIds: ["c04"], operationalAssumption: false },
      { key: "insert", value: "removable", sourceCommentIds: ["c02", "c09"], operationalAssumption: false },
    ],
    priceSignals: [
      { signal: "$260 is my ceiling", currency: "USD", sourceCommentIds: ["c16"], disclaimer: "非资金承诺" },
    ],
    evidence: [
      { commentId: "c10", excerpt: "I'd also take a 10L backpack for short trips" },
    ],
    unknowns: ["Harness and back-panel structure", "Actual mass-production lead time"],
    confidence: "medium",
  },
  {
    schemaVersion: "makebook.candidate.v1",
    title: "Commuter Tote with Removable Insert",
    problem:
      "Some users prefer a tote form factor but still need camera-insert protection",
    targetUser: "City users who prefer tote bags",
    specs: [
      { key: "insert", value: "removable", sourceCommentIds: ["c13", "c02"], operationalAssumption: false },
      { key: "style", value: "urban commuter", sourceCommentIds: ["c15"], operationalAssumption: false },
      { key: "capacity", value: "TBD", sourceCommentIds: [], operationalAssumption: true },
    ],
    priceSignals: [],
    evidence: [
      { commentId: "c13", excerpt: "A tote with a removable insert could be nice too" },
    ],
    unknowns: ["No comment evidence for capacity", "Opening style and anti-theft design"],
    confidence: "low",
  },
];

const FLOW_STEPS = [
  {
    index: "01",
    titleKey: "story.step1Title",
    descriptionKey: "story.step1Desc",
  },
  {
    index: "02",
    titleKey: "story.step2Title",
    descriptionKey: "story.step2Desc",
  },
  {
    index: "03",
    titleKey: "story.step3Title",
    descriptionKey: "story.step3Desc",
  },
  {
    index: "04",
    titleKey: "story.step4Title",
    descriptionKey: "story.step4Desc",
  },
] as const;

/** Same trim/dedup rules as lib/ai/compile.ts, applied to the default input. */
function computeLocalStats(comments: CommentInput[]): CompileStats {
  const seen = new Set<string>();
  let empty = 0;
  let duplicates = 0;
  let valid = 0;
  for (const comment of comments) {
    const text = comment.text.trim();
    if (!text) {
      empty++;
      continue;
    }
    if (seen.has(text)) {
      duplicates++;
      continue;
    }
    seen.add(text);
    valid++;
  }
  return { total: comments.length, empty, duplicates, valid };
}

const commentChipClass =
  "border border-n-22 bg-n-04 px-1.5 font-mono text-11 leading-relaxed text-n-64";

function CandidateCard({ candidate }: { candidate: ProductCandidate }) {
  const { t } = useLang();
  return (
    <article className="surface flex min-w-0 flex-col gap-4 p-5">
      <header className="flex flex-col gap-2">
        <h3 className="text-15 leading-snug font-medium text-n-92">
          {candidate.title}
        </h3>
        <div>
          <SourceTag tone="ai">Confidence {candidate.confidence}</SourceTag>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
          {t("story.cardSpecs")}
        </span>
        <ul className="flex flex-col gap-2">
          {candidate.specs.map((spec) => (
            <li
              key={spec.key}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-13"
            >
              <span className="font-mono text-n-52">{spec.key}</span>
              <span className="font-medium text-n-92">{spec.value}</span>
              {spec.sourceCommentIds.map((id) => (
                <span key={id} className={commentChipClass}>
                  {id}
                </span>
              ))}
              {spec.operationalAssumption ? (
                <span className="text-11 text-n-40">
                  {t("story.operationalAssumption")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
          {t("story.cardEvidence")}
        </span>
        <ul className="flex flex-col gap-2">
          {candidate.evidence.map((item) => (
            <li
              key={item.commentId}
              className="text-13 leading-relaxed text-n-64"
            >
              {`“${item.excerpt}” `}
              <span className="font-mono text-11 text-n-40">
                — {item.commentId}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-n-22 pt-3">
        <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
          {t("story.cardUnknowns")}
        </span>
        <ul className="flex flex-col gap-1">
          {candidate.unknowns.map((unknown) => (
            <li key={unknown} className="text-13 text-n-64">
              {unknown}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function AiStory() {
  const { t } = useLang();
  const [output, setOutput] = useState<CompileOutput | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    compileCommentsViaApi()
      .then((result) => {
        if (!cancelled) setOutput(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFailure(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = output === null && failure === null;
  // Route answered → its candidates (real AI or fixture-degraded). Route
  // unreachable → static fixture snapshot with locally computed stats.
  const candidates = output
    ? output.result.candidates
    : STATIC_FIXTURE_CANDIDATES;
  const stats = output
    ? output.stats
    : failure !== null
      ? computeLocalStats(defaultComments)
      : null;
  const isFixture = output ? output.fixture : failure !== null;
  const fallbackReason = output
    ? output.fixture
      ? (output.error ?? "AI provider unavailable")
      : null
    : failure !== null
      ? `Live compile unavailable — ${failure}`
      : null;

  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <SectionHead
        kicker={t("story.kicker")}
        title={t("story.title")}
        intro={t("story.intro")}
      />

      {/* pipeline */}
      <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {FLOW_STEPS.map((step, stepIndex) => (
          <li key={step.index} className="contents">
            <div className="surface-flat flex min-w-0 flex-1 flex-col gap-1.5 p-4">
              <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                {step.index}
              </span>
              <span className="text-15 font-medium text-n-92">
                {t(step.titleKey)}
              </span>
              <span className="text-13 leading-relaxed text-n-64">
                {t(step.descriptionKey)}
              </span>
            </div>
            {stepIndex < FLOW_STEPS.length - 1 ? (
              <ArrowRight
                size={16}
                className="hidden shrink-0 self-center text-n-40 lg:block"
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>

      {/* AI compile output */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SourceTag tone="ai">AI generated</SourceTag>
          {isFixture && !loading ? (
            <span className="pill">
              <SourceTag tone="offchain">Fixture</SourceTag>
            </span>
          ) : null}
          {stats ? (
            <span className="font-mono text-11 uppercase tracking-[0.14em] text-n-52">
              {t("story.stats", {
                valid: stats.valid,
                duplicates: stats.duplicates,
              })}
            </span>
          ) : null}
        </div>
        {fallbackReason ? (
          <p className="text-13 text-n-52">
            {t("story.fallbackReason", { reason: fallbackReason })}
          </p>
        ) : null}

        {loading ? (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            role="status"
            aria-label={t("story.loadingAria")}
          >
            <div className="skeleton h-[300px]" />
            <div className="skeleton h-[300px]" />
            <div className="skeleton h-[300px]" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="surface p-5 text-13 text-n-64">
            {t("story.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.title} candidate={candidate} />
            ))}
          </div>
        )}
      </div>

      {/* human-confirmed manifest */}
      <div className="surface flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SourceTag tone="human">Human confirmed</SourceTag>
          <span className="font-mono text-11 uppercase tracking-[0.14em] text-n-52">
            {t("story.confirmedLine", {
              code: confirmedManifest.campaignCode,
              date: confirmedManifest.humanConfirmedAt,
            })}
          </span>
        </div>

        <h3 className="text-17 font-medium text-n-92">
          {confirmedManifest.title}
        </h3>

        <dl className="grid grid-cols-1 gap-px border border-n-22 bg-n-22 sm:grid-cols-3">
          {confirmedManifest.specs.map((spec) => (
            <div
              key={spec.key}
              className="flex min-w-0 flex-col gap-1.5 bg-n-00 px-4 py-3"
            >
              <dt className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                {spec.key}
              </dt>
              <dd className="text-15 font-medium text-n-92">{spec.value}</dd>
              <dd className="flex flex-wrap gap-1.5">
                {spec.sourceCommentIds.map((id) => (
                  <span key={id} className={commentChipClass}>
                    {id}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
            {t("story.stillUnknown")}
          </span>
          <ul className="flex flex-col gap-1">
            {confirmedManifest.unknowns.map((unknown) => (
              <li key={unknown} className="text-13 text-n-64">
                {unknown}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-n-22 pt-4">
          <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
            {t("story.manifestHashLabel")}
          </span>
          <p className="num text-13 leading-relaxed break-all text-n-76">
            {successDeployment.manifestHash}
          </p>
          <div>
            <CopyValue
              value={successDeployment.manifestHash}
              display={t("story.copyHash")}
            />
          </div>
          <p className="text-13 leading-relaxed text-n-52">
            {t("story.hashNote")}
          </p>
        </div>
      </div>

      <p className="text-11 text-n-40">
        {t("story.footerNote")}
      </p>
    </div>
  );
}
