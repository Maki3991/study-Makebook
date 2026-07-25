# Spec 008 · P1 三方分账 + 社区上线（2026-07-25 制定）

> 目标：今天（07-25）发社区试用，明早（07-26）pitch。把 PRD v2.0 的"三方共赢"做进合约，
> 使商业叙事与 demo 完全一致；视觉只做数据可见性增强，**不动现有视觉体系**。
> 上游：`docs/PRD-v2.0-draft.md`（9.B 精简版）、`docs/PITCH.md`、`specs/005`、`specs/001`（ABI 冻结流程）。

## 0. 时间线与硬卡点

| 时刻（UTC+8） | 事件 |
|---|---|
| 07-25 10:30 | spec 定稿，Track A 开工 |
| 07-25 18:00 | **卡点①**：forge 全绿（合约+测试完成）。未过 → 启用 fallback（见 §9） |
| 07-25 22:00 | **卡点②**：三套新合约部署 + verify + 前端 build/deploy，社区链接可发 |
| 07-25 晚 | 发社区 |
| 07-26 08:00 | 三套批次 deadline，pitch 现场 settle + 五路领取 |
| 07-26 上午 | pitch |

## 1. 冻结决策（全队已确认）

| 参数 | 值 | 说明 |
|---|---|---|
| `creator` | 独立品牌钱包（.env `CREATOR_KEY`） | 品牌应收唯一领取方，部署后不可改 |
| `feeRecipient` | 独立平台钱包（.env `PLATFORM_KEY`） | 平台费唯一领取方；≠ operator（守住 INV-06 "operator 无资金权限"叙事） |
| `marginBps` | `2500`（×1.25） | 零售价 = 出厂价 × 1.25；上限 `MAX_MARGIN_BPS = 5000` |
| `feeBps` | `200`（2%） | 平台费 = 成交 GMV × 2%；**不做 feeCap**（V2 再加） |
| fixedCost / reservePrice | **不做** | PRD v2.0 草案降级为 V2；R-V1-01 公式改为"零售价 = 出厂价 × 加价系数" |
| 清算量纲 | eligibility 与清算价一律用**零售价** | R-V1-02，P1 的心脏，不可省略 |

**价格体系（三套批次统一）**：

- 报价：North MOQ 3 @ 出厂 0.024；Loom MOQ 3 @ 出厂 0.019（沿用现有刻度）
- 零售档位价：North 0.024×1.25 = **0.030**；Loom 0.019×1.25 = **0.02375**
- success 预下单（5 单）：**0.034 / 0.032 / 0.028 / 0.026 / 0.022** → Loom 档 4 单 ≥ 0.02375 成团（末单 0.022 落选全退）；North 档仅 2 单 ≥ 0.030，MOQ 不达（复刻原"North 差 1 人"叙事）
- failure 预下单（2 单）：**0.023 / 0.022** → 0 单 ≥ 0.02375（留 3 个缺口，降低社区误触成团概率）
- 清算手算例（success 预置态）：赢家 4 人各付 0.02375；工厂应收 4×0.019 = **0.076**；平台费 4×0.02375×2% = **0.0019**；品牌应收 4×0.00475 − 0.0019 = **0.0171**；买家差额 = maxPrice − 0.02375
- 建议价 chips（前端）：`0.020 / 0.024 / 0.030`（跨零售档两侧）

## 2. 合约改动（`contracts/src/MakebookCampaign.sol`，约 100 行）

**新增 immutable（构造冻结）**：`creator`、`feeRecipient`、`marginBps`、`feeBps`。

**constructor**：签名为 `(operator, creator, feeRecipient, manifestHash, manifestURI, deadline, marginBps, feeBps)`；
校验：三地址非零、`marginBps ≤ 5000`、`feeBps ≤ marginBps`（新错误 `InvalidFeeConfig()`）。

**`_computeSettlement`（必改，P1 核心）**：每个 tier 先算
`retailTierPrice = tier.unitPriceWei × (10000 + marginBps) / 10000`（floor）；
R-02 eligibility、R-04~R-06 选择、返回值中的价格一律改用 `retailTierPrice`。
`previewSettlement` 返回签名不变（`clearingPrice` 现在是零售价），前端展示层零改动。

**`settle`** 记三笔账：
```
marginPool    = winnerCount × (clearingRetail − tierPrice)
platformFee   = min(winnerCount × clearingRetail × feeBps / 10000, marginPool)   // min 兜底，永不下溢
factoryRcv    = winnerCount × tierPrice
creatorRcv    = marginPool − platformFee
```
舍入说明：三笔之和恒等于 winnerCount × 零售清算价（fee 的 floor 余数由 creatorReceivable 吸收），全部领取后合约余额精确归零，无锁定尘埃。

**领取（全部 pull，允许在 Succeeded 与 PaidOut 下调用，各一次）**：
- `claimPayout()` 工厂不变（仍触发 state → PaidOut）
- `claimCreatorPayout()` 仅 creator；金额 0 允许调用（与 refund-0 同模式）
- `claimPlatformFee()` 仅 feeRecipient
- 新事件 `CreatorPayoutClaimed(address,uint256)`、`PlatformFeeClaimed(address,uint256)`；新错误 `NotCreator()`、`NotFeeRecipient()`

**不改**：状态机、下单规则、R-04~R-06 选择序、pull 模式、常量上限、19 个既有错误。
marginBps=0 时行为逐字退化为 P0（必须在测试里证明）。

## 3. 测试（`contracts/test/MakebookCampaign.t.sol`，51 → ~75）

- setUp 加 4 参数；既有断言中"清算价=出厂价"的期望值全部按 ×1.25 更新
- 新增：① 三笔应收金额逐 wei 对 §1 手算例 ② creator/platform 领取成功 + 事件 ③ 非 creator/非 platform 调用 revert（NotCreator/NotFeeRecipient）④ 重复领取 revert ⑤ PaidOut 后 creator/platform 仍可领 ⑥ marginBps=0 退化 P0（三笔 = 出厂价/0/0）⑦ 买家差额按零售价计算（maxPrice − retail）⑧ 出价为 tierPrice 但 < retailPrice 者**不算赢家**（防下溢回归，P1 最重要的一条）⑨ InvalidFeeConfig 构造 revert ⑩ INV-01 fuzz 负债含三笔应收
- 附录手算例（§1 数字）逐字复现为 E2E 测试

## 4. 部署脚本与 .env

- `demo-pipeline.sh`：abi-encode 构造签名更新；`up` 读 `MARGIN_BPS/FEE_BPS`；backfill 增加 `creator/feeRecipient/marginBps/feeBps` 字段；`claims` 阶段扩展 creator/platform 领取；verify 参数同步
- `deploy-bracelet.sh`：同样同步
- `.env` 新增（已由运营填）：`CREATOR_KEY`、`PLATFORM_KEY`、`MARGIN_BPS=2500`、`FEE_BPS=200`；两套报价改为 North `[(3,0.024)]` / Loom `[(3,0.019)]` 不变，预下单价格按 §1 更新

## 5. ABI 同步链（spec 001 §3 冻结流程）

`forge build` 重出 `contracts/abi/MakebookCampaign.json`（33 → 44 函数，7 → 9 事件，21 → 24 错误；错误口径含 OZ 继承 `ReentrancyGuardReentrantCall`，自定义 20 → 23）→ `docs/FRONTEND_INTERFACE.md` §2 更新（新读函数 creator/feeRecipient/marginBps/feeBps/creatorReceivable/platformFee/creatorPayoutClaimed/platformFeeClaimed/MAX_MARGIN_BPS、2 个新 claim、2 事件、3 错误；清算价口径改"零售价"）→ 前端。

## 6. 前端改动（分两个 owner，避免与并行会话冲突）

**Owner-A（本会话，功能）：`app/lib/chain/abi.ts`、`hooks.ts`、`write.ts`、`/console` T9、价格显示**
- abi.ts 增量；hooks：`useCreatorPayout / usePlatformFee / useClaimCreator / useClaimPlatform`
- `/console`：角色条识别 creator/feeRecipient/工厂/operator；对应"领取品牌应收 X / 领取平台费 X / 领取工厂应收 X"按钮（T9 一并落地，含编译面板调 /api/compile）
- 项目页清算结果区新增**「每一分钱去哪了」区块**：零售价 = 工厂 0.019 + 品牌 0.00425 + 平台 0.0005（数据全部链上派生：clearingPrice、tierPrice、marginBps、feeBps 实时计算）
- chips 改 0.020/0.024/0.030；需求曲线 X 轴刻度从订单派生（修掉硬编码 PRICE_TICKS）
- 抽屉知情文案不动（"预锁 maxPrice、按不高于它的统一价成交"语义仍真）

**Owner-B（并行会话，视觉增强，仅限以下四处，禁止改动任何既有样式/token/组件外观，禁止写风格提示词；新元素一律复用现有 surface/btn/文本类与 alan-design token）**
1. 首页 hero 下方链上实况细条：3 批次运行中 · 订单总数 · 总托管（Σ maxPrice，来自事件）· 倒计时（数据全部来自既有 hooks）
2. 需求曲线：hover tooltip（价位/累计单数/是否达 MOQ）+ 清算价竖线标注；仅数据变化反馈动效（opacity/transform 150–250ms），无入场动画
3. 产品卡 hash 校验 → 可展开 trust panel：manifest JSON → canonical hash 计算 → 链上 manifestHash() 比对 → ✓（逻辑已存在于 product-card，只做展开呈现）
4. 项目页底部「链上证据」区块：合约地址 + 部署 tx + Blockscout verify 链接 + 最近 OrderPlaced 活动流（买家地址截断、出价、相对时间；Blockscout 禁止 iframe 已实测 X-Frame-Options: SAMEORIGIN，不要内嵌）

## 7. 叙事对齐（Owner-A）

- `docs/PRD-v2.0-draft.md`：R-V1-01 公式改"零售价 = 出厂价 × 加价系数"；fixedCost/reservePrice/feeCap 标 V2；9.A 增加"P1 已实现三方分账（2026-07-25）"行
- `docs/PITCH.md`：「主理人怎么赚钱」去掉"P0 费率为 0"括号，改为"链上已实现：零售差价 + 平台费各领各的，Blockscout 可查"；商业结构段不变（本来就对）
- `specs/005`：§3.3 平台收入 [推迟] → [机制]（feeBps=200 已冻结）；§4 速查同步
- `fixtures/success.json / failure.json`：出价按 §1 更新（fixtures 是文档级剧本，同步改）
- 附录 A2 手算例：按 §1 数字重写
- `specs/006/007`、`AGENTS.md`、`docs/AGENT_CONTEXT.md`：价格/参数锚点刷新（重部署后随地址一起再刷一轮）

## 8. 重部署 = 社区上线（卡点②）

1. `forge build && forge test` 全绿 → anvil 排练（`demo-pipeline.sh anvil all`）
2. testnet 重部署三套（新构造参数）→ verify → 回填 deployments → `status` 复核 §1 数字
3. 前端 build + `wrangler deploy` → 生产 URL 全路由 200 + 真钱包下一单实测
4. **deadline 统一设为 2026-07-26 08:00 UTC+8**（pitch 当天早晨）：社区订单窗口 ~10h，pitch 现场任何人可触发 settle
5. 文档锚点终刷 + `git commit` 全部工作 + 推 main

## 9. Fallback（卡点①未过）

合约 18:00 未全绿 → 放弃 P1 本轮上线：沿用现网 P0 合约（deadline 2026-07-28 05:19），直接发社区；pitch 叙事沿用"P0/V1 不混称"括号口径；P1 改到 pitch 后上线。任何情况下不赶工未测完的资金逻辑。

## 10. 验收锚点

- [ ] 测试 ⑧：出价 ≥ 出厂价但 < 零售价不被计为赢家（资金不下溢）
- [ ] success 批次链上三笔应收 = §1 手算（0.076 / 0.0171 / 0.0019）
- [ ] margin=0 部署实例行为与 P0 逐字一致
- [ ] 生产环境新钱包走通：出价 → deadline 后 settle → 赢家领差额；品牌/平台/工厂各领一笔，Blockscout 可见
- [ ] 「每一分钱去哪了」数字与链上读函数一致，无手写
- [ ] 视觉四处增强均复用既有 token，三档宽度无横向滚动
- [ ] pitch 走查：现场 settle → 五路领取（买家差额/落选全额/工厂/品牌/平台）全部成功
