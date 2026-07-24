/**
 * 中文 UI 词典 —— key 集合与 en.ts 完全一致（缺失时 t() 回退英文）。
 * 品牌词与协议标签不翻译：MAKEBOOK、FRAME-01、Factory North/Loom、MOQ、
 * test INJ、六种来源标签（ONCHAIN / AI GENERATED / HUMAN CONFIRMED /
 * DEMO FACTORY / OFF-CHAIN DEMO / TESTNET）、Fixture 标签、wei/tx hash。
 * 措辞对齐 PRD 第 15 章中文原文（接口文档 2.1 人话映射表）。
 * `{name}` 为插值占位符，由 t(key, vars) 填充。
 */
export const zh: Record<string, string> = {
  // ------------------------------------------------------------- 共用
  "common.copied": "已复制",
  "common.copyValue": "复制 {value}",
  "common.ended": "已结束",
  "common.connectWallet": "连接钱包",
  "common.retry": "重试",
  "common.contract": "合约",
  "common.viewTx": "查看交易",
  "common.viewTransaction": "查看交易",
  "common.viewOnBlockscout": "在 Blockscout 查看",
  "common.ordersEscrowed": "已预锁订单",
  "common.closesIn": "距截止",
  "common.clearingPrice": "清算价",
  "common.clearingPreview": "清算价预览",
  "common.outcome": "结果",
  "common.backThisBatch": "支持本批次",
  "common.triggerSettlement": "触发清算",
  "common.claimAmount": "领取 {amount} test INJ",
  "common.noRefundDue": "无差额可退 · 标记已领取",
  "common.switchInjective": "切换到 Injective testnet",
  "common.manifestHash": "Manifest 哈希",
  "common.hackathonData": "黑客松缩放测试数据",
  "common.hackathonNoValue":
    "黑客松缩放测试数据 · Testnet INJ 无价值。",
  "campaign.success": "成功批次",
  "campaign.failure": "失败批次",
  "campaign.playground": "Playground 批次",
  "state.draft": "筹备中",
  "state.open": "开放中",
  "state.succeeded": "清算成功",
  "state.failed": "清算失败",
  "state.paidout": "工厂已领取",

  // ------------------------------------------------------------- 顶栏
  "topbar.langToggleAria": "切换到 English",
  "topbar.frameCampaign": "FRAME-01 批次",
  "topbar.nav.campaign": "批次",
  "topbar.nav.myBatch": "我的批次",
  "topbar.nav.evidence": "证据",
  "topbar.wrongNetwork": "网络错误",

  // ------------------------------------------------- 首页骨架
  "tabs.ariaLabel": "批次详情",
  "tabs.defaultAria": "批次版块",
  "tab.story": "需求证据",
  "tab.demand": "需求与报价",
  "tab.production": "生产计划",
  "tab.settlement": "结果与回执",
  "page.heroAria": "产品概览",
  "page.evidenceAria": "链上证据",

  // ------------------------------------------------------------ 演示面板
  "demo.openAria": "打开评委演示面板",
  "demo.closeAria": "关闭演示面板",
  "demo.dialogAria": "评委演示面板",
  "demo.kicker": "评委控制",
  "demo.title": "演示面板",
  "demo.intro":
    "仅供评委使用的开关，不属于买家路径。每个开关都会同时切换本页所有批次读取的模式。",
  "demo.scenario": "批次场景",
  "demo.scenario.successTitle": "成功脚本",
  "demo.scenario.successBody":
    "预置 5 个已托管订单 — 按统一清算价成交。",
  "demo.scenario.failureTitle": "失败脚本",
  "demo.scenario.failureBody":
    "2 个订单，没有档位达到 MOQ — 每位支持者领取全额退款。",
  "demo.scenario.playgroundTitle": "Playground",
  "demo.scenario.playgroundBody":
    "面向真实访客开放的批次 — 任何钱包可下一单。",
  "demo.rpcTitle": "RPC 故障模拟",
  "demo.rpcBody":
    "强制走「合约 → fixtures」降级路径。所有数字切换为 OFF-CHAIN DEMO 视图，不触碰网络。",
  "demo.rpcSwitchAria": "模拟 RPC 故障",
  "demo.rpcFallbackTag": "降级已生效",
  "demo.rpcFallback": "当前所有批次数字均为 fixture 数据。",
  "demo.reset": "重置为默认",
  "demo.addresses": "场景地址：",

  // ---------------------------------------------------------------- 首屏
  "hero.kicker": "FRAME-01 · 生产需求批次",
  "hero.positioning":
    "一个众筹批次：你的最高愿付价全额托管在链上，是否生产由工厂的 MOQ 报价决定 — 按公开规则，在公开截止时间。",
  "hero.loadingAria": "正在加载批次状态",
  "hero.status": "状态",
  "hero.tierViable":
    "{name} 的 {quantity} 件档当前可行 — {eligible} 个订单达到 {price} test INJ 单价。",
  "hero.noOrders": "还没有订单 — 第一批支持者将画出需求曲线。",
  "hero.noMoq":
    "当前没有工厂档位达到 MOQ — 若保持到截止，每个订单全额退款。",
  "hero.figuresNote": "批次数字：黑客松缩放测试数据。",
  "hero.operator": "批次运营方",
  "hero.operatorLoadingAria": "正在加载运营方地址",
  "hero.operatorOffline": "离线状态地址不可用",
  "hero.operatorNote":
    "黑客松演示用运营方身份。运营方登记工厂报价并开启批次 — 托管资金从不经过此钱包。",
  "hero.imgAlt":
    "FRAME-01 — 黑色 8L 模块化相机单肩包，配可拆卸内胆",
  "hero.spec.capacity": "容量",
  "hero.spec.color": "颜色",
  "hero.spec.insert": "内胆",
  "hero.spec.load": "装载",

  // ----------------------------------------------------------- 状态条
  "statusbar.title": "批次状态",
  "statusbar.loadingAria": "正在加载批次状态",
  "statusbar.toNearestMoq": "距最近 MOQ",
  "statusbar.moqMet": "MOQ 已达成",
  "statusbar.ordersShort": "还差 {count} 单",
  "statusbar.ctaNotOpen": "尚未开放",
  "statusbar.ctaClaimRefund": "领取退款",
  "statusbar.ctaClaimFull": "领取全额退款",
  "statusbar.ctaViewReceipt": "查看回执",
  "statusbar.note":
    "每个钱包限 1 单，全额托管预锁。若没有工厂 MOQ 达成，每个订单全额退款。",

  // ------------------------------------------------------------- AI 故事
  "story.kicker": "02 / 产品故事",
  "story.title": "这个产品是如何诞生的",
  "story.intro":
    "FRAME-01 始于二十条用户评论，而不是工厂目录。AI 编译器带着证据起草候选方案，由人确认一份规格书，其哈希在第一笔订单之前就写入了批次合约。",
  "story.step1Title": "评论",
  "story.step1Desc":
    "从访谈、论坛和问卷收集的 20 条用户输入",
  "story.step2Title": "AI 编译",
  "story.step2Desc":
    "AI 编译器起草产品候选方案，每个方案都关联评论证据",
  "story.step3Title": "人工确认",
  "story.step3Desc":
    "由人编辑并确认一份规格书 — AI 不直接交付",
  "story.step4Title": "Manifest 哈希",
  "story.step4Desc":
    "确认后规格书的 keccak256 写入批次合约",
  "story.stats": "{valid} 条有效输入 · 去除 {duplicates} 条重复",
  "story.fallbackReason": "降级原因：{reason}",
  "story.loadingAria": "正在编译评论",
  "story.empty": "这组评论没有返回候选方案。",
  "story.cardSpecs": "规格",
  "story.cardEvidence": "证据",
  "story.cardUnknowns": "未知项",
  "story.operationalAssumption": "运营假设",
  "story.confirmedLine": "{code} · 确认于 {date}",
  "story.stillUnknown": "仍未知",
  "story.manifestHashLabel": "Manifest 哈希（keccak256）",
  "story.copyHash": "复制完整 manifest 哈希",
  "story.hashNote":
    "这个哈希只证明一件事：这份规格书自写入批次合约以来未被改动。它不证明规格本身是否正确。",
  "story.footerNote": "评论集与批次数字：黑客松缩放测试数据。",

  // --------------------------------------------------------- 需求曲线
  "demand.kicker": "已预锁需求 · 订单簿",
  "demand.title": "需求曲线是真金白银",
  "demand.intro":
    "每个点统计的是在批次合约中至少托管了该价格的钱包数。没有点赞，没有注册 — 只有预锁的 test INJ。",
  "demand.loadingAria": "正在加载需求曲线",
  "demand.empty":
    "还没有已托管订单 — 第一笔订单落地后，曲线会自己画出来。",
  "demand.legendEscrowed": "已托管需求",
  "demand.legendViable": "可行档位（MOQ 已达成）",
  "demand.legendShort": "未达 MOQ 的档位",
  "demand.explainer":
    "每一级统计至少托管了该价格的钱包数。AI 兴趣样本（72 个）单独展示，永不进入清算。",
  "demand.aiSamples": "{count} 个兴趣样本 · 来自访谈与评论",
  "demand.axisY": "已预锁订单",
  "demand.axisX": "统一清算价 · TEST INJ",
  "demand.ariaPrefix": "已托管需求曲线：",
  "demand.ariaTiersPrefix": "工厂 MOQ 档位：",
  "demand.ariaPoint": "{orders} 单，价格 {price} test INJ",
  "demand.ariaTier":
    "{name} 最低 {quantity} 件，单价 {price} test INJ，{status}",
  "demand.ariaViable": "可行",
  "demand.ariaShort": "未达 MOQ",

  // ------------------------------------------------------- 工厂报价
  "quotes.kicker": "工厂报价 · MOQ 阶梯",
  "quotes.title": "工厂 MOQ 报价",
  "quotes.intro":
    "每家工厂在批次开放前提交了价格阶梯。当出到该档单价或更高的已托管订单数达到其最低数量时，该档可行 — 清算时由合约强制执行。",
  "quotes.thTier": "档位",
  "quotes.thMinQty": "最低数量",
  "quotes.thUnitPrice": "单价",
  "quotes.thEligible": "达标订单",
  "quotes.thFeasible": "可行性",
  "quotes.eligibleOrders": "{count} 单",
  "quotes.viable": "可行",
  "quotes.notMet": "未达成",
  "quotes.frozen":
    "报价自批次开放即冻结，现在无人能改。",
  "quotes.leadTime": "交期 35 天 · 链下备注",
  "quotes.empty": "该批次还没有工厂报价。",
  "quotes.loadingAria": "加载中",

  // --------------------------------------------------------- 下单面板
  "pledge.loadingAria": "正在加载批次面板",
  "pledge.connectNote":
    "连接钱包以托管你的最高愿付价 — 每个钱包限 1 单，锁定至批次清算。",
  "pledge.connectNoteClaim":
    "连接你下单时使用的钱包，以领取退款。",
  "pledge.connectButton": "连接钱包",
  "pledge.connecting": "连接中…",
  "pledge.connectHint":
    "钱包会请求你授权连接 — 此步不发送任何交易。",
  "pledge.wrongNetworkBody":
    "你的钱包在其他网络。下单与领取都在 Injective EVM Testnet（chain ID 1439）上进行。",
  "pledge.switchButton": "切换到 Injective Testnet",
  "pledge.switching": "切换中…",
  "pledge.faucetBody":
    "余额不足 — 去领免费 test INJ。此订单需托管 {amount} test INJ，另加约 0.001 作为 gas；当前钱包持有 {balance}。",
  "pledge.faucetWallet": "你的钱包",
  "pledge.faucetOpen": "打开测试币水龙头",
  "pledge.faucetRecheck": "我已领取",
  "pledge.faucetHint": "新钱包通过 hCaptcha 后可领取 1 个免费 test INJ。",
  "pledge.faucetNotePending":
    "暂未检测到新的 test INJ — 水龙头到账可能需要一分钟。",
  "pledge.faucetNoteFailed":
    "余额查询失败 — 请稍后重试。",
  "pledge.txConfirmed": "已确认",
  "pledge.batchStatus": "批次状态",
  "pledge.deadlineReached": "已到截止时间",
  "pledge.timeToDeadline": "距截止",
  "pledge.winnersSuffix": "test INJ · {count} 个中标",
  "pledge.batchFailedSuffix": "批次失败",
  "pledge.noOrdersYet": "还没有订单 — 做第一个。",
  "pledge.ordersInSuffix": "test INJ · 含 {count} 单",
  "pledge.noTierYet": "暂无档位达到 MOQ。",
  "pledge.oneOrderNote": "每个钱包可下 1 单 · 全额托管。",
  "pledge.claimsTitle": "领取",
  "pledge.claimsSuccess":
    "本批次按统一清算价 {price} test INJ 成交，共 {count} 个中标订单。",
  "pledge.claimsFailed":
    "没有工厂档位达到 MOQ，每个订单都可领取全额退款。",
  "pledge.yourRefund": "你的退款",
  "pledge.reasonFailed":
    "本批次未达到任何工厂 MOQ — 你的全额托管资金退回。",
  "pledge.reasonOutbid":
    "你的最高愿付价低于清算价 — 可领取全额退款。",
  "pledge.reasonExact":
    "你恰好按最高愿付价中标 — 无差额可退；标记已领取即可关闭回执。",
  "pledge.reasonDiff":
    "你按统一清算价中标 — 高出部分的差额退回。",
  "pledge.markedClaimed": "已标记领取",
  "pledge.refundClaimed": "退款已领取",
  "pledge.claimsNoOrder":
    "此钱包在本批次没有订单 — 无可领取。",
  "pledge.factoryPayout": "工厂应收",
  "pledge.factoryNote":
    "此钱包是中标工厂 — 应收 = 中标订单数 × 清算价。",
  "pledge.payoutClaimed": "工厂应收已领取",
  "pledge.claimPayout": "领取工厂应收 · {amount} test INJ",
  "pledge.paused":
    "暂时无法读取链上批次数据，下单与领取已暂停。面板当前显示的是缓存的演示数据。",
  "pledge.orderConfirmed": "订单已确认 — 托管已锁定",
  "pledge.yourOrder": "你的订单",
  "pledge.lockedInEscrow": "托管锁定中",
  "pledge.maxSuffix": "test INJ 上限",
  "pledge.orderTx": "订单交易",
  "pledge.orderNote":
    "每个钱包限 1 单 — 不可撤销、不可修改。截止后批次按统一清算价成交，退款（如有）在此开放领取。",
  "pledge.maxPriceLabel": "你的最高愿付价 · test INJ",
  "pledge.errorZero": "请输入大于 0 的价格。",
  "pledge.errorInvalid": "请输入有效的小数金额（最多 18 位小数）。",
  "pledge.quickPicksAria": "快捷选价",
  "pledge.formExplainer":
    "你现在把最高愿付价锁入合约。若统一清算价低于它，你领回差额；若批次失败或你落选，你领取全额退款。",
  "pledge.confirmNoCancel":
    "我理解此订单不可撤销、不可修改。",
  "pledge.confirmPublic":
    "我的钱包地址和最高愿付价将在 Injective testnet 上公开。",
  "pledge.reviewCta": "确认订单信息 · {amount} test INJ",
  "pledge.notOpenYet": "本批次尚未开放下单。",
  "pledge.pastDeadline":
    "已过截止时间 — 本批次等待清算。",
  "pledge.estimateWin":
    "若当前预览保持到清算，你可在清算后领回 {amount} test INJ。",
  "pledge.estimateOutbid":
    "低于当前清算价预览（{price} test INJ）— 落选 → 全额退款。",
  "pledge.estimateNoTier":
    "暂无档位达到 MOQ — 若截止时仍如此，你领取全额退款。",
  "pledge.reviewTitle": "确认你的订单",
  "pledge.reviewEdit": "修改",
  "pledge.reviewItem": "商品",
  "pledge.reviewMaxPrice": "你的最高愿付价",
  "pledge.escrowNote": "test INJ · 现在全额托管",
  "pledge.reviewRule1":
    "你按统一清算价支付，永远不会高于你的最高愿付价。",
  "pledge.reviewRule2": "此订单不可撤销、不可修改。",
  "pledge.reviewRule3":
    "你的钱包地址和最高愿付价将在 Injective testnet 上公开。",
  "pledge.confirmInWallet": "在钱包中确认…",
  "pledge.confirmLock": "确认并锁定 {amount} test INJ",
  "pledge.confirmOrder": "确认订单",
  "pledge.backToEdit": "返回修改",
  "pledge.footerNote": "Testnet INJ 无价值。黑客松缩放测试数据。",
  "pledge.error.order.CampaignNotOpen": "批次未开放，暂不能下单。",
  "pledge.error.order.DeadlinePassed":
    "已截止，本批次停止接单。",
  "pledge.error.order.InvalidPayment":
    "金额不符：托管金额必须严格等于你的最高愿付价且大于 0。",
  "pledge.error.order.DuplicateOrder":
    "该钱包已在本批次下过单 — 每个钱包限 1 单。",
  "pledge.error.order.OrderLimitReached": "本批次已满（50 单）。",
  "pledge.error.orderRejected":
    "你已在钱包中取消签名 — 未创建订单，资金未动。",
  "pledge.error.claim.WrongState": "清算完成后才能领取。",
  "pledge.error.claim.NoOrder": "该地址没有订单。",
  "pledge.error.claim.AlreadyClaimed":
    "你已领取过，不能重复领取。",
  "pledge.error.claim.NotSelectedFactory":
    "只有中标工厂地址可以领取。",
  "pledge.error.claim.TransferFailed":
    "转账失败，请重试（你的领取状态未改变）。",
  "pledge.error.claimRejected":
    "你已在钱包中取消签名 — 未提交任何交易。",
  "pledge.error.fallback": "交易失败，请重试。",

  // ------------------------------------------------------ 清算（05）
  "settlement.kicker": "05 / 清算",
  "settlement.title": "清算如何运作",
  "settlement.intro":
    "一笔公开交易，一个公开截止时间。合约选出中标档位和所有中标者的统一价格 — 事后没有谈判。",
  "settlement.rules.1": "截止时间一到，任何人都可以触发清算。",
  "settlement.rules.2":
    "合约选出达标订单最多的档位；并列时取更低价格。每个中标者都按这一个价格支付。",
  "settlement.rules.3":
    "若没有档位达到 MOQ，所有人领取全额退款。",
  "settlement.toggleNote":
    "Injective testnet 上部署了两个批次。切换即可对照实时合约状态，预览两种结局。",
  "settlement.cardSettled": "已清算 · {state}",
  "settlement.cardPreview": "若现在清算",
  "settlement.winningFactory": "中标工厂",
  "settlement.everyWinnerPays": "每个中标者都按此价支付",
  "settlement.winners": "中标数",
  "settlement.winnersValue": "{total} 单中 {winners} 单中标",
  "settlement.factoryReceivable": "工厂应收",
  "settlement.settlementTx": "清算交易",
  "settlement.batchFailed": "批次失败",
  "settlement.reason": "原因",
  "settlement.noTierWithOrders": "没有档位达到 MOQ（{orders} 单）",
  "settlement.lowestMoqSuffix": "，最低 MOQ {min}",
  "settlement.refunds": "退款",
  "settlement.refundAll": "每位支持者领取全额退款",
  "settlement.leadingTier": "当前领先档位",
  "settlement.leadingTierValue": "{name} · {quantity}+ 件 @ {price}",
  "settlement.ordersThatClear": "可成交订单",
  "settlement.ordersOfTotal": "{total} 单中 {winners} 单",
  "settlement.factoryWouldReceive": "工厂将收到",
  "settlement.everyWinnerPaysLabel": "每个中标者支付",
  "settlement.higherEscrows": "高出部分可领回差额",
  "settlement.wouldFail": "将会失败",
  "settlement.ordersOnBooks": "簿上订单",
  "settlement.lowestMoqIs": "最低 MOQ 为 {min}",
  "settlement.noTierRefundAll":
    "没有档位达到 MOQ — 所有人领取全额退款",
  "settlement.selectedFactory": "中标工厂",
  "settlement.allocTitle": "分配预览",
  "settlement.allocFactoryCost": "工厂成本",
  "settlement.allocCostNote": "清算价 × 中标数",
  "settlement.allocBrandMargin": "品牌毛利",
  "settlement.allocPlaceholder": "占位",
  "settlement.allocPlatformFee": "平台费",
  "settlement.allocNote":
    "P0 平台费设计为 0；真实费率会在开放前冻结。",
  "settlement.finalTitle": "清算已是最终状态，且在链上。",
  "settlement.finalBody":
    "支持者的退款与中标工厂的应收，都在{link}中领取。",
  "settlement.finalLink": "「支持本批次」面板",
  "settlement.triggerTitle": "清算触发",
  "settlement.triggerNote":
    "无需许可 — 截止时间一过，任何人都可以发送。",
  "settlement.opensIn": "距开放",
  "settlement.notYet": "还没到时间 — 清算于 {date} 开放。",
  "settlement.connectToSettle": "连接钱包以触发清算",
  "settlement.settleConfirmed":
    "清算交易已确认 — 正在刷新结果。",
  "settlement.errorDeadline": "未到截止时间，还不能清算。",
  "settlement.errorNotOpen": "清算已完成或尚未开盘。",
  "settlement.errorWrongState":
    "本批次清算已完成。",
  "settlement.errorRejected":
    "你已取消钱包签名 — 未提交任何交易。",
  "settlement.errorFallback": "交易失败，请重试。",

  // ------------------------------------------------------ 生产计划
  "plan.kicker": "生产计划",
  "plan.title": "从清算到发货",
  "plan.intro":
    "从批次成交到产品送到支持者手中，中间有三个里程碑。",
  "plan.m1Name": "打样",
  "plan.m1Timing": "第 1–2 周 · 清算成功后",
  "plan.m1Desc":
    "中标工厂生产两件样品，由运营方对照已确认的 manifest 验收。",
  "plan.m2Name": "量产",
  "plan.m2Timing": "第 3–6 周",
  "plan.m2Desc":
    "按链上锁定的统一清算单价，投产中标档位的数量。",
  "plan.m3Name": "发货",
  "plan.m3Timing": "第 7–8 周",
  "plan.m3Desc":
    "产品发给支持者。收货地址与物流信息在链下收集（V1）。",
  "plan.note": "链下演示时间线。合约不追踪生产。",

  // ----------------------------------------------- 证据页脚（06）
  "footer.kicker": "06 / 证据与边界",
  "footer.title": "本页一切皆可验证",
  "footer.intro":
    "合约、manifest 与清算交易都是公开的。这里写明在哪里验证 — 以及它们不能证明什么。",
  "footer.onchainRefs": "链上引用",
  "footer.manifestHashBoth": "Manifest 哈希（两个批次共用）",
  "footer.manifestFile": "Manifest 文件",
  "footer.view": "查看",
  "footer.verified": "Blockscout 上的已验证源码：",
  "footer.verifiedSuccess": "成功",
  "footer.verifiedFailure": "失败",
  "footer.boundaries": "边界",
  "footer.b1Title": "Testnet INJ 无价值",
  "footer.b1Body":
    "本页所有金额均以 Injective EVM Testnet 的 test INJ 计价，不可出售、兑换或赎回。",
  "footer.b2Title": "演示工厂是团队控制的钱包",
  "footer.b2Body":
    "Factory North 和 Factory Loom 是团队运营的钱包。其 MOQ 报价仅供演示，自批次开放即冻结。",
  "footer.b3Title": "生产与物流是链下演示",
  "footer.b3Body":
    "清算之后的一切都不是承诺。制造、质量与交付仅作演示，不作保证。",
  "footer.b4Title": "Manifest 哈希只证明一件事",
  "footer.b4Body":
    "它证明公开的规格文件自批次开放以来未被改动。它不证明需求、质量或交付。",
  "footer.note":
    "黑客松缩放测试数据 — 金额、订单与报价均为演示按比例缩小。",

  // -------------------------------------------------- /me 领取中心
  "me.kicker": "我的 / 领取中心",
  "me.title": "我的批次",
  "me.intro":
    "你在所有已部署批次中的 FRAME-01 订单、每笔订单清算后的可领金额，以及 test INJ 的领取入口。",
  "me.connectTitle": "连接你的钱包",
  "me.connectBody":
    "连接你支持 FRAME-01 时使用的钱包。你的订单、可领退款和水龙头地址会显示在这里。",
  "me.connectedWallet": "已连接钱包",
  "me.wrongNetwork":
    "网络错误 — 领取在 Injective EVM Testnet（chain 1439）上进行。",
  "me.switchNetwork": "切换网络",
  "me.emptyTitle": "还没有订单 — 支持 FRAME-01",
  "me.emptyBody":
    "此钱包在任何已部署批次中都没有订单。去批次页面锁定最高愿付价 — 你的订单与每笔退款都会显示在这里。",
  "me.emptyCta": "支持 FRAME-01",
  "me.campaignState": "批次状态",
  "me.yourMaxPrice": "你的最高愿付价",
  "me.orderStatus": "订单状态",
  "me.orderTx": "订单交易",
  "me.claimed": "已领取 — 此订单没有剩余可领。",
  "me.waitSettlement":
    "清算完成后开放领取 — 请在截止时间后回来查看。",
  "me.claimConfirmed": "领取已确认 — 正在刷新你的订单。",
  "me.outcomeFailed": "批次失败 — 全额退款",
  "me.outcomeFailedReason":
    "没有工厂档位达到 MOQ，你的全额托管资金退回。",
  "me.outcomeOutbid": "落选 — 全额退款",
  "me.outcomeOutbidReason":
    "你的最高愿付价低于清算价（{price} test INJ）— 可领取全额退款。",
  "me.outcomeWinnerDiff": "中标 — 统一价差额",
  "me.outcomeWinnerExact": "中标 — 恰好按清算价支付",
  "me.outcomeWinnerDiffReason":
    "每个中标者按统一清算价（{price} test INJ）支付 — 高出部分的差额退回。",
  "me.outcomeWinnerExactReason":
    "你恰好按最高愿付价中标 — 无差额可退；标记已领取即可关闭回执。",
  "me.outcomeOpenExpired": "开放中 — 已过截止时间，等待清算",
  "me.outcomeOpen": "开放中 — 截止时清算",
  "me.outcomeNotSettled": "{state} — 清算尚未发生",
  "me.refundsAfterSettlement": "清算完成后需主动领取。",
  "me.previewWin":
    "当前预览：有望以 {price} test INJ 中标 — 你可领回 {amount}。",
  "me.previewOutbid":
    "当前预览：低于清算价（{price} test INJ）— 你将领取全额退款。",
  "me.previewNoTier":
    "当前预览：没有档位达到 MOQ — 若清算时仍如此，全额退款。",
  "me.errorAlreadyClaimed": "你已领取过 — 此订单已了结。",
  "me.errorWrongState": "清算完成后需主动领取。",
  "me.errorNoOrder": "该地址在此批次没有订单。",
  "me.errorTransferFailed":
    "转账失败 — 你的领取状态未改变，请重试。",
  "me.errorRejected":
    "你已取消钱包签名 — 未提交任何交易。",
  "me.errorFallback": "交易失败，请重试。",
  "me.unavailableBody":
    "暂时无法读取该批次的链上数据 — 演示数据绝不会用于你的订单或领取。",
  "me.faucetLabel": "水龙头",
  "me.faucetTitle": "需要 test INJ？",
  "me.faucetBody":
    "新钱包通过 hCaptcha 后可领取 1 个免费 test INJ — 足够支持 FRAME-01 并在之后领取退款。",
  "me.faucetOpen": "打开 Injective 水龙头",
  "me.faucetYourWallet": "你的钱包：",
  "me.faucetConnectHint": "连接钱包后即可复制地址。",
  "me.slotLoadingAria": "{label} 加载中",

  // ------------------------------------------------------ /evidence 证据页
  "ev.kicker": "证据",
  "ev.title": "一切在链上可验证",
  "ev.intro":
    "已部署的 FRAME-01 批次、它们的实时状态，以及运维 CLI 执行的每一笔交易 — 每个 testnet 哈希都深链到 Blockscout。",
  "ev.successNote":
    "脚本化演示 — 批次清算成功，中标者领取差额。",
  "ev.failureNote":
    "脚本化演示 — 没有档位达到 MOQ，所有人领取全额退款。",
  "ev.playgroundNote": "开放实例 — 任何访客都可以支持这个批次。",
  "ev.playgroundPending":
    "部署进行中 — 一旦开放实例地址写入 deployments/injective-testnet.json，此卡片即显示其合约详情。",
  "ev.metaNote":
    "部署元数据：deployments/injective-testnet.json · 实时状态：链上 RPC 读取",
  "ev.receiptsTitle": "交易回执",
  "ev.receiptsIntro":
    "回执日志由运维 CLI 在批次运行时写入（deployments/receipts/*.jsonl）。testnet 行深链到 Blockscout；本地 anvil 排练行只展示、不链接 — 区块浏览器从未见过它们。",
  "ev.receiptsEmpty":
    "还没有回执 — 运维 CLI 会在批次运行时为每笔交易追加一行。",
  "ev.colTime": "时间 (UTC)",
  "ev.colCampaign": "批次",
  "ev.colAction": "操作",
  "ev.colActor": "操作方",
  "ev.colNetwork": "网络",
  "ev.colTransaction": "交易",
  "ev.networkLocal": "本地 anvil",
  "ev.deadline": "截止时间",
  "ev.liveState": "实时状态",
  "ev.liveOrders": "{count} 单",
  "ev.liveFailed": "实时读取失败",
};
