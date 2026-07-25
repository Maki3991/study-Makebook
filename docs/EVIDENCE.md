# MAKEBOOK 链上证据清单（testnet）

> 本文件为人工策展的当前有效锚点。`contracts/script/render-evidence.sh` 的自动生成输出写入独立文件 `docs/evidence-auto.md`（随重跑覆盖），不再并入本文件。

## 2026-07-25 P1 三方分账部署（当前有效锚点，spec 008）

三套 Campaign 于 2026-07-25 中午以 P1 合约重新部署（8 参构造：creator / feeRecipient / marginBps=2500 / feeBps=200），当日上午的 P0 地址全部废弃（其锁定资金 2026-07-28 后可走旧合约 claimRefund 取回）。

| Campaign | 地址 | 实况 | deployBlock |
|---|---|---|---|
| success | [0x260A9C9075B09B5950385fEB1AEa7d83a25E556e](https://testnet.blockscout.injective.network/address/0x260A9C9075B09B5950385fEB1AEa7d83a25E556e) | Open，5 单（0.034/0.032/0.028/0.026/0.022），预览可行：零售统一价 0.02375、成交 4（Loom 档） | 134614629 |
| failure | [0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9](https://testnet.blockscout.injective.network/address/0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9) | Open，2 单（0.023/0.022），不可行 | 134614708 |
| bracelet | [0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691](https://testnet.blockscout.injective.network/address/0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691) | Open，0 单（manifestHash `0x1c503957…c958dd` 锚点不变） | 134615480 |

- P1 参数：marginBps=2500（零售=出厂×1.25）、feeBps=200（2%）；creator `0x42a0c1B8fC4e804972Eb522C6C8043Ce72393B0a`；feeRecipient `0x04A47233230bEd2aE963cfA7DCCf4D59B77dE2D3`（≠ operator，守 INV-06）
- deadline：1785024000（= 2026-07-26 08:00 UTC+8，pitch 当天早晨现场 settle），三套相同；三套均已 Blockscout verify
- operator：`0x9d60cab786720520038008640b9f7ea56348DA89`
- 清算手算例（settle 后逐 wei 可核）：工厂 0.076 / 品牌 0.0171 / 平台 0.0019（anvil 排练已实测一致）
- 证据文件：`deployments/receipts/testnet-20260725-112855.jsonl`（bracelet 部署 tx `0x8a648d3f…247e32`）
- 合约测试：73 passed（51 P0 + 22 P1），CT-12 settle gas 468,877；ABI 44 函数/9 事件/24 错误

---

下方为 2026-07-25 上午 P0 重部署证据（已废弃，仅历史存档）。2026-07-24 首轮部署的自动生成明细（含更早一代废弃地址 `0x378bb7d0…` / `0x01c51b7c…`）已剥离至 `docs/evidence-auto.md`。

### 2026-07-25 上午 P0 部署（已废弃）

| Campaign | 地址 | 实况 | deployBlock |
|---|---|---|---|
| success | [0xBcA007D33920AA3A22DFfDdb694dC592a7Cc00c5](https://testnet.blockscout.injective.network/address/0xBcA007D33920AA3A22DFfDdb694dC592a7Cc00c5) | Open，5 单，预览可行统一价 0.019、成交 4（已重放 5 单，实测一致） | ≈134587449 |
| failure | [0x44150f2cDB076613d29E7C3341629F4DDA834e6d](https://testnet.blockscout.injective.network/address/0x44150f2cDB076613d29E7C3341629F4DDA834e6d) | Open，2 单，不可行 | ≈134588449 |
| bracelet | [0x02Fb649Cf9015cBF7AFA1e78545dF822374DeF77](https://testnet.blockscout.injective.network/address/0x02Fb649Cf9015cBF7AFA1e78545dF822374DeF77) | Open，0 单 | 134589865 |

- P0 deadline：1785187183（= 2026-07-28 05:19 UTC+8）；证据文件：`deployments/receipts/testnet-20260725-054255.jsonl`
