import { redact } from "./redact.ts";
import { callProvider } from "./provider.ts";
import { FIXTURE_RESULT } from "./fixture.ts";
import { CompileResultSchema, type CompileResult } from "../schema/manifest.ts";

/**
 * AI 需求编译器主入口（PRD 第 06 章）：
 *   粘贴评论 → 去空行/去重（FR-AI-01）→ 脱敏（FR-AI-02）→ LLM → Zod 校验（FR-AI-03）。
 * 无 key / 超时 / schema 错误时 2 秒内返回 fixture 并标 fixture:true（FR-AI-07 / AI-02）。
 * 本模块不持有私钥、不触碰任何合约写操作（FR-AI-08）。
 */

export interface CommentInput {
  id: string;
  text: string;
  sourceLabel?: string;
}

export interface CompileStats {
  total: number;
  empty: number;
  duplicates: number;
  valid: number;
}

export interface CompileOutput {
  result: CompileResult;
  fixture: boolean;
  stats: CompileStats;
  /** fixture 模式下说明降级原因 */
  error?: string;
}

export interface CompileOptions {
  /** provider 超时，默认 2000ms；超时即降级 fixture */
  timeoutMs?: number;
}

/** 防御性剥离 Markdown 代码围栏（prompt 已禁止，仍兜底）。 */
function stripMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function compileComments(
  comments: CommentInput[],
  opts: CompileOptions = {},
): Promise<CompileOutput> {
  // FR-AI-01：去空行、去完全重复
  const seen = new Set<string>();
  let empty = 0;
  let duplicates = 0;
  const valid: CommentInput[] = [];
  for (const c of comments) {
    const text = c.text.trim();
    if (!text) {
      empty++;
      continue;
    }
    if (seen.has(text)) {
      duplicates++;
      continue;
    }
    seen.add(text);
    valid.push({ ...c, text });
  }
  const stats: CompileStats = { total: comments.length, empty, duplicates, valid: valid.length };

  const fallback = (error?: string): CompileOutput => ({
    result: FIXTURE_RESULT,
    fixture: true,
    stats,
    ...(error ? { error } : {}),
  });

  if (valid.length === 0) return fallback("无有效评论输入");

  try {
    // FR-AI-02：每条评论脱敏后才允许发给模型
    const payload = valid.map((c) => `${c.id}: ${redact(c.text)}`).join("\n");
    const raw = await callProvider(payload, { timeoutMs: opts.timeoutMs ?? 2000 });
    const parsed = CompileResultSchema.parse(JSON.parse(stripMarkdownFences(raw)));
    return { result: parsed, fixture: false, stats };
  } catch (err) {
    return fallback(err instanceof Error ? err.message : String(err));
  }
}
