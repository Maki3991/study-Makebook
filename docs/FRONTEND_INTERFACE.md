# MAKEBOOK 前端接口对接文档

面向前端队友的唯一对接入口。链交互只用 viem；所有金额一律 wei（uint256 字符串/BigInt），前端只做 `parseUnits` / `formatUnits`，**不允许浮点进入合约**（INV-09）。

---

## 1. 链配置（PRD 12.2）

| 项 | 值 |
|---|---|
| EVM Chain ID | **1439**（前端强校验，错误网络显示一键切换） |
| Native Chain ID | `injective-888`（仅解释用，不要配给 MetaMask） |
| RPC | `https://k8s.testnet.json-rpc.injective.network/`（支持环境变量覆盖） |
| Explorer | `https://testnet.blockscout.injective.network/` |
| Native token | INJ，**18 decimals**，测试网无真实价值 |
| Faucet | `https://testnet.faucet.injective.network/` |

Explorer 深链格式：

```
地址：https://testnet.blockscout.injective.network/address/<0x...>
交易：https://testnet.blockscout.injective.network/tx/<0x...>
```

viem chain 定义示例：

```ts
import { defineChain } from "viem";

export const injectiveEvmTestnet = defineChain({
  id: 1439,
  name: "Injective EVM Testnet",
  nativeCurrency: { name: "INJ", symbol: "INJ", decimals: 18 },
  rpcUrls: { default: { http: ["https://k8s.testnet.json-rpc.injective.network/"] } },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://testnet.blockscout.injective.network" },
  },
  testnet: true,
});
```

合约地址从 `deployments/injective-testnet.json` 读取（成功/失败两个预部署 Campaign）。

---

## 2. 合约 ABI 与函数规格

机器可读 ABI：`contracts/abi/MakebookCampaign.json`（`{ contractName, abi }`）。以下为人类可读格式（viem `parseAbi` 可直接用）：

```ts
export const makebookAbi = parseAbi([
  // 构造（仅部署脚本用）
  "constructor(address operator, bytes32 manifestHash, string manifestURI, uint64 deadline)",

  // 写函数
  "function registerFactory(address factory, bytes32 profileHash)",
  "function submitQuote(bytes32 quoteHash, (uint32 minQty, uint256 unitPriceWei)[] tiers)",
  "function openCampaign()",
  "function placeOrder(bytes32 variantHash, uint256 maxPrice) payable",
  "function settle()",
  "function claimRefund()",
  "function claimPayout()",

  // 读函数
  "function previewSettlement() view returns (bool feasible, uint256 quoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount)",
  "function getOrder(address buyer) view returns ((address buyer, bytes32 variantHash, uint256 maxPriceWei, bool refundClaimed))",
  "function getQuote(uint256 quoteId) view returns ((address factory, bytes32 quoteHash, (uint32 minQty, uint256 unitPriceWei)[] tiers))",
  "function ordersLength() view returns (uint256)",
  "function quotesLength() view returns (uint256)",
  "function registeredFactoriesLength() view returns (uint256)",
  "function registeredFactories(uint256) view returns (address)",
  "function isRegisteredFactory(address) view returns (bool)",
  "function factoryProfileHash(address) view returns (bytes32)",
  "function hasQuoted(address) view returns (bool)",
  "function state() view returns (uint8)",
  "function operator() view returns (address)",
  "function manifestHash() view returns (bytes32)",
  "function manifestURI() view returns (string)",
  "function deadline() view returns (uint64)",
  "function settlementFeasible() view returns (bool)",
  "function winningQuoteId() view returns (uint256)",
  "function winningTierIndex() view returns (uint256)",
  "function clearingPrice() view returns (uint256)",
  "function winnerCount() view returns (uint256)",
  "function selectedFactory() view returns (address)",
  "function factoryReceivable() view returns (uint256)",
  "function factoryPayoutClaimed() view returns (bool)",
  "function MAX_ORDERS() view returns (uint256)",   // 50
  "function MAX_FACTORIES() view returns (uint256)", // 2
  "function MAX_TIERS() view returns (uint256)",     // 3
]);
```

### 2.1 写函数：调用时机 / 谁可调 / revert 对照

合约统一使用 custom errors（不是 revert string）。前端用 viem 捕获 `ContractFunctionRevertedError`，按 `errorName` 映射下表文案（PRD 15 章人话）：

| 函数 | 谁可调 | 时机 | 主要 revert | 用户文案 |
|---|---|---|---|---|
| `registerFactory(factory, profileHash)` | 仅 operator | 仅 Draft | `NotOperator` | 只有 Campaign 创建者能登记工厂 |
| | | | `WrongState(Draft, actual)` | Campaign 已开盘，工厂登记已冻结 |
| | | | `TooManyFactories` | 最多登记 2 个工厂 |
| | | | `FactoryAlreadyRegistered` | 该工厂已登记 |
| | | | `ZeroAddress` | 工厂地址无效 |
| `submitQuote(quoteHash, tiers)` | 仅已登记 factory | 仅 Draft，每地址 1 份 | `FactoryNotRegistered` | 该地址未登记为工厂 |
| | | | `AlreadyQuoted` | 每个工厂只能提交 1 份报价 |
| | | | `WrongState(Draft, actual)` | 报价已冻结，无法修改 |
| | | | `InvalidTiers` | 档位需 1~3 个，MOQ 递增、单价严格递减、均非 0 |
| `openCampaign()` | 仅 operator | Draft 且 ≥1 份 quote | `NotOperator` / `NoQuotes` / `WrongState` | 需要至少 1 份有效报价才能开盘 |
| `placeOrder(variantHash, maxPrice)` payable | 任何人 | Open 且未截止 | `CampaignNotOpen` | Campaign 未开放，暂不能下单 |
| | | | `DeadlinePassed` | 已截止，本批次停止接单 |
| | | | `InvalidPayment` | 金额不符：支付金额必须严格等于最高愿付价且大于 0 |
| | | | `DuplicateOrder` | 你已在当前 Campaign 下过单，每个钱包限 1 单 |
| | | | `OrderLimitReached` | 本批次 50 单已满 |
| `settle()` | **任何人** | Open 且 `block.timestamp ≥ deadline` | `CampaignNotOpen` | 清算已完成或尚未开盘 |
| | | | `DeadlineNotReached` | 未到截止时间，还不能清算 |
| `claimRefund()` | 仅下单本人 | Succeeded / Failed / PaidOut | `WrongState(Succeeded, actual)` | 清算完成后才能领取 |
| | | | `NoOrder` | 该地址没有订单 |
| | | | `AlreadyClaimed` | 你已领取过，不能重复领取 |
| | | | `TransferFailed` | 转账失败，请重试（你的领取状态未改变） |
| `claimPayout()` | 仅中标工厂 | Succeeded（一次） | `WrongState(Succeeded, actual)` | 当前状态不能领取工厂应收 |
| | | | `NotSelectedFactory` | 只有中标工厂地址可以领取 |
| | | | `TransferFailed` | 转账失败，请重试 |

下单确认文案（PRD 15，签名前必须展示）：“你将预锁 {maxPrice} test INJ。若统一价不高于它，你会获得 1 件 {SKU}，并可领取差额；否则可领取全额。提交后不可撤销。”

公开性提示（签名前）：“你的钱包地址、最高愿付价和交易会公开出现在 Injective EVM Testnet。请勿使用含真实资产的主钱包。”

### 2.2 读函数用法

- `previewSettlement()`：Open 期间实时预览当前候选清算结果（与 settle 同一算法）；`feasible=false` 时其余字段全为 0。settle 后返回已写入的唯一结果。**需求曲线数据源**：遍历 `ordersLength()` + `getOrder(buyer)` 不可得买家地址列表——买家地址从 `OrderPlaced` 事件日志拿（`getLogs` 按事件过滤），再逐个 `getOrder(buyer)`。
- `getQuote(quoteId)` + `quotesLength()`：渲染工厂报价卡与阶梯线。
- `state()`：返回 uint8，映射见第 3 节。

---

## 3. 状态枚举与按钮可用性（PRD 第 10 章）

`state()` 返回值：

| 值 | 枚举 | 含义 | 下单 | 清算 | 领取退款 | 工厂领取 |
|---|---|---|---|---|---|---|
| 0 | `Draft` | 工厂登记/报价期 | ✕ | ✕ | ✕ | ✕ |
| 1 | `Open` | 接单中 | ✓（未截止） | ✓（截止后任何人） | ✕ | ✕ |
| 2 | `Succeeded` | 清算成功 | ✕ | ✕（已完成） | ✓ 赢家差额 / 落选全额 | ✓ 仅中标工厂 |
| 3 | `Failed` | 无可行档位 | ✕ | ✕（已完成） | ✓ 全员全额 | ✕ |
| 4 | `PaidOut` | 工厂已领取 | ✕ | ✕ | ✓（仍可领取） | ✕（已完成） |

状态流转：`Draft → Open → Succeeded → PaidOut`；失败路径 `Draft → Open → Failed`。Succeeded → PaidOut 由中标工厂 `claimPayout()` 触发。

---

## 4. 事件（PRD 13.4）

```ts
parseAbi([
  "event CampaignOpened(bytes32 manifestHash, uint64 deadline)",
  "event FactoryRegistered(address indexed factory, bytes32 profileHash)",
  "event QuoteSubmitted(uint256 indexed quoteId, address indexed factory, bytes32 quoteHash)",
  "event OrderPlaced(address indexed buyer, uint256 maxPrice, bytes32 variantHash)",
  "event CampaignSettled(bool success, uint256 winningQuoteId, uint256 tierIndex, uint256 clearingPrice, uint256 winnerCount)",
  "event RefundClaimed(address indexed buyer, uint256 amount)",
  "event FactoryPayoutClaimed(address indexed factory, uint256 amount)",
])
```

前端用法：

- tx 确认后（`waitForTransactionReceipt`）从 receipt logs 解码对应事件作为成功凭证，不要只信"交易没 revert"。
- `OrderPlaced` 日志是**买家地址列表的唯一链上来源**（渲染需求曲线、My Receipt 恢复订单状态）。
- `CampaignSettled` 是 Batch Receipt 的核心内容：success / winningQuoteId / tierIndex / clearingPrice / winnerCount 直接展示，并附 Blockscout tx 深链。
- Blockscout 上已验证合约的事件页可作离线备份证据。

---

## 5. Canonical JSON 与 manifestHash（PRD 11.2 / APP-01）

**算法规格（逐步）：**

1. 按 `MarketManifest` schema（见下）生成对象，删除所有 UI 临时字段；
2. 对象 key **递归按字典序排序**（数组元素顺序保持不变）；
3. `JSON.stringify` 序列化，**无任何多余空格**，字符串按 UTF-8 编码；
4. `keccak256(utf8Bytes(canonicalJson))` 即 `manifestHash`（bytes32）。

参考实现（前端直接 import 或照抄，禁止另写一套）：

```ts
import { canonicalize, canonicalHash } from "../lib/schema/canonicalize.ts"; // 或复制这两个函数
import { MarketManifestSchema } from "../lib/schema/manifest.ts";

const manifest = MarketManifestSchema.parse(editedManifest); // 人工确认后
const hash = canonicalHash(manifest); // 交给 operator 部署用
```

**已确认 fixture（FRAME-01）**：`public/manifests/frame-01.json`（文件本身即 canonical 形式），其

```
manifestHash = 0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec
```

前端、Node 脚本与链上 `manifestHash()` 三方必须一致（`npm test` 中有稳定性锚点测试）。

---

## 6. AI 需求编译器（/api/compile 契约）

### 6a. 前端 Next.js 工程直接复用（推荐）

```ts
// app/api/compile/route.ts（前端工程内）
import { compileComments, type CommentInput } from "@/lib/ai/compile"; // 从本仓库 lib/ai 复制或 monorepo 引用

export async function POST(req: Request) {
  const { comments } = (await req.json()) as { comments: CommentInput[] };
  return Response.json(await compileComments(comments));
}
```

环境变量：`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`（OpenAI 兼容端点）。**未配置时自动 2 秒内返回 fixture 并标 `fixture: true`，页面必须显示 Fixture 标签**（FR-AI-07）。

### 6b. HTTP 契约（若分开部署）

```
POST /api/compile
Content-Type: application/json

请求：
{
  "comments": [{ "id": "c01", "text": "...", "sourceLabel": "forum" }]   // 10~50 条
}

响应 200（无论真实 AI 还是 fixture 都是 200）：
{
  "result": {
    "schemaVersion": "makebook.compile.v1",
    "candidates": [ ProductCandidate, ... ]        // 2~3 个，结构见 lib/schema/manifest.ts
  },
  "fixture": false,                                 // true 时前端显示 Fixture 标签
  "stats": { "total": 20, "empty": 0, "duplicates": 2, "valid": 18 },
  "error": "provider 超时（>2000ms）"               // 仅 fixture 模式，说明降级原因
}
```

`ProductCandidate` 关键约束：`specs[]` 每条必有 `sourceCommentIds` 非空或 `operationalAssumption=true`（FR-AI-04）；`priceSignals[]` 的 `disclaimer` 恒为“非资金承诺”，**UI 不得把价格信号渲染成订单数**（FR-AI-05）。AI 模块不持有私钥、不做任何合约写操作（FR-AI-08），确认候选 → 人工编辑 → 生成 manifest → 算 hash 全部在前端/部署脚本侧完成。

---

## 7. Fixtures（Demo 模式直接消费）

| 文件 | 内容 |
|---|---|
| `fixtures/comments.json` | 20 条摄影包评论（c01~c20，含 2 条完全重复：c18=c03、c19=c07），主题覆盖容量/外观/内胆/肩带/价格 220~260 |
| `fixtures/success.json` | 附录 A.1 成功 Campaign：North min3@0.024 不可行；Loom min3@0.019 中标（eligibleCount=4）；Buyer A~E 与预期退款、Loom 应收 0.076 test INJ |
| `fixtures/failure.json` | 附录 A.2 失败 Campaign：MOQ=3 仅 2 单 → Failed，全员全额退款，factoryReceivable=0 |
| `public/manifests/frame-01.json` | 人工确认版 FRAME-01 manifest（canonical 格式，hash 见第 5 节） |

所有 fixture 价格单位字段均为字符串 INJ（如 `"0.019"`），用 `parseUnits(v, 18)` 转 wei。页面展示时必须带 "Hackathon scaled test data" 说明（PRD 9.4）。

## 8. deployments/injective-testnet.json

```json
{
  "chainId": 1439,
  "rpc": "...",
  "explorer": "...",
  "success": { "address": "0x...", "manifestHash": "0x...", "manifestURI": "...", "deadline": 1785000000 },
  "failure": { "address": "0x...", "manifestHash": "0x...", "manifestURI": "...", "deadline": 1785000000 }
}
```

当前为**占位**（零地址），部署后由合约任务回填。前端启动时校验 `address` 非零地址，否则进入 fixture/Demo 模式。

## 9. 六种状态标签语义（PRD 14.2）

| 标签 | 视觉 | 含义 | 典型使用位置 |
|---|---|---|---|
| `ONCHAIN` | 绿色 | 值直接从合约读取或由交易事件证明 | state、订单、清算结果、退款 |
| `AI GENERATED` | 蓝色 | 模型生成、未经或已人工确认的内容 | ProductCandidate 卡片 |
| `HUMAN CONFIRMED` | 深蓝 | Operator 已确认并用于 manifestHash | manifest 预览、需求说明书 |
| `DEMO FACTORY` | 橙色 | 团队控制的测试网工厂身份 | 工厂报价卡（不得暗示真实供应合作） |
| `OFF-CHAIN DEMO` | 灰色 | 生产进度、物流等模拟状态 | 生产进度时间线 |
| `TESTNET` | 紫/深蓝 | 资产无真实价值，交易公开可查 | 全局横幅、金额旁 |

---

### 附：常见边界

- 赢家 `maxPrice == clearingPrice` 时差额为 0：`claimRefund()` 仍须点一次以标记（事件金额 0），UI 显示“无需退款”但不要阻止点击（PRD FR-BUY-07）。
- `deadline` 是 uint64 秒级 Unix 时间；`block.timestamp ≥ deadline` 即停止接单并允许清算。
- 任何人的浏览器都可以触发 `settle()`——清算按钮在截止后对所有访客可用。
