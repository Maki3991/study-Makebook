import { compileComments, type CommentInput } from "@/lib/ai/compile";

/**
 * POST /api/compile — AI 需求编译器（接口文档第 6 节）。
 *
 * 请求：{ comments: [{ id, text, sourceLabel? }] }（10~50 条）
 * 响应：无论真实 AI 还是 fixture 降级都是 200 + { result, fixture, stats, error? }，
 * error 仅 fixture 模式出现（说明降级原因）；fixture:true 时前端必须显示 Fixture 标签。
 * 环境变量 AI_BASE_URL / AI_API_KEY / AI_MODEL 未配置时 lib/ai 自动 2 秒内降级 fixture。
 */
export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "请求体不是合法 JSON" }, { status: 400 });
  }

  const comments = (body as { comments?: unknown }).comments;
  if (!Array.isArray(comments) || !comments.every(isCommentInput)) {
    return Response.json(
      { message: "body 必须是 { comments: [{ id, text, sourceLabel? }] }" },
      { status: 400 },
    );
  }

  // 网关生成速度 25–80 tok/s，真实编译实测 26–92s；120s 预算提高成功率，超出才降级 fixture
  const output = await compileComments(comments, { timeoutMs: 120000 });
  return Response.json(output);
}

function isCommentInput(value: unknown): value is CommentInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    (v.sourceLabel === undefined || typeof v.sourceLabel === "string")
  );
}
