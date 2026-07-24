# MAKEBOOK Contracts

Injective EVM Testnet 上的预生产订单簿与确定性统一清算合约（PRD 第 13 章）。一个部署 = 一个 Campaign。

## 工具链

Foundry（forge 1.7.1+，Solidity 0.8.28，OpenZeppelin Contracts v5.4.0）。

首次克隆后恢复依赖（`contracts/lib/` 不进 git）：

```bash
cd contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-git
```

```bash
cd contracts
forge build
forge test -vv          # 51 个测试：CT-01~CT-12 + 附录 A 端到端
forge test --match-test testCT12 -vv   # settle gas 实测日志
```

## 目录

```
src/MakebookCampaign.sol      核心合约
test/MakebookCampaign.t.sol   CT-01~CT-12 + E2E 测试
script/Deploy.s.sol           部署脚本（参数全部走环境变量）
abi/MakebookCampaign.json     供前端使用的 ABI 导出
foundry.toml                  含 injectiveEvm RPC endpoint
```

## 部署到 Injective EVM Testnet

**推荐：一键流水线** `script/demo-pipeline.sh`（anvil 排练 / testnet 正式，用法见脚本头注释与 `docs/DEMO_RUNBOOK.md` 第 2 节）：

```bash
contracts/script/demo-pipeline.sh anvil all      # 本地全链路排练（deploy→open→orders→settle→claims）
contracts/script/demo-pipeline.sh testnet up     # testnet 部署两套 Campaign 并预下单
```

**必须带 `--legacy --gas-price 160000000 --gas-limit 2000000`**（Injective EVM 不支持 EIP-1559 类型交易）。手动单实例部署：

```bash
export PRIVATE_KEY=0x...                  # 只存在本地环境，绝不写入仓库
export OPERATOR_ADDRESS=0x...
export MANIFEST_HASH=0x...                # lib/schema/canonicalize 对确认版 manifest 算出的 keccak256
export MANIFEST_URI="https://<repo>/public/manifests/frame-01.json"
export DEADLINE=1785000000                # uint64 Unix 时间戳

forge script script/Deploy.s.sol:DeployMakebookCampaign \
  --rpc-url injectiveEvm \
  --broadcast \
  --legacy --gas-price 160000000 --gas-limit 2000000
```

网络参数：Chain ID **1439**（native `injective-888`，仅作解释）、RPC `https://k8s.testnet.json-rpc.injective.network/`、native token INJ（18 decimals）、Faucet <https://testnet.faucet.injective.network/>。

## Blockscout 验证

```bash
forge verify-contract <DEPLOYED_ADDRESS> \
  src/MakebookCampaign.sol:MakebookCampaign \
  --chain-id 1439 \
  --verifier blockscout \
  --verifier-url 'https://testnet.blockscout-api.injective.network/api/' \
  --constructor-args $(cast abi-encode \
    "constructor(address,bytes32,string,uint64)" \
    $OPERATOR_ADDRESS $MANIFEST_HASH "$MANIFEST_URI" $DEADLINE)
```

Explorer 深链：`https://testnet.blockscout.injective.network/address/<addr>` / `/tx/<hash>`。

## settle gas 实测（CT-12）

50 orders × 6 tiers（2 quotes × 3 tiers，满上限）：**286,858 gas**（forge test 日志 `testCT12_SettleGasWith50OrdersAnd6Tiers`），远低于 2,000,000 gas-limit 预算；清算循环上界 2×3×50 = 300 次比较（INV-08），不随领取人数做转账。

## 安全边界（PRD 13A）

无 proxy / delegatecall / selfdestruct / ownerWithdraw；ReentrancyGuard + pull payment；settle 只计算不转账；operator 无任何资金权限（INV-06）。

## Slither 静态分析（2026-07-24，slither 0.11.5）

`slither src/MakebookCampaign.sol --filter-paths "lib/"`：5 条结果，全部 informational/low，无中高严重度。

- `block.timestamp` 比较（placeOrder/settle 的 deadline 判断）：矿工可操纵窗口约秒级，对跨小时的 Campaign 截止无实际影响——接受。
- `claimRefund`/`claimPayout` 的 low-level `.call{value:}`：有意选择的 pull-payment 模式，先置 claimed 再转账 + nonReentrant（INV-02/07），CT-10 已覆盖恶意接收者——接受。
