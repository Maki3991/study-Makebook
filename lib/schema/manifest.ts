import { z } from "zod";

/**
 * Market Manifest（PRD 6.2）——人工确认后 canonicalize + keccak256 得到 manifestHash，
 * 部署时写入合约且不可改。schemaVersion 管理全部字段演进。
 */

export const MANIFEST_SCHEMA_VERSION = "makebook.manifest.v1" as const;

export const ManifestSpecSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  sourceCommentIds: z.array(z.string().min(1)).min(1),
});
export type ManifestSpec = z.infer<typeof ManifestSpecSchema>;

export const MarketManifestSchema = z.object({
  schemaVersion: z.literal(MANIFEST_SCHEMA_VERSION),
  campaignCode: z.string().min(1),
  title: z.string().min(1),
  specs: z.array(ManifestSpecSchema).min(1),
  unknowns: z.array(z.string().min(1)),
  aiGenerated: z.boolean(),
  humanConfirmedAt: z
    .string()
    .datetime({ offset: false, message: "必须是 ISO 8601 UTC 时间，如 2026-07-24T10:30:00Z" }),
});
export type MarketManifest = z.infer<typeof MarketManifestSchema>;

/**
 * ProductCandidate（PRD FR-AI-03 / FR-AI-04）——AI 需求编译器输出。
 * 每条 spec 必须引用至少一条 commentId，或显式标记为运营假设。
 */

export const CANDIDATE_SCHEMA_VERSION = "makebook.candidate.v1" as const;

export const CandidateSpecSchema = z
  .object({
    key: z.string().min(1),
    value: z.string().min(1),
    sourceCommentIds: z.array(z.string().min(1)).default([]),
    operationalAssumption: z
      .boolean()
      .default(false)
      .describe("true 表示该规格为运营假设而非评论证据"),
  })
  .refine((s) => s.sourceCommentIds.length > 0 || s.operationalAssumption, {
    message: "每条 spec 必须引用至少一条 commentId 或标记 operationalAssumption=true",
  });
export type CandidateSpec = z.infer<typeof CandidateSpecSchema>;

export const PriceSignalSchema = z.object({
  signal: z.string().min(1).describe("原文中的价格表述，保留语境"),
  currency: z.string().min(1).describe("保留原币种，如 CNY / testINJ"),
  sourceCommentIds: z.array(z.string().min(1)).min(1),
  disclaimer: z
    .literal("非资金承诺")
    .default("非资金承诺")
    .describe("FR-AI-05：价格信号不是链上订单"),
});
export type PriceSignal = z.infer<typeof PriceSignalSchema>;

export const EvidenceSchema = z.object({
  commentId: z.string().min(1),
  excerpt: z.string().min(1).describe("代表评论摘录"),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ProductCandidateSchema = z.object({
  schemaVersion: z.literal(CANDIDATE_SCHEMA_VERSION),
  title: z.string().min(1),
  problem: z.string().min(1),
  targetUser: z.string().min(1),
  specs: z.array(CandidateSpecSchema).min(1),
  priceSignals: z.array(PriceSignalSchema),
  evidence: z.array(EvidenceSchema).min(1),
  unknowns: z.array(z.string().min(1)),
  confidence: z.enum(["low", "medium", "high"]),
});
export type ProductCandidate = z.infer<typeof ProductCandidateSchema>;

/** AI 编译器整体输出：2–3 个候选（FR-AI-03）。 */
export const CompileResultSchema = z.object({
  schemaVersion: z.literal("makebook.compile.v1"),
  candidates: z.array(ProductCandidateSchema).min(2).max(3),
});
export type CompileResult = z.infer<typeof CompileResultSchema>;
