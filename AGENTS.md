# MAKEBOOK 前端施工指南（给编码 Agent 的入口）

你是施工者，不是决策者。产品判断、视觉标准、文案、数值口径已全部定稿在下列文件里。你的工作：按图施工，按锚点验收。

## 开工前必读（按此顺序）

1. `specs/006-frontend-rebuild.md` — 做什么：页面、流程、状态机、验收锚点
2. `specs/007-frontend-construction.md` — 怎么施工：token、文件树、hooks 签名、逐字文案、任务分解 T1–T9
3. `specs/009-ux-polish.md` — **UX 打磨定稿（2026-07-25）：视觉 token、字号阶梯、文案、品牌方登场、量纲修复。视觉与文案上取代 006 §7 与 007 §3/§6（那两节写白底+功能蓝，已被代码推翻，实际为暖纸底 #F5F3EF + 赭红 #B23A18）**
4. `.agents/skills/alan-design/SKILL.md` — 视觉权威，UI 呈现以此为准
5. `docs/FRONTEND_INTERFACE.md` — 链/AI 字段级细节（ABI、事件、错误码、hash 算法）

## 红线

- 禁止新增路由、页面、导航项、功能区块；禁止改写 copy.ts 已定稿文案
- 禁止在 UI 里手写演示数值（5 单、0.019 等只能来自链上读取）
- 禁止引入新色/新圆角/渐变/玻璃拟态/emoji 图标；只用 spec 009 §1 token（007 §3 已失效）
- 禁止改动 `lib/`、`contracts/`、`fixtures/`、`public/manifests/`、`deployments/`（前端只读消费）
- 遇到 specs 未覆盖的情况：停下来问，不自行发挥

## 环境

- Node ≥ 22.18；`npm run dev`（vinext）；测试 `npm run test:lib`
- 链：Injective EVM Testnet，Chain ID 1439；三套已部署 Campaign 见 `deployments/injective-testnet.json`

## 子系统：预测市场 predictions/（2026-07-25 新增，独立于主前端）

针对 success 批次清算结果的多结果 LMSR 预测市场，明天 pitch 演示用。与上面"红线"约束的主前端完全解耦：`predictions/` 是独立 Vite SPA（暗色 + motion/NumberFlow 动画），不走 vinext、不消费 spec 006/007。

- 合约 `contracts/src/MakebookPredictionMarket.sol`（LMSR AMM，prb-math SD59x18，max-subtraction 防溢出；resolve() 任何人可调，代触发 campaign.settle() 后读 winningQuoteId/winningTierIndex 映射结果，零预言机；结果集 = 全部 (quoteId,tierIndex) 档 + 末尾"流团"；1 股 = 1e18 = 猜中兑 1 INJ；b=0.005 INJ，种子 0.01 INJ ≥ b·ln(3)）
- 接口 `contracts/src/interfaces/IMakebookCampaign.sol`；部署脚本 `contracts/script/DeployPrediction.s.sol`（枚举链上档位）；测试 `contracts/test/MakebookPredictionMarket.t.sol`（17 个，含 fork 端到端 + fuzz 偿付不变式）；forge 全套 90 绿
- 已部署三个市场（均 b=0.005 INJ、种子 0.01 INJ、Blockscout 已 verify；注册表 `predictions/deployments.json`，不动 `deployments/`）：
  - success 批次 → `0xceacbb4bda362130ce4e3839b438737395ee1799`（deployBlock 134625833）
  - failure 批次 → `0x18f51d0A951C3bfF9cBA7E02731337DbD7beB1B2`（deployBlock 134630883）
  - bracelet 批次 → `0x6aC7b18FCF315Db46DBF6a783E65C5671e0788c4`（deployBlock 134630933）
- 前端多市场：`predictions/src/chain/config.ts` MARKETS 注册表驱动；hash 路由 `#/` 市场列表 + `#/m/:id` 详情页；所有 hooks 参数化 `MarketMeta`；`npm run dev:predictions` / `build:predictions`；wrangler 静态部署 `predictions/wrangler.json`（name: makebook-predictions）；运行时冒烟 `node scripts/predictions-check.mjs`（需先 `npm run preview:predictions`）
- 新增市场流程：`CAMPAIGN_ADDRESS=0x... forge script contracts/script/DeployPrediction.s.sol --broadcast` → 注册表加条目 + 产品图放 `predictions/public/` → 重新 build+deploy 即可
- 注意：Injective testnet 有 multicall3（`0xcA11…CA11`），viem 链定义须显式配置 `contracts.multicall3` 否则 `client.multicall` 报 "multicallAddress is required"
- foundry 新增依赖 `contracts/lib/prb-math`（v4.1.2，foundry.toml 已加 remapping）

## 当前状态锚点（2026-07-25 P1 重部署验证）

**P1 三方分账已上线**（spec 008，2026-07-25）：合约 8 参构造（operator/creator/feeRecipient/manifestHash/manifestURI/deadline/marginBps/feeBps），清算价 = 零售价 = 出厂价 ×(1+marginBps/10000)，settle 记三笔账（工厂出厂价 / 平台费 / 品牌差价），品牌/平台/工厂三路各自 pull 领取；73 测试绿（51 P0 + 22 P1），ABI 44 函数/9 事件/24 错误（spec 001 §3 口径）。

批次 A（success，`0x260A9C9075B09B5950385fEB1AEa7d83a25E556e`）：Open，5 单（0.034/0.032/0.028/0.026/0.022），预览零售清算价 0.02375、成交 4（Loom 档；手算例：工厂 0.076 / 品牌 0.0171 / 平台 0.0019）；批次 B（failure，`0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9`）：Open，2 单（0.023/0.022），不可行；BRACELET-01（bracelet，`0x0c4A1bee6B352C7916560774BBda408c3E47d595`，2026-07-25 下午重部署为**社区批次**）：Open，0 单，manifestHash 锚点 `0x1c503957…c958dd` 不变，deadline **1785571630（2026-08-01 16:07 UTC+8，+7 天，覆盖 Expo 与社区试用）**，deployBlock 134634908，已 Blockscout verify。三套均 P1 参数（marginBps=2500、feeBps=200；creator `0x42a0c1B8fC4e804972Eb522C6C8043Ce72393B0a`、feeRecipient `0x04A47233230bEd2aE963cfA7DCCf4D59B77dE2D3` ≠ operator），已 Blockscout verify；FRAME-01 A/B deadline 统一 1785024000（2026-07-26 08:00 UTC+8，pitch 早晨现场 settle + 五路领取），operator `0x9d60cab786720520038008640b9f7ea56348DA89`，A/B deployBlock 134614629 / 134614708，证据文件 `deployments/receipts/testnet-20260725-112855.jsonl`。线上地址：https://makebook-frontend.jiachexie6.workers.dev（P1 版 2026-07-25 上线，Cloudflare Workers）。bracelet 旧合约 `0x8Bb41E71…`（P1 首轮）与 `0x78b3A38C…`（一次误用 .env DEADLINE 的部署）均已废弃、0 单、无资金锁定，到期自然失效；`contracts/script/deploy-bracelet.sh` 已加 `DEADLINE_OVERRIDE` 防再犯。P0 旧合约（`0xBcA0…`/`0x4415…`/`0x02Fb…`）已废弃，其锁定资金 2026-07-28 后可走旧合约 claimRefund 取回。

产品图：manifest 驱动（`scripts/product-images.manifest.json`，共 12 张），已全量生成（2026-07-25 02:54–02:55 重跑完成）：原"未生成"的 og-share、preview-backpack、preview-tote 三张已在库；hero-alt、scale-camera、scene-commute 三张已按 v2 提示词 `--force` 重生成，待人眼复验包型/文字/方向。遗留问题：scene-commute 与 og-share 实测仍为 768×1360 竖版，不符 `scripts/product-images.md` 的横幅 1360×768 要求，按该文档的升级报告路径处理，不擅自接受；manifest 中 6 张的 status 仍为 "pending"，元数据未回填。
