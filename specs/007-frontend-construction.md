# Spec 007 · 前端施工蓝图（零判断施工版）

> 配套：spec 006（产品与验收）、`.agents/skills/alan-design/SKILL.md`（视觉权威）、`docs/FRONTEND_INTERFACE.md`（链/AI 字段细节）。
> 本文件的用途：**施工者不需要做任何产品或设计判断**。所有数值、文案、结构、状态推导、任务顺序都已定死。遇到本文件与 spec 006 未覆盖的情况，停下来问，不要自行发挥。

## 1. 硬规则（违反即返工）

1. 页面只有 6 个路由：`/`、`/campaigns/success`、`/campaigns/failure`、`/campaigns/bracelet`、`/orders`、`/console`。下单确认是项目页内抽屉。**禁止新增路由、导航项、功能区块。**
2. 所有链上数字来自读函数/事件；演示锚点数值只许出现在测试里，不许手写进 UI。
3. 金额一律经 `lib/chain/format.ts` 输出（≤4 位有效小数 + test INJ）；禁止 `toFixed` 直接渲染 wei。
4. 用户可见文案一律取自 `app/lib/copy.ts`（本文件 §6 逐字给定）；报错文案一律取自 `lib/chain/errors.ts`（§6.6 表）。
5. 视觉只用 §3 的 token；禁止引入新色、新圆角、新阴影、渐变背景、玻璃拟态、emoji 图标。
6. 写函数成功以 receipt 事件解码为准（OrderPlaced / CampaignSettled / RefundClaimed），不以"交易没 revert"为准。
7. 每钱包每批次限 1 单由合约保证，UI 只负责把 `DuplicateOrder` 翻译成人话，不做前端预检之外的额外逻辑。

## 2. 运行环境常量（写进 `app/lib/chain/config.ts`）

| 常量 | 值 |
|---|---|
| CHAIN_ID | `1439` |
| RPC | `https://k8s.testnet.json-rpc.injective.network/`（可被 `NEXT_PUBLIC_INJ_RPC` 覆盖） |
| EXPLORER | `https://testnet.blockscout.injective.network` |
| FAUCET | `https://testnet.faucet.injective.network/` |
| 成功批次 address | `0x260A9C9075B09B5950385fEB1AEa7d83a25E556e`，deployBlock `134614629` |
| 失败批次 address | `0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9`，deployBlock `134614708` |
| BRACELET 批次 address | `0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691`，deployBlock `134615480` |
| manifestHash 锚点（FRAME-01） | `0x92e96e079279e2a5d21e099f2693513f0e954384407de71ae66f8b853becc6ec` |
| manifestHash 锚点（BRACELET-01） | `0x1c503957667bb009a161c7d9bfe70e59db01c61c80920faae60f98a1e3c958dd` |

**Campaign 注册表（config.ts 静态元数据 + deployments json 动态地址，二者按 key 合并）**：

| key | 产品 | 批次名 | manifest 文件 | 主图 | 路由 |
|---|---|---|---|---|---|
| success | FRAME-01 摄影斜挎包 | 批次 A | `/manifests/frame-01.json` | `/products/frame-01/hero.png` | `/campaigns/success` |
| failure | FRAME-01 摄影斜挎包 | 批次 B（未满 MOQ 示例批） | 同上 | `/products/frame-01/hero-alt.png` | `/campaigns/failure` |
| bracelet | BRACELET-01 AI 传承手链 | 批次 A | `/manifests/heritage-bracelet.json` | `/products/bracelet-01/hero.png` | `/campaigns/bracelet` |

deployments json 里每个非零地址的 key 对应一行；bracelet 未部署（零地址或缺 key）时，首页在售区只渲染已部署的卡，`/campaigns/bracelet` 返回"本批尚未开盘"占位页（不 404）。预告区两张卡为纯静态内容（10L 背包、托特，标题取自 lib/ai fixture 候选），不进注册表。

| 常量 | 值 |
|---|---|
| MANIFEST_URL | `/manifests/frame-01.json`（public 内同名文件） |
| 单位 | INJ，18 decimals，展示名 `test INJ` |
| 轮询间隔 | 10_000ms |

地址等运行时值以 `deployments/injective-testnet.json` 为唯一来源，构建期 import 该 JSON，启动校验非零地址；上面表格仅作文档锚点。

## 3. 设计 Token（写进 `app/globals.css` 的 `@theme`，Tailwind v4）

> ⚠️ 【本节已失效 2026-07-25】token 数值已被 `specs/009-ux-polish.md` §1 取代：代码实际视觉为暖纸底 `#F5F3EF` + 赭红 `#B23A18`，非本节的白底 + 功能蓝。当前唯一权威是 `app/globals.css` / `app/lib/design-tokens.ts` 与 spec 009 §1，本节保留作历史记录。

```css
@theme {
  /* 色板：白画布 / 炭黑墨 / 冷灰辅 / 唯一功能蓝 */
  --color-canvas: #ffffff;
  --color-surface: #f7f7f5;      /* 次级区块底 */
  --color-ink: #18181b;          /* 主文字 */
  --color-ink-2: #52525b;        /* 次文字 */
  --color-ink-3: #a1a1aa;        /* 元信息 */
  --color-line: #e4e4e0;         /* 分隔线/边框 */
  --color-accent: #1d4ed8;       /* 唯一 accent：CTA/可交互 */
  --color-accent-hover: #1e40af;
  --color-accent-soft: #eff4ff;  /* accent 浅底（选中态/提示条） */
  --color-success: #15803d;
  --color-danger: #b91c1c;
  --color-warn: #b45309;

  /* 圆角：克制 */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* 字体：系统栈，零外链字体 */
  --font-sans: -apple-system, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
}
```

| 规则 | 定值 |
|---|---|
| 页面最大宽 | 1120px，居中；移动端左右 padding 20px，桌面 32px |
| 字号阶梯 | display 30/38 600 · 页标题 22/30 600 · 区块题 16/24 600 · 正文 14/22 400 · 辅助 13/20 400 · 元信息 12/18 400。**金额/数字用 `font-mono` + `tabular-nums`** |
| 间距 | 4 的倍数；区块间 32/48px；卡片内边距 20px（移动端 16px） |
| 边框 | 1px `color-line`；不用阴影堆层级；hover 只改底色/文字色 |
| 按钮 | 主按钮：accent 底白字，radius-md，高 44px；次按钮：白底 1px line；危险/警示用文字色区分不加红底 |
| 状态徽标 | 接单中=success 字 + 浅绿底 / 已截止=ink-2 + surface 底 / 已成团=accent / 未成团=danger / 已领取=ink-3。徽标必带文字，不单靠颜色 |
| 动效 | 150–200ms ease-out，仅 opacity/transform；抽屉从右（桌面）/从底（移动）滑入；无入场动画 |
| 图标 | lucide-react 线性图标，16/20px，单色 ink-2；禁 emoji |
| 产品图 | 实拍级渲染图系列，资产策划与提示词定稿见 `scripts/product-images.md` + `scripts/product-images.manifest.json`（K2.7 跑 `scripts/gen-product-image.py --all -j 4` 并发生成，key 在 `.env` 的 `STEPFUN_API_KEY`）；卡片/规格区 3:4 竖版，横幅/OG 横版，一律 `object-fit: cover`；加载失败兜底 surface 底 + SVG 线稿，禁外链占位图；`layout.tsx` 配 OG meta（图 `/products/frame-01/og-share.png`），favicon 用代码画 SVG 字母标 |

## 4. 文件结构（施工目标树）

```
app/
  layout.tsx                  # html 骨架 + Providers + TopBar + TestnetBanner
  globals.css                 # @theme token + 基础排版
  page.tsx                    # 首页（§5.1）
  campaigns/[id]/page.tsx     # 项目页（§5.2），路由接受 success|failure|bracelet；bracelet 未部署时渲染占位页；其余 id notFound()
  orders/page.tsx             # 我的订单（§5.3）
  console/page.tsx            # 工作台：品牌方编译与监控 + 工厂报价与领取（spec 006 §3.4）
  api/compile/route.ts        # 接口文档 §6a 标准实现（保留，无页面入口）
  components/
    site/top-bar.tsx          # LOGO + 我的订单链接 + WalletButton
    site/testnet-banner.tsx   # TESTNET 细条 + faucet 链接
    site/wallet-button.tsx    # RainbowKit 定制按钮：连接/错网/已连接三态
    campaign/status-strip.tsx # 徽标+倒计时+订单数+当前预览
    campaign/product-card.tsx # 产品图+名称+规格简表+manifestHash 行
    campaign/pledge-panel.tsx # 出价面板（sticky）
    campaign/quote-table.tsx  # 工厂条件简表
    campaign/demand-curve.tsx # SVG 需求曲线
    campaign/result-block.tsx # 清算结果区（截止后/清算后）
    campaign/back-drawer.tsx  # 下单确认抽屉（含双勾选+tx 状态机）
    orders/order-card.tsx     # 订单卡（含领取按钮）
    console/role-bar.tsx      # 角色条（未连接/普通/operator/工厂）
    console/compile-panel.tsx # 品牌方需求编译（评论输入→候选→确认→hash）
    console/admin-table.tsx   # 批次监控表（全部 Campaign 状态/报价/预览）
    console/factory-panel.tsx # 工厂报价卡 + claimPayout 领取
    ui/                       # shadcn 抄改：button drawer checkbox badge skeleton toast
  lib/
    chain/config.ts           # §2 常量 + deployments 校验
    chain/client.ts           # viem chain 定义 + publicClient
    chain/abi.ts              # 接口文档 §2 parseAbi 全文（函数+事件）
    chain/hooks.ts            # §5.4 全部 hooks
    chain/errors.ts           # errorName → 文案（§6.6）
    chain/format.ts           # formatInj(wei)：≤4 位有效小数；truncateAddress；explorerTx/Address 链接
    manifest.ts               # manifest fetch + Zod parse + canonicalHash 校验展示
    copy.ts                   # §6 全部文案
    types.ts                  # CampaignId / OrderView / QuoteView / PreviewView
```

Providers 顺序：`WagmiProvider > QueryClientProvider > RainbowKitProvider`（注入式钱包，默认主题改为 token 色；关闭其渐变与圆角大主题）。TanStack Query 统一管理轮询与缓存。

## 5. 数据层（全部判断已做完，照抄实现）

### 5.1 读数据组合（每个 Campaign 一次聚合，`useCampaign(id)`）

并行读取（`multicall` 或 Promise.all，10s refetchInterval）：`state` `deadline` `ordersLength` `previewSettlement` `quotesLength`+逐 `getQuote(i)`。另：`OrderPlaced` 事件用 `publicClient.getLogs`（fromBlock: deployBlock，按 5000 块分片），结果进 QueryClient 缓存 key `['orders', id]`，随轮询 invalidate；对每个 buyer 地址再 `getOrder(buyer)` 得 maxPrice。

**已核实的合约陷阱（施工必须处理）**：`getOrder(buyer)` 对**未下单地址直接 revert `NoOrder()`**（合约源码 300–304 行）。因此：① `getOrder(我的地址)` 必须单独调用、错误容忍，不得并入 multicall 批次（一次 revert 拖垮整批）；② 捕获到 `NoOrder` = 订单状态 `'none'`（正常业务态，不是错误，不显示报错）；③ 遍历买家列表逐个 `getOrder` 时同理（事件里的地址必有单，但并发下仍按错误容忍处理）。

衍生计算（写死在 hooks.ts，施工照抄）：

```ts
// 需求曲线：按价格点降序累计
demandPoints = orders.map(o => Number(formatUnits(o.maxPriceWei, 18)))
  .sort((a, b) => b - a)
  .map((price, i) => ({ price, count: orders.length - i })) // ≥price 的单数；重复价格保留多点

// 每个 tier 的 eligibleCount
eligible(tier) = orders.filter(o => o.maxPriceWei >= tier.unitPriceWei).length

// 我的订单状态推导（输入：state, deadline, myOrder, clearingPrice, refundClaimed）
if (!myOrder) -> 'none'
if (state === Open && now < deadline)  -> 'escrowed'         // 托管中
if (state === Open && now >= deadline) -> 'awaiting_settle'  // 待清算
if (state === Failed)                  -> refundClaimed ? 'claimed' : 'refund_full'   // 全额
if (state === Succeeded || PaidOut) {
  if (refundClaimed) -> 'claimed'
  if (myMaxPrice >= clearingPrice) -> 'refund_diff'  // 金额 = maxPrice - clearingPrice；为 0 显示"无需退款"仍可点击
  else -> 'refund_full'                              // 金额 = maxPrice
}
```

### 5.2 写函数封装（`useTx` 统一状态机）

`stage: 'idle' | 'signing' | 'confirming' | 'success' | 'error'`，`error` 为 errors.ts 映射后的文案。四个写函数：`placeOrder(variantHash, maxPrice)`（value = maxPriceWei）、`settle()`、`claimRefund()`、`claimPayout()`（仅工作台工厂区，仅中标工厂）。confirming 阶段禁用按钮；success 后刷新对应 query；`waitForTransactionReceipt` 后解码事件取凭证。**variantHash = 该 Campaign 的 `manifestHash()`**（已核实：`demo-pipeline.sh` 预置订单即以 `$MANIFEST_HASH` 下单；合约不校验该值，仅为完整性字段；从链上 `manifestHash()` 读取，与链上预置订单保持一致）。

工作台角色推导（`useConsoleRole`）：未连接 → `'guest'`；`operator()` === 当前地址 → `'operator'`；`isRegisteredFactory(addr)` 为 true → `'factory'`；否则 `'viewer'`。编译与监控区对 guest/viewer 可用；工厂区仅 factory 渲染；操作按钮按 §6.6 错误表兜底。编译调用（`useCompile`）：POST `/api/compile`，body `{ comments }`，响应渲染候选卡，`fixture:true` 时显示 Fixture 标签；确认动作 = 前端 `MarketManifestSchema.parse` + `canonicalHash` 展示，**不发起任何链上写**。

### 5.3 manifest 校验（`lib/manifest.ts`）

fetch `/manifests/frame-01.json`（本地 public 副本，刻意不用链上 manifestURI 的 GitHub raw 地址——避免现场网络依赖与 CORS；两个文件内容相同，hash 校验即证明一致）→ `MarketManifestSchema.parse`（从仓库 `lib/schema/` import）→ `canonicalHash()` → 与链上 `manifestHash()` 对比 → 项目页小字行显示"说明书 hash 已校验一致 ✓"（不一致显示警示，不阻塞页面）。规格的 key/value 渲染走 copy.ts 映射表（§6.3 product.spec.*），未命中映射的 key/value 原样显示兜底。

## 6. 文案字典（`app/lib/copy.ts`，逐字定稿，禁止改写）

> ⚠️ 【本节已失效 2026-07-25】文案权威已迁移至 `specs/009-ux-polish.md` §2（文案打磨）：界面为中英双语，本节假设的中文逐字定稿已被代码推翻。现行文案以 `app/lib/copy.ts` 实际内容与 spec 009 §2 为准，本节保留作历史记录。

### 6.1 全局

| key | 文案 |
|---|---|
| nav.brand | MAKEBOOK 造物簿 |
| nav.orders | 我的订单 |
| nav.console | 工作台 |
| banner.testnet | 测试网体验：用免费 test INJ 走完真实链上流程，资产无价值 · 领取 test INJ → |
| wallet.connect | 连接钱包 |
| wallet.wrongNetwork | 网络不对，点击切换 |
| wallet.switching | 正在切换网络… |

### 6.2 首页 `/`

| key | 文案 |
|---|---|
| home.hero.title | 说出你的最高愿付价，工厂按真实需求生产。 |
| home.hero.sub | 你出的价全额托管进合约。成团只付统一清算价，差额自动退回；不成团全额退回。 |
| home.hero.cta | 开始体验 |
| home.steps.title | 三步上手 |
| home.steps.1 | 连接钱包（自动切换到 Injective 测试网） |
| home.steps.2 | 领取免费 test INJ |
| home.steps.3 | 给喜欢的装备出价 |
| home.batches.title | 进行中的批次 |
| batch.a.name | 批次 A |
| batch.b.name | 批次 B |
| batch.b.note | 未满 MOQ 示例批 |
| batch.bracelet.name | 批次 A |
| preview.title | 需求编译中 |
| preview.note | 以下产品由 AI 从同一批用户评论编译，确认需求后开盘 |
| preview.status | 未开盘 |
| preview.from | 来自评论 {ids} |
| batch.card.orders | {n}/50 单 |
| batch.card.preview | 若现在截止：统一价 {price} test INJ，{count} 单成团 |
| batch.card.previewInfeasible | 暂未满 MOQ，暂不成团 |
| batch.card.closed | 已截止，等待清算 |

### 6.3 项目页 `/campaigns/[id]`

| key | 文案 |
|---|---|
| status.open | 接单中 |
| status.closed | 已截止 |
| status.succeeded | 已成团 |
| status.failed | 未成团 |
| status.countdown | 距截止 {dd}天{hh}时{mm}分 |
| status.orders | {n}/50 单 |
| product.hashOk | 产品说明书 hash 已校验，与链上一致 ✓ |
| product.hashBad | 说明书 hash 与链上不一致，请暂缓下单 |
| product.specsFrom | 规格由 AI 从真实用户评论编译，人工确认后上链 |
| product.spec.key.capacity | 容量 |
| product.spec.key.color | 颜色 |
| product.spec.key.insert | 内胆 |
| product.spec.key.materials | 材质 |
| product.spec.key.charms | 吊坠 |
| product.spec.key.style | 风格 |
| product.spec.key.size | 尺寸 |
| product.spec.value.black | 黑色 |
| product.spec.value.removable | 可拆卸 |
| pledge.title | 我要支持 |
| pledge.inputLabel | 你的最高愿付价（test INJ） |
| pledge.chipHint | 参考价格点 |
| pledge.feasibleNow | 按当前订单，这个价可以成团 |
| pledge.infeasibleNow | 按当前订单，这个价暂不成团（清算后全额退回） |
| pledge.cta | 立即支持 |
| pledge.ordered | 你已出价 {price} test INJ · 查看订单 |
| pledge.full | 本批 50 单已满 |
| pledge.settleCta | 立即清算（任何人可触发） |
| pledge.resultCta | 查看清算结果 |
| quotes.title | 工厂条件（演示工厂） |
| quotes.row | MOQ {minQty} 件 · 单价 {price} test INJ · 当前 {eligible} 单达标 |
| quotes.rowShort | 还差 {n} 单达标 |
| curve.title | 需求曲线：每个价格点上有多少真实订单 |
| result.success | 本批已成团：统一价 {price} test INJ，共 {count} 单 |
| result.failure | 未满 MOQ，本批未成团，全员全额退款 |
| result.mine.win | 你中了：应付 {clearing}，可领回差额 {diff} test INJ |
| result.mine.lose | 未中选：可领回全额 {amount} test INJ |
| result.mine.claimed | 已领取 ✓ |
| result.goClaim | 去领钱 |

### 6.4 下单抽屉

| key | 文案 |
|---|---|
| drawer.title | 确认支持 |
| drawer.step | 确认订单 → 钱包签名 → 完成 |
| drawer.summary | {product} × 1 · 你的最高愿付价 {price} test INJ |
| drawer.legal1 | 你将预锁 {price} test INJ。若统一价不高于它，你会获得 1 件 {product}，并可领取差额；否则可领取全额。提交后不可撤销。 |
| drawer.legal2 | 你的钱包地址、最高愿付价和交易会公开出现在 Injective EVM Testnet。请勿使用含真实资产的主钱包。 |
| drawer.check1 | 我已知晓：提交后不可撤单 |
| drawer.check2 | 我已知晓：地址与出价将公开 |
| drawer.submit | 签名并支付 {price} test INJ |
| drawer.signing | 等待钱包签名… |
| drawer.confirming | 链上确认中，请勿关闭… |
| drawer.success | 下单成功，已全额托管 |
| drawer.viewOrder | 查看我的订单 |
| drawer.retry | 重试 |

### 6.5 订单页 `/orders`

| key | 文案 |
|---|---|
| orders.empty.connect | 连接钱包查看订单 |
| orders.empty.none | 你还没有订单，去批次页看看 |
| orders.escrowed | 托管中 · 截止 {date} |
| orders.awaitingSettle | 已截止，等待清算 |
| orders.refundDiff | 已中选 · 可领回差额 {amount} test INJ |
| orders.refundFull | 未中选/未成团 · 可领回全额 {amount} test INJ |
| orders.noRefundNeeded | 已中选 · 无需退款（仍可点击完成标记） |
| orders.claimed | 已领取 ✓ |
| orders.claim | 领取 {amount} test INJ |
| orders.settle | 立即清算 |
| orders.viewTx | 查看交易 ↗ |

### 6.5b 工作台 `/console`

| key | 文案 |
|---|---|
| console.title | 工作台 |
| console.role.guest | 连接钱包以识别角色（品牌方 / 工厂） |
| console.role.viewer | 当前地址不是品牌方或已登记工厂，编译与监控可用，操作不可用 |
| console.role.operator | 品牌方（Operator） |
| console.role.factory | 已登记工厂（演示） |
| console.compile.title | 需求编译 |
| console.compile.source | 评论来源：{source}（可切换相机包 / 手链评论集） |
| console.compile.run | 编译 |
| console.compile.fixture | Fixture（AI 服务降级，展示的是预置结果） |
| console.compile.confirm | 人工确认并生成 manifest |
| console.compile.hashOk | manifestHash 与锚点一致 ✓ |
| console.compile.noWallet | 编译不需要钱包，AI 没有链上写权限 |
| console.admin.title | 批次监控 |
| console.admin.note | 新批次部署 / 工厂登记 / 报价由部署脚本完成（contracts/script/deploy-bracelet.sh），私钥不进浏览器 |
| console.factory.title | 我的报价 |
| console.factory.none | 当前地址在该批次没有报价 |
| console.factory.win | 已中标 · 应收 {amount} test INJ |
| console.factory.lose | 未中标 |
| console.factory.failed | 未成团，无应收 |
| console.factory.claim | 领取应收 {amount} test INJ |
| console.factory.claimed | 应收已领取 ✓ |

### 6.6 错误文案（`lib/chain/errors.ts`，key = errorName 或场景）

| key | 文案 |
|---|---|
| UserRejected | 你已取消签名，链上没有产生订单 |
| WrongNetwork | 当前网络不对，点这里切到 Injective 测试网 |
| InsufficientFunds | test INJ 不足，先去免费领水 |
| InvalidPayment | 支付金额必须等于你的最高愿付价 |
| DuplicateOrder | 这个钱包已下过单，每批限 1 单 |
| OrderLimitReached | 本批 50 单已满 |
| CampaignNotOpen | 当前批次不在接单状态 |
| WrongState | 当前阶段不能执行此操作，页面正在刷新到最新状态 |
| DeadlinePassed | 本批已截止，等清算结果吧 |
| DeadlineNotReached | 还没到截止时间，暂不能清算 |
| NoOrder | 这个钱包在当前批次没有订单 |
| AlreadyClaimed | 已领取过，不能重复领取 |
| NotSelectedFactory | 只有中标工厂地址可以领取 |
| TransferFailed | 转账失败，请重试（钱还在合约里，状态没变） |
| RpcError | 链上数据加载失败，正在重试 |
| fallback | 操作未完成，资金未动，请重试 |

文案中 `{product}` = manifest `title`（Black 8L Modular Camera Sling Bag），`{date}` 格式 `M月d日 HH:mm`，金额经 `formatInj`。operator/factory 专属错误（NotOperator、ZeroAddress、FactoryAlreadyRegistered、TooManyFactories、FactoryNotRegistered、AlreadyQuoted、InvalidTiers、NoQuotes、DeadlineNotInFuture）在本 demo 的 UI 中无可调用入口，不配图文案，触发时走 fallback。

## 7. 施工任务分解（按序执行，每步有完成定义）

| # | 任务 | 完成定义（可检查） |
|---|---|---|
| T1 | 清场 + 地基：删除 `app/` 旧页面组件样式（保留工程壳与 `api/compile` 标准实现）；装 wagmi v2 / RainbowKit v2 / @tanstack/react-query；写 config/client/abi/deployments 校验 | `npm run dev` 起空壳首页，console 无错；`deployments` 零地址时启动报错文案可见 |
| T2 | token + 布局：`globals.css` @theme 全量 token（§3）；`layout.tsx` 顶栏 + TESTNET 条 + Providers；WalletButton 三态 + 错网一键切换 1439 | MetaMask 错网时按钮变红且点击可切换；390px 无横向滚动 |
| T3 | 数据层：hooks.ts 全部读函数 + 事件拉取 + §5.1 衍生计算 + errors.ts + format.ts + manifest 校验 | 页面可渲染链上实时 5 单/2 单；刷新缓存重建；manifestHash 校验 ✓ 显示 |
| T4 | 首页（§5.1 spec 006）：hero + 三步条 + 两批次卡（实时数据） | 批次卡数字与 `cast call state/ordersLength` 一致 |
| T5 | 项目页只读区：status-strip / product-card / quote-table / demand-curve | 曲线 X 轴刻度从订单派生（P1：零售口径 eligibility），计数与订单一致；quote 表 eligible 与预览一致 |
| T6 | 出价面板 + 抽屉 + 下单写链路（§5.2 状态机 + 双勾选 + legal 原文） | 真钱包下 0.024 单成功（≥零售档 0.02375 可成团），事件解码显示，列表/曲线/预览即时更新；拒签/重复单/错网三条错误各触发一次 |
| T7 | 订单页 + 领取：订单卡状态推导 + claimRefund + 无需退款分支 | 差额 0.00825 可领（Buyer B：0.032 − 零售清算价 0.02375）；领取后状态翻已领取；重复领取被 AlreadyClaimed 文案拦截 |
| T8 | 清算链路 + 结果区 + 打磨：settle 按钮（截止后）、result-block、三档响应式实机目检、alan-design §16 checklist | 验收锚点（spec 006 §9）全勾 |
| T9 | 工作台 `/console`：role-bar 角色推导 + compile-panel（调 /api/compile + manifest 确认 + hash 一致性）+ admin-table 批次监控 + factory-panel（报价卡 + claimPayout） | 普通地址只读提示正确；fixture 降级显示 Fixture 标签；编译确认后 hash 与锚点一致；中标工厂钱包可见「领取应收」并领取成功（Loom 0.076）；非中标地址触发 NotSelectedFactory 文案 |

T1–T3 是地基，不产出可见页面，完成后必须人工确认再进 T4。每步提交一个可运行版本。

## 8. 验证命令（施工自检）

```bash
npm run dev                                   # 本地预览
node --test lib/ai/compile.test.ts lib/schema/canonicalize.test.ts   # 后端锚点不被动破
cast call $ADDR "state()(uint8)" --rpc-url https://k8s.testnet.json-rpc.injective.network/
cast call $ADDR "previewSettlement()(bool,uint256,uint256,uint256,uint256)" --rpc-url …
```

UI 数字与 `cast call` 结果不一致时，以链上为准改 UI。
