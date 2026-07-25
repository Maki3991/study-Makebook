# MAKEBOOK 链上证据清单（testnet）

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

下方为 2026-07-25 上午 P0 重部署与 2026-07-24 首轮部署证据（地址均已废弃，仅历史存档）。

### 2026-07-25 上午 P0 部署（已废弃）

| Campaign | 地址 | 实况 | deployBlock |
|---|---|---|---|
| success | [0xBcA007D33920AA3A22DFfDdb694dC592a7Cc00c5](https://testnet.blockscout.injective.network/address/0xBcA007D33920AA3A22DFfDdb694dC592a7Cc00c5) | Open，5 单，预览可行统一价 0.019、成交 4（已重放 5 单，实测一致） | ≈134587449 |
| failure | [0x44150f2cDB076613d29E7C3341629F4DDA834e6d](https://testnet.blockscout.injective.network/address/0x44150f2cDB076613d29E7C3341629F4DDA834e6d) | Open，2 单，不可行 | ≈134588449 |
| bracelet | [0x02Fb649Cf9015cBF7AFA1e78545dF822374DeF77](https://testnet.blockscout.injective.network/address/0x02Fb649Cf9015cBF7AFA1e78545dF822374DeF77) | Open，0 单 | 134589865 |

- P0 deadline：1785187183（= 2026-07-28 05:19 UTC+8）；证据文件：`deployments/receipts/testnet-20260725-054255.jsonl`

生成时间：2026-07-24T09:27:57Z ・ 数据源：deployments 状态文件 + receipts JSONL（demo-pipeline.sh 每次运行自动记录）

## Campaign 合约

| Campaign | 地址 | manifestHash | deadline |
|---|---|---|---|
| success | [0x378bb7d08e92317ff8a5f7750bb7a91332bab03d](https://testnet.blockscout.injective.network/address/0x378bb7d08e92317ff8a5f7750bb7a91332bab03d) | `0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec` | 1785016800 |
| failure | [0x01c51b7c50dd0537933bf245b8a5ea6252735f51](https://testnet.blockscout.injective.network/address/0x01c51b7c50dd0537933bf245b8a5ea6252735f51) | `0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec` | 1785016800 |

manifestURI：https://raw.githubusercontent.com/gmy20060609-jpg/ACL-team/main/public/manifests/frame-01.json

## 交易记录

| Run | Campaign | 操作 | 发起方 | 交易 |
|---|---|---|---|---|
| 20260724-170533 | success | registerFactory(address,bytes32) | operator | [0x68c982b8…](https://testnet.blockscout.injective.network/tx/0x68c982b8f4bc4e69b98d0a004158194d995f6534be6f90ed5b66247dea17ad32) |
| 20260724-170533 | success | submitQuote(bytes32,(uint32,uint256)[]) | north | [0x879604f2…](https://testnet.blockscout.injective.network/tx/0x879604f2b7803ec05eeeaf171d5d7510328ae588a55652ab9efdb36493bf6103) |
| 20260724-170533 | success | submitQuote(bytes32,(uint32,uint256)[]) | loom | [0x549426d3…](https://testnet.blockscout.injective.network/tx/0x549426d3b1d1be253e9ab60a362961d4cd3d46c23f66131cae05c98ce67189d8) |
| 20260724-170533 | success | openCampaign() | operator | [0x66411f8c…](https://testnet.blockscout.injective.network/tx/0x66411f8c299163096f11ff3050f061ade943661c9f931516c134b202dfacb836) |
| 20260724-170533 | failure | registerFactory(address,bytes32) | operator | [0x1bf6667e…](https://testnet.blockscout.injective.network/tx/0x1bf6667eb919dfe43cea2fa6d7e56dfe301e6fcf60fbbc9eee9caa7f3a1c7e14) |
| 20260724-170533 | failure | registerFactory(address,bytes32) | operator | [0xdf8a4024…](https://testnet.blockscout.injective.network/tx/0xdf8a40242d3a338dc2ced08badeee90587786451d1c305c4fc6fa07298b7c7f1) |
| 20260724-170533 | failure | submitQuote(bytes32,(uint32,uint256)[]) | north | [0xd9e48af0…](https://testnet.blockscout.injective.network/tx/0xd9e48af0af02dbbbfa3f2560dcef0eb44bb5be325caa5530dfaea4c220d6968b) |
| 20260724-170533 | failure | submitQuote(bytes32,(uint32,uint256)[]) | loom | [0x6d487c00…](https://testnet.blockscout.injective.network/tx/0x6d487c00598bb58464ee24718b999177fe19a4b0ab33e7aacc672691f55071c0) |
| 20260724-170533 | failure | openCampaign() | operator | [0x30ea1312…](https://testnet.blockscout.injective.network/tx/0x30ea13122cdee5e247a9ada31b8575f6c73d44b65c4b4c2f1497a2b44e08ddbf) |
| 20260724-170533 | success | placeOrder(bytes32,uint256) | buyerA | [0xfb7ceae5…](https://testnet.blockscout.injective.network/tx/0xfb7ceae535526fa84fbc833669529ed51c11c3751ca073b7b4558c75f3589929) |
| 20260724-170533 | success | placeOrder(bytes32,uint256) | buyerB | [0x798f9e16…](https://testnet.blockscout.injective.network/tx/0x798f9e1621d3fef789409806f9ff8c48108631e16f01dede2b583023ee263d31) |
| 20260724-170533 | success | placeOrder(bytes32,uint256) | buyerC | [0x8915d4ba…](https://testnet.blockscout.injective.network/tx/0x8915d4baf8ee3f69ade712082862b4820fb07694e6df789f2adf229c57d7dfbd) |
| 20260724-170533 | success | placeOrder(bytes32,uint256) | buyerD | [0xfd61f799…](https://testnet.blockscout.injective.network/tx/0xfd61f799db454fd18ae58abff077c5f0676c38c4ccfd47b997f43588ff208aec) |
| 20260724-170533 | success | placeOrder(bytes32,uint256) | buyerE | [0x80240979…](https://testnet.blockscout.injective.network/tx/0x80240979b9c736ed49dd2aa44daf0687f0867cccacf4c4df5acb6a996e889637) |
| 20260724-170533 | failure | placeOrder(bytes32,uint256) | buyerA | [0xd6769fe6…](https://testnet.blockscout.injective.network/tx/0xd6769fe66bbc5a9dfd9b1931e991682f7195679d69246e3fbc59216cec71a509) |
| 20260724-170533 | failure | placeOrder(bytes32,uint256) | buyerB | [0x7af81be0…](https://testnet.blockscout.injective.network/tx/0x7af81be037040a1e70325d3475159b01b8052dde80f01ed5baff46bdca9fa9d6) |
| 20260724-recovery | success | deploy(operator=0xa4aBC0AE3D82442b4EF2875e8a629bC911823404,manifestHash=0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec,deadline=1785016800) | operator | [0xcf662488…](https://testnet.blockscout.injective.network/tx/0xcf66248806861fb18569d79dc2c36b412eb6e8506de70157bc162f56cb3bb26f) |
| 20260724-recovery | failure | deploy(operator=0xa4aBC0AE3D82442b4EF2875e8a629bC911823404,manifestHash=0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec,deadline=1785016800) | operator | [0xbcb5cae7…](https://testnet.blockscout.injective.network/tx/0xbcb5cae735129ecab37e0dc8c68f31785838b4c3e3a0bfd80572c5a7e8129666) |
| 20260724-recovery | success | registerFactory(address,bytes32) | operator | [0x60c5c05e…](https://testnet.blockscout.injective.network/tx/0x60c5c05e44905748667c8afb60e04d37cfc2ce443d74b8ffa21e02d7980643f8) |
