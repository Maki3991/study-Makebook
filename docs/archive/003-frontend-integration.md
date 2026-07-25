# Spec 003 · 前端集成与数值对齐

> ⚠️ 【已归档 2026-07-25】本文施工坐标（mock-data.ts、story-screens、Demo Panel）已全部删除，被 specs/006 取代。数值口径（0.019×4 / MOQ 3 / 应收 0.076）仍与 fixtures/success.json 一致，保留作历史参考。

> 面向前端（Alan）。接口字段细节以 `docs/FRONTEND_INTERFACE.md` 为唯一入口；本 spec 管"mock 如何换成真数据"与"两边数值必须一致"。
> 原则：界面结构与视觉系统不动；只替换数据源与修正数值。

## 1. 数据源优先级（每个数值只能有一个来源）

| 数据 | 来源 | 标签 |
|---|---|---|
| 订单、maxPrice、需求曲线 | 合约 `OrderPlaced` 事件 + `getOrder` | ONCHAIN |
| 工厂 tiers、可行性 | `getQuote` + `previewSettlement` | ONCHAIN |
| 清算结果 | `CampaignSettled` 事件 / settlement 读函数 | ONCHAIN |
| AI 候选、证据、unknowns | `/api/compile`（lib/ai） | AI GENERATED（+ Fixture 标签当 fixture:true） |
| 确认版 manifest 与 hash | `public/manifests/frame-01.json` + lib/schema | HUMAN CONFIRMED |
| 生产进度 | 固定文案 | OFF-CHAIN DEMO |
| 合约地址未部署（零地址）时全部数值 | `fixtures/*.json` | OFF-CHAIN DEMO |

合约地址从 `deployments/injective-testnet.json` 读取；address 为零地址时进入 fixture/Demo 模式（接口文档第 8 节）。

## 2. 数值对齐清单（当前 mock 与 fixtures/PRD 附录 A 的偏差）

以下数值以 `fixtures/success.json` / `fixtures/failure.json` 为准（即 PRD 附录 A 缩放剧本）。前端现有 mock 是手写近似值，接入前请逐项对齐——评审会按清算规则手算，对不上会扣分。

**成功 Campaign（Buyer A–E：maxPrice 0.026 / 0.024 / 0.021 / 0.019 / 0.017）**

| 位置（文件:行附近） | 当前 mock | 应为 |
|---|---|---|
| `app/lib/mock-data.ts` demandPoints | `0.017→6, 0.019→5` | `0.017→5, 0.019→4`（0.021→3、0.024→2、0.026→1 已正确） |
| `app/lib/mock-data.ts` factoryTiers.loom | `quantity: 5, eligible: 5` | `quantity: 3, eligible: 4` |
| story-screens aria-label | "Loom 的 5 件档位" | "Loom 的 3 件档位" |
| 需求曲线 SVG 标注 | `WINNER · LOOM · MOQ 5 @ 0.019` | `MOQ 3 @ 0.019`；y 轴上限 6 可保留或改 5 |
| Settlement 指标卡 | 成交订单 5、中标 MOQ 5、工厂应收 0.095 | 成交订单 **4**、中标 MOQ **3**、工厂应收 **0.076**（4 × 0.019） |
| Settlement 解释第 02 条 | "有 5 笔 maxPrice 足够的订单" | "有 4 笔" |
| 解释第 03 条 | "满足 MOQ，且总成本最低" | "满足 MOQ，且为唯一可行档位"（North 2 < 3 不可行，未触发价格 tie-break） |
| Campaign 页可行性提示 | "5 件档位可成批" | "3 件档位可成批" |

**失败 Campaign**：最低 MOQ 3 件、有效订单 2 笔、全员全额退款、factoryReceivable = 0（当前 mock 文案写"最低 MOQ 5 件""至少 5 笔"，需改为 3）。

**个人退款示例**：买家 maxPrice 0.024、清算价 0.019 → 退差额 0.005（当前 mock 已正确）；落选（如 0.017）退全额。

需求曲线 y 轴坐标是按订单数 × 40px 画的，改为 5 上限后 SVG 坐标需同步重算。

## 3. Demo Panel 状态 ↔ 真实链状态映射

现有 Demo Panel 四组开关保留，接入真实链后语义对应：

| Demo Panel 开关 | 真实来源 |
|---|---|
| 合约读取 ready/loading/error | viem readContract 的 promise 状态 + RPC 重试 |
| 钱包网络 correct/wrong | `wallet_getChainId` === 1439，wrong 时一键切换 |
| 下一次签名 success/reject | 钱包签名回调（reject = 用户取消，按 PRD 15 文案提示） |
| 清算场景 success/failure | 读 `deployments/injective-testnet.json` 里 success / failure 两个合约地址切换 |

## 4. 签名前必须出现的元素（PRD FR-BUY-02/05/09）

- SKU、deadline、工厂 tiers、需求曲线、风险声明，不藏在滚动后；
- "不可撤单 + 公开性"确认勾选，未勾选不能发起交易；
- 确认文案与公开性提示用接口文档 2.1 节原文。

## 5. 验收锚点

- [ ] 上表所有数值与 `fixtures/success.json` / `failure.json` 逐项一致
- [ ] 评委手算路径成立：0.019 价格点 4 笔 ≥ MOQ 3 → Loom 中标、统一价 0.019、应收 0.076
- [ ] 零地址 deployments 时全站 fixture 可跑通并标 OFF-CHAIN DEMO
- [ ] manifestHash 显示值 = `0x92e96e07…cc6ec`（lib/schema 计算，非硬编码）
- [ ] 金额显示 ≤4 位有效小数，地址截断可复制，tx 带 Blockscout 深链
