# MAKEBOOK 链上证据清单（testnet）

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
