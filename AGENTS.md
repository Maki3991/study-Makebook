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
- 链：Injective EVM Testnet，Chain ID 1439；两套已部署 Campaign 见 `deployments/injective-testnet.json`

## 当前状态锚点（2026-07-25 验证）

批次 A（success）：Open，5 单，预览统一价 0.019、成交 4；批次 B（failure）：Open，2 单，不可行；BRACELET-01（bracelet）：**待部署**（运营执行 `contracts/script/deploy-bracelet.sh` 后自动回填 deployments，manifestHash 锚点 `0x1c503957…c958dd`）。原两批 deadline 2026-07-26 06:00 UTC+8，社区上线前需重新部署推后 deadline（spec 006 §8）。

产品图：manifest 驱动（`scripts/product-images.manifest.json`，共 12 张），已全量生成（2026-07-25 02:54–02:55 重跑完成）：原"未生成"的 og-share、preview-backpack、preview-tote 三张已在库；hero-alt、scale-camera、scene-commute 三张已按 v2 提示词 `--force` 重生成，待人眼复验包型/文字/方向。遗留问题：scene-commute 与 og-share 实测仍为 768×1360 竖版，不符 `scripts/product-images.md` 的横幅 1360×768 要求，按该文档的升级报告路径处理，不擅自接受；manifest 中 6 张的 status 仍为 "pending"，元数据未回填。
