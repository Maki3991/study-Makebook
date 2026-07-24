/**
 * 基础脱敏（PRD FR-AI-02）：评论进入 LLM 前，把直接联系方式与地址片段替换为占位符。
 * 覆盖：邮箱、手机号（中国大陆 11 位与带国家码/分隔符形态）、中文地址片段。
 * 这是尽力而为的前置过滤，不替代“不粘贴敏感信息”的输入约束。
 */

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 中国大陆手机号，或 +86 / 分隔符形态；避免误伤 220-260 这类价格区间（要求 11 位连续或显式 + 前缀）
const PHONE_RE = /(?:\+?86[-\s]?)?1[3-9]\d{9}/g;
const INTL_PHONE_RE = /\+\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{0,4}/g;
// 中文地址片段：省市县区路街号室组合，或“地址：xxx”
const ADDRESS_RE =
  /(?:地址|收货地|住址)\s*[:：]?\s*[一-龥0-9A-Za-z号弄幢单元室,-]{4,40}/g;
const CN_ADDRESS_RE =
  /[一-龥]{2,}(?:省|自治区)(?:[一-龥]{2,}市)?(?:[一-龥]{2,}(?:区|县))?(?:[一-龥0-9]{1,}(?:路|街|大道|巷|弄))?(?:\d{1,4}号)?/g;

export const REDACTED_EMAIL = "[EMAIL_REDACTED]";
export const REDACTED_PHONE = "[PHONE_REDACTED]";
export const REDACTED_ADDRESS = "[ADDRESS_REDACTED]";

export function redact(text: string): string {
  return text
    .replace(EMAIL_RE, REDACTED_EMAIL)
    .replace(INTL_PHONE_RE, REDACTED_PHONE)
    .replace(PHONE_RE, REDACTED_PHONE)
    .replace(ADDRESS_RE, REDACTED_ADDRESS)
    .replace(CN_ADDRESS_RE, REDACTED_ADDRESS);
}

/** 供测试与调试：返回脱敏后的文本及命中的类别。 */
export function redactWithReport(text: string): { text: string; hits: string[] } {
  const hits: string[] = [];
  let out = text;
  const apply = (re: RegExp, tag: string, label: string) => {
    if (re.test(out)) hits.push(label);
    re.lastIndex = 0;
    out = out.replace(re, tag);
  };
  apply(EMAIL_RE, REDACTED_EMAIL, "email");
  apply(INTL_PHONE_RE, REDACTED_PHONE, "phone");
  apply(PHONE_RE, REDACTED_PHONE, "phone");
  apply(ADDRESS_RE, REDACTED_ADDRESS, "address");
  apply(CN_ADDRESS_RE, REDACTED_ADDRESS, "address");
  return { text: out, hits };
}
