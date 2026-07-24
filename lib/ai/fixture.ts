import type { CompileResult } from "../schema/manifest.ts";

/**
 * 确定性 fixture（PRD FR-AI-07）：无 API key / 超时 / schema 错误时，
 * 2 秒内返回这份固定合规输出，前端必须显示 Fixture 标签。
 * commentId 与 fixtures/comments.json（c01~c20）对齐；demo 面向欧美用户，输出为英文。
 * 注意：priceSignals[].disclaimer 是 schema 固定 literal "非资金承诺"，属于协议常量，不翻译。
 */
export const FIXTURE_RESULT: CompileResult = {
  schemaVersion: "makebook.compile.v1",
  candidates: [
    {
      schemaVersion: "makebook.candidate.v1",
      title: "Black 8L Modular Camera Sling Bag",
      problem: "Photography commuters cannot find a sling that nails capacity, looks, and insert flexibility at once",
      targetUser: "Hobbyist photographers shooting street and commuting daily in the city",
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
      problem: "The same users want a bigger backpack for short trips with a consistent look",
      targetUser: "Urban commuters taking short trips",
      specs: [
        { key: "capacity", value: "10L", sourceCommentIds: ["c10"], operationalAssumption: false },
        { key: "color", value: "black", sourceCommentIds: ["c04"], operationalAssumption: false },
        { key: "insert", value: "removable", sourceCommentIds: ["c02", "c09"], operationalAssumption: false },
      ],
      priceSignals: [
        { signal: "$260 is my ceiling", currency: "USD", sourceCommentIds: ["c16"], disclaimer: "非资金承诺" },
      ],
      evidence: [{ commentId: "c10", excerpt: "I'd also take a 10L backpack for short trips" }],
      unknowns: ["Harness and back-panel structure", "Actual mass-production lead time"],
      confidence: "medium",
    },
    {
      schemaVersion: "makebook.candidate.v1",
      title: "Commuter Tote with Removable Insert",
      problem: "Some users prefer a tote form factor but still need camera-insert protection",
      targetUser: "City users who prefer tote bags",
      specs: [
        { key: "insert", value: "removable", sourceCommentIds: ["c13", "c02"], operationalAssumption: false },
        { key: "style", value: "urban commuter", sourceCommentIds: ["c15"], operationalAssumption: false },
        { key: "capacity", value: "TBD", sourceCommentIds: [], operationalAssumption: true },
      ],
      priceSignals: [],
      evidence: [{ commentId: "c13", excerpt: "A tote with a removable insert could be nice too" }],
      unknowns: ["No comment evidence for capacity", "Opening style and anti-theft design"],
      confidence: "low",
    },
  ],
};
