# Review Apply 083 — 082 修订独立复审

Owner 请求：`根据最新run，review-apply`。精确输入 `20260907-082-revise-apply`，对照 `081-review-apply` 和 `074-review-propose` 批准合同；保留 `080` 历史结论。Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：`changes-requested`。原 `001–009` 均闭合/保持闭合；新增一项本轮实现回归 `D04-RA007-010 / P2`。不重开已修正问题，不改写任何历史 Run。

## 已闭合

- `008`：独立旧反例中，exact base/source 有效且内容相同的非祖先 HEAD/target，fresh Integration preparation 均成功，来源被实际读取。missing base/mismatched source 仍拒绝；具体操作 parent、prestate drift、内容与必要证据约束保持。
- `009`：Start 两处 artifact ref 字段重排均 terminal；Integration input/source、ref、record、acceptance 对同值重排全部保持，ref 相同。原 `001–007` 诊断及相关回归继续通过。

## 新增阻断：010 — Start 数组形状/槽位校验回归

落点：`src/internal/delivery-start-content.ts:148–175`；公开调用 `src/domain/delivery-start-execution.ts:269–277`。

新 `sameArtifactRefs` 直接调用 `length/every`，而 source 入口仅验证 plain record。只改变合法来源的 `outputs`：

- 缺失、null、`{length:4}`：公开 Start invocation 抛出 TypeError，没有返回规范 failed outcome。
- `new Array(4)` 或仅缺一个索引的四槽数组：因 `every` 跳过空洞，错误地返回 terminal。
- dense null-elements 控制组仍正常拒绝。
- 同一比较器另一侧的稀疏 `surface.validation.artifacts` 也通过前置 validator，随后抛出读取 artifact 的 TypeError；旧模块正常拒绝。两侧纳入同一个 010。

同一 fixture 下，hash 精确匹配 079/081 的修订前 Start 模块对上述六项全部返回 null。旧模块仅在 .tmp 隔离重建并重定位 imports，复原 imports 后 SHA-256 与已审记录相同；没有回滚项目。仓库输出、候选及其他 source bytes 均未变。这证明是 082 比较器修改引入的回归，而不是材料迁移问题。

最小修正：在现有窄接缝验证真实数组及每个必需位置的完整 closed artifact ref，再做字段相等判断；缺项/空洞/非数组必须返回 null/规范 failed，不抛错、不误接受。仅加 Array.isArray 或外包 catch 不足以处理空洞。增加公开 invocation 负例及 checkpoint callback 零调用断言，同时保留字段重排成功、值/未知字段/数组顺序变化拒绝。对应 design D3、tasks 3.1/7.1，无需修改 Proposal 或另建 Change。

## 验证、范围与 STOP

独立执行七文件 42/42 回归、080 原脚本 15/15 诊断、typecheck、OpenSpec 1.10.0 当前 Change strict、git diff check，均通过。新的隔离诊断同时证明 008/009 收敛及 010 回归；不能用已有测试通过抵销该反例。

4/4 revision hashes 与上游 Run/批准计划匹配，无未申报差异；1487 个受保护文件检查前后快照相同。最大受影响文件 643 行。未独立重跑完整 domain/acceptance/build/gates/Linux，082 相应结果保留为 Author 报告；fixture 不冒充真实 D04 Formal Full Test。

复杂度：3 个既有实现文件和 1 个定向测试，无新依赖/层/平台；范围漂移 `NONE`。按独立 review-apply Skill 审查，并用调试 Skill 做最小复现与旧代码对照；只修改 Reviewer .tmp 诊断及 083 三文件。Owner 已授权原始 Explore proof 的临时存放/非永久保留边界不变。

`archiveAllowed=false`，正常交接事实为 `revise-apply`。不自动修订、archive、Formal Full Test、Git 操作或下一 Action。STOP。
