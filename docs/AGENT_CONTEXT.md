# MAKEBOOK 项目上下文（Agent 交接用 · 2026-07-25 快照）

> 把这份文件整体贴给任何新接入的 agent 作为冷启动上下文。仓库内施工规范仍以 `AGENTS.md` 为准。

## 1. 项目一句话

MAKEBOOK（造物簿）：实体商品的预售交易平台 demo——品牌方把评论经 AI 编译成产品规格（manifest，hash 上链锚定），工厂阶梯报价（MOQ+单价），买家按最高愿付价全额托管下单，到期由合约做确定性统一价清算：赢家付统一清算价领回差额、落选/未达 MOQ 全额退、工厂领应收。黑客松项目，部署在 Injective EVM Testnet（Chain ID 1439）。

## 2. 当前状态（2026-07-25 实测，非估算）

**线上**：https://makebook-frontend.jiachexie6.workers.dev （Cloudflare Workers，2026-07-25 上线；AI 编译在生产环境走 fixture 降级，属规格内行为 FR-AI-07）

**链上三套 Campaign（全部 Open、已 Blockscout verify，P1 三方分账 spec 008）**：

| 批次 | 地址 | 实况 |
|---|---|---|
| success | `0x260A9C9075B09B5950385fEB1AEa7d83a25E556e` | 5 单（0.034/0.032/0.028/0.026/0.022），预览可行：零售统一价 0.02375 INJ、成交 4（Loom 报价 quoteId=1） |
| failure | `0x785CbE7E2C874413CF5430BA272Bfa02bcc77AA9` | 2 单（0.023/0.022），零售 0.02375 无人达标不可行 |
| bracelet | `0x8Bb41E7195eD2b440c868BBa1d3d1146970dC691` | 0 单，新批次 |

- deadline 统一 `1785024000`（2026-07-26 08:00 UTC+8）；operator `0x9d60cab786720520038008640b9f7ea56348DA89`；P1 参数 marginBps=2500 / feeBps=200，creator `0x42a0c1B8…93B0a`、feeRecipient `0x04a47233…E2D3`
- manifestHash 锚点：FRAME-01 `0x92e96e07…cc6ec`、BRACELET-01 `0x1c503957…c958dd`（lib/schema 可复算）
- 地址来源：`deployments/injective-testnet.json`（前端构建期内嵌）；部署证据 `deployments/receipts/testnet-20260725-054255.jsonl`
- 前端读函数 10s 轮询 + OrderPlaced 事件从 deployBlock 增量拉取；写函数以 receipt 事件解码为成功凭证

**代码**：买家主链路（连钱包→领水→出价→查看订单→清算→领差额/全额）代码 100%（T1–T8 完成，`/orders`+claimRefund 已落地），首页/项目页全部真链读取无写死演示值；`/console` 工作台仍是占位桩（T9 未开工）。forge 51/51、lib 9/9、build/lint 全绿。另一个 agent 会话在并行推进前端，改动未全部提交。

## 3. 仓库与技术栈

- 前端：Next.js 16 / vinext（输出 Cloudflare Worker）+ Tailwind 4 + wagmi v2 + RainbowKit v2 + TanStack Query；页面：`/`、`/campaigns/{success,failure,bracelet}`、`/orders`、`/console`、`/api/compile`
- 合约：`contracts/src/MakebookCampaign.sol`（一个部署=一个批次，无代理无 ownerWithdraw；P1 起 ABI 44 函数/9 事件/24 错误，见 spec 001 §3 与 spec 008，改动需全队确认并同步 abi→接口文档→前端）
- AI 编译：`lib/ai`（OpenAI 兼容 provider，2s 超时降级 fixture）；canonical JSON + keccak：`lib/schema`
- 文档权威层级：`AGENTS.md` + `specs/006`（做什么）+ `specs/007`（怎么施工）+ `docs/FRONTEND_INTERFACE.md`（字段级接口）为活权威；`docs/CC_FRONTEND_HANDOFF.md`、`FRONTEND-ARCHITECTURE.md`、`PRD_FRONTEND_AUDIT.md`、`specs/003` 已归档勿读；`docs/PRD-v2.0-draft.md` 的 P1 三方分账（9.B，2026-07-25 已实现）与 demo 一致，fixedCost/保留价/feeCap 仍为 V2 设计层未实现，不得混称

## 4. 环境坑（都踩过了，别再踩）

- Node 必须 ≥22.18（本机默认 22.0 跑不了测试；用 homebrew node 25）
- foundry 在 `~/.foundry/bin/`（不在 PATH），当前为 nightly 1.7.2
- **cast 1.7+ 的 `--create` 模式把其后 flag 当位置参数解析**：flag 必须放位置参数前（`cast send --async --json … --create CODE`）
- **Injective RPC 的 receipt/tx 查询经常返回 null**：广播用 `cast send --async`；读合约地址用 operator nonce 反推（`cast compute-address`）兜底；两个部署脚本（`contracts/script/demo-pipeline.sh`、`deploy-bracelet.sh`）已打补丁
- 交易走 legacy + `gasPrice 160000000`（无 EIP-1559）
- 本机代理 fake-ip 会劫持 workers.dev 导致握手失败；验证生产 URL 用 `curl --resolve <host>:443:<真实IP> --noproxy '*'`
- 部署私钥在 `.env`（OPERATOR/NORTH/LOOM/BUYER_A–E，8 个，永不提交）；BUYER_C 是 2026-07-25 新生成的演示钱包

## 5. 常用命令

```bash
npm run dev          # vinext 开发
npm run test:lib     # lib 单测（9/9）
cd contracts && ~/.foundry/bin/forge test   # 合约 51/51
contracts/script/demo-pipeline.sh testnet status|setup|settle|claims|verify
contracts/script/deploy-bracelet.sh          # 新批次部署模板
npm run build && npx wrangler deploy --config dist/server/wrangler.json
```

## 6. 待办（按优先级）

1. **生产真钱包验收**：新钱包在生产 URL 走五步（连接→切 1439→faucet→下单→deadline 后 settle→claimRefund）
2. **git 提交+推送**：4 个部署产物文件（两脚本补丁、deployments、receipts）待提交；`local/chain-integration` 分支待推送合并 main（GitHub 仓库已 public：AdventureX2026-MAKEBOOK）
3. **T9 `/console`**：品牌方编译面板（/api/compile 后端就绪）+ 工厂 claimPayout
4. **合约 v2（spec 008 待写）**：MakebookFactory 注册表合约 + 品牌自服务向导（手动优先、AI 辅助）+ V1 经济参数（creator/marginBps/reservePrice/feeBps/三方分账，见 PRD v2.0 §9.B）；MakebookCampaign 核心暂不动
5. 优化项：生产 AI provider 超时、产品图 6 张 manifest status 元数据回填、EVIDENCE.md 在 settle 后重渲染

## 7. 红线

- 禁止在 UI 手写演示数值（订单数/价格只能来自链上读取）
- 禁止改动 `lib/`、`contracts/src`、`fixtures/`、`public/manifests/`（前端只读消费）；私钥不进浏览器、不进聊天/截图
- 禁止新增路由/页面/导航项；视觉以 `.agents/skills/alan-design/SKILL.md` 为准
- 遇到 specs 未覆盖的情况：停下来问，不自行发挥
