## ADDED Requirements

### Requirement: Fixed finish enforces complete proof declarations for its own new Run

对本次固定 `action start` 建立的新 Run，`action finish` SHALL 在首次写入 `context.json` 或 `result.json` 前，将该 Run 的正式 proof 目录实际文件集合与本次 Result 的显式 `proofRefs` 做 exact 闭合集核对。每个实际文件 SHALL 恰有一个同 Delivery/Change/Run 归属的引用，路径、regular-file/no-link、可读性、bytes、SHA-256、用途与目标 Git 原始字节规则 SHALL 有效；多余、遗漏、重复、不安全或不可解释条目 SHALL 拒绝本次 finish，并保留已存在的开始记录与材料。无新材料时，正式 proof 目录 SHALL 不存在且 `proofRefs` SHALL 为显式空数组。该核对只读取本 Run 目录；历史 Run 不追溯迁移，后继 Action 可按当前判断只引用此前已声明材料的相关子集。它不判断 Author/Reviewer 实质结论，也不改变 F 的 prepared proof checkpoint 准入规则。

#### Scenario: Three files but one declared
- **WHEN** 本 Run proof 目录有三个真实文件，而 finish Result 仅声明其中一个或提交空数组
- **THEN** finish SHALL 在 terminal machine 文件创建前拒绝，指出不完整声明并保留该 Run 的已有 bytes

#### Scenario: Complete current Run proof set
- **WHEN** 本 Run proof 目录全部实际文件均被唯一、完整且字节匹配地声明
- **THEN** finish SHALL 继续既有 package、Policy 和 Result admission 流程；proof 闭合集本身 SHALL NOT 产生业务 PASS

#### Scenario: No new material
- **WHEN** 本 Run 未生成必要 proof 且正式 proof 目录不存在，Result 明确提供 `proofRefs: []`
- **THEN** 该证据检查 SHALL 通过且 SHALL NOT 创建空目录或制造文件

#### Scenario: Invalid own-Run entry or stale reference
- **WHEN** 本 Run 目录或引用包含链接、非普通文件、路径逃逸、失效摘要、缺失文件、重复引用或不可读取条目
- **THEN** finish SHALL 拒绝且不覆盖任何现有 Run/Proof；不得靠只校验已提交引用的子集来报告完成

#### Scenario: Later action needs one prior proof
- **WHEN** 后继 Review 只需读取此前 Run 已完整声明材料的一项
- **THEN** 它 MAY 按需核对并引用该项，且此前 Run 的原始 `proofRefs` SHALL 保持不变；finish SHALL NOT 扫描该历史目录作本次闭合集
