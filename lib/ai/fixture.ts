import type { CompileResult } from "../schema/manifest.ts";

/**
 * 确定性 fixture（PRD FR-AI-07）：无 API key / 超时 / schema 错误时，
 * 2 秒内返回这份固定合规输出，前端必须显示 Fixture 标签。
 * commentId 与 fixtures/comments.json（c01~c20）对齐。
 */
export const FIXTURE_RESULT: CompileResult = {
  schemaVersion: "makebook.compile.v1",
  candidates: [
    {
      schemaVersion: "makebook.candidate.v1",
      title: "黑色 8L 模块化摄影斜挎包",
      problem: "摄影通勤用户找不到容量、外观与内胆灵活性同时满足的斜挎包",
      targetUser: "日常扫街与城市通勤的摄影爱好者",
      specs: [
        { key: "capacity", value: "8L", sourceCommentIds: ["c01", "c03", "c11"], operationalAssumption: false },
        { key: "color", value: "black", sourceCommentIds: ["c04", "c05"], operationalAssumption: false },
        { key: "insert", value: "removable", sourceCommentIds: ["c02", "c09"], operationalAssumption: false },
        { key: "strap", value: "wide quick-release", sourceCommentIds: ["c07", "c14"], operationalAssumption: false },
      ],
      priceSignals: [
        { signal: "价格 240 以内可以接受", currency: "CNY", sourceCommentIds: ["c06"], disclaimer: "非资金承诺" },
        { signal: "250 左右我会下单", currency: "CNY", sourceCommentIds: ["c08"], disclaimer: "非资金承诺" },
        { signal: "220-260 这个区间都合理", currency: "CNY", sourceCommentIds: ["c12"], disclaimer: "非资金承诺" },
      ],
      evidence: [
        { commentId: "c03", excerpt: "8L 容量日常扫街刚好" },
        { commentId: "c02", excerpt: "内胆一定要可拆，不然通勤很蠢" },
      ],
      unknowns: ["最终面料克重", "真实量产交期"],
      confidence: "high",
    },
    {
      schemaVersion: "makebook.candidate.v1",
      title: "黑色 10L 城市短途双肩包",
      problem: "同一批用户在短途旅行场景需要更大容量但风格一致的双肩包",
      targetUser: "短途出行的城市通勤者",
      specs: [
        { key: "capacity", value: "10L", sourceCommentIds: ["c10"], operationalAssumption: false },
        { key: "color", value: "black", sourceCommentIds: ["c04"], operationalAssumption: false },
        { key: "insert", value: "removable", sourceCommentIds: ["c02", "c09"], operationalAssumption: false },
      ],
      priceSignals: [
        { signal: "260 是上限了", currency: "CNY", sourceCommentIds: ["c16"], disclaimer: "非资金承诺" },
      ],
      evidence: [{ commentId: "c10", excerpt: "双肩包 10L 也能接受，短途旅行用" }],
      unknowns: ["背负系统结构", "真实量产交期"],
      confidence: "medium",
    },
    {
      schemaVersion: "makebook.candidate.v1",
      title: "可拆内胆通勤托特包",
      problem: "部分用户偏好托特形态但仍需相机内胆保护",
      targetUser: "偏好托特包形态的城市用户",
      specs: [
        { key: "insert", value: "removable", sourceCommentIds: ["c13", "c02"], operationalAssumption: false },
        { key: "style", value: "urban commuter", sourceCommentIds: ["c15"], operationalAssumption: false },
        { key: "capacity", value: "TBD", sourceCommentIds: [], operationalAssumption: true },
      ],
      priceSignals: [],
      evidence: [{ commentId: "c13", excerpt: "托特包如果能拆内胆也不错" }],
      unknowns: ["容量规格无评论证据", "开口方式与防盗设计"],
      confidence: "low",
    },
  ],
};
