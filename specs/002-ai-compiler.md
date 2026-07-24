# Spec 002 · AI 需求编译器

> 对应 PRD：06（AI 编译器）、11.2（canonical JSON 与哈希）、16A.1（AI 验收）。
> 代码：`lib/ai/`、`lib/schema/`；fixture 数据：`fixtures/comments.json`。

## 1. 范围与权限边界

AI 只做"文本 → 受约束 JSON"：候选 SKU、证据、未知项、价格信号。**AI 无钱包、无私钥、无发布权、无合约写权限**（FR-AI-08）；资金流程的入口永远是人工确认后的 manifestHash。

## 2. 管线（顺序固定）

```
粘贴评论 → 计数/去重 → 脱敏(redact.ts) → LLM(provider.ts) → Zod 校验 → 候选卡
        → 人工逐项编辑 → MarketManifestSchema.parse → canonicalize → keccak256 = manifestHash
```

任一环节失败（无 key、超时、schema 不符）→ 返回 fixture 并标 `fixture: true`，2 秒内响应（FR-AI-07）。

## 3. 契约

- 输入：`{ id, text, sourceLabel? }[]`，10–50 条；邮箱/手机号/地址片段在发给模型前替换为占位符（FR-AI-02）。
- 输出：2–3 个 `ProductCandidate`；每条 spec 必须 `sourceCommentIds` 非空或 `operationalAssumption=true`（FR-AI-04）；`priceSignals` 恒带"非资金承诺"声明，UI 不得渲染成订单数（FR-AI-05）。
- HTTP 契约（若前后端分开部署）见 `docs/FRONTEND_INTERFACE.md` 第 6 节。
- 环境变量：`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`（OpenAI 兼容端点）。密钥只进环境变量，不进仓库。

## 4. manifestHash 算法（三方一致性锚点）

1. 删除 UI 临时字段，按 `MarketManifestSchema` 校验；
2. 对象 key 递归字典序排序（数组顺序不变）；
3. `JSON.stringify` 无多余空格，UTF-8；
4. `keccak256(utf8Bytes)` → bytes32。

参考实现唯一来源：`lib/schema/canonicalize.ts`（前端 import 或照抄，禁止另写一套）。

**FRAME-01 锚点**：

```
public/manifests/frame-01.json
manifestHash = 0x7952a786db50f4ee3d6f1170a2f2c5d4fa1df5d90fe1ff06a5327e8c52b876b0
```

前端算出的 hash、部署参数、链上 `manifestHash()` 三者必须一致；`npm run test:lib` 含稳定性断言。

## 5. Prompt 约束（PRD 6.3，改动需记录）

只依据输入评论；无证据写 unknown 不补造；候选必须是单一可制造 SKU；冲突意见分列不平均；confidence 只表达提取把握；价格信号保留原币种语境；严格 JSON 无 Markdown。

## 6. 验收锚点

- [ ] `npm run test:lib` 全绿（当前 9/9）
- [ ] 无 `AI_API_KEY` 时 2 秒内返回 fixture 且 `fixture: true`
- [ ] 脱敏测试集不含直接联系方式
- [ ] frame-01.json 的 canonical hash 等于上述锚点
- [ ] lib/ai 代码路径无私钥、无合约写调用（grep 检查）
