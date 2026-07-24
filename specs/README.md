# MAKEBOOK Specs（SDD 规格索引）

本目录是团队的 Spec-Driven Development 单一事实来源。优先级关系：

1. **PRD**（产品需求文档 v1.0，团队外部文档）定义"做什么、为什么"；
2. **本目录 specs** 定义"模块之间如何对接、验收以什么为准"，与代码同仓演进；
3. **代码与测试** 是最终真相；spec 与代码冲突时，先改代码再同步 spec，并在 commit 中说明。

## 规则

- 改接口（ABI、事件、错误码、JSON 结构、hash 算法、fixtures 数值）必须先改对应 spec，再改代码。
- 每个 spec 末尾的"验收锚点"是可机器/人工复核的检查项，评审前逐项过。
- 前端对接的唯一入口仍是 `docs/FRONTEND_INTERFACE.md`；specs 管决策与变更，接口文档管字段细节。

## 索引

| Spec | 主题 | 状态 |
|---|---|---|
| [001](001-campaign-contract.md) | 清算合约：状态机、ABI 冻结、不变量与测试映射 | 已实现（51/51 测试） |
| [002](002-ai-compiler.md) | AI 需求编译器：I/O 契约、脱敏、fixture 降级 | 已实现（9/9 测试） |
| [003](003-frontend-integration.md) | 前端集成：mock → 链上替换规则与数值对齐清单 | 待队友执行 |
| [004](004-testnet-deployment.md) | Testnet 预部署与演示证据 | 待执行（需钱包/faucet） |
| [005](005-stakeholder-requirements.md) | 三方真实需求矩阵：P0 机制 / 有意推迟 / 永不承诺 | 已评审 |

## 变更记录

| 日期 | 变更 | 影响面 |
|---|---|---|
| 2026-07-24 | 初始四份 spec 建立 | 全仓 |
