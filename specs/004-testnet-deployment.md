# Spec 004 · Testnet 预部署与演示证据

> 对应 PRD：12.2（网络基线）、18（现场 Demo）、附录 A.3（20 项速查）。
> 执行手册：`docs/DEMO_RUNBOOK.md`；部署命令：`contracts/README.md`。

## 1. 网络基线（T+0 只读复核）

| 项 | 值 |
|---|---|
| EVM Chain ID | 1439（`cast chain-id` 复核） |
| RPC | `https://k8s.testnet.json-rpc.injective.network/` |
| Explorer | `https://testnet.blockscout.injective.network/` |
| Faucet | `https://testnet.faucet.injective.network/` |
| 部署参数 | `--legacy --gas-price 160000000 --gas-limit 2000000`（Injective EVM 不支持 EIP-1559） |

## 2. 钱包规划（私钥只在各自 MetaMask / 本地环境变量）

| 角色 | 数量 | 用途 | 余额要求 |
|---|---|---|---|
| operator | 1 | 部署、registerFactory、openCampaign | ≥ 0.1 test INJ |
| factory（North / Loom） | 2 | submitQuote、claimPayout | 少量 gas |
| buyer | 5 | placeOrder（A–E：0.026 / 0.024 / 0.021 / 0.019 / 0.017） | 各 ≥ maxPrice + gas |

地址清单可进内部文档；助记词/私钥不进仓库、聊天、视频、截图。

## 3. 两套预部署 Campaign

**Success**：部署 → registerFactory ×2 → submitQuote（North min3@0.024；Loom min3@0.019）→ openCampaign → 5 个 buyer 按 fixtures/success.json 下单 → **现场 settle**（保留一份已 settle 的录屏兜底）。
**Failure**：同流程但只下 2 单（< MOQ 3）→ 现场 settle → Failed → 全额 claim。

部署后回填 `deployments/injective-testnet.json`（address / manifestHash / deadline），两个合约都做 Blockscout verify。

## 4. 证据清单（提交前）

- [ ] Chain ID 1439 复核截图；RPC/Explorer 现场可达
- [ ] 两个合约地址 + 部署 tx + verify 链接
- [ ] manifest JSON 与链上 `manifestHash()` 一致（= `0x7952a786…876b0`）
- [ ] 3+ 笔 OrderPlaced tx；settle / 差额 refund / 全额 refund / payout 各 ≥1 笔
- [ ] 重复 claim、重复 settle 被拒的证据（截图或录屏）
- [ ] 2 分钟视频（字幕、tx 可见）+ 关键截图离线备份
- [ ] 所有 tx hash 写入只读证据页

## 5. 演示降级链（按优先级）

1. RPC 抖动 → 切备用 RPC；2. 现场断网 → 前端 Demo 模式（fixtures）+ 预录 tx 证据页（**不得把预录说成现场**）；3. AI API 故障 → fixture 自动降级；4. 钱包问题 → 备用 buyer 钱包重试。

## 6. 验收锚点

- [ ] 成功/失败路径各连续跑通 3 次
- [ ] 现场主路径 < 120 秒
- [ ] 生产 URL、本地 URL、视频、截图、tx hash 五类备份均可打开
