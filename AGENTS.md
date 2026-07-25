# MAKEBOOK 前端施工指南（给编码 Agent 的入口）

你是施工者，不是决策者。产品判断、视觉标准、文案、数值口径已全部定稿在下列文件里。你的工作：按图施工，按锚点验收。

## 开工前必读（按此顺序）

1. `specs/006-frontend-rebuild.md` — 做什么：页面、流程、状态机、验收锚点
2. `specs/007-frontend-construction.md` — 怎么施工：token、文件树、hooks 签名、逐字文案、任务分解 T1–T9
3. `.agents/skills/alan-design/SKILL.md` — 视觉权威，UI 呈现以此为准
4. `docs/FRONTEND_INTERFACE.md` — 链/AI 字段级细节（ABI、事件、错误码、hash 算法）

## 红线

- 禁止新增路由、页面、导航项、功能区块；禁止改写 copy.ts 已定稿文案
- 禁止在 UI 里手写演示数值（5 单、0.019 等只能来自链上读取）
- 禁止引入新色/新圆角/渐变/玻璃拟态/emoji 图标；只用 spec 007 §3 token
- 禁止改动 `lib/`、`contracts/`、`fixtures/`、`public/manifests/`、`deployments/`（前端只读消费）
- 遇到 specs 未覆盖的情况：停下来问，不自行发挥

## 环境

- Node ≥ 22.18；`npm run dev`（vinext）；测试 `npm run test:lib`
- 链：Injective EVM Testnet，Chain ID 1439；三套已部署 Campaign 见 `deployments/injective-testnet.json`

## 当前状态锚点（2026-07-25 P1 重部署验证）

**P1 三方分账已上线**（spec 008，2026-07-25）：合约 8 参构造（operator/creator/feeRecipient/manifestHash/manifestURI/deadline/marginBps/feeBps），清算价 = 零售价 = 出厂价 ×(1+marginBps/10000)，settle 记三笔账（工厂出厂价 / 平台费 / 品牌差价），品牌/平台/工厂三路各自 pull 领取；73 测试绿（51 P0 + 22 P1），ABI 44 函数/9 事件/24 错误（spec 001 §3 口径）。

批次 A（success，`0x260A9C9075B09B5950385fEB1AEa7d83a25E556e`）：Open，5 单（0.034/0.032/0.028/0.026/0.022），预览零售清算价 0.02375、成交 4（Loom 档；手算例：工厂 0.076 / 品牌 0.0171 / 平台 0.0019）；批次 B（failure，`0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9`）：Open，2 单（0.023/0.022），不可行；BRACELET-01（bracelet，`0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691`）：Open，0 单，manifestHash 锚点 `0x1c503957…c958dd` 不变。三套均 P1 参数（marginBps=2500、feeBps=200；creator `0x42a0c1B8fC4e804972Eb522C6C8043Ce72393B0a`、feeRecipient `0x04A47233230bEd2aE963cfA7DCCf4D59B77dE2D3` ≠ operator），已 Blockscout verify，deadline 统一 1785024000（2026-07-26 08:00 UTC+8，pitch 早晨现场 settle + 五路领取），operator `0x9d60cab786720520038008640b9f7ea56348DA89`，deployBlock 134614629 / 134614708 / 134615480，证据文件 `deployments/receipts/testnet-20260725-112855.jsonl`。线上地址：https://makebook-frontend.jiachexie6.workers.dev（P1 版 2026-07-25 上线，Cloudflare Workers）。P0 旧合约（`0xBcA0…`/`0x4415…`/`0x02Fb…`）已废弃，其锁定资金 2026-07-28 后可走旧合约 claimRefund 取回。

产品图：manifest 驱动（`scripts/product-images.manifest.json`，共 12 张），已全量生成（2026-07-25 02:54–02:55 重跑完成）：原"未生成"的 og-share、preview-backpack、preview-tote 三张已在库；hero-alt、scale-camera、scene-commute 三张已按 v2 提示词 `--force` 重生成，待人眼复验包型/文字/方向。遗留问题：scene-commute 与 og-share 实测仍为 768×1360 竖版，不符 `scripts/product-images.md` 的横幅 1360×768 要求，按该文档的升级报告路径处理，不擅自接受；manifest 中 6 张的 status 仍为 "pending"，元数据未回填。
