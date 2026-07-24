"use client";

import commentsFixture from "../../fixtures/comments.json";
import type { CommentInput, CompileOutput } from "../../lib/ai/compile";

export type { CommentInput, CompileOutput, CompileStats } from "../../lib/ai/compile";
export type { ProductCandidate } from "../../lib/schema/manifest";

/**
 * /api/compile 客户端（接口文档第 6 节）。
 * 默认输入为仓库根 fixtures/comments.json 的 20 条评论（id/text/sourceLabel）。
 * 路由侧无论真实 AI 还是 fixture 降级都返回 200 + CompileOutput（fixture 标来源）；
 * 这里只对 HTTP 非 200 / 网络失败 / 超时抛错，由调用方回落 mock 候选。
 */

/** 客户端兜底超时：路由内部 provider 2s 超时自动降级 fixture，此处留足首访编译余量。 */
const COMPILE_TIMEOUT_MS = 8_000;

/** 默认编译输入：fixtures/comments.json（c01~c20，含 2 条完全重复：c18=c03、c19=c07）。 */
export const defaultComments: CommentInput[] = commentsFixture;

export async function compileCommentsViaApi(
  comments: CommentInput[] = defaultComments,
): Promise<CompileOutput> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), COMPILE_TIMEOUT_MS);
  try {
    const res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`/api/compile 返回 ${res.status}`);
    return (await res.json()) as CompileOutput;
  } finally {
    window.clearTimeout(timer);
  }
}
