"use client";

import { useState } from "react";
import { Wand2, Check, AlertTriangle, Loader2 } from "lucide-react";
import { MarketManifestSchema, type MarketManifest } from "@/lib/schema/manifest";
import { canonicalHash } from "@/lib/schema/canonicalize";
import type { CompileResult, ProductCandidate } from "@/lib/schema/manifest";
import cameraComments from "@/fixtures/comments.json";
import braceletComments from "@/fixtures/bracelet-comments.json";
import { CAMPAIGNS } from "@/app/lib/chain/config";
import { copy } from "@/app/lib/copy";

type CommentSource = "camera" | "bracelet";

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
  const [source, setSource] = useState<CommentSource>("camera");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<CompileOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    candidate: ProductCandidate;
    manifest: MarketManifest;
    hash: `0x${string}`;
    anchor: `0x${string}`;
    ok: boolean;
  } | null>(null);

  const comments = source === "camera" ? cameraComments : braceletComments;

  const handleCompile = async () => {
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
    const campaignCode = source === "camera" ? "FRAME-01" : "BRACELET-01";
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
      const anchor =
        source === "camera"
          ? CAMPAIGNS.success.manifestHashAnchor
          : CAMPAIGNS.bracelet.manifestHashAnchor;
      setConfirmed({
        candidate: editingManifest.candidate,
        manifest: parsed,
        hash,
        anchor,
        ok: hash.toLowerCase() === anchor.toLowerCase(),
      });
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="surface p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">
        {copy.console.compile.title}
      </h2>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-2">Source:</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as CommentSource)}
            className="input h-9 min-h-0 px-3 text-sm"
          >
            <option value="camera">Camera bag (c01–c20)</option>
            <option value="bracelet">Bracelet (b01–b20)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleCompile}
          disabled={loading}
          className="btn btn-primary inline-flex"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Compiling…
            </>
          ) : (
            <>
              <Wand2 size={16} />
              {copy.console.compile.run}
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-3">
        {copy.console.compile.noWallet}
      </p>

      {error && (
        <p className="mt-4 text-sm text-danger">{error}</p>
      )}

      {output && (
        <div className="mt-6 space-y-4">
          {output.fixture && (
            <div className="flex items-center gap-2 text-sm text-warn">
              <AlertTriangle size={16} />
              {copy.console.compile.fixture}
              {output.error && <span className="text-ink-3">— {output.error}</span>}
            </div>
          )}

          <p className="text-xs text-ink-3">
            {output.stats.valid} valid comments · {output.result.candidates.length} candidates
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {output.result.candidates.map((candidate, idx) => (
              <article
                key={idx}
                className="border border-line rounded-md p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">
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
                    {candidate.confidence}
                  </span>
                </div>

                <p className="mt-2 text-xs text-ink-2 line-clamp-2">
                  {candidate.problem}
                </p>

                <div className="mt-4 space-y-2">
                  {candidate.specs.map((spec, sidx) => (
                    <div
                      key={sidx}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-ink-2">
                        {spec.key}: <span className="font-medium text-ink">{spec.value}</span>
                      </span>
                      <span className="text-ink-3">
                        {spec.sourceCommentIds.length > 0
                          ? `from ${spec.sourceCommentIds.join(", ")}`
                          : "operational"}
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
          <h3 className="text-sm font-semibold text-ink">
            Human confirm manifest
          </h3>
          <p className="mt-1 text-xs text-ink-2">
            Edit the JSON below, then confirm to compute canonicalHash and check
            against the on-chain anchor.
          </p>
          <textarea
            value={editingManifest.json}
            onChange={(e) =>
              setEditingManifest({ ...editingManifest, json: e.target.value })
            }
            className="mt-3 h-64 w-full rounded-md border border-line bg-canvas p-3 font-mono text-xs text-ink"
            spellCheck={false}
          />
          {confirmError && (
            <p className="mt-2 text-sm text-danger">{confirmError}</p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary mt-3 inline-flex"
          >
            <Check size={16} />
            Confirm and compute hash
          </button>
        </div>
      )}

      {confirmed && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            {confirmed.ok ? (
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
                  Hash mismatch: {confirmed.hash.slice(0, 14)}… vs anchor{" "}
                  {confirmed.anchor.slice(0, 14)}…
                </span>
              </>
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-ink-3">
              View manifest JSON
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-surface p-3 text-xs text-ink-2">
              {JSON.stringify(confirmed.manifest, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
