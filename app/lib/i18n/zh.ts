export const zh = {
  global: {
    brand: "MAKEBOOK",
    nav: {
      brand: "MAKEBOOK",
      orders: "我的订单",
      console: "工作台",
    },
    a11y: {
      toggleLanguage: "切换语言",
      close: "关闭",
      demandCurve: "需求曲线",
      openMenu: "打开菜单",
      loading: "加载中…",
    },
    banner: {
      testnet: {
        message: "测试网体验：用免费 test INJ 走完真实链上流程，资产无价值",
        cta: "领取 test INJ →",
      },
    },
    wallet: {
      connect: "连接钱包",
      wrongNetwork: "网络不对，点击切换",
      switching: "正在切换网络…",
      installMetaMask: "请安装 MetaMask →",
    },
    errorPage: {
      title: "页面出错了",
      body: "发生了未预期的错误。链上状态不受影响，可以重试或返回首页。",
      retry: "重试",
      home: "返回首页",
    },
    notFound: {
      title: "页面不存在",
      body: "你要找的页面不存在。",
      home: "返回首页",
    },
  },

  home: {
    hero: {
      title: "说出你愿意付的最高价。品牌据此下单，工厂据此生产。",
      sub: "你出的价全额托管进合约。成团只付统一清算价，差额自动退回；不成团全额退回。",
      cta: "看看正在开的批次",
    },
    steps: {
      title: "三步上手",
      stepLabel: "第 {n} 步",
      step1: "连接钱包（自动切换到 Injective 测试网）",
      step2: "领取免费 test INJ",
      step3: "给想要的东西出价",
    },
    batches: {
      title: "进行中的批次",
    },
    ticker: {
      openBatches: "接单中批次",
      orders: "订单总数",
      escrowed: "链上托管",
      escrowedValue: "{amount} test INJ",
      untilDeadline: "距截止",
    },
    // spec 009 §3.3 主理人叙事块：平台费 2% 与「你的」靠分段加粗；
    // 本 section 禁用 收益/回报/投资 字样（spec 009 §2.1 原则 1）。
    creator: {
      title: "不压货，也能开一条产线",
      sub: "给有社群、有想法，但不想为了一次尝试押上全部现金流的主理人。",
      cards: {
        noInventory: {
          title: "你不用先下单",
          body: "消费者的钱先全额锁进合约。够 MOQ 才生产，不够全员全额退。库存风险不在你身上。",
        },
        margin: {
          title: "你收零售差价",
          body1: "清算价 = 出厂价 × 你设的加价系数。成交那一刻链上记账，你自己领，平台不经手。平台费 ",
          fee: "2%",
          body2: "（大平台通常 8–12%）。",
        },
        responsibility: {
          title: "你承担什么",
          body1: "商品责任、质保、退换货、配送、社群运营。工厂是",
          your: "你的",
          body2: "供应商，不直接面对消费者。",
        },
      },
      flow: {
        label: "一个批次怎么跑",
        steps: ["选评论源", "AI 编译 SKU", "你确认上链", "工厂报价冻结", "社群出价", "清算", "你领差价"],
      },
      cta: "聊聊你的批次 →",
      note: "自助发起为 V1；当前批次由 MAKEBOOK 团队协助开设。",
    },
  },

  provenance: {
    onchain: "链上",
    aiGenerated: "AI 生成",
    humanConfirmed: "人工确认",
    demoFactory: "演示工厂",
    demoBrand: "演示品牌",
    offchainDemo: "链下演示",
    testnet: "测试网",
  },

  batch: {
    a: { name: "批次 A", badge: "演示：可成团" },
    b: { name: "批次 B", note: "演示：未达 MOQ 的批次", badge: "演示：未达 MOQ" },
    bracelet: { name: "社区批次" },
    card: {
      orders: "{n}/50 单",
      preview: "若现在截止：统一价 {price} test INJ，{count} 单成团",
      previewInfeasible: "未达 MOQ，当前不成团",
      closed: "已截止，等待清算",
      // spec 009 §2.1 原则 3：卡片 CTA 说明去向，不复用 hero CTA
      cta: "进入批次",
      // spec 009 §6-4：卡片 CTA 随批次状态分化；cta 留作未知/错误态兜底，
      // 已清算态复用 pledge.resultCta
      ctaBid: "去出价",
      ctaClosed: "已截止 · 等待清算",
    },
  },

  preview: {
    title: "需求编译中",
    note: "以下产品由 AI 从同一批用户评论编译，确认需求后开盘",
    status: "未开盘",
    from: "来自评论 {ids}",
  },

  status: {
    open: "接单中",
    closed: "已截止",
    succeeded: "已成团",
    failed: "未成团",
    countdownUntil: "距截止 {span}",
    countdown: {
      dhm: "{dd}天{hh}时{mm}分",
      hm: "{hh}时{mm}分",
      m: "{mm}分",
    },
    badge: {
      canClear: "可成团",
      belowMoq: "未满 MOQ",
    },
    orders: "{n}/50 单",
    ordersLabel: "订单数",
  },

  monument: {
    previewLabel: "统一清算价 · 若现在截止的预览",
    settledLabel: "统一清算价 · 清算结果",
    unit: "test INJ",
    context: "{orders} 单中 {winners} 单可成交 · {factory} · MOQ {moq}",
    contextSettled: "{orders} 单中 {winners} 单成交 · {factory} · MOQ {moq}",
  },

  product: {
    hashOk: "产品说明书 hash 已校验，与链上一致 ✓",
    hashBad: "说明书 hash 与链上不一致，请暂缓下单",
    specsFrom: "规格由 AI 从真实用户评论编译，人工确认后上链",
    specsTitle: "规格",
    manifestLoading: "加载中…",
    manifestError: "说明书加载失败",
    spec: {
      key: {
        capacity: "容量",
        color: "颜色",
        insert: "内胆",
        materials: "材质",
        charms: "吊坠",
        style: "风格",
        size: "尺寸",
      },
      value: {
        black: "黑色",
        removable: "可拆卸",
      },
    },
    // spec 009 §6-2：规格区下方的细节图 + 页面次级场景图（仅 FRAME-01 批次）
    detailStrapAlt: "FRAME-01 背带快拆扣细节",
    detailInsertAlt: "FRAME-01 可拆卸内胆",
    sceneAlt: "挂在书桌旁椅背上的 FRAME-01",
    trust: {
      toggle: "链上校验详情",
      manifestTitle: "说明书 JSON",
      canonicalNote:
        "canonicalHash：将 manifest JSON 的键递归按字典序排列后，对其 UTF-8 字节取 keccak-256",
      onchainNote: "链上合约 manifestHash() 的当前读数",
      match: "本地计算 hash 与链上锚点一致",
    },
  },

  pledge: {
    title: "出价预订",
    inputLabel: "你的最高愿付价（test INJ）",
    inputError: "请输入大于 0 的价格",
    chipHint: "参考价格点",
    feasibleNow: "按当前订单，这个价可以成团",
    infeasibleNow: "按当前订单，这个价暂不成团（清算后全额退回）",
    cta: "立即出价",
    connectCta: "连接钱包后出价",
    ordered: "你已出价 {price} test INJ · 查看订单",
    full: "本批 50 单已满",
    settleCta: "立即清算（任何人可触发）",
    resultCta: "查看清算结果",
  },

  quotes: {
    title: "工厂报价（出厂价）",
    empty: "暂无工厂报价",
    ordersSuffix: "单",
    row: "MOQ {minQty} 件 · 单价 {price} test INJ · 当前 {eligible} 单达标",
    headers: {
      factory: "工厂",
      moq: "MOQ",
      factoryPrice: "出厂价",
      retailPrice: "零售价",
      eligible: "达标",
      status: "结果",
    },
    result: {
      win: "中标",
      lost: "未中标",
    },
    reason: {
      win: "达标 {n} ≥ MOQ {moq} · 达标数最多 → 中标",
      infeasible: "达标 {n} < MOQ {moq} · 不可行",
      lost: "达标 {n} ≥ MOQ {moq}，但达标数少于 {winner} → 未中标",
    },
    tiebreak: "排序规则：eligibleCount 最大 → 出厂价低 → quoteId/tierIndex 小",
  },

  curve: {
    title: "需求曲线：每个价格点上有多少真实订单",
    yAxis: "订单数",
    xAxis: "价格 (test INJ)",
    legendDemand: "需求（该价格点的累计订单）",
    legendClearing: "统一清算价",
    legendFeasible: "可行工厂档位",
    legendInfeasible: "不可行工厂档位",
    clearingLabel: "统一清算价 {price} · {count} 单成团",
    tooltip: {
      price: "价位 {price} test INJ",
      orders: "≥ 此价共 {count} 单",
      clears: "达到清算价 · 成团",
      below: "低于清算价 · 未中选",
      infeasible: "未满 MOQ · 暂不成团",
    },
  },

  result: {
    title: "清算结果",
    factoryPaidOut: "工厂应收已领取，买家仍可领取退款",
    success: "本批已成团：统一价 {price} test INJ，共 {count} 单",
    failure: "未满 MOQ，本批未成团，全员全额退款",
    viewSettleTx: "查看清算交易 ↗",
    mine: {
      win: "你中了：应付 {clearing}，可领回差额 {diff} test INJ",
      lose: "未中选：可领回全额 {amount} test INJ",
      claimed: "已领取 ✓",
    },
    goClaim: "去领钱",
  },

  drawer: {
    title: "确认出价",
    step: "确认订单 → 钱包签名 → 完成",
    summary: "{product} × 1 · 你的最高愿付价 {price} test INJ",
    breakdown: {
      factory: "工厂出厂价",
      markup: "品牌加价 ×{factor}",
      youPay: "你支付（统一清算价）",
      ofWhich: "其中",
      creatorNet: "品牌实收",
      creatorNetNote: "（加价 − 平台费）",
      platformFee: "平台费",
      platformFeeNote: "（{pct}%）",
    },
    legal1:
      "你将预锁 {price} test INJ。若统一价不高于它，你会获得 1 件 {product}，并可领取差额；否则可领取全额。提交后不可撤销。",
    legal2:
      "你的钱包地址、最高愿付价和交易会公开出现在 Injective EVM Testnet。请勿使用含真实资产的主钱包。",
    check1: "我已知晓：提交后不可撤单",
    check2: "我已知晓：地址与出价将公开",
    submit: "签名并支付 {price} test INJ",
    signing: "等待钱包签名…",
    confirming: "链上确认中，请勿关闭…",
    success: "下单成功，已全额托管",
    viewOrder: "查看我的订单",
    viewTxBlockscout: "在 Blockscout 查看交易",
    retry: "重试",
  },

  orders: {
    subtitle: "管理你在所有进行批次中的出价与退款",
    empty: {
      connect: "连接钱包查看订单",
      connectBody:
        "连接钱包后，可查看你在所有批次中的活跃出价、退款与清算结果",
      none: "你还没有订单，去批次页看看",
    },
    bidLabel: "你的出价",
    escrowed: "托管中 · 截止 {date}",
    awaitingSettle: "已截止，等待清算",
    refundDiff: "已中选 · 可领回差额 {amount} test INJ",
    refundFull: "未中选/未成团 · 可领回全额 {amount} test INJ",
    noRefundNeeded: "已中选 · 无需退款（仍可点击完成标记）",
    claimed: "已领取 ✓",
    claim: "领取 {amount} test INJ",
    settle: "立即清算",
    viewTx: "查看交易 ↗",
  },

  console: {
    title: "工作台",
    role: {
      subtitle: "编译需求、监控批次、管理工厂应收",
      guest: "连接钱包以识别角色（品牌方 / 工厂）",
      viewer: "当前地址不是品牌方或已登记工厂，编译与监控可用，操作不可用",
      operator: "运营方（Operator）",
      factory: "已登记工厂",
      creator: "品牌主理人",
      platform: "平台费收款方",
      operatorNote: "Operator 操作（开批次 / 登记工厂 / 报价）走 CLI，私钥不进浏览器",
    },
    compile: {
      title: "需求编译",
      source: "评论来源：{source}（可切换相机包 / 手链评论集）",
      sourceLabel: "来源：",
      sourceCamera: "相机包（c01–c20）",
      sourceBracelet: "手链（b01–b20）",
      run: "编译",
      compiling: "编译中…",
      fixture: "Fixture（AI 服务降级，展示的是预置结果）",
      confirm: "人工确认并生成 manifest",
      humanConfirmTitle: "人工确认 manifest",
      editJsonHint:
        "编辑下方 JSON，确认后计算 canonicalHash 并与链上锚点比对",
      confirmHashButton: "确认并计算 hash",
      validComments: "条有效评论",
      candidates: "个候选",
      stats: "{valid} 条有效评论 · {candidates} 个候选",
      sourceFrom: "来自 {ids}",
      operational: "运营",
      confidence: {
        high: "高",
        medium: "中",
        low: "低",
      },
      hashOk: "manifestHash 与锚点一致 ✓",
      hashMismatch: "Hash 不一致：{hash}… 与锚点 {anchor}…",
      viewJson: "查看 manifest JSON",
      noWallet: "编译不需要钱包，AI 没有链上写权限",
      sourcePaste: "粘贴自己的评论",
      pasteHint: "每行一条评论，10–50 条",
      pasteCount: "{n} / 50 条",
      pasteTooFew: "至少需要 10 条非空评论才能编译",
      pasteTooMany: "超出上限，最多 50 条评论",
      noAnchor: "这是新 manifest 的 hash：{hash}…，可用来锚定新批次",
    },
    admin: {
      title: "批次监控",
      note: "新批次部署 / 工厂登记 / 报价由部署脚本完成（contracts/script/deploy-bracelet.sh），私钥不进浏览器",
      noQuotes: "无报价",
      clearing: "{price} · {count} 单成团",
      cleared: "{price} · {count} 单成交",
      headers: {
        batch: "批次",
        state: "状态",
        orders: "订单数",
        factoryQuotes: "工厂报价",
        currentPreview: "当前预览",
        deadline: "截止时间",
      },
    },
    factory: {
      title: "我的报价",
      none: "当前地址在该批次没有报价",
      win: "已中标 · 应收 {amount} test INJ",
      lose: "未中标",
      failed: "未成团，无应收",
      claim: "领取应收 {amount} test INJ",
      claimed: "应收已领取 ✓",
    },
    creator: {
      title: "我的批次",
      address: "品牌主理人地址",
      previewPrice: "当前预览零售价",
      expected: "预计品牌应收",
      actual: "实际应收",
      awaitingSettle: "清算后可领取",
      previewInfeasible: "按当前订单暂不成团，无应收",
      pending: "尚未清算",
      win: "已成团 · 品牌应收 {amount} test INJ",
      failed: "未成团，无应收",
      claim: "领取品牌应收 {amount} test INJ",
      claimed: "品牌应收已领取 ✓",
    },
    platform: {
      title: "平台费",
      address: "平台费收款地址",
      pending: "尚未清算",
      win: "已成团 · 平台费 {amount} test INJ",
      failed: "未成团，无平台费",
      claim: "领取平台费 {amount} test INJ",
      claimed: "平台费已领取 ✓",
    },
  },

  campaign: {
    contractLabel: "合约地址：",
    brand: {
      byline: "由 {brand} 发售",
    },
    evidence: {
      title: "链上证据",
      deployTxLabel: "部署交易：",
      activityTitle: "最近订单",
      activityEmpty: "暂无订单",
      viewAddress: "在 Blockscout 查看地址",
      copyAddress: "复制地址",
      copied: "已复制 ✓",
      bid: "出价 {amount} test INJ",
      time: {
        justNow: "刚刚",
        minutesAgo: "{n} 分钟前",
        hoursAgo: "{n} 小时前",
        daysAgo: "{n} 天前",
      },
    },
  },

  fundsSplit: {
    title: "每一分钱去哪了",
    // spec 009 §6-1：出价面板下方的紧凑小卡（右栏）
    cardTitle: "你这笔钱会怎么走",
    roles: {
      factory: "工厂",
      creator: "品牌",
      platform: "平台",
    },
    columns: {
      role: "角色",
      amount: "金额",
      share: "占比",
    },
    note: "每一笔都在清算时链上记账，三方各自领取，平台不经手品牌与工厂的钱",
    basisPreview: "按当前预览清算价，每件的分账",
    basisSettled: "按实际清算价，每件的分账",
    totals:
      "成交 {count} 单：工厂应收 {factory} · 品牌应收 {creator} · 平台费 {platform} test INJ",
  },

  notOpen: {
    title: "尚未开盘",
    body: "本批尚未部署，等运营方开盘后再来查看。",
  },

  errors: {
    ConnectRequired: "请先连接钱包",
    UserRejected: "你已取消签名，链上没有产生订单",
    WrongNetwork: "当前网络不对，点这里切到 Injective 测试网",
    InsufficientFunds: "test INJ 不足，先去免费领水",
    InvalidPayment: "支付金额必须等于你的最高愿付价",
    DuplicateOrder: "这个钱包已下过单，每批限 1 单",
    OrderLimitReached: "本批 50 单已满",
    CampaignNotOpen: "当前批次不在接单状态",
    WrongState: "当前阶段不能执行此操作，页面正在刷新到最新状态",
    DeadlinePassed: "本批已截止，等清算结果吧",
    DeadlineNotReached: "还没到截止时间，暂不能清算",
    NoOrder: "这个钱包在当前批次没有订单",
    AlreadyClaimed: "已领取过，不能重复领取",
    NotSelectedFactory: "只有中标工厂地址可以领取",
    NotCreator: "只有品牌主理人地址可以领取这笔应收",
    NotFeeRecipient: "只有平台费收款地址可以领取平台费",
    InvalidFeeConfig: "该批次的费率配置无效",
    TransferFailed: "转账失败，请重试（钱还在合约里，状态没变）",
    RpcError: "链上数据加载失败，正在重试",
    fallback: "操作未完成，资金未动，请重试",
  },
} as const;
