# Spec 001 · 清算合约 MakebookCampaign

> 对应 PRD：09（清算算法）、10（状态机）、13（合约规格）、13A（不变量）、16A（测试矩阵）。
> 代码：`contracts/src/MakebookCampaign.sol`；测试：`contracts/test/MakebookCampaign.t.sol`。

## 1. 范围

一个合约实例 = 一个 Campaign。原生 test INJ（msg.value）托管，无 ERC20、无代理、无 ownerWithdraw。P0 平台费为 0。

## 2. 已冻结决策（改动需全队确认）

| 项 | 值 |
|---|---|
| 状态机 | `Draft(0) → Open(1) → Succeeded(2) / Failed(3) → PaidOut(4)`；PaidOut 由中标工厂 claimPayout 触发 |
| 上限常量 | `MAX_ORDERS=50`、`MAX_FACTORIES=2`、`MAX_TIERS=3` |
| 订单规则 | 每地址 1 单、数量恒 1、`msg.value == maxPrice > 0`、截止前、不可撤 |
| 清算算法 | R-01~R-10：eligibleCount 最大优先 → 价低优先 → quoteId/tierIndex 小优先；统一价；`maxPrice == clearingPrice` 算赢家 |
| 资金流出 | 仅 pull：claimRefund（赢家差额/落选全额/失败全额，一次）、claimPayout（仅中标工厂，winnerCount × clearingPrice，一次） |
| 清算成本 | 有界循环 2×3×50 次比较，settle 不做任何转账；满负载实测 286,858 gas |
| 错误风格 | custom errors（19 个前端相关），不用 revert string |

## 3. ABI 冻结面

对外 ABI 以 `contracts/abi/MakebookCampaign.json` 为准：P1（2026-07-25，spec 008）起 **44 函数 + 9 事件 + 24 错误**（错误口径含 OZ 继承的 `ReentrancyGuardReentrantCall`；自定义错误 23 个）。P0 基数为 33 函数 + 7 事件 + 21 错误。前端按 `docs/FRONTEND_INTERFACE.md` 第 2 节对接。**任何 ABI 变更必须同步：abi JSON → 接口文档 → 通知前端。**

## 4. 不变量 → 测试映射

| 不变量 | 测试 |
|---|---|
| INV-01 余额 ≥ 未领负债 | `testFuzzCT11_BalanceCoversLiabilities`（256 runs） |
| INV-02 领取最多一次 | CT-08/CT-09 重复领取用例 |
| INV-03 deposit == maxPrice | CT-03 金额校验用例 |
| INV-04 Open 后冻结 | CT-01/CT-02 权限与时序用例 |
| INV-05 settle 仅一次 | CT-10 幂等用例 |
| INV-06 operator 无资金权限 | 合约无 ownerWithdraw（代码审查项） |
| INV-07 先状态后转账 + nonReentrant | CT-10 恶意接收者用例 |
| INV-08 有界清算 | `testCT12_SettleGasWith50OrdersAnd6Tiers` |
| INV-10 Failed 时 receivable = 0 | CT-04 失败路径用例 |

## 5. 已知偏离（与 PRD 的差异，已确认无害）

1. CT-06 的"count 更大但价格更高"组合数学上不存在（eligibleCount 对价格单调非增），改为等价覆盖 R-04/R-05/R-06。
2. `previewSettlement` 在 `feasible=false` 时其余字段返回 0（内部占位值不透出）。

## 6. 验收锚点

- [ ] `forge build && forge test` 全绿（当前 51/51）
- [ ] `contracts/abi/MakebookCampaign.json` 与接口文档第 2 节一致
- [ ] settle gas 实测 < 2,000,000（当前 286,858）
- [ ] 无 proxy / delegatecall / selfdestruct / ownerWithdraw（grep 检查）
