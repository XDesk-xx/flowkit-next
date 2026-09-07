# Propose — correct-delivery-content-continuity

- Run：`20260907-070-propose`；Role：Author；输入：`20260907-069-review-explore`。
- Delivery：`20260902-04-delivery-continuity-stable-core-closure`；projectOrdinal：`32`；physical group：`007`。
- 本次请求：根据最新 runs 执行 propose，生成内容用中文。
- 输入 Reviewer verdict：`approved`，无阻断 finding，reported next boundary 为 `propose`；本次用户请求授权实际 Propose。
- HOW：独立 proposal-convergence / openspec-propose，加 planning-and-task-breakdown 的可验证任务拆分；未使用外部 manager 或 candidate lifecycle authority。

## 真实执行

1. 核对当前 Git、tool lock、最新 Run 069、approved Explore 及审查所绑定 hashes，确认已有 Change active、序号不变、Delivery active/pending/pending。
2. 使用 exact OpenSpec 1.10.0 status/instructions，依赖顺序读取并生成 proposal、七个 delta specs、design、tasks；没有重建已有 Change。
3. 内容收敛为共享 v2 材料、独立 Start 内容完成、Final 必要证据覆盖及 Integration 新建/复用具体操作；保留来源、Git prestate、lineage、非目标与 650 行 gate。
4. 首次 strict 校验指出既有 Scenario 标识不能重命名；恢复 exact 标识并保留中文正文、拆回独立场景后校验通过，未跳过或降低规则。
5. 当前 Change strict PASS；all strict 23/23 PASS；新产物文本/相对链接/checkbox、输入 hash 与 git diff --check 均通过。
6. 持久化本次三文件 Run，绑定 10 个计划文件 hashes、原审查输入和明确验证范围。32 项 tasks 全部未勾选。

## 收敛与 STOP

任务溯源见 tasks 第 8 节；字段/来源/失败顺序见 design D1–D7。
外部 Delivery 证据位置仍待未来真实 Full Test 前独立确定/验证，未伪造 PASS；当前读取接缝的产品验收已列为 Apply 任务。
本轮没有 production/test/当前 canonical spec/manifest/Memo/历史 Run 修改，没有 Apply、archive、Formal Full Test 或项目 Git mutation。
OpenSpec planningComplete 只说明计划产物完整，不能替代 Reviewer approval。

下一边界：`review-propose`。STOP。
