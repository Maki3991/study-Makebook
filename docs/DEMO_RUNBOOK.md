# MAKEBOOK 演示手册（Pitch Runbook）

面向黑客松现场：如何把项目跑通并完成 2 分钟 pitch。配合 PRD 第 18 章使用。
本仓库当前状态：合约与后端模块已完成并测试通过（forge 51/51、lib 9/9），前端由队友按 `docs/FRONTEND_INTERFACE.md` 开发。

## 当前进度与剩余工作

| 部分 | 状态 | 负责人 |
|---|---|---|
| 合约 MakebookCampaign.sol + 51 测试 | ✅ 完成 | 后端 |
| AI 编译模块 lib/ai（fixture 降级） | ✅ 完成 | 后端 |
| canonical JSON + manifestHash（lib/schema） | ✅ 完成，hash 锚点 `0x92e96e07…cc6ec` | 后端 |
| fixtures 成功/失败剧本 + 20 条评论 | ✅ 完成 | 后端 |
| 前端四步叙事 + Demo 模式 | 🔲 队友，按接口文档对接 | 前端 |
| Testnet 预部署两套 Campaign | 🔲 见下方第 2 步 | 后端 |
| 证据页 / 视频 / README 素材 | 🔲 演示前一天完成 | Producer |

## 1. 赛前准备（T+0 必做）

1. 准备 7 个测试钱包：1 operator、2 factory（North/Loom）、≥4 buyer。只记录地址，私钥只在各自 MetaMask / 本地环境变量。
2. 每个钱包去 faucet 领 test INJ：<https://testnet.faucet.injective.network/>（buyer 至少 0.03，operator/factory 少量 gas 即可）。
3. 只读验证网络：`cast chain-id --rpc-url https://k8s.testnet.json-rpc.injective.network/` 应返回 `1439`；Blockscout 能打开。
4. 复核 manifestHash：`npm test` 中 lib/schema 单测会打印并断言 FRAME-01 的 hash，必须与部署参数一致。

## 2. 预部署两套 Campaign（演示前一天完成）

按 `contracts/README.md` 的命令部署两个合约实例（都带 `--legacy --gas-price 160000000 --gas-limit 2000000`）：

- **Success Campaign**：deadline 设在演示时段附近。部署后依次：`registerFactory`（North、Loom）→ 两个 factory 钱包各自 `submitQuote`（North: min3@0.024；Loom: min3@0.019，可各加第二档）→ operator `openCampaign` → 5 个 buyer 钱包按 fixtures/success.json 下单（0.026 / 0.024 / 0.021 / 0.019 / 0.017）。**先不 settle**，留到现场触发；同时保留一份已 settle 的截图/tx 作为兜底。
- **Failure Campaign**：同样流程，但只下 2 个订单（低于 MOQ 3），现场 settle → Failed → 演示全额退款。

部署后把两个地址、manifestHash、deadline 写入 `deployments/injective-testnet.json`（替换占位零地址），前端从此文件读取。两个合约都做 Blockscout verify（命令见 contracts/README.md）。

## 3. 现场 2 分钟流程（对应 PRD 18 章节）

| 时间 | 动作 | 证据 |
|---|---|---|
| 0:00–0:15 | 讲问题：品牌靠点赞猜产量，工厂靠询价猜订单 | 口述 |
| 0:15–0:35 | AI Studio 粘贴 fixtures/comments.json 的 20 条评论 → 生成 3 候选 → 展示证据/unknowns → 确认 FRAME-01，展示 manifestHash | AI GENERATED → HUMAN CONFIRMED 标签切换 |
| 0:35–0:55 | Campaign 页展示两家 DEMO FACTORY 的冻结 MOQ 曲线 | 报价卡 + ONCHAIN 标签 |
| 0:55–1:15 | 一个 buyer 钱包现场连接 MetaMask 下单（或展示已下单 tx） | 真实 testnet tx + Blockscout 深链 |
| 1:15–1:35 | Success Campaign 现场 `settle`；结果页逐条解释 Loom min3@0.019 为何中标（North 只有 2 人 ≥0.024 不可行） | CampaignSettled 事件 |
| 1:35–1:50 | 赢家领差额 / 切 Failure Campaign 展示 Failed + 全额退款；打开 Blockscout | RefundClaimed / FactoryPayoutClaimed tx |
| 1:50–2:00 | 收尾一句话：MAKEBOOK 把需求、价格和 MOQ 变成 Injective 上可执行的生产清算 | — |

全程 <120 秒主路径（DEMO-01）。评委追问用 PRD 19.1 高频问答。

## 4. 降级预案（按优先级）

1. **RPC 抖动**：前端切备用 RPC 环境变量；已下单的 tx 链接不受影响。
2. **现场网络完全挂掉**：切前端 Demo 模式（fixtures 驱动，全部视图可走通，数据标 OFF-CHAIN DEMO），同时展示预录的 testnet tx 证据页。**不得把预录状态说成现场交易。**
3. **AI API 故障**：lib/ai 自动落 fixture（<2 秒），页面显示 Fixture 标签，不阻断流程。
4. **钱包拒签/余额不足**：按 PRD 15 章文案提示，换备用 buyer 钱包重试。

## 5. 提交前证据清单（PRD 附录 A.3 精简版）

- [ ] Chain ID 1439，RPC/Explorer 现场可达
- [ ] 两个合约地址已 verify，源码公开
- [ ] manifest JSON 与链上 hash 一致（`0x92e96e07…cc6ec`）
- [ ] 3+ buyer 订单 tx 可在 Blockscout 查看
- [ ] settle / 差额 refund / 全额 refund / factory payout 各至少一条 tx
- [ ] 重复 claim、重复 settle 被拒的截图或录屏
- [ ] 2 分钟视频（字幕、tx 可见）+ 关键截图离线备份
- [ ] README：启动、部署、架构、团队分工
- [ ] 30s / 2min / 5min 三套讲法彩排过

## 6. 评委最可能攻击的三个点（背熟）

1. **"普通服务器也能做，为什么上链？"** —— 平台可以改订单、报价、deadline、退款逻辑；这里资金已全额预锁，关键输入 Open 后冻结，清算由公开合约执行，任何一方不能事后改规则。
2. **"为什么是 Injective？"** —— 高性能金融向 EVM、极低 gas 让 50 订单清算成本可忽略（实测 settle 286,858 gas）、MetaMask 零门槛、Bank/MTS 余额互操作是后续稳定币支付的扩展点。
3. **"AI 是不是噱头？"** —— AI 只做结构化编译：每条规格可追溯评论、unknowns 明示、Schema 强校验、人工确认后哈希上链；AI 无钱包、无发布权，资金决策全在人和合约。
