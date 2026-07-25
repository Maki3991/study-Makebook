"use client";

import { useState } from "react";
import { Wand2, Check, AlertTriangle, Loader2 } from "lucide-react";
import { MarketManifestSchema, type MarketManifest } from "@/lib/schema/manifest";
import { canonicalHash } from "@/lib/schema/canonicalize";
import type { CompileResult, ProductCandidate } from "@/lib/schema/manifest";
import cameraComments from "@/fixtures/comments.json";
import braceletComments from "@/fixtures/bracelet-comments.json";
import { CAMPAIGNS } from "@/app/lib/chain/config";
import { useCopy } from "@/app/lib/i18n/use-copy";

type CommentSource = "camera" | "bracelet" | "paste";

// 与 POST /api/compile 的 10~50 条口径一致
const PASTE_MIN = 10;
const PASTE_MAX = 50;

type CompileOutput = {
  result: CompileResult;
  fixture: boolean;
  stats: {
    total: number;
    empty: number;
    duplicates: number;
    valid: number;
  };
  error?: string;
};

function candidateToManifest(
  candidate: ProductCandidate,
  campaignCode: string,
): MarketManifest {
  return {
    schemaVersion: "makebook.manifest.v1",
    campaignCode,
    title: candidate.title,
    specs: candidate.specs.map((s) => ({
      key: s.key,
      value: s.value,
      sourceCommentIds: s.sourceCommentIds,
    })),
    unknowns: candidate.unknowns,
    aiGenerated: true,
    humanConfirmedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
}

export function CompilePanel() {
  const copy = useCopy();
  const [source, setSource] = useState<CommentSource>("camera");
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<CompileOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    candidate: ProductCandidate;
    manifest: MarketManifest;
    hash: `0x${string}`;
    anchor: `0x${string}` | null;
    ok: boolean;
  } | null>(null);

  // 粘贴模式：非空行才算一条评论，去掉首尾空白（与后端 trim 口径一致）
  const pasteLines = pasteText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const pasteCountInvalid =
    pasteLines.length < PASTE_MIN || pasteLines.length > PASTE_MAX;

  const comments =
    source === "camera"
      ? cameraComments
      : source === "bracelet"
        ? braceletComments
        : pasteLines.map((text, i) => ({ id: `c${i + 1}`, text }));

  const handleCompile = async () => {
    if (source === "paste" && pasteCountInvalid) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    setConfirmed(null);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });
      if (!res.ok) {
        throw new Error(`Compile failed: ${res.status}`);
      }
      const data = (await res.json()) as CompileOutput;
      setOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const [editingManifest, setEditingManifest] = useState<{
    candidate: ProductCandidate;
    json: string;
  } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const startEditing = (candidate: ProductCandidate) => {
    const campaignCode =
      source === "camera"
        ? "FRAME-01"
        : source === "bracelet"
          ? "BRACELET-01"
          : "CUSTOM-01";
    const manifest = candidateToManifest(candidate, campaignCode);
    setEditingManifest({
      candidate,
      json: JSON.stringify(manifest, null, 2),
    });
    setConfirmed(null);
    setConfirmError(null);
  };

  const handleConfirm = () => {
    if (!editingManifest) return;
    setConfirmError(null);
    try {
      const raw = JSON.parse(editingManifest.json);
      const parsed = MarketManifestSchema.parse(raw);
      const hash = canonicalHash(parsed);
      // 粘贴模式没有对应链上批次锚点：只计算 canonicalHash，中性展示
      const anchor =
        source === "camera"
          ? CAMPAIGNS.success.manifestHashAnchor
          : source === "bracelet"
            ? CAMPAIGNS.bracelet.manifestHashAnchor
            : null;
      setConfirmed({
        candidate: editingManifest.candidate,
        manifest: parsed,
        hash,
        anchor,
        ok: anchor !== null && hash.toLowerCase() === anchor.toLowerCase(),
      });
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="surface p-5 lg:p-6">
      <h2 className="text-h2 text-ink">
        {copy.console.compile.title}
      </h2>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label
            htmlFor="compile-source"
            className="text-body text-ink-2"
          >
            {copy.console.compile.sourceLabel}
          </label>
          <select
            id="compile-source"
            value={source}
            onChange={(e) => setSource(e.target.value as CommentSource)}
            className="input h-9 min-h-0 px-3 text-body"
          >
            <option value="camera">{copy.console.compile.sourceCamera}</option>
            <option value="bracelet">{copy.console.compile.sourceBracelet}</option>
            <option value="paste">{copy.console.compile.sourcePaste}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleCompile}
          disabled={loading || (source === "paste" && pasteCountInvalid)}
          className="btn btn-primary inline-flex"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {copy.console.compile.compiling}
            </>
          ) : (
            <>
              <Wand2 size={16} />
              {copy.console.compile.run}
            </>
          )}
        </button>

        {source === "paste" && pasteLines.length < PASTE_MIN && (
          <p className="text-micro text-warn">{copy.console.compile.pasteTooFew}</p>
        )}
        {source === "paste" && pasteLines.length > PASTE_MAX && (
          <p className="text-micro text-warn">{copy.console.compile.pasteTooMany}</p>
        )}
      </div>

      {source === "paste" && (
        <>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={copy.console.compile.pasteHint}
            aria-label={copy.console.compile.sourcePaste}
            className="mt-3 h-64 w-full rounded-md border border-line bg-canvas p-3 font-mono text-micro text-ink"
            spellCheck={false}
          />
          <p className="mt-1 text-micro text-ink-3">
            {copy.console.compile.pasteCount.replace(
              "{n}",
              String(pasteLines.length),
            )}
          </p>
        </>
      )}

      <p className="mt-3 text-micro text-ink-3">
        {copy.console.compile.noWallet}
      </p>

      {error && (
        <p role="alert" className="mt-4 text-body text-danger">
          {error}
        </p>
      )}

      {output && (
        <div className="mt-6 space-y-4">
          {output.fixture && (
            <div className="flex items-center gap-2 text-body text-warn">
              <AlertTriangle size={16} />
              {copy.console.compile.fixture}
              {output.error && <span className="text-ink-3">— {output.error}</span>}
            </div>
          )}

          <p className="text-micro text-ink-3">
            {copy.console.compile.stats
              .replace("{valid}", String(output.stats.valid))
              .replace("{candidates}", String(output.result.candidates.length))}
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {output.result.candidates.map((candidate, idx) => (
              <article
                key={idx}
                className="border border-line rounded-md p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-body font-semibold text-ink">
                    {candidate.title}
                  </h3>
                  <span
                    className={`tag ${
                      candidate.confidence === "high"
                        ? "tag-success"
                        : candidate.confidence === "medium"
                          ? "tag-warn"
                          : "tag-neutral"
                    }`}
                  >
                    {copy.console.compile.confidence[
                      candidate.confidence as keyof typeof copy.console.compile.confidence
                    ] ?? candidate.confidence}
                  </span>
                </div>

                <p className="mt-2 text-micro text-ink-2 line-clamp-2">
                  {candidate.problem}
                </p>

                <div className="mt-4 space-y-2">
                  {candidate.specs.map((spec, sidx) => (
                    <div
                      key={sidx}
                      className="flex flex-wrap items-center justify-between gap-2 text-micro"
                    >
                      <span className="text-ink-2">
                        {spec.key}: <span className="font-medium text-ink">{spec.value}</span>
                      </span>
                      <span className="text-ink-3">
                        {spec.sourceCommentIds.length > 0
                          ? copy.console.compile.sourceFrom.replace(
                              "{ids}",
                              spec.sourceCommentIds.join(", "),
                            )
                          : copy.console.compile.operational}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => startEditing(candidate)}
                  className="btn btn-secondary mt-4 w-full"
                >
                  {copy.console.compile.confirm}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {editingManifest && (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-body font-semibold text-ink">
            {copy.console.compile.humanConfirmTitle}
          </h3>
          <p className="mt-1 text-micro text-ink-2">
            {copy.console.compile.editJsonHint}
          </p>
          <textarea
            value={editingManifest.json}
            onChange={(e) =>
              setEditingManifest({ ...editingManifest, json: e.target.value })
            }
            aria-label={copy.console.compile.humanConfirmTitle}
            className="mt-3 h-64 w-full rounded-md border border-line bg-canvas p-3 font-mono text-micro text-ink"
            spellCheck={false}
          />
          {confirmError && (
            <p role="alert" className="mt-2 text-body text-danger">
              {confirmError}
            </p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary mt-3 inline-flex"
          >
            <Check size={16} />
            {copy.console.compile.confirmHashButton}
          </button>
        </div>
      )}

      {confirmed && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center gap-2 text-body font-medium">
            {confirmed.anchor === null ? (
              <>
                <Check size={16} className="text-ink-3" />
                <span className="text-ink-2">
                  {copy.console.compile.noAnchor.replace(
                    "{hash}",
                    confirmed.hash.slice(0, 14),
                  )}
                </span>
              </>
            ) : confirmed.ok ? (
              <>
                <Check size={16} className="text-success" />
                <span className="text-success">
                  {copy.console.compile.hashOk}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} className="text-warn" />
                <span className="text-warn">
                  {copy.console.compile.hashMismatch
                    .replace("{hash}", confirmed.hash.slice(0, 14))
                    .replace("{anchor}", confirmed.anchor.slice(0, 14))}
                </span>
              </>
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-micro text-ink-3">
              {copy.console.compile.viewJson}
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-surface p-3 text-micro text-ink-2">
              {JSON.stringify(confirmed.manifest, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
