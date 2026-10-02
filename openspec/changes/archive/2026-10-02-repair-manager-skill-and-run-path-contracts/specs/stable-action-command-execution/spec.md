## MODIFIED Requirements

### Requirement: Fixed finish enforces complete proof declarations for its own new Run

对本次固定 `action start` 建立的新 Run，`action finish` SHALL 在首次写入 `context.json` 或 `result.json` 前，从唯一 canonical Run 分组确定本 Run 的编号 Proof 目录，同时检查对应语义目录是否存在。仅有一个目录时，SHALL 将该目录实际文件集合与本次 Result 的显式 `proofRefs` 做 exact 闭合集核对；两者并存 SHALL 拒绝，不能只扫描其中一个。每个实际文件 SHALL 恰有一个同 Delivery/语义 Change/Run 归属的引用，路径、regular-file/no-link、可读性、bytes、SHA-256、用途与目标 Git 原始字节规则 SHALL 有效；多余、遗漏、重复、不安全或不可解释条目 SHALL 拒绝本次 finish，并保留已存在的开始记录与材料。无新材料时，两种正式 Proof 目录 SHALL 均不存在且 `proofRefs` SHALL 为显式空数组。该核对只读取本 Run 的两个精确候选目录；历史 Run 不追溯迁移，后继 Action 可按当前判断只引用此前已声明材料的相关子集。它不判断 Author/Reviewer 实质结论，也不改变 prepared proof checkpoint 准入规则。

#### Scenario: Three files but one declared

- **WHEN** 本 Run 的唯一正式 proof 目录有三个真实文件，而 finish Result 仅声明其中一个或提交空数组
- **THEN** finish SHALL 在 terminal machine 文件创建前拒绝，指出不完整声明并保留该 Run 的已有 bytes

#### Scenario: Complete current Run proof set

- **WHEN** 本 Run 唯一正式 proof 目录全部实际文件均被唯一、完整且字节匹配地声明
- **THEN** finish SHALL 继续既有 package、Policy 和 Result admission 流程；proof 闭合集本身 SHALL NOT 产生业务 PASS

#### Scenario: No new material

- **WHEN** 本 Run 未生成必要 proof、编号与语义正式 proof 目录均不存在，Result 明确提供 `proofRefs: []`
- **THEN** 该证据检查 SHALL 通过且 SHALL NOT 创建空目录或制造文件

#### Scenario: Invalid own-Run entry or stale reference

- **WHEN** 本 Run 目录或引用包含链接、非普通文件、路径逃逸、失效摘要、缺失文件、重复引用或不可读取条目
- **THEN** finish SHALL 拒绝且不覆盖任何现有 Run/Proof；不得靠只校验已提交引用的子集来报告完成

#### Scenario: Later action needs one prior proof

- **WHEN** 后继 Review 只需读取此前 Run 已完整声明材料的一项
- **THEN** 它 MAY 按需核对并引用该项，且此前 Run 的原始 `proofRefs` SHALL 保持不变；finish SHALL NOT 扫描该历史目录作本次闭合集

#### Scenario: Numbered proof exists but no refs are declared

- **WHEN** canonical Run 分组为 `001-<change-id>`，相同编号的 Proof 目录已有文件，而候选 Result 提交 `proofRefs: []`
- **THEN** finish SHALL 在写 machine 文件前拒绝，不因语义目录不存在而接受空集合

#### Scenario: Both proof layouts exist for one Run

- **WHEN** 同一 Delivery、语义 Change 和 Run 下编号与语义 Proof 目录均存在
- **THEN** finish SHALL 拒绝并报告两个目录，不能任意选择一个目录的声明

## ADDED Requirements

### Requirement: Proof inspection and later consumption resolve one exact Run owner

`proof inspect` 与后续 `proofRefs` 消费 SHALL 由真实唯一 Run 分组、语义 `changeId` 和 exact `runId` 共同确定所属 Run；SHALL 接受该 Run 的编号 Proof 路径，且对已保存的语义 Proof 路径保持兼容。若两种目录并存、Run 分组不唯一、引用路径不属于两种精确布局或引用中的语义 `changeId` 与 Run 身份不符，SHALL fail closed。后续消费 SHALL 只检查当前判断需要的引用，不扫描无关历史 Proof。

#### Scenario: LearningPlatform numbered proof is inspected

- **WHEN** 唯一 Run 分组为 `001-role-workspace-and-shared-shell`，引用路径中的 Proof 分组也是 `001-role-workspace-and-shared-shell`，而 `proofRefs.changeId` 是语义 `role-workspace-and-shared-shell`
- **THEN** inspect SHALL 按真实文件检查 bytes、SHA、regular/no-link 与原始 Git bytes，不因编号目录段拒绝

#### Scenario: MenDi semantic proof remains consumable

- **WHEN** 已完成 Run 的引用使用语义 Proof 目录且同 Run 没有编号 Proof 目录
- **THEN** 后续 Action SHALL 按原有归属及完整性规则读取该引用，不要求重写 Result

### Requirement: Proposal artifact hashes use one repository-root-relative contract

成功的 `propose` 或 `revise-propose` Result 中用于交接的 `artifactHashes` SHALL 以 target 项目根为解析根，键 SHALL 精确指向当前语义 Change 的 OpenSpec 规划产物，文件 SHALL 为 target 内可读的真实普通文件且 SHA-256 匹配。fixed finish SHALL 在首次写入 machine 文件前拒绝无效、越界、错误根或不匹配的成功 Result；`review-propose` start SHALL 用同一根和规则复核已接受的前序 Result，不将项目根相对键再拼到 Change 目录下。真实 Author `FAIL` 的现有 Result 边界保持既有规则，不借此伪造成功规划产物。

#### Scenario: Valid Proposal is reviewed

- **WHEN** 前序成功 Propose Result 声明 `openspec/changes/<change-id>/proposal.md` 等规划产物，真实文件与 SHA 匹配
- **THEN** `review-propose` start SHALL 从 target 项目根解析并核对，允许独立 Reviewer 继续实质审查

#### Scenario: Wrong-root or escaped Proposal identity is rejected early

- **WHEN** 成功 Propose Result 的 key 是绝对路径、含路径逃逸、指向其他 Change，或其文件 bytes 与声明 SHA 不符
- **THEN** finish SHALL 在首次写入 machine 文件前拒绝该 Result；Review start 也 SHALL 拒绝漂移的已接受产物，不补造新 Hash
