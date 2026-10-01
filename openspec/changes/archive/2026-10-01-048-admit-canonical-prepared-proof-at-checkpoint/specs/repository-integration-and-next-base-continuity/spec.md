## MODIFIED Requirements

### Requirement: Create-new checkpoint preserves new managed evidence bytes

在已有 Owner 授权、scope 与完整 index 检查成立后，create-new checkpoint 宿主 SHALL 在提交前对本次新增的 managed Run/proof exact 路径核对 index blob 与当前原始文件 bytes 一致。新增 Run 三文件 SHALL 以本次真实 create-once 文件为原始来源核对 index。新增 managed proof SHALL 有所属 Run Result 中唯一且身份匹配的 `proofRef`，其 path、bytes、SHA-256 SHALL 与 index 和当前文件一致；缺失、重复、无法对应或不一致时 SHALL 停止提交，报告 exact 路径和实际已发生的暂存效果，不自动清空或改写 index。不得以当前文件与 index 一致替代已声明 proof 的记录身份。

对 `terminal` owner，宿主 SHALL 保留已有准入和原始字节行为。对 `prepared` owner，只有所属 Run 的三文件完整、context/result 身份一致、author/reviewer/verification/next 四个结果槽均为 null，并且该 owner 在本次 checkpoint 候选 Git 树的完整 canonical Run 链中有唯一合法直接后继且不是 tip，宿主才 SHALL 接纳其新增 proof。该链 SHALL 按既有 Run 链和 Policy 规则验证唯一根、同目标、唯一 identity/sequence、完整记录、无 fork/断链及合法 successor edge；Owner correction SHALL 有匹配的已保存 authority，同 Action continuation SHALL 满足既有 Policy。证明此链所需的 Run 文件与 proof owner Result SHALL 来自提交前 HEAD 加待提交 index 构成的候选树；只存在于未提交工作区的后继或与候选树冲突的文件 SHALL NOT 提供准入。partial Run、当前 prepared tip、伪 verdict、非法 edge 或不可验证链 SHALL 拒绝。

此检查 SHALL 只消费本次新增 proof 明确需要的所属 Change Run 链，不追溯扫描无关历史证据；不得给 push、复用或其他 Git 节点增加 index 写入，不创建 Git、Owner 或 Reviewer authority，也不补写或改写历史 Run/Proof。

#### Scenario: New evidence is staged without transformation
- **WHEN** Owner 已授权 create-new checkpoint，新增 terminal Run 的 index blob 与 create-once 文件一致，新增 proof 的 index/当前文件与 Result 中唯一 `proofRef` 的身份、path、bytes、SHA-256 一致
- **THEN** 宿主 SHALL 可继续既有 scope、空白诊断与 commit 核验流程

#### Scenario: Prepared proof with Owner correction is in a closed candidate chain
- **WHEN** 完整 prepared Author Run 的新增 proof 满足唯一声明及原始字节检查，且候选树中的完整 canonical 链以合法 Owner-linked revise Run 为其唯一直接后继
- **THEN** 宿主 SHALL 允许该 proof 继续既有 checkpoint 流程，不修改 prepared Run 的原始状态或证据

#### Scenario: Prepared proof with same-Action continuation is in a closed candidate chain
- **WHEN** 完整 prepared Author Run 的新增 proof 满足唯一声明及原始字节检查，且候选树中的完整 canonical 链以合法同 Action 新 occurrence 为其唯一直接后继
- **THEN** 宿主 SHALL 允许该 proof 继续既有 checkpoint 流程，不把前驱伪装成 terminal

#### Scenario: Prepared successor exists only in worktree
- **WHEN** proof owner 是 prepared，合法后继只在未提交工作区存在，而 HEAD 与待提交 index 组成的候选树中没有其完整 Run
- **THEN** 宿主 SHALL 在 commit 前拒绝该 proof，保留本次已发生的 stage 并报告原因

#### Scenario: Candidate chain is incomplete or invalid
- **WHEN** prepared owner 是当前 tip，或候选树包含 partial Run、缺文件、断链、fork、重复 identity/sequence、非法 successor edge、错误 Owner correction、伪 verdict 或互相冲突的 Run bytes
- **THEN** 宿主 SHALL 在 commit 前拒绝本次新增 prepared proof，不用工作区或未来可能的 continuation 补足链

#### Scenario: Attributes drift before commit
- **WHEN** 本次新 Run/proof 的 index blob 因 Git clean 转换或属性漂移而不同于原始字节
- **THEN** 宿主 SHALL 在 commit 前停止并报告差异及已发生的 stage，保留 index 而不自行修复或继续 push

#### Scenario: Proof changes after Result admission
- **WHEN** 已声明 proof 在 Result 接纳后被改动且暂存，index blob 与当前文件一致但与唯一 `proofRef` 的身份、SHA-256 或 bytes 不一致
- **THEN** 宿主 SHALL 在 commit 前停止，报告 exact proof 路径与记录身份不匹配，保留 index

#### Scenario: Missing or ambiguous declaration
- **WHEN** 新增 proof 在所属 Result 中缺少唯一匹配声明、存在重复声明或指向其他 Run/Change
- **THEN** 宿主 SHALL 在 commit 前拒绝，不能以路径存在或摘要碰巧相同替代所属 Result 的声明

#### Scenario: Existing history is outside the forward-only check
- **WHEN** 本次 checkpoint 不含新产生的 managed Run/proof，或仅执行复用/push
- **THEN** SHALL 不遍历旧 Run/proof 作追溯迁移或无关 index 检查
