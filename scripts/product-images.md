# MAKEBOOK 产品图资产策划（FRAME-01）

> 执行：K2.7 运行 `python3 scripts/gen-product-image.py --all -j 4`（并发生成，已存在的自动跳过）。
> 本文件管"拍什么、为什么、怎么验收"。提示词定稿在 `product-images.manifest.json`，**改图先改 manifest，不直接改脚本**。

## 1. 拍摄逻辑

图不是装饰，是规格的证人。每张图都对应 manifest 里的一条规格或一条用户评论诉求，让用户在 3 秒内相信"这个产品被认真想过"：

| 图 | 证明什么 | 用在哪 |
|---|---|---|
| hero ✅ | 产品本体成立（黑、斜挎、都市感） | 批次卡、项目页主视觉、订单缩略图 |
| detail-insert ✅ | insert: removable（可拆卸内胆） | 项目页规格区 |
| detail-strap ✅ | 宽肩带（评论 c07/c19 的强诉求） | 项目页规格区 |
| hero-alt | 与批次 A 区分（同一产品，诚实复用） | 批次卡 B |
| scale-camera | capacity: 8L = 一机两镜（评论 c01） | 项目页规格区容量带 |
| scene-commute | 使用场景（都市通勤，评论 c15） | 当前无 UI 引用（specs/006 首页无横幅区块，代码无引用） |
| scene-desk | 备用：社区发帖 / 关于区 | 不进主链路 |
| og-share | 社区分享的封面（MVP 公开发布需要） | og:image / twitter:image |

风格基线（全系列一致）：浅灰影棚底 / 哑光黑主体 / 柔和顶光 / 细腻阴影 / 无人物 / 无文字 / 无 logo / 无水印。风格词已写进每条提示词，不要删——删了就串味。

## 2. 尺寸与比例规则

- 卡片与规格区图：3:4 竖版（manifest 请求 1184x896，API 目前返回 896x1184 竖版，属已知行为，脚本会打印实际尺寸）
- 横幅与 OG 图：1360x768 横版；OG 前端按 1200×630 居中裁剪，构图已要求居中留白
- 前端一律 `object-fit: cover` + 固定比例容器，不依赖原图精确尺寸

## 3. 验收标准（生成后人工目检，逐张过）

- [ ] 无文字、无水印、无 logo、无人物（含手部）
- [ ] 包体结构物理合理：背带走向、扣具连接、拉链逻辑不违反常识
- [ ] 背景与光线与已有 hero 一致（浅灰底、顶光、软阴影）
- [ ] 主体黑色哑光，不发蓝、不发亮皮感
- [ ] 尺寸方向符合用途（横幅必须横版；竖版图不得横过来拉伸用）

不合格的重生成：`python3 scripts/gen-product-image.py --only <id> --force`；连续两次不合格，改 manifest 里该条提示词（先加具体约束，再考虑换 seed），不要盲目刷图。

## 4. 前端接线（spec 007 补充）

- 图片路径：`/products/frame-01/<file>`（public 目录，构建后直出）
- `layout.tsx` 增加 OG meta：`og:title` = MAKEBOOK 造物簿，`og:description` = 说出你的最高愿付价，工厂按真实需求生产。，`og:image` = `/products/frame-01/og-share.png`；favicon 用代码画的 SVG 字母标（M，ink 色，不生成）
- 每张 `<img>` 配 manifest 里的 `alt`（中文，无障碍硬性要求）
- 图片加载失败兜底：对应区块退化为 surface 底色 + 精确 SVG 线稿，**禁止外链占位图**
