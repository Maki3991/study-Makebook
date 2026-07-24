# MAKEBOOK 前端架构（MVP 产品化版）

> 目的：把全部需求（PRD v1.0 + v2 草案 + spec 001–005）映射为一套**像真实众筹平台**的前端信息架构，供实现 agent 施工。
> 核心转向：从"四步评审叙事"升级为"产品主页 + 角色控制台"。四步叙事压缩进产品页，评审路径不丢失。
> 纪律：数据源优先级（合约 → fixtures 降级）与六种来源标签不变；P0 已实现 / V1 设计在 UI 上永不混称（OFF-CHAIN DEMO 标签）；金额全程 wei bigint。

## 0. 三类 Campaign 实例（部署拓扑决定 IA）

| 实例 | 用途 | 用户可下单？ |
|---|---|---|
| Success（`0x378b…b03d`） | 演示剧本：26 日 settle 后展示成功路径 | 仅演示钱包（已预置 5 单） |
| Failure（`0x01c5…5f51`） | 演示剧本：失败 + 全额退款 | 仅演示钱包（已预置 2 单） |
| **Playground（待部署）** | 真实用户体验场：任何访客可下单 | **开放**（deadline 设在演示日后） |

产品主页默认展示 Playground（真实体验）；Demo Panel 可切到剧本实例（评审路径）。

## 1. 角色 → 界面地图

| 角色 | 入口 | 能做什么 |
|---|---|---|
| 访客 / 买家 | 产品主页 `/` | 浏览、连钱包、领测试币、下单、看曲线、settle（截止后）、领退款/差额、看凭证 |
| 品牌方 / Operator | 品牌工作室 `/studio` + 运营台 `/console` | AI 编译、编辑确认 SKU、生成 manifest、登记工厂、审核报价、开盘（P0 由团队用 CLI；UI 化是 V1） |
| 工厂 | 工厂台 `/factory` | 提交 MOQ 报价（Draft 期）、看 eligibleCount、中标后领应收 |
| 评委 | 产品主页 + Demo Panel（隐藏） | 切换剧本/体验场、模拟异常态、亲手 settle、验 manifestHash |

## 2. 信息架构（页面树）

```
/                       产品主页（= Campaign 详情页，众筹平台气质）
├─ Hero 区              产品大图、名称、来源标签、主理人卡
├─ 成团状态条           已预锁 X 单 / 距最近 MOQ 还差 Y 单 / 当前可成价 / 倒计时
├─ 常驻 CTA             「支持 TA」→ 唤起下单抽屉（全状态机）
├─ 页签 1 需求证据       评论 → AI 编译 → 人工确认 的可追溯链（AI GENERATED/HUMAN CONFIRMED 标签）
├─ 页签 2 需求与报价     需求曲线（链上订单）+ 工厂 MOQ 档位卡（可行绿/不可行灰）
├─ 页签 3 生产计划       里程碑时间线（打样→大货→发货，OFF-CHAIN DEMO 占位）
├─ 页签 4 结果与凭证     settle 后激活：清算解释、分配预览、个人凭证、Blockscout 深链
/pledge（抽屉/弹层）     完整购买流程（见 §3.3）
/me                    我的：我的订单、可领金额、领取中心、领测试币入口
/studio                AI 需求工作室（品牌方）：粘贴评论 → 编译 → 候选卡 → 编辑 → 确认 → manifestHash
/console               运营台（operator）：Campaign 信息、登记工厂、报价审核、开盘、证据汇总
/factory               工厂台：报价表单（1–3 档，minQty 递增/单价递减校验）、 eligibility 监视、claimPayout
/evidence              证据页：全部 tx 深链 + 复核指引（docs/EVIDENCE.md 的页面化）
Demo Panel（隐藏抽屉）   评审开关：剧本/体验场切换、异常态模拟、重置
```

## 3. 功能 → 界面映射

### 3.1 后端功能（合约 × 流水线 → UI）

| 功能 | 合约/工具 | UI 位置 | 现状 |
|---|---|---|---|
| 连接钱包 / 错网切换 | useWallet / switchChain | 全局 header + 下单抽屉 | ✅ 已实现 |
| 浏览 Campaign / 曲线 / 报价 | reads.ts（getQuote/orders/previewSettlement） | 产品主页页签 1/2 | ✅ 已实现 |
| 下单 | placeOrder（payable） | 下单抽屉 | ✅ 已实现 |
| 触发清算 | settle（截止后任何人） | 状态条按钮 + 页签 4 | ✅ 已实现（需复核曝光度） |
| 领退款 / 差额 | claimRefund | /me 领取中心 + 页签 4 | ✅ 已实现 |
| 工厂领应收 | claimPayout | /factory + 页签 4 | 已实现，需复核入口 |
| 登记工厂 | registerFactory | /console | ❌ 仅 CLI → 需 UI（P0 可留 CLI，页面只读展示） |
| 提交报价 | submitQuote | /factory 报价表单 | ❌ 仅 CLI → **需 UI**（工厂体验闭环缺这条腿） |
| 开盘 | openCampaign | /console | ❌ 仅 CLI → P0 可留 CLI |
| 部署新 Campaign | Deploy.s.sol / 流水线 | /console（V1） | ❌ P0 不做 UI |
| 部署 Playground | 流水线 | —（运维动作） | ❌ 待执行 |
| 事件 → tx 证据 | OrderPlaced 等 7 事件 | /evidence + 各处深链 | ✅ 已实现 |

### 3.2 AI 功能（FR-AI-01~09 → UI）

| 需求 | UI 位置 | 现状 |
|---|---|---|
| 粘贴 10–50 条评论、显示有效/空行/重复 | /studio 输入区 | ⚠️ 需从 mock 升级为真实输入框 |
| 脱敏（邮箱/手机→占位符） | 路由内自动 + UI 提示"已脱敏" | ✅ 后端有，UI 提示待加 |
| 2–3 候选卡（title/specs/evidence/unknowns/confidence） | /studio 候选区 | ✅ 有（mock 源），接 /api/compile 已有 client |
| 规格可追溯到 commentId | 候选卡 evidence 链接到评论 | ⚠️ 需强化（贡献者标记 = V2 版税占位） |
| priceSignals 标"非资金承诺" | 候选卡价格区 | ⚠️ 需复核标签 |
| 编辑/删除规格、确认时展示 diff 与 unknowns | /studio 编辑器 | ❌ 需实现（人工闸门的核心交互） |
| 确认 → canonical JSON → manifestHash | 确认按钮 → 展示 hash（HUMAN CONFIRMED） | ⚠️ lib 有，UI 串联待做 |
| 无 key 时 fixture 降级 + 标签 | 全局 | ✅ 已实现 |
| 真实 provider 联调 | —（运维） | ❌ 网关 429 待重试 |

### 3.3 完整购买功能（FR-BUY-01~09 → 下单抽屉状态机）

下单抽屉必须是**全状态机**，每一步用户都知道"钱在哪、规则是什么"：

```
[连接钱包] → [检查网络 1439] → [领测试币（余额不足时）] → [输入 maxPrice]
→ [规则确认页：SKU/统一价逻辑/不可撤单/公开性（勾选）] → [签名 pending]
→ [成功：tx 深链 + 曲线刷新] → [截止后：settle 或看结果] → [领取：差额/全额]
```

| 需求 | 现状/缺口 |
|---|---|
| 错网一键切换（FR-BUY-01） | ✅ |
| 签名前看 SKU/deadline/tiers/曲线/风险（FR-BUY-02） | ⚠️ 分散在各页签，确认页需汇总 |
| 每钱包 1 单（FR-BUY-03） | ✅（含 getOrder 预检） |
| maxPrice + 同额预锁预览（FR-BUY-04） | ⚠️ 加"余额检查" |
| **领测试币引导** | ❌ **新增**：余额 < maxPrice+gas 时，下单按钮替换为"领取免费 test INJ"（faucet 链接 + 复制地址 + 已领切换回下单）。空投脚本由后端备（批量转账）。 |
| 不可撤单 + 公开性勾选（FR-BUY-05/09） | ✅（已绑定 maxPrice 输入） |
| Pending 防重复 / 状态恢复（FR-BUY-06） | ✅ |
| 差额/全额领取（FR-BUY-07/08） | ✅（/me 领取中心需复核） |

### 3.4 他们的需求（spec 005 / v2 → 界面）

| 需求 | 界面回答 |
|---|---|
| 买家：不被宰 | 确认页写清"你只付统一清算价，差额自动退" |
| 买家：规则可验证 | 页签 4 逐条解释 eligibleCount vs minQty；manifestHash 现场可验（引导文案） |
| 买家：失败必退 | 状态条与页签常驻"不成团全额退款" |
| 买家：收货（V1） | 页签 3 生产计划占位 + 文案"链上凭证 + 链下收集，V1" |
| 工厂：需求真实 | 曲线只统计链上订单，AI 兴趣样本分开展示（已在） |
| 工厂：收款确定 | /factory 显示"清算即锁定应收"，中标后 claimPayout |
| 主理人：赚钱与角色 | **主理人卡**（hero）+ 页签 4 **分配预览三行**（工厂成本/品牌溢价/平台费，OFF-CHAIN DEMO） |
| 平台：不碰钱 | 页签 4 写"合约无 ownerWithdraw，资金按冻结规则分配" |
| 评委：亲手验证 | settle 按钮对所有人可见（截止后）+ manifestHash 验证引导 |
| 真实用户：完整体验 | Playground 实例 + 领币引导 + /me 领取中心 |

## 4. 状态机 → 关键按钮可用性（沿用 spec 003 §3，补 UI 位置）

| 状态 | 状态条主按钮 | 下单 | settle | 领取 |
|---|---|---|---|---|
| Open（未截止） | 「支持 TA」 | ✅ | ❌ | ❌ |
| Open（已截止） | 「触发清算」 | ❌ | ✅ 任何人 | ❌ |
| Succeeded | 「领取差额/退款」 | ❌ | ❌ | ✅ |
| Failed | 「领取全额退款」 | ❌ | ❌ | ✅ |
| PaidOut | 「查看凭证」 | ❌ | ❌ | ✅ |

## 5. 施工优先级（对 26 日演示）

**P0（必须有，阻塞真实体验）**：Playground 部署；领测试币引导；下单抽屉确认页汇总；/me 领取中心复核；主理人卡 + 分配预览占位（OFF-CHAIN DEMO）；产品主页信息架构改造（状态条 + 常驻 CTA + 页签）。
**P1（强烈建议）**：/studio 真实输入与编辑确认闸门；页签 3 生产计划占位；证据页页面化。
**P2（可砍）**：/factory 报价 UI（保留 CLI，页面只读）；/console UI（保留 CLI）。
**不做（V1+）**：部署 Campaign UI、多 Campaign 列表、真实 KYB、讨论区。

## 6. 不变量（任何改造不得破坏）

1. 合约 → fixtures 降级链路与六种来源标签；2. P0/V1 实现状态永不混称；3. 金额 wei bigint、≤4 位小数显示；4. PRD 15 章文案不改写；5. 四步评审路径仍可走通（Demo Panel 保留）；6. 移动端 390×844 / 投屏 1024×768 / 桌面 1920×1080 三档验收。
