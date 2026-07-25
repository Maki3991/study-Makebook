# MAKEBOOK 前端交接给 Claude Code

> ⚠️ 【已归档 2026-07-25】本文档描述旧前端时代（四步叙事 + Demo Panel）的方案/交接，已被 specs/006-frontend-rebuild.md 与 specs/007-frontend-construction.md 取代。保留仅作历史参考，施工以 006/007 为准。

更新时间：2026-07-24  
当前分支：`main`  
交接基线：`400ea5a`  
远程仓库：`https://github.com/gmy20060609-jpg/ACL-team`

## 1. 项目与分工

MAKEBOOK / 造物簿是围绕实体产品 `FRAME-01`（黑色 8L 模块化摄影斜挎包）的预生产订单簿。主路径是：

`AI Studio → Campaign → Order → Settlement → Receipt`

Alan 负责前端、视觉、产品体验、AIGC 资产和演示呈现。队友负责合约、AI 编译器、链上接口、部署与其他技术层。处理前端时必须保护队友的技术代码，尤其是：

- `contracts/`
- `lib/ai/`
- `lib/schema/`
- `deployments/`
- `fixtures/`
- `public/manifests/`
- `specs/`

前端的主要编辑范围：

- `app/components/makebook-app.tsx`
- `app/components/story-screens.tsx`
- `app/components/ui.tsx`
- `app/lib/mock-data.ts`
- `app/art-direction.css`
- `app/globals.css`
- `app/layout.tsx`
- `public/makebook-wordmark.png`
- `public/makebook-monogram.png`

## 2. 必读资料与优先级

发生冲突时按以下顺序判断：

1. 产品 PRD 与第 15 章原始文案  
   `C:\Users\jyc20\Desktop\makebook\MAKEBOOK_造物簿_产品需求文档_v1.0.md`
2. MAKEBOOK 视觉规范 v1.2  
   `C:\Users\jyc20\Desktop\MAKEBOOK-design-system-v1.2.md`
3. 前后端接口文档  
   `docs/FRONTEND_INTERFACE.md`
4. 利益相关方补充要求  
   `specs/005-stakeholder-requirements.md`
5. 当前已验收实现与本交接文档

PRD 第 15 章的关键文案涉及诚实边界，不要自行润色或改写。视觉规范与 PRD 局部冲突时，以产品真实性、可用性和完整演示为先。

## 3. Alan 的设计意图

不要把 MAKEBOOK 做成 Web3、炒币或通用 AI SaaS。它首先是一个制造实体包的产品。

目标气质：

- 制造业规格书、订单簿、工程图纸的克制感；
- 冷静、中性、精确，但有人味；
- 有设计感，不是粗糙后台，也不是套模板；
- 桌面端适合投屏和录屏，移动端适合钱包 App 内置浏览器真实操作。

禁止：

- 深紫渐变、玻璃拟态、发光边框；
- 赛博朋克、K 线感、跳动行情数字；
- 大圆角卡片、随意阴影、浮夸动效；
- 用暖橙色制造“区块链感”；
- 只有 hover 才能看到的信息；
- 传统 serif 字体作为 UI 正文；
- AI 自动生成网站常见的图标堆叠、重复卡片和空泛营销文案。

设计系统核心：

- 主背景 `#DFE3E6`；
- 深色结算区 `#14262C`，只用于 Settlement / Receipt；
- Azure `#1B4F6B` 用于主要 CTA、当前步骤和清算重音；
- Celadon `#9CC3C9` 只在深色结算区使用；
- Violet `#4E4570` 只表示 AI inferred，不能大面积填充；
- 圆角只允许 `0` 或 `2px`；
- 字体使用 Noto Sans SC / MiSans / Geist Mono；
- 字号阶梯：11 / 13 / 15 / 17 / 21 / 28 / 40 / 64；
- 字重只使用 400 / 500 / 600；
- 数字使用等宽数字，避免金额跳动；
- 状态来源标签使用“6px 方形标记 + 文字”，颜色不能是唯一信号。

六类来源标签必须保留并统一：

- `ONCHAIN`
- `AI GENERATED`
- `HUMAN CONFIRMED`
- `DEMO FACTORY`
- `OFF-CHAIN DEMO`
- `TESTNET`

## 4. 当前已完成

- 使用 MAKEBOOK Wordmark / Monogram；
- 完成 v1.2 冷中性视觉系统；
- 移除旧视觉层和多余 Motion 依赖；
- 390×844 移动端单列、固定关键 CTA；
- 1024×768 投屏尺寸无横向滚动；
- 1920×1080 桌面 Dashboard 与侧边步骤导航；
- Campaign 桌面端让需求曲线成为视觉焦点；
- AI 兴趣样本与测试网订单用不同图形表达；
- 工厂 tier、中标档位和 clearing line 有明确区别；
- Order 的确认、pending、success、disabled 状态；
- Settlement / Receipt 使用唯一深色舞台；
- 钱包地址、交易哈希截断并提供复制/Explorer 入口；
- 合约读取失败的 skeleton / retry 视觉；
- Operator / Factory 操作不进入主路径；
- 技术层已合并：合约、ABI、manifest schema、AI compiler、fixture 与接口文档。

## 5. 当前实现性质

前端目前是一个完整、可交互、可录屏的演示状态机，但大部分展示数据仍来自 `app/lib/mock-data.ts` 和组件内部状态。不要误称为已经完成真实钱包与真实合约联调。

下一阶段应依照 `docs/FRONTEND_INTERFACE.md` 把模拟状态逐步换成真实接口，同时保留 fixture / demo fallback。真实数据和模拟数据在 UI 上必须继续明确标注，不能混在同一来源里。

推荐接入顺序：

1. 读取 network / campaign 基础状态；
2. 接入钱包连接与错误网络提示；
3. 接入 `placeOrder` 与交易 pending / success / error；
4. 接入 clearing / settlement 状态；
5. 接入 refund / receipt；
6. 最后接 AI compiler，始终保留 fixture 降级。

不要让接口接入破坏现有演示路径。黑客松现场网络、RPC 或钱包失效时，Demo 仍必须可完整跑通。

## 6. 响应式与 UX 硬约束

必须逐一验证：

- `390×844`：移动钱包浏览器；
- `1024×768`：投屏硬性尺寸；
- `1920×1080`：录屏与展位大屏。

断点：

- `<768px`：单列纵向流；
- `768–1279px`：两列；
- `≥1280px`：完整 Dashboard + 步骤导航。

移动端：

- 所有触控目标至少 44×44px；
- 签名、下单、退款等关键操作固定在视口底部；
- 不依赖 hover；
- `maxPrice` 使用 `inputmode="decimal"`；
- 长地址和哈希截断、可复制；
- 注意 MetaMask / OKX 内置浏览器的 safe area 和视口高度。

桌面端：

- 四步主路径清楚；
- 正文至少 14px，重要金额至少 18px；
- pending → success 在录屏中必须明显；
- 横向空间用于曲线与工厂 tier 等信息并置；
- 不允许把移动端简单拉宽。

所有交易按钮都要有：

`idle / loading / success / error / disabled`

pending 时禁用，防止重复提交。读取失败时显示 skeleton 与 retry，不允许白屏。

## 7. 开发与验证

推荐使用 pnpm：

```bash
pnpm install
pnpm run dev
pnpm run lint
pnpm run test:lib
pnpm run build
node --test tests/rendered-html.test.mjs
```

当前已验证结果：

- lint：通过；
- AI/schema tests：9/9；
- build：通过；
- rendered HTML / responsive requirement tests：2/2。

本地入口通常是：

`http://localhost:3001/`

如果端口被占用，以终端实际输出为准。

## 8. Git 与 AI 审查要求

这是黑客松项目，有 AI 使用审查。不要一次生成或提交整个项目。

- 每次只处理一个可解释的小目标；
- 修改前先读相关 PRD、接口和现有组件；
- 每次提交前运行与改动相称的检查；
- commit message 要描述真实工程意图；
- 小量、多次 commit / push，保留迭代痕迹；
- 不要重写或 squash 已有历史；
- 不要强推 `main`；
- push 前先 `git fetch`，队友有新提交时安全合并；
- 不要覆盖队友技术目录；
- 不要在没有验证的情况下声称已接入真实链上功能。

## 9. 给 CC 的直接任务

先执行只读审查：

1. 阅读本交接、PRD、设计规范与 `docs/FRONTEND_INTERFACE.md`；
2. 运行当前项目并查看三个目标尺寸；
3. 确认当前前端没有被技术层合并回退；
4. 列出真实接口接入点，不立即大规模改造；
5. 从最小的一条真实读取链路开始，每完成一个状态就测试、提交、推送。

维护原则：Alan 对视觉与体验做最终判断；技术事实以合约、ABI 和接口文档为准；任何数值都必须让用户看出它来自链上、AI、人工确认还是 Demo 模拟。
