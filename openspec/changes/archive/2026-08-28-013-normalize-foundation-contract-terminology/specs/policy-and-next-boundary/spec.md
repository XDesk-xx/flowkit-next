## MODIFIED Requirements

### Requirement: Owner correction is bounded, explicit and revise-only
Policy MAY 在 active terminal Action 已产生有效 normal boundary且 reported-boundary consistency PASS 后应用一个 explicit Owner correction request。Correction request SHALL 只包含 requested revise-family Standard Action 与 structural-valid OwnerAuthorityFact。Policy SHALL 仅识别 `decision == "revise-action"`，且 authority 的 `deliveryId` / `changeId` SHALL 精确匹配当前 Delivery/Change，`scope` SHALL 精确为仅包含 requested revise Action 的单元素 array。缺失 authority SHALL 返回 `BLOCKED(owner-authority-required)`；structural-invalid 或 decision/identity/scope 不匹配 SHALL 返回 `BLOCKED(owner-authority-rejected)`。

允许的 correction SHALL 仅按 current terminal Action 所属 reached stage 向当前或更早阶段回退：explore stage (`explore|revise-explore|review-explore`) 只允许 `revise-explore`；propose stage (`propose|revise-propose|review-propose`) 允许 `revise-propose|revise-explore`；apply stage (`apply|revise-apply|review-apply`) 允许 `revise-apply|revise-propose|revise-explore`。其他 target、prepared CurrentAction 上的切换、archive/completed reopening 或任何 forward skip SHALL 返回 `BLOCKED(unsupported-owner-correction)`。Owner correction SHALL NOT 作为 normal apply/archive invocation authority，也 SHALL NOT 自动执行 requested Action。

#### Scenario: Allow proactive Explore revision with matching Owner authority
- **WHEN** terminal `explore` 的 normal/reported boundary 均为 `review-explore`，Owner correction 请求 `revise-explore`，且 authority 为 matching `decision=revise-action`、current Delivery/Change、`scope=["revise-explore"]`
- **THEN** correction candidate SHALL 为 `revise-explore`，随后进入统一 structural-enterability check

#### Scenario: Allow an Apply-stage correction to an earlier Proposal revision
- **WHEN** current terminal Action 属于 apply stage、normal/reported consistency PASS，Owner correction 请求 `revise-propose` 且 matching authority 有效
- **THEN** correction candidate SHALL 为 `revise-propose`，随后进入统一 structural-enterability check

#### Scenario: Reject a forward Owner skip
- **WHEN** current terminal Action 仍属于 explore stage，而 Owner correction 请求 `revise-propose`、`apply` 或其他非允许 revise target
- **THEN** Policy SHALL 返回 `BLOCKED(unsupported-owner-correction)`

#### Scenario: Require explicit matching correction authority
- **WHEN** Owner correction request 存在但缺失 authority，或 authority 的 decision/current identity/scope 与 requested revise Action 不匹配
- **THEN** Policy SHALL 分别返回 `BLOCKED(owner-authority-required)` 或 `BLOCKED(owner-authority-rejected)`
