/**
 * OpenAI 兼容接口适配器（PRD 6.3 prompt 约束）。
 * 环境变量：AI_BASE_URL / AI_API_KEY / AI_MODEL。
 * AI 模块绝不持有私钥、不调用任何合约写操作（FR-AI-08）。
 */

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class ProviderConfigError extends Error {
  constructor() {
    super("AI_BASE_URL / AI_API_KEY / AI_MODEL 未完整配置");
    this.name = "ProviderConfigError";
  }
}

export class ProviderCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderCallError";
  }
}

/**
 * PRD 6.3 推荐 Prompt 约束（英文版：demo 面向欧美用户，自由文本字段一律英文输出）。
 * disclaimer 固定 token "非资金承诺" 是 schema literal（manifest.ts），不属于文案，不得翻译。
 */
export const SYSTEM_PROMPT = [
  "You are MAKEBOOK's demand compiler: compress raw user comments into confirmable, manufacturable objects.",
  "Rules:",
  "1. Use only the input comments; when evidence is missing, put it into unknowns — never invent materials, certifications, lead times, or costs.",
  "2. Each candidate must be a single manufacturable SKU — no marketplaces, brand strategy, or marketing copy.",
  "3. List conflicting opinions separately; do not average them. confidence expresses extraction confidence only, not market success probability.",
  '4. Price signals keep their original currency and context, tagged disclaimer="非资金承诺" (fixed schema token, do not translate); never treat "200 sounds fine" as an on-chain order.',
  "5. Every spec must carry sourceCommentIds; if there is no comment evidence, set operationalAssumption=true.",
  "6. Output strict JSON only — no Markdown, no code fences. Write all free-text fields (title, problem, targetUser, evidence excerpts, unknowns) in English.",
  'Output format: {"schemaVersion":"makebook.compile.v1","candidates":[ProductCandidate]} with 2 to 3 candidates.',
  'ProductCandidate={"schemaVersion":"makebook.candidate.v1","title","problem","targetUser","specs":[{"key","value","sourceCommentIds":[],"operationalAssumption":false}],"priceSignals":[{"signal","currency","sourceCommentIds":[],"disclaimer":"非资金承诺"}],"evidence":[{"commentId","excerpt"}],"unknowns":[],"confidence":"low|medium|high"}.',
].join("\n");

export interface CallProviderOptions {
  timeoutMs?: number;
  temperature?: number;
}

/** 调用 OpenAI 兼容 /chat/completions，返回 message.content 原始字符串。 */
export async function callProvider(
  userContent: string,
  opts: CallProviderOptions = {},
): Promise<string> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!baseUrl || !apiKey || !model) throw new ProviderConfigError();

  const { timeoutMs = 2000, temperature = 0 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        // 推理型模型（glm-5.2）不关思考会把 token 预算烧在 reasoning 上导致空响应；
        // 4000 token 上限给 2–3 个候选（实测 5.5–6.8k 字符 ≈ 2000 token）留足余量
        max_tokens: 4000,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT } satisfies ChatMessage,
          { role: "user", content: userContent } satisfies ChatMessage,
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ProviderCallError(`provider HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new ProviderCallError("provider 返回为空");
    return content;
  } catch (err) {
    if (err instanceof ProviderCallError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProviderCallError(`provider 超时（>${timeoutMs}ms）`);
    }
    throw new ProviderCallError(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}
