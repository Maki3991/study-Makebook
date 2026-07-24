export type StoryStepId = "studio" | "campaign" | "order" | "settlement";

export type StoryStep = {
  id: StoryStepId;
  shortLabel: string;
  title: string;
  kicker: string;
  intro: string;
  task: string;
  nextLabel: string;
};

export const storySteps: StoryStep[] = [
  {
    id: "studio",
    shortLabel: "需求",
    title: "从评论，到制造规格",
    kicker: "AI Demand Studio",
    intro:
      "从评论与访谈里提炼规格、证据和未知项。AI 只给建议，最终进入资金流程的版本必须由人确认。",
    task: "选择方向并人工确认",
    nextLabel: "前往 FRAME-01 市场",
  },
  {
    id: "campaign",
    shortLabel: "市场",
    title: "让资金画出需求曲线",
    kicker: "Campaign Market",
    intro:
      "消费者提交最高愿付价，工厂提交 MOQ 阶梯。兴趣样本与链上订单分开显示，不把点赞假装成购买。",
    task: "读懂中标档位，再决定下单",
    nextLabel: "提交条件订单",
  },
  {
    id: "order",
    shortLabel: "订单",
    title: "最高愿付价，统一清算",
    kicker: "Conditional Order",
    intro:
      "预锁你的最高愿付价。统一清算价不高于它时成交并退回差额，否则可领取全额退款。",
    task: "确认金额、公开性和不可撤销",
    nextLabel: "查看清算结果",
  },
  {
    id: "settlement",
    shortLabel: "清算",
    title: "规则公开，结果可验证",
    kicker: "Settlement & Receipt",
    intro:
      "Injective 合约比较资金订单与工厂 MOQ 报价，给出唯一档位、统一价格与可验证的个人凭证。",
    task: "看清结果，再领取差额或退款",
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

// English demo data aligned with fixtures/comments.json (c01~c20) and
// lib/ai/fixture.ts. Every evidence string cites a traceable comment id —
// no aggregated statistics that cannot be traced back to the comments.
export const sourceComments = [
  "Need a sling that fits one body and two lenses — 8L is about right",
  "Removable insert is non-negotiable, otherwise commuting with it is dumb",
  "$220-260 all sounds reasonable to me",
  "Black goes with everything — skip the flashy colorways",
  "Wide strap please — my shoulder dies after a full day of carrying",
  "8L sling is the sweet spot — anything bigger kills my shoulder",
];

export const candidates: Candidate[] = [
  {
    id: "FRAME-01",
    name: "Black 8L Modular Camera Sling Bag",
    type: "Selected direction",
    confidence: 88,
    specs: ["Black", "8L", "Removable insert", "Wide quick-release strap"],
    evidence: [
      'c03 · "8L is perfect for everyday street shooting"',
      'c02 · "Removable insert is non-negotiable, otherwise commuting with it is dumb"',
      'c12 · "$220-260 all sounds reasonable to me"',
    ],
    unknown: "Final fabric weight and actual mass-production lead time still need confirmation",
  },
  {
    id: "FRAME-02",
    name: "Black 10L Urban Short-trip Backpack",
    type: "Alternative",
    confidence: 64,
    specs: ["Black", "10L", "Removable insert"],
    evidence: [
      'c10 · "I\'d also take a 10L backpack for short trips"',
      'c16 · "$260 is my ceiling — above that I\'d just buy a big brand"',
    ],
    unknown: "Harness and back-panel structure; actual mass-production lead time unconfirmed",
  },
  {
    id: "FRAME-03",
    name: "Commuter Tote with Removable Insert",
    type: "Alternative",
    confidence: 57,
    specs: ["Removable insert", "Urban commuter style", "Capacity TBD"],
    evidence: [
      'c13 · "A tote with a removable insert could be nice too"',
      'c15 · "Don\'t make it look too outdoorsy — urban commuter vibe please"',
    ],
    unknown: "No comment evidence for capacity; opening style and anti-theft design TBD",
  },
];

// Cumulative funded demand (orders with maxPrice >= price), aligned with
// fixtures/success.json Buyer A–E: 0.026 / 0.024 / 0.021 / 0.019 / 0.017.
export const demandPoints = [
  { price: "0.017", orders: 5 },
  { price: "0.019", orders: 4 },
  { price: "0.021", orders: 3 },
  { price: "0.024", orders: 2 },
  { price: "0.026", orders: 1 },
];

// fixtures/success.json: Loom min3 @ 0.019 feasible (eligibleCount = 4);
// North min3 @ 0.024 not feasible (only 2 orders >= 0.024).
export const factoryTiers = [
  {
    id: "loom",
    name: "Factory Loom",
    quantity: 3,
    price: "0.019",
    feasible: true,
    eligible: 4,
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
