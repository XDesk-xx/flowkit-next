## ADDED Requirements

### Requirement: Create-new checkpoint preserves new managed evidence bytes

在已有 Owner 授权、scope 与完整 index 检查成立后，create-new checkpoint 宿主 SHALL 在提交前对本次新增的 managed Run/proof exact 路径核对 index blob 与当前原始文件 bytes 一致。对已有 terminal Result proofRef 声明的本次 proof，SHALL 进一步核对 index 与当前文件均匹配已记录 SHA/bytes；缺失、无法对应或不一致时 SHALL 停止提交，报告 exact 路径和实际已发生的暂存效果，不自动清空或改写 index。新增的 Run 三文件 SHALL 以本次真实 create-once 文件为原始来源核对 index；新增 managed proof 若不能对应本次已接纳 Result 的 proofRef，SHALL 拒绝作为已接纳 proof 提交。不得以当前文件与 index 一致替代已声明 proof 的记录身份。此检查 SHALL 不重扫历史证据，不给 push、复用或其他 Git 节点增加 index 写入，也不创建新的 Git authority。

#### Scenario: New evidence is staged without transformation

- **WHEN** Owner 已授权 create-new checkpoint，且本次新增 Run 的 index blob 与 create-once 文件一致、本次声明 proof 的 index/当前文件与 Result 记录一致
- **THEN** 宿主 SHALL 可继续既有 scope、空白诊断与 commit 核验流程

#### Scenario: Attributes drift before commit

- **WHEN** 本次新 Run/proof 的 index blob 因 Git clean 转换或属性漂移而不同于原始字节
- **THEN** 宿主 SHALL 在 commit 前停止并报告差异及已发生的 stage，保留 index 而不自行修复或继续 push

#### Scenario: Proof changes after Result admission

- **WHEN** 已声明 proof 在 Result 接纳后被改动且暂存，index blob 与当前文件一致但与 proofRef SHA/bytes 不一致
- **THEN** 宿主 SHALL 在 commit 前停止，报告 exact proof 路径与记录身份不匹配，保留 index

#### Scenario: Existing history is outside the forward-only check

- **WHEN** 本次 checkpoint 不含新产生的 managed Run/proof，或仅执行复用/push
- **THEN** SHALL 不遍历旧 Run/proof 作追溯迁移或无关 index 检查
