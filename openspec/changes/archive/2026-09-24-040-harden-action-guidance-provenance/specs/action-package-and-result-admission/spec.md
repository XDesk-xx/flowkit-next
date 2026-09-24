## ADDED Requirements

### Requirement: Structural package validation does not grant new-Run start authority

`GuidanceRef` 与 `ActionPackage` 的纯结构校验 SHALL 仅证明字段、Action path、Role、Run context 与状态的结构关系；SHA 格式正确 SHALL NOT 被解释为当前 manager 安装的文件内容证明。新 Run 的持久开始 SHALL 仅消费由可信 manager start 操作绑定当前安装真实 Guidance 后形成的 exact package。既有 Result admission SHALL 保持对 exact current Action 与 occurrence 的校验职责，不借此新增历史 Run 的当前安装 rehash 或另一个 Owner/Reviewer/Verification authority。

#### Scenario: Shape-valid forged package cannot start a new Run
- **WHEN** `ActionPackage` 的结构校验通过，但其中的 Guidance SHA 与当前 manager canonical Skill bytes 不同
- **THEN** 该结构结果 SHALL 不许可创建新 Run；可信 start SHALL 在目标 Run 目录或 `action.md` 创建前拒绝该身份

#### Scenario: Result admission retains its existing boundary
- **WHEN** 可信 start 形成了与当前 prepared Action、Role、occurrence 一致的 package，随后提交属于该 exact package 的真实 Result
- **THEN** 既有 admission SHALL 只验证并接纳该 Result，不自动 terminalize、选择下一 Action 或创造 Reviewer/Verification outcome

#### Scenario: Historical package shape remains readable
- **WHEN** 历史 Run 的 package 记录了当时的 canonical path 和 SHA，而当前 manager Skill bytes 已变
- **THEN** 历史记录的结构与完整性读取 SHALL 不因此要求按当前安装重新形成 package 或修改原始 bytes
