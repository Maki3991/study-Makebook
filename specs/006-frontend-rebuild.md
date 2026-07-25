# Spec 006 · 前端重建：用户上手 Demo（v2 极简版）

> v2 改写说明（2026-07-25）：产品定位从"评委演示机"改为**给用户上手的 demo**。原则：页面能少则少、解释能砍则砍、主链路一路走通、全部接真链上线。v1 中评委向内容（逐条清算解释、规则长文、FAQ、证据墙、AI Studio、证据页、标签图例）全部移除；签名前知情同意保留（那不是解释，是保护用户）。接口字段仍以 `docs/FRONTEND_INTERFACE.md` 为唯一事实来源。

## 0. 链上实况（2026-07-25 P1 三方分账重部署后验证，非估算）

P1（spec 008）：清算价 = 零售价 = 出厂价 ×1.25（marginBps=2500），settle 三笔账，品牌/平台/工厂三路领取。

| Campaign | 地址 | state | orders | previewSettlement |
|---|---|---|---|---|
| success | `0x260A9C9075B09B5950385fEB1AEa7d83a25E556e` | Open | 5/50（0.034/0.032/0.028/0.026/0.022） | feasible，零售统一价 0.02375，成交 4 单 |
| failure | `0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9` | Open | 2/50（0.023/0.022） | 不可行（零售 0.02375 无人达标） |
| bracelet | `0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691`（manifestHash `0x1c503957…c958dd`，已校验锚定） | Open | 0 | 新批次从 0 单起步，前 3 单成团是天然传播点 |

- deadline：1785024000（= 2026-07-26 08:00 UTC+8，pitch 当天早晨现场 settle），三套相同；两套 FRAME-01 的 manifestHash 与锚点 `0x92e96e07…cc6ec` 一致（bracelet 为 `0x1c503957…c958dd`）；operator `0x9d60cab786720520038008640b9f7ea56348DA89`；creator `0x42a0c1B8…93B0a`、feeRecipient `0x04a47233…E2D3`。
- 数据源：`ACL-team/deployments/injective-testnet.json`（已回填真实地址与 P1 参数字段，live 模式成立；`makebook/` 仓的同名文件仍是占位，不供前端使用）。
- **运营注意**：① 三套 Campaign 都在 Open，访客仍可下单——failure 批次当前 2 单，再来 1 单 ≥0.02375（零售价）就会变可行，"失败示例"可能被用户行为改变；② deadline 2026-07-26 08:00 UTC+8 过后用户无法下单，完整流程断在第一步；pitch 后若继续开放社区试用，需再跑 `demo-pipeline.sh testnet up` 把 `DEADLINE` 设到新的未来时点。

## 1. 用户完整流程（全角色）

**买家 / 社区用户（主链路）**：

```
① 连钱包          ② 领水              ③ 出价下单          ④ 等待截止/触发清算      ⑤ 领钱
Connect →      MetaMask 缺币 →     项目页输入 maxPrice →   deadline 后任何人点      我的订单里
自动切 1439    faucet 领 test INJ   确认+双勾选+签名        「立即清算」→ 看结果      一键领取差额/全额
```

**全部角色链路总览**：

| 角色 | 完整链路 | 入口 |
|---|---|---|
| 买家 | 发现商品 → 了解 → 出价托管 → 看状态 → 清算 → 领差额/全额 → 凭证 | `/` → `/campaigns/*` → `/orders` |
| 访客（无钱包） | 只读浏览全部页面；截止后可连钱包触发 settle | 全部页面只读 |
| 品牌方 / Operator | 粘贴评论 → AI 编译出候选 → 人工确认 manifest + hash → 监控批次状态与报价 → 清算后看结果与工厂收款 | `/console`（新批次部署/工厂登记/报价刻意留在脚本：`contracts/script/deploy-bracelet.sh`，私钥不进浏览器，这是安全特性） |
| 工厂（DEMO FACTORY） | 查看自己的报价与批次状态 → 清算后看是否中标 → 中标则一键领取应收（claimPayout，资金动作有 UI） | `/console`（按钱包地址自动识别） |

配套事实：出价即全额托管（msg.value == maxPrice）；每钱包每批次限 1 单；不可撤单；成交只付统一清算价、差额自动可领；不满 MOQ 全员全额退；工厂应收 = 成交数 × 清算价，清算即锁定、claimPayout 一笔领走。

## 2. 信息架构（5 个页面 + 1 个抽屉，无其他路由）

```
/                     首页：一句话 + 三步上手条 + 商品网格（在售区 + 需求编译中预告区）
/campaigns/success    项目页（FRAME-01 批次 A）：产品 + 出价 + 状态 + 结果，全部在这页
/campaigns/failure    项目页（FRAME-01 批次 B，未满 MOQ 示例）：同上结构
/campaigns/bracelet   项目页（BRACELET-01 手链批次）：同上结构
/orders               我的订单：跨批次汇总 + 领取
/console              工作台：品牌方（AI 编译 + 批次监控）与工厂（报价 + 领取应收），按钱包角色自动切换
（下单确认为项目页内抽屉，不单独路由）
```

显式不做：AI Studio、证据页、独立清算结果页、FAQ、评论区、搜索、分类、多语言切换之外的任何运营入口。演示失败退款不需要解释页——失败批次页本身就是演示。

## 3. 逐页规格

### 3.1 `/` 首页

| 区块 | 内容 | 数据 |
|---|---|---|
| 顶栏 | LOGO + 导航（项目 / 我的订单 / 工作台）+ 钱包按钮（未连=连接；已连=截断地址；错网=红色一键切换 1439） | 钱包 |
| TESTNET 细条 | "测试网体验：用免费 test INJ 走完真实链上流程，资产无价值" + faucet 链接 | 固定 |
| Hero | 一句话："说出你的最高愿付价，工厂按真实需求生产。" + CTA「开始体验」 | 固定 |
| 三步上手条 | ① 连钱包 ② 领 test INJ（faucet 深链）③ 出价，三步图标卡；已连钱包自动勾掉第①步 | 钱包状态 |
| 在售区（商品网格） | 3 张商品卡：FRAME-01 批次 A（摄影斜挎包，主图 hero.png）/ FRAME-01 批次 B（未满 MOQ 示例批，配图 hero-alt.png）/ BRACELET-01 手链批次（主图 bracelet-01/hero.png）。每卡：产品图、名称、批次徽标（接单中/已截止/已成团/未成团）、订单数 n/50、当前预览统一价、倒计时。点击进对应项目页 | `state()` `ordersLength()` `previewSettlement()` `deadline()`，三套 Campaign 各自独立 |
| 需求编译中（预告区） | 2 张预告卡：Black 10L Urban Short-trip Backpack、Commuter Tote with Removable Insert（lib/ai fixture 的真实候选，来自同一批评论 c10/c13）。徽标"需求编译中 · 未开盘"，**无购买按钮**；卡底小字露出来源评论 id。点击不跳转 | fixtures + lib/ai 候选，静态内容 |

### 3.2 `/campaigns/[id]` 项目页（全流程主阵地）

| 区块 | 内容 | 数据 |
|---|---|---|
| 状态条 | 徽标（接单中/已截止/已成团/未成团）+ 倒计时 + 订单数 n/50 + 当前预览（"若现在截止：统一价 0.02375，4 单成团"或"暂未满 MOQ"） | `state()` `deadline()` `ordersLength()` `previewSettlement()`，10s 轮询 |
| 产品卡 | 产品图、名称、规格简表（直接渲染 manifest `specs[]` 全部行，当前为 capacity 8L / color black / insert removable 共 3 条，UI 配中文 key 映射）；一行小字：规格由 AI 从用户评论编译、人工确认上链，hash 可复制 | manifest `specs[]`；hash 由 lib/schema 计算 |
| 出价面板 | 金额输入（test INJ）+ 建议价 chips（0.020 / 0.024 / 0.030，跨零售档两侧，spec 008 §1）+ 即时反馈"当前可成团/暂不能"+ CTA「立即支持」；已下单则显示"你已出价 X · 查看订单" | `previewSettlement()` + `getOrder(我的地址)` |
| 工厂条件简表 | 两行：工厂 A MOQ 3 @ 0.024（差 n 单）/ 工厂 B MOQ 3 @ 0.019（可成团）；工厂名旁小字"演示工厂" | `getQuote` + eligibleCount 重算 |
| 需求曲线（轻量） | 价格点 × 累计订单数阶梯图 + 当前清算价竖线；一屏高，不配长文 | `OrderPlaced` 事件 + `getOrder` |
| 清算结果区 | 截止前隐藏；清算后显示：统一价 / 成交人数 / 我中了没 / 「去领钱」按钮；失败批次显示"未满 MOQ，全员全额退款" | `CampaignSettled` 事件 |
| 底部 | 合约地址 + manifestHash 小字可复制（一行，不展开） | deployments |

**下单确认抽屉**（点「立即支持」弹出，签名前最后一屏，强制元素逐字保留）：

1. 摘要：产品 ×1 + 你的 maxPrice + 当前预览结果；
2. 原文文案："你将预锁 {maxPrice} test INJ。若统一价不高于它，你会获得 1 件 {SKU}，并可领取差额；否则可领取全额。提交后不可撤销。"；
3. 原文提示："你的钱包地址、最高愿付价和交易会公开出现在 Injective EVM Testnet。请勿使用含真实资产的主钱包。"；
4. 双勾选：☐ 不可撤单已知晓 ☐ 信息公开已知晓（未全勾按钮禁用）；
5. 提交后状态机：待签名 → 链上确认中（禁重复点）→ 成功（显示 tx 链接 +「查看我的订单」）/ 失败（§5 人话 + 重试）。

### 3.3 `/orders` 我的订单

| 区块 | 内容 | 数据 |
|---|---|---|
| 未连接 | "连接钱包查看订单"单按钮空态 | — |
| 订单卡 | 每批次一卡：批次名、我的出价、状态（托管中/待清算/可领差额 X/可领全额 X/已领取）、主按钮（「去清算」或「领取 X test INJ」）、tx 链接 | `getOrder` + `state()` + settlement 读函数 |
| 领取反馈 | 成功后标记已领取 + RefundClaimed tx 链接；差额 0 显示"无需退款"仍可点击标记 | `claimRefund()` receipt |

状态文案：Open=托管中；已截止=待清算（按钮「立即清算」，任何访客可触发）；Succeeded 且 maxPrice≥clearingPrice=可领差额（金额=差值）；低于=可领全额；Failed=可领全额；PaidOut=已领取（或仍可领）。

### 3.4 `/console` 工作台（品牌方 + 工厂，按钱包角色自动切换）

| 区块 | 内容 | 数据 |
|---|---|---|
| 角色条 | 显示当前钱包角色：未连接 / 普通地址 / 品牌方（operator）/ 已登记工厂；未连接给连接按钮 | 钱包 + `operator()` + `isRegisteredFactory(addr)` |
| 品牌方 · 需求编译 | 评论输入区（预填 fixtures/comments.json 或 bracelet-comments.json，可切换）→「编译」调 /api/compile → 候选卡 ×2–3（每条 spec 带来源评论 id，fixture 降级时标 Fixture）→「人工确认」→ 显示 manifest JSON + canonicalHash（lib/schema 计算）+ 与锚点一致性提示。**全程不需要钱包，AI 无写链权限** | /api/compile + lib/schema |
| 品牌方 · 批次监控 | 全部已部署 Campaign 状态表：状态、订单数、工厂报价、当前预览、deadline；一行说明"新批次部署/工厂登记/报价由部署脚本完成（contracts/script/deploy-bracelet.sh），私钥不进浏览器" | 注册表全部读函数 |
| 工厂 · 我的报价 | 仅当当前钱包是已登记工厂：我的报价卡（工厂地址、tiers、是否中标） | `getQuote` + `hasQuoted` + `winningQuoteId` |
| 工厂 · 领取应收 | 清算成功且我是中标工厂：显示应收金额（factoryReceivable）+ 「领取应收 X test INJ」按钮（claimPayout）；已领取显示 PaidOut + tx 链接；未中标/未成团显示结果文案 | `state()` `selectedFactory()` `factoryReceivable()` `factoryPayoutClaimed()` |
| 非角色地址提示 | 普通地址：编译与监控可用，操作区显示"当前地址不是品牌方或已登记工厂，操作不可用" | — |

## 4. 状态机 → 按钮可用性（精简矩阵）

| Campaign 状态 | 项目页 CTA | 订单页按钮 | 工作台工厂区 |
|---|---|---|---|
| Open 未截止 | 「立即支持」（满 50 换"已满员"；已下单换"查看订单"） | 无操作（托管中） | 报价卡只读 |
| Open 已截止 | 「立即清算」 | 「立即清算」 | 报价卡只读 |
| Succeeded | 「查看结果」 | 「领取差额/全额」（已领则置灰"已领取"） | 中标工厂：「领取应收」；未中标：结果文案 |
| Failed | 「查看结果」 | 「领取全额」（已领则置灰） | "未成团，无应收" |
| PaidOut | 「查看结果」 | 仍可领取（未领者） | "应收已领取 ✓" + tx 链接 |

## 5. 错误文案（用户能遇到的全部情况）

| 场景 | 文案 |
|---|---|
| 拒签 | 你已取消签名，链上没有产生订单 |
| 错网 | 当前网络不对，点这里切到 Injective 测试网 |
| 余额不足 | test INJ 不足，先去免费领水（faucet 链接） |
| InvalidPayment | 支付金额必须等于你的最高愿付价 |
| DuplicateOrder | 这个钱包已下过单，每批限 1 单 |
| OrderLimitReached | 本批 50 单已满 |
| DeadlinePassed | 本批已截止，等清算结果吧 |
| DeadlineNotReached | 还没到截止时间，暂不能清算 |
| NoOrder | 这个钱包在当前批次没有订单 |
| AlreadyClaimed | 已领取过，不能重复领取 |
| TransferFailed | 转账失败，请重试（钱还在合约里，状态没变） |
| NotSelectedFactory | 只有中标工厂地址可以领取 |
| WrongState | 当前阶段不能执行此操作，页面正在刷新到最新状态 |
| RPC 读取失败 | 链上数据加载失败，正在重试 |
| 其余 revert | 操作未完成，资金未动，请重试 |

## 6. 数据层（live-first，无模式切换 UI）

1. 启动读 `deployments/injective-testnet.json`：地址非零 → live（当前即此态）；读函数 10s 轮询（`state`/`ordersLength`/`previewSettlement`/`deadline`）；`OrderPlaced` 事件从 `deployBlock` 起拉一次后增量续拉，买家列表只能来自事件（接口文档 §2.2）。
2. 写函数以 receipt 事件解码为成功凭证（不信"没 revert"）。
3. manifestHash 展示值 = lib/schema 实时计算，禁硬编码。
4. fixtures 仅作本地开发降级（改代码注入，不给用户可见的"Demo 模式"开关）；若线上读取持续失败，显示加载失败文案，**不静默切假数据**。
5. i18n：界面中文为主（用户上手场景），产品数据（manifest/评论）保持英文原文；金额一律等宽数字 + test INJ。

## 7. 视觉方向（遵循 alan-design）

> ⚠️ 【本节已失效 2026-07-25】视觉权威已迁移至 `specs/009-ux-polish.md` §1（设计 Token 契约）/ §2（文案打磨）+ `.agents/skills/alan-design/SKILL.md`。本节的"白/软白画布 + 功能蓝 accent"已被代码推翻——实际视觉为暖纸底 `#F5F3EF` + 赭红 `#B23A18`。本节保留作历史记录，施工与验收以 spec 009 为准。

视觉标准的权威文件是 `.agents/skills/alan-design/SKILL.md`（设计师个人标准，已随仓安装）。一切 UI 决策——配色、字体、间距、组件形态、动效——以它为准；本节只写 MAKEBOOK 的落地决定，不复制其全文。

- **设计目标**：像一个真实的量产产品页面，不像黑客松通宵产物；用户 30 秒理解、3 步走完主流程。
- **视觉性格**：克制、编辑感、建筑感。白/软白画布 + 炭黑正文 + 冷灰辅助 + **唯一**受控 accent（建议单一功能蓝，承担 CTA 与可交互态；状态色另计：成功绿/失败红/警示橙）。禁紫蓝渐变、玻璃拟态、发光边框。
- **版式**：强网格，桌面端项目页左内容右 sticky 出价面板（众筹范式）；信息横向分组，不用"一句一卡"纵向堆叠；每屏至多一个主视觉锚点；细分隔线代替盒子套盒子。
- **字体**：一套 grotesk 系无衬线承担 Latin + 数字，中文走系统中黑体（PingFang SC / Microsoft YaHei），中英混排视觉兼容；全部金额等宽数字；禁可爱圆体、伪未来字体、细到难读的正文。
- **组件**：卡片只用于真实对象（批次卡、订单卡、产品卡）；radius ≤8px；按钮阴影克制；步骤条、抽屉、toast 用 shadcn/ui 抄改后统一 token。
- **动效**：只做状态反馈（opacity/transform，150–250ms，克制缓动）；无入场动画、无滚动触发、无 hover 位移；尊重 reduced-motion。
- **图像**：产品图是结构元素——单张高质量渲染或精确 SVG 线稿，禁止占位图、低质外链图、与内容无关的装饰图。
- **密度与移动端**：信息横向展开而非纵向堆卡；移动端保持层级、简化构图不删内容；触控目标 ≥44px。
- **验收方式**：实现后按 SKILL.md §16 completion checklist 逐项过，三档宽度实机目检（不凭代码猜效果）；设计评审按 §14 打分制，低于 80 继续打磨最高影响项，不堆装饰。

## 8. 技术栈与上线

保留工程壳（Next.js 16/vinext + Tailwind 4），新增 wagmi v2 + RainbowKit v2（连接/错网切换开箱即用）+ shadcn/ui（抽屉、按钮、卡片、toast 直接抄）+ TanStack Query（轮询缓存）。开源参照：scaffold-eth-2 的合约 hooks 模式（github.com/scaffold-eth/scaffold-eth-2）、juice-interface 的出资面板结构（github.com/jbx-protocol/juice-interface）。`app/` 旧代码全删，唯一保留重建 `app/api/compile/route.ts` 标准实现（本 demo 无 AI 页入口，但保留接口不影响）。

上线（Cloudflare，wrangler 已在依赖）checklist：

- [x] `demo-pipeline.sh testnet up` 重新部署，`DEADLINE` 设到上线之后（建议 +72h），回填 deployments（P1 已完成 2026-07-25：三套 Campaign 以 8 参构造重新部署，DEADLINE=1785024000 = 2026-07-26 08:00 UTC+8）
- [ ] 两套批次链上状态复核：`status` 命令 + 首页肉眼对得上
- [ ] MetaMask 走通全流程：连接→切 1439→faucet→下单→（时间到）settle→claimRefund
- [ ] 390×844 单列无横向滚动、触控目标 ≥44px
- [ ] `wrangler deploy` 后生产 URL 全流程复走一遍

## 9. 验收锚点

- [ ] 用户五步流程（§1）在生产环境用新钱包从零走通，每步不超过 2 次点击到达下一步
- [ ] 项目页所有数字与链上 `status` 只读结果一致（当前锚点：批次 A 5 单/预览 0.019×4；批次 B 2 单/不可行）
- [ ] 签名前两段原文 + 双勾选逐字存在，未勾选不可提交（接口文档 §2.1）
- [ ] §5 错误表每条实际触发过一遍（拒签/错网/重复单/重复领取至少必测）
- [ ] 差额 0 的赢家显示"无需退款"且可点击（FR-BUY-07）；刷新/换设备后订单从事件恢复（FR-BUY-06）
- [ ] 视觉按 alan-design §16 checklist 实机目检通过（三档宽度、无横向滚动、无 AI 模板感），评审打分 ≥80
- [ ] 旧前端零迁移：grep 确认 `app/` 无旧组件残留（除 `api/compile/route.ts`）
