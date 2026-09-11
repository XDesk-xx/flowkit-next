# 独立图集检查记录

日期：2026-09-11。对象仅为本目录五份 `flowkit.*.json` 及其生成 HTML，不是 Flowkit Action Run、独立 Reviewer verdict 或新的 Full Test 结果。

## 自动校验与交付

五图均执行 Archify `validate`，冻结 JSON 后通过 `deliver` 原子生成 HTML。每图均为 **9/9 showcase，0 errors，0 warnings**；最终 JSON 和 HTML 的 bytes/SHA-256 均已重新读回匹配。

| diagram_type | output（相对本目录） | specification_sha256 | artifact_sha256 | 回执 |
| --- | --- | --- | --- | --- |
| architecture | `html/flowkit.architecture.html` | `a84320acec317ea4594b1447fbd9cefdd5655ba17669d35a5077c50926e83c56` | `f5ab6310a53c2b8def964bbe5a92510c6352172cb50096fde37e25e6af4f3c39` | [JSON](receipts/flowkit.architecture.delivery.json) |
| workflow | `html/flowkit.workflow.html` | `99042d1e47de1f9cc8a555adc1baa2019138010781a933fa37c58bf5ab9a52c8` | `4eba0ef6c8dbe52ff6613987184f236f1e5e8b5105a3d237d45ffef7c1cd02f8` | [JSON](receipts/flowkit.workflow.delivery.json) |
| sequence | `html/flowkit.sequence.html` | `aaca19183cc13246d215885010e8013155aaa0f80ea77748339a07ddc19cd090` | `04f95f040fefd98b9055574dda29763d4b6a6bf0cf1d3423bd64ff22139f405c` | [JSON](receipts/flowkit.sequence.delivery.json) |
| dataflow | `html/flowkit.dataflow.html` | `0d26f3da66e5d1bf008fb07142821cb3a18388f9986412e11ac50c4a9f32678e` | `f6aada8b659b9c2d894d862cf1716097a6ac02b1728fb2f94ad6bd1cae38fb41` | [JSON](receipts/flowkit.dataflow.delivery.json) |
| lifecycle | `html/flowkit.lifecycle.html` | `dbbd126fb3ca0bbab26ead27d69d0f6b1cba2c35de54564969102ceefd978c2f` | `21f1598d196c287ee66f9a68ffb2c688fbdae5e539802dfe1ad6b04126fe3672` | [JSON](receipts/flowkit.lifecycle.delivery.json) |

架构图的 21 个源码引用由 `--repo-root` 对当前仓库核对通过。其他类型不支持同样的 repository 字段，来源由 [分析 README](README.md) 明确列出，没有伪造源码校验回执。

## 实际视觉与交互

使用本机 Edge headless，视口 1560 × 1080，由 Playwright CLI 读取实际生成 HTML；逐图保存并查看 Light/Dark 全页截图。检查默认 READ 视图、节点文字、连线、说明卡、图例和留白。没有使用示例图或 JSON 结构检查冒充视觉观察。

| diagram_type | visual_review | correction_rounds | 修正范围 |
| --- | --- | --- | --- |
| architecture | passed | 2 | 首轮去掉拥挤的冗余边标签；视觉轮扩大节点并压缩画布留白 |
| workflow | passed | 1 | 按固定列宽聚合三个 Author/Review 阶段，完整顺序留在说明卡 |
| sequence | passed | 0 | 初版通过，保留真实只读调用与返回顺序 |
| dataflow | passed | 0 | 初版通过，三条材料链保持独立 |
| lifecycle | passed | 2 | 首轮调整标签；视觉轮明确状态/执行分区及主转换可探索关系 |

`correction_rounds` 统计本轮 JSON 修正批次；其中 architecture、lifecycle 各包含一次视觉修正，修正后均重新 validate/deliver，并检查新输出。

五份实际页面还分别验证了：

- 默认 `READ 100%`，节点可聚焦，Semantic passport 可打开和关闭，关闭后移除 focus hash。
- 搜索过滤能返回相应节点：Git 与远端、Archive、Policy、Archify、terminal。
- 每图实际下载 PNG 与 SVG。已查看五份 PNG，导出仅含图，没有工具栏、搜索框、passport 或本地检查服务信息；五份 SVG 均为有效 SVG 根，`script = 0`、`foreignObject = 0`。
- 批量检查期间无 pageerror。最初载入的单条控制台错误是临时检查服务未提供 `favicon.ico` 的 404，不是 HTML 脚本异常；未为此改动产品或图形。

截图、导出探针与浏览器临时记录仅在仓库 `.tmp`。本记录概括已发生的观察，不要求这些临时材料成为永久前置。没有验证所有浏览器/设备，也不声称执行了 JPEG/WebP/剪贴板/WebM 的全量兼容测试。

## Full Test 与修改范围读回

[只读核对结果](receipts/readback.json)显示：

- 原 Full Test attempt：`a8c1d48a-fb77-4f1d-b535-e828ca86c3f3`。
- 原执行记录的 185 个输入文件逐一 hash 相同；当前配置选中的 183 个文件没有额外新增项。两文件差额为该 bootstrap 验证额外绑定的 `README.md` 与 `docs/onboarding.md`。
- `architecture` 仍在 Full Test 的显式 exclude 中；本轮没有重跑 Full Test、修改其配置、结果或 manifest。
- 已有历史 architecture 文件没有改动，index 没有新增暂存；开始时已存在的 manifest / Full Test 材料变更原样保留。

本次新增的持久内容只在 `architecture/system`；HTML 遵循既有 ignore 规则留在本机。未执行 Apply、Delivery Final、commit、push 或 merge。
