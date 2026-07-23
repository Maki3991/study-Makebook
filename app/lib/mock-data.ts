export type StoryStepId = "studio" | "campaign" | "order" | "settlement";

export type StoryStep = {
  id: StoryStepId;
  shortLabel: string;
  title: string;
  kicker: string;
  intro: string;
  nextLabel: string;
};

export const storySteps: StoryStep[] = [
  {
    id: "studio",
    shortLabel: "需求",
    title: "从评论，到制造规格。",
    kicker: "AI Demand Studio",
    intro:
      "从评论与访谈里提炼规格、证据和未知项。AI 只给建议，最终进入资金流程的版本必须由人确认。",
    nextLabel: "前往 FRAME-01 市场",
  },
  {
    id: "campaign",
    shortLabel: "市场",
    title: "资金订单，画出需求曲线。",
    kicker: "Campaign Market",
    intro:
      "消费者提交最高愿付价，工厂提交 MOQ 阶梯。兴趣样本与链上订单分开显示，不把点赞假装成购买。",
    nextLabel: "提交条件订单",
  },
  {
    id: "order",
    shortLabel: "订单",
    title: "承诺最高价，等待统一清算。",
    kicker: "Conditional Order",
    intro:
      "预锁你的最高愿付价。统一清算价不高于它时成交并退回差额，否则可领取全额退款。",
    nextLabel: "查看清算结果",
  },
  {
    id: "settlement",
    shortLabel: "清算",
    title: "规则公开，结果可验证。",
    kicker: "Settlement & Receipt",
    intro:
      "Injective 合约比较资金订单与工厂 MOQ 报价，给出唯一档位、统一价格与可验证的个人凭证。",
    nextLabel: "演示完成",
  },
];

export type Candidate = {
  id: string;
  name: string;
  type: string;
  confidence: number;
  specs: string[];
  evidence: string[];
  unknown: string;
};

export const sourceComments = [
  "普通相机包看起来太像器材箱，我想背去上班也不突兀。",
  "最好能装下一机两镜，但不要大到像双肩包。",
  "内胆可拆很重要，平时想把它当普通斜挎包。",
  "肩带要宽一点，背久了不要勒。",
  "黑色最稳，预算大概在 220–260 元。",
  "希望能快速从侧面拿到相机。",
];

export const candidates: Candidate[] = [
  {
    id: "FRAME-01",
    name: "8L 模块摄影斜挎包",
    type: "Selected direction",
    confidence: 88,
    specs: ["黑色", "8L", "可拆内胆", "宽肩带"],
    evidence: [
      "14 / 20 条评论明确反感“器材箱”外观",
      "9 / 20 条评论提到一机两镜与日常物品共存",
      "价格意愿集中在 220–260 元",
    ],
    unknown: "防水等级与侧取结构仍需打样确认",
  },
  {
    id: "FRAME-02",
    name: "10L 城市双肩包",
    type: "Alternative",
    confidence: 64,
    specs: ["深灰", "10L", "后开仓", "双肩"],
    evidence: ["容量诉求明确，但双肩形态的支持样本较少"],
    unknown: "通勤体积与器材保护之间仍有冲突",
  },
  {
    id: "FRAME-03",
    name: "可拆内胆托特包",
    type: "Alternative",
    confidence: 57,
    specs: ["米白", "12L", "独立内胆", "手提"],
    evidence: ["生活方式感最强，但相机侧取需求无法满足"],
    unknown: "提手承重与镜头保护方式不明确",
  },
];

export const demandPoints = [
  { price: "0.017", orders: 6 },
  { price: "0.019", orders: 5 },
  { price: "0.021", orders: 3 },
  { price: "0.024", orders: 2 },
  { price: "0.026", orders: 1 },
];

export const factoryTiers = [
  {
    id: "loom",
    name: "Factory Loom",
    quantity: 5,
    price: "0.019",
    feasible: true,
    eligible: 5,
  },
  {
    id: "north",
    name: "Factory North",
    quantity: 3,
    price: "0.024",
    feasible: false,
    eligible: 2,
  },
];
