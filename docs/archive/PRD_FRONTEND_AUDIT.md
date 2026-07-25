# MAKEBOOK 前端 × PRD 自检

> ⚠️ 【已归档 2026-07-25】本文档描述旧前端时代（四步叙事 + Demo Panel）的方案/交接，已被 specs/006-frontend-rebuild.md 与 specs/007-frontend-construction.md 取代。保留仅作历史参考，施工以 006/007 为准。

更新时间：2026-07-24

## 已由前端实现并验证

- 单页四步路径：AI Studio → Campaign → Order → Settlement & Receipt。
- 移动端 390×844、投屏 1024×768、桌面 1920×1080 均无横向滚动。
- FRAME-01 产品图是主视觉；界面不使用币价、K 线、玻璃拟态或赛博朋克语言。
- 六类来源标签均为统一组件，并同时使用图标、文字和颜色。
- AI / 访谈兴趣样本与测试网资金订单分区展示。
- 需求曲线包含价格轴、订单轴、可行 / 不可行 factory tiers 与中标视觉重音。
- 未人工确认候选方向时，移动端和平板端不能进入后续步骤。
- maxPrice 使用数字键盘；地址和哈希截断、可复制；交易提供 Explorer 链接。
- Order 与 Refund 按钮覆盖 disabled、pending、success 和 error / reject 演示状态，pending 时禁止重复点击。
- 合约读取失败保留页面外壳、skeleton 与重试入口。
- 1024×768 下正文计算字号为 14px，重要金额大于 18px。
- PRD 第 15 章的下单、公开性、pending、拒签、错误网络、清算和退款文案未改写。
- Operator / Factory 操作只存在于隐藏 Demo Panel。
- `prefers-reduced-motion` 用户可关闭非必要动画。

## 需要技术分支接入后才能最终验收

- Supabase / AI API 的真实评论输入、生成与结构化证据。
- Injective EVM Testnet 钱包连接、Chain ID 1439 校验和真实签名。
- Campaign、orders、factory tiers、settlement 与 receipt 的真实合约读取。
- 页面中演示交易哈希替换为本次部署产生的真实测试网交易。
- 刷新后恢复订单、claim 状态和幂等保护。
- 生产部署环境的首屏性能、钱包 App 内置浏览器与真实 RPC 失败测试。
- 最终 secrets scan、合约权限审查和演示钱包资产检查。

## 当前诚实边界

当前仓库是可交互的前端与演示状态机。固定订单、工厂和交易数据属于前端 fixture，只有技术分支接入并完成测试网交易后，才能作为真实链上证据展示。
