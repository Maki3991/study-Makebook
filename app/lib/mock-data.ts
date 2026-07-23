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
    title: "把想要，编译成可制造的东西。",
    kicker: "AI Demand Studio",
    intro:
      "从评论与访谈里提炼规格、证据和未知项。AI 只给建议，最终进入资金流程的版本必须由人确认。",
    nextLabel: "查看已确认的 FRAME-01",
  },
  {
    id: "campaign",
    shortLabel: "市场",
    title: "让真实资金，画出需求曲线。",
    kicker: "Campaign Market",
    intro:
      "消费者提交最高愿付价，工厂提交 MOQ 阶梯。兴趣样本与链上订单分开显示，不把点赞假装成购买。",
    nextLabel: "提交条件订单",
  },
  {
    id: "order",
    shortLabel: "订单",
    title: "承诺一个上限，不接受固定答案。",
    kicker: "Conditional Order",
    intro:
      "预锁你的最高愿付价。统一清算价不高于它时成交并退回差额，否则可领取全额退款。",
    nextLabel: "查看清算结果",
  },
  {
    id: "settlement",
    shortLabel: "清算",
    title: "规则公开，结果才值得相信。",
    kicker: "Settlement & Receipt",
    intro:
      "Injective 合约比较资金订单与工厂 MOQ 报价，给出唯一档位、统一价格与可验证的个人凭证。",
    nextLabel: "演示完成",
  },
];
