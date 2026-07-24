# MAKEBOOK / 造物簿

MAKEBOOK 是面向实体新品的预生产订单簿：AI 将评论与访谈整理为可制造的 SKU，消费者用全额担保的最高愿付价表达真实需求，工厂提交 MOQ 阶梯报价，Injective 合约在截止后按公开规则统一清算。

当前首个案例是 `FRAME-01`——一款黑色 8L 模块化摄影斜挎包。

## 这份仓库包含什么

本仓库当前聚焦 MAKEBOOK 的前端、视觉系统和完整演示路径：

1. **AI Demand Studio**：评论证据 → 候选 SKU → 人工确认
2. **Campaign Market**：产品说明、兴趣样本、资金需求曲线与工厂 tiers
3. **Conditional Order**：钱包、maxPrice、同额预锁与签名前确认
4. **Settlement & Receipt**：清算原因、个人退款、交易与 manifest 凭证

界面使用统一来源标签区分 `ONCHAIN`、`AI GENERATED`、`HUMAN CONFIRMED`、`DEMO FACTORY`、`OFF-CHAIN DEMO` 与 `TESTNET`，避免把 AI 信号、测试网状态和真实制造混在一起。

## 当前实现边界

- 前端交互与成功/失败演示状态可独立运行。
- 仓库中的固定交易哈希和订单数据仅用于前端联调，不是最终链上证据。
- 钱包、合约读取、真实交易与 AI API 由团队技术分支接入；接入后仍沿用当前状态与错误界面。
- 这是测试网原型，不处理真实资产，也不保证真实生产、物流或质量履约。

## 仓库结构（Monorepo）

- `app/` — 前端：首页 + /campaigns/[id] + /orders + /console + /api/compile（specs/006 信息架构）
- `contracts/` — MakebookCampaign 清算合约（Foundry，51 个测试全绿；见 `contracts/README.md`）
- `lib/schema/` — Market Manifest Zod schema + canonical JSON / manifestHash（前后端共用）
- `lib/ai/` — AI 需求编译器：脱敏、OpenAI 兼容适配器、Zod 校验、fixture 降级
- `fixtures/` — 成功/失败清算剧本与评论样本（comments.json、bracelet-comments.json；Demo 模式数据源，数值与 PRD 附录 A 逐 wei 对齐）
- `public/manifests/` — 人工确认版 manifest（canonical 格式）：frame-01.json、heritage-bracelet.json
- `deployments/injective-testnet.json` — 预部署 Campaign 地址（已回填真实地址，两套 Campaign）
- `docs/FRONTEND_INTERFACE.md` — 前后端唯一对接入口（ABI / revert 文案 / 状态机 / 事件 / hash 算法）
- `docs/DEMO_RUNBOOK.md` — 演示手册：预部署步骤、2 分钟流程、降级预案、评委问答
- `specs/` — SDD 规格文档（见 `specs/README.md`）
- `worker/`、`db/`、`examples/d1/`、`build/sites-vite-plugin.ts` — vinext 模板残留，当前 dormant（db 未接线，D1 binding 为空）

## 后端 / 合约

```bash
npm run test:lib        # lib/schema + lib/ai 测试（node --test，需 Node ≥ 22.18）
cd contracts && forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-git
forge test -vv          # 合约 CT-01~CT-12 + 端到端
```

部署到 Injective EVM Testnet 的命令（必须带 `--legacy --gas-price 160000000 --gas-limit 2000000`）见 `contracts/README.md`。

## 响应式验收

移动端和桌面端均为正式使用场景：

- `390 × 844`：钱包 App 内置浏览器，单列流程与底部关键操作
- `1024 × 768`：投屏尺寸，两列布局，无横向滚动
- `1920 × 1080`：录屏与展位大屏，四步单页 Dashboard

交互目标不小于 `44 × 44px`；金额使用等宽数字；地址和哈希可复制；交易状态覆盖 idle、loading、success、error 与 disabled。

## 本地运行

需要 Node.js `>=22.18.0`（实测 22.13–22.17 无法 flagless 跑 .ts 测试）。包管理器以 npm 为准：仓库根暂存 pnpm-lock.yaml 与 package-lock.json 双 lockfile，pnpm-lock.yaml 待清理。

```bash
npm install
npm run dev
```

检查前端：

```bash
npm run lint
npm run build
npm test
```

## 设计方向

视觉参考制造业规格书、订单簿与工程图纸：暖灰纸张、黑色信息骨架、克制蓝色强调和清晰的来源标记。产品图是主角；不使用加密行情、K 线、赛博朋克、玻璃拟态或蓝紫发光来制造“Web3 感”。

设计和实现过程采用小步提交。AI 用于实现辅助与审查，但产品逻辑、视觉方向、信息层级和最终验收均以团队 PRD 与人工判断为准。

## 前端所有权

- Alan：产品体验、响应式前端、视觉系统、AIGC 资产与展示叙事
- 团队技术方向：AI 服务、钱包/viem、Injective 合约、部署地址与真实交易证据
