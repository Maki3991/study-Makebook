# MAKEBOOK T4–T6 视觉优化报告

## 修改文件清单

| 文件 | 改动概要 |
|---|---|
| `app/globals.css` | 新增 `.chip`、`.input`、`.legal`、`.section` 工具类；统一 chip 选中态（accent-soft 底 + accent 边框）、输入框聚焦态、法律文案左强调线。 |
| `app/page.tsx` | Hero 标题加 `max-w-3xl` 与更松的垂直节奏；三步条由 3 张独立卡片改为横向通栏（桌面分三栏/移动堆叠），已连钱包时 Step 1 自动勾选；预告区改为 2 列网格，避免 3 列空洞。 |
| `app/campaigns/[id]/page.tsx` | 左侧内容区去 card 化，改为 ProductCard 顶部锚点 + 分隔线分隔的后续区块；右侧 sticky 出价面板保留 card。 |
| `app/components/campaign/status-strip.tsx` | 移除 surface 背景；状态徽标+倒计时横向一组，orders/current preview 作为 stats 横向分组；数字保持 `num` + `tabular-nums`。 |
| `app/components/campaign/product-card.tsx` | 桌面端改为左图（45%）右信息的横向布局；移动端保持上图下文；规格表减少背景/边框，靠留白与层级区分；hash 校验行缩小且不抢视觉。 |
| `app/components/campaign/quote-table.tsx` | 由 Factory A/B 卡片改为表格式横向条带：Factory / MOQ / Unit price / Eligible / Status；行内用分隔线，状态用 success/warn 文字色。 |
| `app/components/campaign/demand-curve.tsx` | 删除底部重复的 `price → count` 列表；SVG 加虚线网格、坐标轴标题、数据点标签、清算价竖线保持 success 色并加小标签。 |
| `app/components/campaign/pledge-panel.tsx` | 输入框与 chips 使用 `.input`/`.chip` 工具类；chips 选中态走 accent-soft；错误提示改为 danger 文字色，不再用红底。 |
| `app/components/campaign/back-drawer.tsx` | 成功态不再显示完整 tx URL，改为「View on Blockscout ↗」按钮 + 截断 hash；法律文案用 `.legal` 左强调线分组；复选框与文字基线对齐。 |
| `app/components/campaign/result-block.tsx`（附带最小改动） | 为与左侧去 card 化布局一致，将 `surface` 改为 `.section`；未在原始任务清单中，但属于同一视觉流。 |
| `scripts/visual-snapshot.mjs`（新增） | Playwright 抓取桌面/移动端首页与两个项目页的文本与截图，用于验收关键信息未丢失。 |

## alan-design 对应条款说明

- **§2 / §6 / §11（信息横向分组、减少纵向堆叠、卡片只用于真实对象）**
  - 首页三步条由 3 张 card 改为通栏横向分组；项目页左侧由 `space-y-6` 的 4 张 card 改为 ProductCard（真实对象，保留 card）+ 其余区块以 `.section` 分隔线组织。
  - 状态条的徽标/倒计时/订单数/预览改为两排横向分组，而非纵向列表。
- **§6 / §11（强网格、建筑感、编辑感）**
  - ProductCard 桌面端左图右文；QuoteTable 使用 5 列表头+数据行的强网格；DemandCurve SVG 加网格与坐标轴标题，增强可读性。
- **§7（Typography 层级）**
  - 标题使用 tracking-tight、副标题使用 leading-relaxed；金额/订单数/价格全部使用 `num` + `tabular-nums`；标签使用 uppercase tracking-wide 小字。
- **§8（Color 克制）**
  - 仅使用 spec 007 token：canvas/surface/ink/line/accent/success/danger/warn。accent 仅用于 CTA 与可交互态；success 用于清算价竖线与成团状态；warn/danger 仅文字色，不加色块底。
- **§9（Imagery 作为结构元素）**
  - ProductCard 产品图占据 45% 宽度作为视觉锚点；首页 batch/preview 卡片保持 3:4 竖图比例。
- **§10（Interaction 克制）**
  - 仅保留 hover 底色/边框 150ms 过渡；无入场动画、无滚动触发、无玻璃拟态。
- **§16（Completion checklist）**
  - 主任务 obvious（Hero + CTA）；信息层级清晰；响应式 390px 无横向溢出；关键链上数据（5 单/0.019/4、2 单/不可行）完整保留。

## 自检结果

| 检查项 | 命令 | 结果 |
|---|---|---|
| app 目录类型检查 | `npx tsc --noEmit` 后过滤 `^app/` | ✅ 无 app 目录类型错误（项目其它目录存在既有错误，与本次改动无关） |
| app 目录 lint | `npx eslint app --ignore-pattern dist --ignore-pattern .next` | ✅ 无错误、无警告 |
| 生产构建 | `npm run build` | ✅ 构建成功，全部 5 个环境完成 |
| 开发服务器 | `npm run dev` + curl `/`、`/campaigns/success`、`/campaigns/failure` | ✅ 全部返回 200 |
| 链上数据锚点 | Playwright 文本快照 | ✅ success 页：5 / 50、0.019、4 orders clearing；failure 页：2 / 50、Below MOQ |

## 当前截图与文本快照

- 文本快照：`visual-snapshots.txt`
- 桌面截图：
  - `visual-snapshots/home-desktop.png`
  - `visual-snapshots/campaign-success-desktop.png`
  - `visual-snapshots/campaign-failure-desktop.png`
- 移动截图：
  - `visual-snapshots/home-mobile.png`
  - `visual-snapshots/campaign-success-mobile.png`
  - `visual-snapshots/campaign-failure-mobile.png`

### 关键信息快照摘要

**首页**
- Hero：标题 + 副标题 + Start demo CTA
- 三步条：Step 1/2/3 横向通栏，Step 1 未连接时显示图标/连接后显示勾选
- 在售区：Batch A（5/50 orders、0.019/4 clearing）、Batch B（2/50 orders、Below MOQ）
- 预告区：Black 10L Urban Short-trip Backpack、Commuter Tote with Removable Insert（2 列平衡布局）

**项目页 /campaigns/success**
- 状态：Accepting orders、1d 1h 23m、ORDERS 5 / 50、CURRENT PREVIEW 0.019 / 4 clearing
- 产品：FRAME-01 Camera Sling / Batch A / Capacity 8L / Color Black / Insert Removable / hash verified
- 工厂：Factory A 0.024（1 orders short）、Factory B 0.019（can clear）
- 曲线：5 个价格点与清算价竖线
- 出价面板：输入框 + 0.019/0.024/0.026 chips + Back now

**项目页 /campaigns/failure**
- 状态：Accepting orders、ORDERS 2 / 50、CURRENT PREVIEW Below MOQ
- 工厂：Factory A/B 均为 1 orders short

## 遗留问题

1. **copy.ts 未含「View on Blockscout ↗」文案**：按任务指令在抽屉成功态使用了该 inline 文案。若需严格统一走 copy.ts，建议后续补充 `drawer.viewOnExplorer` 键。
2. **链上数据锚点依赖当前测试网状态**：deadline 已接近（2026-07-25 22:00Z），上线前需按 spec 006 §8 重新部署并延后 deadline，否则用户无法完整走通下单→清算→领取链路。
3. **需求曲线 SVG 在极小屏幕下**：x 轴标签密集，390px 下尚可辨认，更窄设备可考虑隐藏部分价格点标签。
4. **结果区标题硬编码 "Settlement result"**：该文案未在 copy.ts 中定义，当前仅作为区块标题；后续若需多语言，建议补入 copy.ts。

## 结论

alan-design 优化完成，当前 UI 已满足：
- 信息层级清晰、横向分组明确、卡片仅用于真实对象；
- 仅使用 spec 007 token，无新色/渐变/玻璃拟态/emoji；
- 链上读取功能未破坏，success/failure 锚点数值与链上保持一致；
- tsc（app 目录）、lint（app 目录）、build、dev 全部通过。

**可以继续推进 T7（订单页 + 领取链路）。**
