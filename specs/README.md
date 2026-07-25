# MAKEBOOK Specs（SDD 规格索引）

本目录是团队的 Spec-Driven Development 单一事实来源。优先级关系：

1. **PRD**（产品需求文档 v1.0，团队外部文档）定义"做什么、为什么"；
2. **本目录 specs** 定义"模块之间如何对接、验收以什么为准"，与代码同仓演进；
3. **代码与测试** 是最终真相；spec 与代码冲突时，先改代码再同步 spec，并在 commit 中说明。

PRD v1.0 为仓外文档（不在本仓库内）。

## 规则

- 改接口（ABI、事件、错误码、JSON 结构、hash 算法、fixtures 数值）必须先改对应 spec，再改代码。
- 每个 spec 末尾的"验收锚点"是可机器/人工复核的检查项，评审前逐项过。
- 前端对接的唯一入口仍是 `docs/FRONTEND_INTERFACE.md`；specs 管决策与变更，接口文档管字段细节。

## 索引

| Spec | 主题 | 状态 |
|---|---|---|
| [001](001-campaign-contract.md) | 清算合约：状态机、ABI 冻结、不变量与测试映射 | 已实现（73/73 测试，含 P1 三方分账 22 例） |
| [002](002-ai-compiler.md) | AI 需求编译器：I/O 契约、脱敏、fixture 降级 | 已实现（9/9 测试） |
| [003](../docs/archive/003-frontend-integration.md) | 前端集成：mock → 链上替换规则与数值对齐清单 | 已归档（被 006 取代，2026-07-25 移入 `docs/archive/`） |
| [004](004-testnet-deployment.md) | Testnet 预部署与演示证据 | 已完成（2026-07-25 三套 Campaign 重新部署并预下单，见 deployments/injective-testnet.json） |
| [005](005-stakeholder-requirements.md) | 三方真实需求矩阵：P0 机制 / 有意推迟 / 永不承诺 | 已评审 |
| [006](006-frontend-rebuild.md) | 前端重建：用户上手 demo（极简三页 + 真链全流程） | 已完成（T1–T9 全部落地并上线） |
| [007](007-frontend-construction.md) | 前端施工蓝图：token/文件树/hooks/逐字文案/任务分解（零判断施工版） | 已完成（同 006） |
| [008](008-p1-three-way-split.md) | P1 三方分账 + 社区上线：creator/feeRecipient/marginBps/feeBps、零售清算价、三路领取、叙事对齐 | 已上线（2026-07-25：73 测试绿、三套 P1 合约部署+verify、前端 P1 版上线） |

## 变更记录

| 日期 | 变更 | 影响面 |
|---|---|---|
| 2026-07-24 | 初始四份 spec 建立 | 全仓 |
| 2026-07-24 | demo 数据英文化（产品面向欧美用户）；manifestHash 重锚定 `0x92e96e07…cc6ec` | fixtures/、lib/ai/、public/manifests/、docs/、spec 002–004 |
| 2026-07-24 | 部署流水线 `demo-pipeline.sh` + 证据渲染器 `render-evidence.sh`（anvil 全链路排练通过） | contracts/script/、deployments/、.env.example |
| 2026-07-25 | 新增 spec 006：前端废弃重建，页面/功能/状态机/错误文案/技术选型以本 spec 为验收依据 | specs/006、app/（待重建） |
| 2026-07-25 | spec 006 改写 v2：定位改为用户上手 demo（极简三页、live-first）；记录链上实况锚点（两 Campaign 均 Open，deadline 2026-07-26 06:00 UTC+8） | specs/006 |
| 2026-07-25 | 安装设计师标准 alan-design（`.agents/skills/`）；spec 006 新增 §7 视觉方向与视觉验收项 | .agents/skills/、specs/006 |
| 2026-07-25 | 新增 spec 007 施工蓝图（零判断施工版）+ 仓库级 AGENTS.md（编码 Agent 入口规则）；variantHash 锚定为 manifestHash | specs/007、AGENTS.md |
| 2026-07-25 | 对照合约源码/manifest/schema/receipts 全量复核 spec 006/007：修正 getOrder 未下单 revert NoOrder 陷阱、补 WrongState 文案、规格表按 manifest 实际 3 条定稿 + key/value 中文映射 | specs/006、specs/007 |
| 2026-07-25 | 接入阶跃星辰 API（`.env` 的 `STEPFUN_*`）；生成 FRAME-01 产品图三张入 `public/products/frame-01/`；生成脚本 `scripts/gen-product-image.py`；spec 007 产品图规则改为实拍级渲染图 + SVG 兜底 | .env、public/products/、scripts/、specs/007 |
| 2026-07-25 | 产品图资产策划定稿：8 张拍摄清单 + manifest 提示词 + 并发批量生成脚本 + 验收标准；新增 OG 分享图与 favicon（SVG 代码画）要求 | scripts/product-images.*、specs/007 |
| 2026-07-25 | 新增 BRACELET-01（Tech & AI Heritage Bracelet）：评论 fixtures、manifest（hash `0x1c503957…c958dd`）、产品图 ×2、部署脚本 `contracts/script/deploy-bracelet.sh`（.env 缺角色私钥，待运营执行）；首页升级为"在售区+预告区"商城网格 | fixtures/、public/manifests/、public/products/、contracts/script/、specs/006、specs/007 |
| 2026-07-25 | 全角色链路补全：新增 `/console` 工作台（品牌方编译+监控 / 工厂报价+claimPayout，按钱包角色切换）；spec 006 加 §3.4 与状态矩阵工厂列；spec 007 加 T9 与 console 文案 | specs/006、specs/007、AGENTS.md |
| 2026-07-25 | 三套 Campaign 重新部署（deadline 1785187183 = 2026-07-28 05:19 UTC+8，now+72h；operator `0x9d60…DA89`），旧 2026-07-24 地址废弃；BRACELET-01 已部署（Open，0 单，已 verify）；前端上线 https://makebook-frontend.jiachexie6.workers.dev | deployments/、docs/、AGENTS.md、specs/006 |
| 2026-07-25 | **P1 三方分账全链路上线**（spec 008）：合约 8 参构造 + `_computeSettlement` 零售口径 + settle 三笔账 + 品牌/平台两路新 claim（73 测试绿）；三套 P1 合约重部署（success `0x260A…556e` / failure `0x785C…77AA9` / bracelet `0x8Bb4…C691`，deadline 1785024000 = 2026-07-26 08:00 UTC+8，均 verify）；前端 P1 版上线（creator/platform 领取面板、每一分钱去哪了、chips 0.020/0.024/0.030、曲线零售口径）；PRD/PITCH/005/fixtures 叙事对齐 | contracts/、app/、deployments/、docs/、specs/、fixtures/、AGENTS.md |
| 2026-07-25 | 文档收尾（spec 009 §8.2）：spec 003 与 CC_FRONTEND_HANDOFF / FRONTEND-ARCHITECTURE / PRD_FRONTEND_AUDIT 移入 `docs/archive/`；`docs/AGENT_CONTEXT.md` 删除（与 AGENTS.md 重复且过期）；spec 006 §7、spec 007 §3/§6、ALAN_DESIGN_OPTIMIZATION_REPORT 挂失效横幅；EVIDENCE.md 底部自动生成段剥离，`render-evidence.sh` 改输出 `docs/evidence-auto.md`；README「当前实现边界」重写为已上线口径；测试数 51→73 | docs/、specs/、README.md、.gitignore、contracts/script/ |
