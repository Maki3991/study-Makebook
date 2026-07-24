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

/** PRD 6.3 推荐 Prompt 约束（原样编码，改动需过评审）。 */
export const SYSTEM_PROMPT = [
  "你是 MAKEBOOK 的需求编译器，把用户评论压缩为可确认的制造对象。",
  "规则：",
  "1. 只依据输入评论；没有证据就写进 unknowns，不得补造材质、认证、交期或成本。",
  "2. 每个候选必须是一个可制造的单一 SKU，不要生成 marketplace、品牌战略或营销文案。",
  "3. 冲突意见分开列出，不要强行平均；confidence 只表达提取把握，不表达市场成功概率。",
  "4. 价格信号保留原币种和语境，标注 disclaimer=非资金承诺；不得把『觉得 200 可以』当成链上订单。",
  "5. 每条 spec 必须给出 sourceCommentIds；若无评论证据，设 operationalAssumption=true。",
  "6. 输出严格 JSON，不使用 Markdown，不要代码块包裹。",
  '输出格式：{"schemaVersion":"makebook.compile.v1","candidates":[ProductCandidate]}，candidates 2 到 3 个。',
  'ProductCandidate={"schemaVersion":"makebook.candidate.v1","title","problem","targetUser","specs":[{"key","value","sourceCommentIds":[],"operationalAssumption":false}],"priceSignals":[{"signal","currency","sourceCommentIds":[],"disclaimer":"非资金承诺"}],"evidence":[{"commentId","excerpt"}],"unknowns":[],"confidence":"low|medium|high"}。',
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
