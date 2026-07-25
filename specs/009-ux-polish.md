# Spec 009 · UX 打磨（设计 token / 文案 / 品牌方登场 / 量纲修复）

> 状态：定稿，可施工
> 日期：2026-07-25
> 前置：spec 006（信息架构）、spec 008（P1 三方分账）、`.agents/skills/alan-design/SKILL.md`
> **本 spec 在视觉与文案上取代 spec 006 §7 与 spec 007 §3/§6。** 那两节写的是白底 + 功能蓝 + 假设 `copy.ts` 为中文，均已被代码推翻。

---

## 0. 背景与约束

### 0.1 为什么要这份 spec

后端能力已经跑在前端叙事前面：合约 P1 三方分账上链（工厂 / 品牌 / 平台各自 pull 领取），但界面语言仍停留在 spec 005 的"消费者 ↔ 工厂"两方模型。结果不只是叙事缺角，而是**页面上出现了自相矛盾的数字**（见 §4）。

同时，产品的目标用户之一——**会来平台开批次的小品牌主理人**——在站上没有任何落点。

### 0.2 硬约束

| 项 | 值 |
|---|---|
| settle 时间 | `1785024000` = 2026-07-26 08:00 UTC+8 |
| 不可改动 | `contracts/`、`lib/`、`fixtures/`、`public/manifests/` |
| 可改动 | `app/**`、`deployments/`（仅由部署脚本回填）、`docs/`、`specs/` |
| 视觉权威 | 本 spec §1 + `alan-design/SKILL.md`；冲突时以 SKILL.md 的 avoid 清单为准 |
| 语言 | 界面中英双语；产品数据（manifest / 评论）保持英文原文 |

### 0.3 非目标

- 不做品牌方自助发起批次（V1 形态，需要合约调用权限）
- 不做后端存储的意向登记表单（用 mailto）
- 不新增路由；§5 的主理人叙事是首页内的一个 section
- 不碰 `predictions/` 子系统（独立 Vite SPA，本 spec 不覆盖）

---

## 1. 设计 Token 契约

### 1.1 集中 token 文件（新增）

现状：`app/globals.css` 的 `@theme` 已与本节数值一致，但有 3 处 JS 侧硬编码绕过了它。

新增 `app/lib/design-tokens.ts`，作为**非 CSS 上下文的唯一色值来源**：

```ts
export const tokens = {
  paper0: "#F5F3EF", paper1: "#FCFBF9", paper2: "#EBE7E1",
  rule1:  "#DDD8D0", rule2:  "#C4BEB4",
  ink1:   "#14140F", ink2:   "#45443C", ink3:   "#85837A",
  accent: "#B23A18", accentW:"#F5E6DF",
  ok:     "#2E6B4F", warn:   "#9A6414", err:    "#8F2F22",
} as const;
```

替换点：

| 文件 | 现状 | 改为 |
|---|---|---|
| `app/layout.tsx:35` | `themeColor: "#F5F3EF"` | `tokens.paper0` |
| `app/components/site/providers.tsx:33` | `accentColor: "#B23A18"` | `tokens.accent` |
| `app/components/site/providers.tsx:34` | `accentColorForeground: "#FCFBF9"` | `tokens.paper1` |

**规则**：组件内禁止出现十六进制色值、`[#...]` 任意值类、Tailwind 默认灰阶（`gray-*` / `slate-*` / `white` / `black`）。
现状已合规（扫描 0 命中），本规则用于防回归，纳入 §8 验收。

### 1.2 表面 / 文字 / 强调 / 语义

以 `globals.css` `@theme` 现有定义为准，与需求一致，**不修改数值**：

```
--color-paper-0/1/2   #F5F3EF / #FCFBF9 / #EBE7E1
--color-rule-1/2      #DDD8D0 / #C4BEB4
--color-ink-1/2/3     #14140F / #45443C / #85837A
--color-accent        #B23A18      --color-accent-w  #F5E6DF
--color-ok/warn/err   #2E6B4F / #9A6414 / #8F2F22
```

语义色**仅用于状态**，不得用于装饰性区分（如给不同 section 上色）。

**待办 · 暖底铺满**：`SKILL.md` §8 avoid 明确列出 "full-page yellow-beige wash"。当前 `--paper-0` 铺满全站。
处理：保留 `--paper-0` 作页面底，但**每个 section 之间用 `--paper-1` 卡片与留白建立层次**，避免出现连续三屏以上纯 `--paper-0` 的空场。不改 token 数值，改用法。

**待删 · `.ambient-grid`**：`globals.css:387` 的 8px 点阵 radial-gradient 违反 SKILL.md avoid "decorative noise"，删除该类及其所有引用与 `body[data-ambient]` 开关。

### 1.3 间距 / 圆角 / 边框 / 阴影

```
间距  4 / 8 / 16 / 24 / 40 / 64 / 96 / 128   （--spacing-1..8，已存在）
圆角  --r-0: 0px  卡片 / 按钮 / 输入框
      --r-1: 2px  标签
边框  1px solid var(--color-rule-1)
阴影  不使用。层次由边框与留白建立。
```

现状 `globals.css` 已定义 `--radius-0/1` 与 `--radius-sm/md/lg`（后三者均映射到 0/2px）。**保留别名以免破坏现有类，但新代码只允许写 `--radius-0` / `--radius-1`。**

### 1.4 字号阶梯：把 165 处 Tailwind 默认字号收进 6 级

**这是本节工作量最大的一项，也是页面读起来"平"的主因。**

现状扫描：

| 用法 | 次数 | 说明 |
|---|---|---|
| `text-sm` | 95 | = 14px = `--text-body` |
| `text-xs` | 49 | = 12px = `--text-small` |
| `text-base` | 21 | = 16px，**不在阶梯上** |
| `text-h1` / `text-h2` / `text-body` / `text-micro` | 21 | 项目阶梯 |

6 级阶梯（`globals.css` 已定义，不改数值）：

```
--text-display  3rem    48px
--text-h1       2.25rem 36px
--text-h2       1.5rem  24px
--text-body     0.875rem 14px
--text-small    0.75rem  12px
--text-micro    0.625rem 10px
```

迁移映射：

| 现状 | 改为 | 性质 |
|---|---|---|
| `text-sm` | `text-body` | 机械替换，视觉不变（同为 14px） |
| `text-xs` | `text-small` | 机械替换，视觉不变（同为 12px） |
| `text-base font-semibold`（区块标题，如 `quote-table.tsx:22`） | `text-h2` | **视觉变化**：区块标题 16px → 24px |
| `text-base` 其余用途 | `text-body` | 收敛到阶梯 |

区块标题从 16px 提到 24px 是有意为之：当前区块标题（16px semibold）与正文（14px）只差 2px，层级几乎不存在，这是项目页读起来像一张长清单的直接原因。

### 1.5 字体（双语成对）

现状已符合大部分要求，**不更换字体族**：

| 用途 | 字体 | 状态 |
|---|---|---|
| 拉丁标题 / 正文 | Instrument Sans | ✅ 三选一之一，`@fontsource` 自托管 |
| 数字 / 代码 | JetBrains Mono | ✅ 自托管 |
| 中文 | Noto Sans SC Variable | ⚠️ 见下 |

**问题：中文字体首屏负担。**
`@fontsource-variable/noto-sans-sc` 提供 101 个 unicode-range 分片，共 4.3MB，平均 44KB/片。中文页面命中 8–20 片 ≈ 350–900KB。NFR-UX-01 要求 3 秒内首屏，现场网络下不可接受。

**实测：全站中文唯一汉字仅 359 个。**

**方案：构建期子集化。**

新增 `scripts/build-cjk-subset.mjs`：
1. 扫描 `app/lib/i18n/zh.ts` + `app/**/*.tsx` 中的 `[一-鿿]` 字符集，并入常用标点与全角符号
2. 用 `fonttools`（`pyftsubset`）从 Noto Sans SC 生成两个 woff2：
   - `noto-sans-sc-subset-400.woff2`（正文）
   - `noto-sans-sc-subset-900.woff2`（中文标题 Heavy）
3. 输出到 `public/fonts/`，预期总计 **≤ 40KB**
4. `globals.css` 用 `@font-face` 直接引用，`font-display: swap`

字体栈（fallback 保证子集漏字时不空白）：

```css
--font-sans: "Instrument Sans", "Noto Sans SC Subset",
             "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif;
```

**降级条款**：若子集化脚本在时间盒内未跑通，回退到现状（`@fontsource-variable`），并在 §8 验收中标记为已知风险。**不得因为字体没做完而阻塞其他项。**

### 1.6 排版细则

现状已合规，仅做补充：

| 项 | 值 | 状态 |
|---|---|---|
| 标题字距 / 行高 | `-0.03em` / `1.05` | ✅ `globals.css:111,119,127` |
| 中文标题字距 | `0.02em` | ✅ `globals.css:138,142` |
| 数字 | `font-variant-numeric: tabular-nums` | ✅ `globals.css:208,325` |
| 小型标签 | 大写 + `0.12em` + micro | ✅ `globals.css:216,280` |
| **中文标题字重** | **700–900** | ❌ **待补**：`h1/h2` 需显式 `font-weight: 800`，否则中文标题与正文同重 |

### 1.7 组件规则

**卡片**：`--paper-1` 底 + 1px `--rule-1` 边框 + 0 圆角 + 无阴影。
hover 仅 `border-color → --rule-2`。不位移、不缩放、不发光。

**按钮**：

```
主按钮  --accent 实底 + --paper-1 文字 + 0 圆角
次按钮  透明底 + 1px --rule-2 边框 + --ink-1 文字
```

🔴 **必修 · disabled 态**
现状 `globals.css:235-239`：

```css
.btn:disabled { cursor: not-allowed; opacity: 0.6; }
```

赭红 `#B23A18` 在 `--paper-0` 上降到 60% 不透明度会混出脏粉紫，看起来像坏掉的按钮。而**下单抽屉的提交按钮默认就是 disabled**（双勾选未勾），所以用户第一眼看到的主 CTA 永远是这个脏色。

改为显式禁用配色，不使用 opacity：

```css
.btn:disabled,
.btn[aria-disabled="true"] {
  cursor: not-allowed;
  background: var(--color-paper-2);
  color: var(--color-ink-3);
  border-color: var(--color-rule-1);
  filter: none;
}
```

全站主 CTA 统一使用 `.btn-primary`，禁止任何组件覆写其配色。

**表格**（工厂报价 `quote-table.tsx`、批次监控 `admin-table.tsx`）：
表头 `--paper-2` + micro 大写 `0.12em`；行分隔 1px `--rule-1`；数字右对齐 + `tabular-nums`。
这是全站信息密度最高的位置，保持最高对比度，不加任何装饰。

**六类来源标签**（`provenance-tag.tsx`）：
统一 pill：`--r-1` 圆角、1px 边框、micro 大写 `0.12em`、图标 + 文字。
语义色只用于**边框与文字**，底色用 `--paper-2` 或语义色极浅稀释。不发光、不渐变。
🔴 **必修**：现状 `provenance-tag.tsx:63` 直接渲染枚举值本身作为可见文本（`AI GENERATED` / `ONCHAIN` / `TESTNET`），永不翻译。改为走词典。

---

## 2. 文案打磨

### 2.1 原则

1. **消费者不是投资人。** 禁用「支持」「众筹」「回报」「项目方」。用「出价」「预订」「成交」「品牌方」。
   （PITCH 红线：任何材料永远不说"股东 / 股权 / 收益权"。「支持」是同一类语义滑坡。）
2. **每个金额旁边必须有量纲。** 页面同时存在出厂价、零售价、你付的价，三者必须各自标明，不得裸奔。
3. **CTA 必须说明去向。** 禁止全站复用同一个「开始体验」。
4. **边界主动说。** 每个 `[不承诺]` 在页面上有对应位置（履约、质保、物流归品牌方）。
5. **中文不夹生。** 保留 `test INJ`、`MOQ`、`hash` 等术语原文；其余不夹英文。

### 2.2 关键改写

| key | 现状 | 改为 | 理由 |
|---|---|---|---|
| `home.hero.title` | 说出你的最高愿付价，工厂按真实需求生产。 | **说出你愿意付的最高价。品牌据此下单，工厂据此生产。** | 品牌方是 merchant of record，不能从主叙事里缺席 |
| `home.hero.cta` | 开始体验 | **看看正在开的批次** | 说明去向 |
| `home.steps.step3` | 给喜欢的装备出价 | **给想要的东西出价** | 站上有手链，"装备"不成立 |
| `batch.bracelet.name` | 批次 A | **社区批次** | 与 `batch.a.name`「批次 A」重名 |
| `batch.b.note` | 未满 MOQ | **演示：未达 MOQ 的批次** | 现状看起来像坏掉的商品，而它是有意的失败示例 |
| `batch.card.previewInfeasible` | 暂未满 MOQ，暂不成团 | **未达 MOQ，当前不成团** | 「暂」重复 |
| `pledge.title` | 我要支持 | **出价预订** | 这是条件购买订单，不是打赏 |
| `quotes.title` | 工厂条件 | **工厂报价（出厂价）** | 量纲必须写在标题上 |
| `quotes.headers.unitPrice` | 单价 | **出厂价** | 同上 |
| — | — | 新增 `quotes.headers.retailPrice` **零售价** | §4 需要 |
| — | — | 新增 `quotes.winReason` / `quotes.loseReason` | §4 需要 |
| `product.trust.canonicalNote` | canonicalHash：将 manifest JSON 的键递归按字典序排列后，对其 UTF-8 字节取 keccak-256 | 保留，但移入折叠区二级说明 | 首屏不该出现实现细节 |

### 2.3 新增文案（§5 主理人叙事块）

见 §5.2，需同时写入 `app/lib/copy.ts`（en）与 `app/lib/i18n/zh.ts`（zh），保持 key 完全对齐。

### 2.4 i18n 收口

🔴 **`errors.ts` 静态导入英文 copy** —— 中文用户永远看英文错误，`zh.ts` 里 19 条中文错误文案是死文案。
改为 `useErrorCopy()` hook 形式，或把 copy 对象作参数传入 `mapErrorName(name, copy)`。

其余收口（P2，时间允许再做）：
- `layout.tsx:10-30` metadata 恒英文
- `layout.tsx:42` `<html lang="en">` 硬编码
- `config.ts:39-74` 产品名 / 批次名英文字面量（词典里 `batch.*.name` 已备好却零引用）
- `order-card.tsx:57` / `format.ts:21` 日期与数字 locale 写死 `en-US`
- `test INJ` / `/ 50` / `Factory A|B` 等字面量未走词典

---

## 3. 品牌方登场

### 3.1 角色定义（写给施工者）

**品牌方 = 会来平台开批次的小品牌主理人**，不是 MAKEBOOK 自己。

PRD 3.1：消费者向品牌方购买，品牌方向工厂采购；工厂是品牌方的供应商，不直接面对消费者。
品牌方承担：商品责任、质保、退换货、配送、社群运营、SKU 策展。
品牌方获得：零售差价 = 清算零售价 − 出厂价 − 平台费，仅成功清算时落袋。

链上：`creator` 地址与 `operator`、`feeRecipient` 三者互不相同，开盘前冻结。

### 3.2 C · 把演示批次里的品牌角色演清楚

**C1 · 项目页署名（新增）**
`app/campaigns/[id]/page.tsx` 顶部、状态条之下、产品卡之上：

```
由 FRAME LAB 发售 · FACTORY B 供货     [DEMO BRAND]
0x42a0…3B0a  ⧉
```

- 品牌显示名用独立名（`FRAME LAB`），不用 MAKEBOOK —— PRD 的核心区分就是"品牌方 ≠ 平台"，用平台自己的名字会把这条抹平
- `DEMO BRAND` 标签保证不失真（沿用 `provenance-tag.tsx` 组件）
- creator 地址取自 `deployments/injective-testnet.json` 的 `creator` 字段，可复制
- 品牌显示名写入 `config.ts`，走词典

**C2 · FundsSplit 从一行字变成分账条**
现状 `funds-split.tsx` 渲染一行 12px 小字：
`统一零售价 0.0238 test INJ = 工厂 0.019 + 品牌 0.0043 + 平台 0.0005`

这是 PRD 拿来对标 Everlane 的核心差异化，当前视觉重量为零。改为：

- 一条带刻度的水平分段条，三段按比例：工厂 80% / 品牌 18% / 平台 2%
- 段内用 `--paper-2`、`--accent-w`、`--rule-2` 区分（**不引入第二个强调色**）
- 条下三列：角色 / 金额（tabular-nums）/ 占比
- 一句说明：`每一笔都在清算时链上记账，三方各自领取，平台不经手品牌与工厂的钱`

**C3 · 下单抽屉加价格拆解**
`back-drawer.tsx` 摘要区，双勾选之上，新增四行：

```
工厂出厂价                    0.019     test INJ
品牌加价   ×1.25            + 0.00475   test INJ
──────────────────────────────────────────
你支付（统一清算价）           0.02375   test INJ

其中  品牌实收  0.004275   （加价 − 平台费）
      平台费    0.000475   （2%）
```

⚠️ **量纲注意**：平台费是从清算价里**切出来**的，不是加在清算价之上。
`clearingPrice = tierPrice × (1 + marginBps/10000)`；`platformFee = clearingPrice × feeBps/10000`；
`creatorReceivable = clearingPrice − tierPrice − platformFee`。
写成"出厂 + 加价 + 平台费 = 你付"是错的，会多算一次费。

数据来源：`tier.unitPriceWei`、`marginBps`、`feeBps`（均在 `deployments/injective-testnet.json` 与 ABI 中）。
校验：与 PRD 附录 A2 逐 wei 对齐——4 单成交时 工厂 0.076 / 品牌 0.0171 / 平台 0.0019。
兑现 PRD 9.C「消费者在下单前看到每一分钱的分配」。

**C4 · console 品牌方经营视图**
`creator-panel.tsx` 现状只有领取按钮。改为「我的批次」卡列表，每批次一行：

| 字段 | 来源 |
|---|---|
| 批次名 + 状态 | `useCampaign` |
| 当前预览零售价 | `previewSettlement().clearingPrice` |
| 预计品牌应收 | `winnerCount × (retail − tierPrice − fee)` |
| 实际应收 / 已领取 | `creatorReceivable()` / `creatorPayoutClaimed()` |
| 领取按钮 | `useClaimCreatorPayout`（已存在） |

🔴 **顺带修角色互斥**：`hooks.ts:585-589` 的角色推导是单一优先级短路
`operator > factory > creator > platform > viewer`。
若一个地址同时是 operator 与 creator，creator 面板永远出不来。改为返回**角色集合**，各面板按"是否包含该角色"独立渲染。

同时：`operator` 角色当前没有任何专属面板，拿到 tag 后界面与 viewer 完全一致。
处理：不新建 operator 面板，但在 `role-bar.tsx` 明示 `operator 操作（开批次 / 登记工厂 / 报价）走 CLI，私钥不进浏览器`。

### 3.3 A · 面向主理人的叙事块（首页新增 section）

**位置**：首页「进行中的批次」之后、「需求编译中」之前。不新增路由、不新增导航项。

**内容**：

标题：**不压货，也能开一条产线**
副题：给有社群、有想法，但不想为了一次尝试押上全部现金流的主理人。

三栏（`--paper-1` 卡片，1px `--rule-1` 边框，0 圆角）：

| 你不用先下单 | 你收零售差价 | 你承担什么 |
|---|---|---|
| 消费者的钱先全额锁进合约。够 MOQ 才生产，不够全员全额退。库存风险不在你身上。 | 清算价 = 出厂价 × 你设的加价系数。成交那一刻链上记账，你自己领，平台不经手。平台费 **2%**。 | 商品责任、质保、退换货、配送、社群运营。工厂是**你的**供应商，不直接面对消费者。 |

流程条（横向 7 步，micro 大写）：
`选评论源 → AI 编译 SKU → 你确认上链 → 工厂报价冻结 → 社群出价 → 清算 → 你领差价`

CTA：`聊聊你的批次 →`（mailto）
小字：`自助发起为 V1；当前批次由 MAKEBOOK 团队协助开设。`

**约束**：本 section 不得出现"收益""回报""投资"等词（§2.1 原则 1）。

---

## 4. 量纲修复（P0 · 这是 bug）

### 4.1 现象

`app/components/campaign/quote-table.tsx:43`：

```ts
const eligible = eligibleCount(orderList, tier.unitPriceWei);   // 出厂价
```

而 `demand-curve.tsx` 用零售价。同一页两个数字互相矛盾：

| 位置 | Factory A 达标数 | 结论 |
|---|---|---|
| 工厂条件表 | 4 单（按出厂价 0.024 算） | 绿色「可成团」 |
| 需求曲线 | 2 单（按零售价 0.030 算） | 不可行 |

**真相**：Factory A 不可成团（≥0.030 的只有 0.034 / 0.032 两单 < MOQ 3）。表格盖了错误的绿章。
评委只要读这张表就会问"既然 A 也能成团，为什么 B 中标"，而屏幕上的答案是错的。

根因：品牌加价层（`marginBps`）没有进入 UI 计算。

### 4.2 修复

```ts
const retailWei = tier.unitPriceWei * BigInt(10000 + marginBps) / 10000n;
const eligible  = eligibleCount(orderList, retailWei);
```

`marginBps` 取自 `deployments/injective-testnet.json`（`2500`），无需额外链上读。
🔴 顺带修 `app/lib/chain/deployments.ts:3-9` 的 `DeploymentEntry` 类型——缺 `creator` / `feeRecipient` / `marginBps` / `feeBps` 四个字段，而 JSON 里都有。

### 4.3 表格改造

| 列 | 内容 |
|---|---|
| 工厂 | `FACTORY A` / `FACTORY B` + `DEMO FACTORY` 标签 |
| MOQ | `3` |
| **出厂价** | `0.019 test INJ` |
| **零售价**（新增） | `0.0238 test INJ` |
| 达标 | 按零售价计的 eligibleCount |
| 结果 | 中标 / 未中标 + 原因 |

原因行文案（兑现 spec 005 §2.3「输家可以验证自己为什么输」与 §1.4「我能自己验证结果」）：

- 中标：`达标 4 ≥ MOQ 3 · 达标数最多 → 中标`
- 未中标（不可行）：`达标 2 < MOQ 3 · 不可行`
- 未中标（可行但输）：`达标 4 ≥ MOQ 3，但达标数少于 FACTORY B → 未中标`

排序规则原文附在表尾 small 字号：`eligibleCount 最大 → 出厂价低 → quoteId/tierIndex 小`

### 4.4 清算结果区加证据

`result-block.tsx` 增加 settle 交易的 Blockscout 深链。
现状 tx 链接只出现在订单页与抽屉里，清算结果区没有——而这正是评委要看的地方。

---

## 5. 修血清单（P0）

| # | 位置 | 症状 | 修法 |
|---|---|---|---|
| 1 | `top-bar.tsx:24` | 390px 下顶栏竖裂成一字一行（「连接钱包」渲染成四行） | 各项 `whitespace-nowrap`；<640px 收紧凑态（缩字号/间距，必要时「工作台」收进溢出菜单） |
| 2 | `write.ts:94-120` | `extractRevertReason` 判断 `ContractFunctionRevertedError`，而 wagmi 抛的是 `ContractFunctionExecutionError`；正则也对不上 viem 消息格式 → 14 条错误文案全部退化为 fallback | `err.walk(e => e instanceof ContractFunctionRevertedError)?.data?.errorName` |
| 3 | `errors.ts:1` | 静态 `import { copy }` 英文包 → 中文用户永远看英文错误 | 接 `useCopy()`，见 §2.4 |
| 4 | `write.ts:189` + `pledge-panel.tsx` | 未连钱包点「出价预订」→ 提示"操作未完成，请重试"，完全不提示要连钱包 | `PledgePanel` 加未连钱包 / 错网前置门控，CTA 变「连接钱包后出价」 |
| 5 | `page.tsx:35-36`、`status-strip.tsx:24-25` | `state === undefined`（加载中）时默认渲染绿色「接单中」，Draft 也误显示为接单中 | 加载中渲染 skeleton；`Draft` 单独分支 |
| 6 | `hooks.ts:341` | `useMyOrder` 无 `retry:false`，合约对无订单地址 revert `NoOrder()`，react-query 默认重试 3 次 × 每 10s 轮询 | 加 `retry: false` |
| 7 | `orders/page.tsx:82` | 加载中先闪「你还没有订单」再跳出订单卡 | 加载态骨架，`isLoading` 与 `hasAnyOrder` 分开判断 |
| 8 | `pledge-panel.tsx:20` | 建议 chips `0.020/0.024/0.030` 全批次复用；failure 批次现有 2 单，再来 1 单 ≥0.02375 就变可行 —— 产品自己在推用户破坏演示资产 | chips 按批次配置；failure 批次全部低于其零售清算价 |
| 9 | 全站 | `useCampaign` 的 `isError`/`error` 零消费，RPC 挂掉页面显示 `—` + 绿色「接单中」；`copy.errors.RpcError` 已写好但零引用 | 消费 `isError`，接上 `RpcError` 文案 |
| 10 | `app/` | 无 `error.tsx` / `not-found.tsx`；`types.ts:parseCampaignState` 未知 state 会 throw，无边界兜底 | 补两个文件 |
| 11 | `providers.tsx:16-20` | WalletConnect 移除后只剩 `injected({target:"metaMask"})`，无 MetaMask 的浏览器点「连接钱包」得到空列表，无引导 | 检测 `window.ethereum` 缺失时显示「请安装 MetaMask →」 |

### 5.1 可访问性（P2）

| 位置 | 问题 |
|---|---|
| `pledge-panel.tsx:169` | 价格 chip 用 `data-selected`，缺 `aria-pressed` |
| `wallet-button.tsx:29` | `aria-hidden={!ready}` 但内部 `<button>` 仍可聚焦（WCAG 违规） |
| `compile-panel.tsx:161,201,312` | `<select>` 与两个 `<textarea>` 无 label / `aria-label` |
| `admin-table.tsx:111-127` | 表格无 `<caption>` / `<th scope>` |
| 全站 | 错误无 `aria-live`，屏幕阅读器不播报 |

---

## 6. 呼吸感（P1，时间盒硬切）

1. **项目页右栏**：出价面板之下补「你这笔钱会怎么走」小卡（复用 §3.2 C2 的分账数据），消除右栏 3/4 空场
2. **闲置产品图上线**：`public/products/` 共 12 张，代码只引用 5 张。将 `detail-strap` / `detail-insert` 并入产品卡规格区，`scene-desk` 作项目页次级视觉
   - ⚠️ `scene-commute` 与 `og-share` 实测 768×1360 竖版，不符 `scripts/product-images.md` 的 1360×768 横幅要求，**本轮不使用**
3. **首页 A/B 区分**：两张同款相机包并排，需在卡上明确区分（批次 A = 演示成功线；批次 B = 演示未达 MOQ）
4. **CTA 分化**：`开始体验` → 按状态分化为 `去出价` / `查看清算结果` / `已截止 · 等待清算`
5. **section 节奏**：项目页各区块间距统一到 `--spacing-7`（96px），消除当前忽大忽小的空场

---

## 7. 批次编排（运营）

**BRACELET-01 以 deadline +7 天重新部署**，作为社区体验批次。FRAME-01 A/B 保持不动，明早 08:00 现场 settle。

理由：
- settle 之后 FRAME-01 两批关闭，若不另开批次，"给用户上手的 demo"主链路第一步即失效
- bracelet 当前 0/50 单，首页上是一张死卡；换成长 deadline 后成为唯一活入口
- pitch 后首页 = 两批已清算（链上证据）+ 一批开放中（评委可当场自己下单）

执行：`contracts/script/demo-pipeline.sh` 或 `deploy-bracelet.sh`，需要 `.env` 私钥。
**由人执行，不由 agent 执行。** 完成后脚本自动回填 `deployments/injective-testnet.json`。

前端配套：`config.ts` 的 bracelet 条目更新为「社区批次」，`VALID_IDS` 不变。

---

## 8. 文档处置

### 8.1 立即（影响明早彩排）

| 文件 | 改动 |
|---|---|
| `specs/001` ×2、`docs/PITCH.md` ×2、`docs/DEMO_RUNBOOK.md` §6 | settle gas `286,858` → **`468,877`**（286,858 是 P0 真值，P1 新增三笔分账记账后已失效） |
| `docs/DEMO_RUNBOOK.md:53` | 现场旁白 `Loom min3@0.019` / `North ≥0.024` → 零售口径 **`0.02375`** / **`0.030`**。不改则明早会对着 0.0238 的屏幕念 0.019 |
| `docs/DEMO_RUNBOOK.md` §2 | 「预部署两套」→ 三套（+ §5「两个合约地址」同改） |

### 8.2 收尾

| 文件 | 处置 |
|---|---|
| `specs/006` §7、`specs/007` §3/§6 | 挂失效横幅，指向本 spec §1/§2 |
| `docs/EVIDENCE.md` 底部自动生成段 | 删除（含第三代废弃地址 `0x378bb7d0…` / `0x01c51b7c…`，零废弃标记）；改 `render-evidence.sh` 输出独立文件 |
| `docs/AGENT_CONTEXT.md` | 删除（内容与 AGENTS.md 重复且更旧：T9 未开工 / 51 测试 / spec 008 待写，全部过期） |
| `docs/CC_FRONTEND_HANDOFF.md`、`docs/FRONTEND-ARCHITECTURE.md`、`docs/PRD_FRONTEND_AUDIT.md`、`specs/003` | 移入 `docs/archive/`（已挂归档横幅） |
| `docs/ALAN_DESIGN_OPTIMIZATION_REPORT.md` | 加失效横幅（0.019 口径、遗留问题已修、"仅用 spec 007 token"结论已不成立） |
| `README.md`「当前实现边界」 | 整节重写（与同文件 L7「已上线」自相矛盾） |
| 测试数 `51` → `73` | `specs/001`、`docs/AGENT_CONTEXT.md`、`docs/PRD-v2.0-draft.md` |
| 根目录 | `kimi-debug-session_*.zip`（4.1MB）、`tsconfig.tsbuildinfo`、`t7-t9-snapshots.txt`、`visual-snapshots.txt` 加 `.gitignore` |

### 8.3 待办（不在本 spec 范围）

`predictions/` 子系统（LMSR 预测市场合约 + 独立 Vite SPA，17 个测试）目前**零文档**，且合约与前端均为 untracked。建议单独立 `specs/010-prediction-market.md`。

---

## 9. 验收锚点

### 9.1 设计 token

- [ ] `grep -rn "\[#\|#[0-9a-fA-F]\{6\}" app/ --include="*.tsx"` 仅命中 `design-tokens.ts`
- [ ] `grep -rn "text-sm\|text-xs\|text-base" app/ --include="*.tsx"` 零命中
- [ ] `grep -rn "gray-\|slate-\|bg-white\|text-black" app/` 零命中
- [ ] `.ambient-grid` 及其引用已删除
- [ ] 禁用态按钮不使用 opacity；截图目检不出现脏粉紫
- [ ] 中文标题字重 ≥800，与正文有明显区分
- [ ] 中文子集字体总计 ≤40KB（未达成则记录为已知风险）

### 9.2 量纲

- [ ] 工厂条件表的达标数与需求曲线一致
- [ ] Factory A 显示为**不可成团**
- [ ] 表格同时显示出厂价与零售价，各自有标签
- [ ] 中标 / 未中标各有一行可读的原因

### 9.3 品牌方

- [ ] 项目页可见发售方署名 + DEMO BRAND 标签 + creator 地址
- [ ] 下单抽屉在签名前显示价格拆解，且 `出厂 + 加价 = 你付`、`品牌 + 平台费 = 加价`
      （手算校验：0.019 → 0.02375；4 单成交时 工厂 0.076 / 品牌 0.0171 / 平台 0.0019，与 PRD 附录 A2 逐 wei 一致）
- [ ] FundsSplit 是分段条而非一行文字
- [ ] console 中同时是 operator 与 creator 的地址能看到 creator 面板
- [ ] 首页有面向主理人的 section，且不含"收益 / 回报 / 投资"字样

### 9.4 修血

- [ ] 390 × 844 顶栏不竖裂，触控目标 ≥44px
- [ ] 拒签 / 重复下单 / 重复领取 / 错网四类错误显示对应中文文案（非 fallback）
- [ ] 未连钱包点主 CTA 得到"请先连接钱包"而非"请重试"
- [ ] 首屏加载期间不出现绿色「接单中」
- [ ] 订单页加载期间不闪空态

### 9.5 整体

- [ ] 390 / 1024 / 1920 三档实机目检，无横向滚动**且无竖向碎裂**
      （注：`scripts/verify-i18n.mjs` 只查横向溢出，顶栏竖裂时它仍然全绿——不可只信脚本）
- [ ] 新钱包从零走通：连接 → 切链 → faucet → 出价 → settle → 领取
- [ ] en / zh 双语全页切换无残留英文（`/orders` 桌面端曾出现 zh 未生效）
- [ ] 生产 URL 全流程复走一遍

---

## 10. 优先级与时间盒

| 阶段 | 内容 | 预算 |
|---|---|---|
| 0 | §8.1 文档救急（gas / 旁白口径） | 0.5h |
| 1 | §7 bracelet 长 deadline 重部署（**人工执行**） | 1h |
| 2 | §5 修血 1–8 | 3h |
| 3 | §4 量纲修复 + §3.2 品牌角色（C1–C4） | 3h |
| 4 | §1 token 收口（字号阶梯 / disabled / 集中文件 / 字体子集） | 2.5h |
| 5 | §3.3 主理人叙事块 + §2.2 文案改写 | 2.5h |
| 6 | §6 呼吸感（**硬切，超时即砍**） | 2h |
| 7 | §8.2 文档收尾 | 0.5h |
| 8 | §9 三档目检 + 生产部署 + 主路径实跑 | 1.5h |

**砍单顺序**（时间不够时从后往前砍）：§6 → §8.2 → §5.1 可访问性 → §1.5 字体子集。
**不可砍**：§4 量纲（是 bug）、§5 修血 1–4、§8.1（明早要念）。
