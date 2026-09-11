## MODIFIED Requirements

### Requirement: Delivery operation identity is closed and maps deterministically to canonical Guidance

系统 SHALL 只接受四个 canonical `DeliveryOperationId`：`delivery-start`、`delivery-full-test`、`delivery-final`、`delivery-repository-integration`。每个 exact operation SHALL 通过固定 1:1 映射唯一对应 canonical repository-relative Delivery Guidance path；未知 literal、已退役的 `delivery-architecture-finalization`、alias、模糊匹配、动态 registration/ranking SHALL fail closed。identity SHALL 只表达 already-decided execution，不决定下一 operation、Change activation、Reviewer/Verification truth 或 Git authority。

#### Scenario: Resolve the canonical Guidance path for Delivery Start
- **WHEN** already-decided operation 为 `delivery-start`
- **THEN** 系统 SHALL 唯一解析 `skills/delivery/start/SKILL.md`

#### Scenario: Reject unknown Delivery operation
- **WHEN** operation 不在四值集合中，包括 `delivery-architecture-finalization`
- **THEN** 系统 SHALL 拒绝，不通过 alias/discovery 转换，不返回 optional、skip 或空成功结果

#### Scenario: Operation identity cannot advance the Delivery lifecycle
- **WHEN** valid operation 已识别
- **THEN** 该 identity SHALL NOT 推导 next operation、Owner authority、Change state 或 mutation permission

### Requirement: Delivery Start package facts are minimal and anchored to exact accepted repository truth

`delivery-start` SHALL 保持 closed facts，绑定 exact `acceptedBaseCommit` 与 Owner-approved planning reference identity/content SHA-256。可信 host SHALL 从 Git/OpenSpec/Memo 各 owner 读取实时输入，验证 canonical repository 位于 exact accepted base 且满足 clean-start，不以 caller 声明代替事实；SHALL NOT 要求 Previous-Actual 或任何架构输入。Start SHALL 要求精确匹配 Delivery 且包含 `delivery-start` scope 的 Owner authority；仅明确要求专属 checkpoint 时另需 `single-delivery-start-fixed-point-commit`，内容完成不要求此权限。

#### Scenario: Accept exact Delivery Start facts and authority
- **WHEN** accepted base、planning reference/hash、Delivery 与 create-delivery authority 匹配且包含 delivery-start，无 Previous-Actual
- **THEN** host SHALL 允许形成 Start package，不要求 commit scope 或图表历史

#### Scenario: Reject stale base or wrong planning reference
- **WHEN** preparation 或 mutation 前 HEAD、规划或本 operation 的 canonical 输入不匹配
- **THEN** Start SHALL 拒绝，不以另一 SHA 内容等价静默重绑定

#### Scenario: Reject missing bounded Start authority
- **WHEN** authority 缺失、Delivery 不符或没有 delivery-start scope
- **THEN** 系统 SHALL 不形成 executable Start package

### Requirement: Delivery Final package binds exact accepted closure facts and exact Final authority

`delivery-final` SHALL 保持既有 package envelope，绑定 verified candidate、Full Test execution、coordination prestate、manifest-order completed required Change IDs 和 `requiredEvidence`。可信 host SHALL 从各 durable owner 与完整 prerequisite outcomes 派生证据，覆盖每个 required Change 的 accepted archive/review 及必要完整性链接和 Full Test 来源，不允许 caller 缩小集合。Package SHALL 不包含 Architecture closure、post-Architecture candidate 或架构证据字段。

Final SHALL 保持 exact `finalize-delivery` singleton authority 与 matching canonical Guidance；extra/malformed/stale/mismatched facts、来源不明、coverage 不全或 Guidance/authority 不符 SHALL 拒绝。Package SHALL 不决定 next operation 或产生 Git 权限。

#### Scenario: Form a valid Delivery Final package
- **WHEN** 无架构字段的 complete prerequisites、必要证据、Guidance 与 singleton Final authority 全部匹配
- **THEN** host SHALL 形成 content-bound package，直接保留 Full Test → Final 因果链接

#### Scenario: Reject caller-substituted or stale Final facts
- **WHEN** caller 提供 boolean completion、任意 path/digest、遗漏 Change 的证据、伪造来源、stale candidate 或旧架构字段
- **THEN** host SHALL 拒绝，不用自洽 hash 代替可信事实，不静默转换旧 package

#### Scenario: Final package cannot select repository integration
- **WHEN** Final package 形成或执行完毕
- **THEN** 系统 SHALL 不选择 Integration、不取得 Git authority

### Requirement: Delivery Start 在内容完成边界返回可核验记录

Start SHALL 保持 state-first：exact repository/history/environment 已有则 verify/reuse，缺失则只恢复必要状态并重验同一 preparation；不引入 local/detached/ZIP/bundle lifecycle mode。Start SHALL 仅以 canonical Delivery manifest 为固定输出，不要求或生成 Current、Planned、compare 或 system views。可信 host SHALL 对实际 manifest 与保留的 Git/OpenSpec/receipt validation 取得完整证明，不执行 Archify check。

成功 terminal SHALL 返回 `contentCompletion`，绑定 project/Delivery、exact accepted base、planning reference、唯一固定 manifest 输出的 artifact/hash/bytes、输出后 v2 candidate 与真实 validation 来源；Agent 的 validated 标记、伪造 hash 或缺实际输出不足以成功。后续 Change SHALL 使用被核验的内容事实，不要求虚构 Start SHA。

无 checkpoint 请求/权限时，内容完成 SHALL 可成功且 `fixedPointCommit=null`，不得调用 Git mutation。明确要求 checkpoint 时 SHALL 验证权限及实际 Git 结果；失败不得谎报 Git 完成或自动重试。一次 invocation SHALL 在明确边界 STOP，不创建第二 Start lifecycle。

#### Scenario: 无 Git 权限也可完成内容
- **WHEN** Start authority 有效，manifest 与验证来源完整，无图且无 checkpoint 请求/权限
- **THEN** terminal SHALL 返回完整 contentCompletion 与 null fixedPointCommit，不执行 Git callback 或 Archify

#### Scenario: validated 标记不能充当证明
- **WHEN** 只有 validated，或 manifest 缺失/漂移、验证输入不符或来源不明
- **THEN** host SHALL 拒绝内容完成，不用空 receipt 代替真实验证

#### Scenario: 显式 checkpoint 独立核验
- **WHEN** Owner 明确要求并授权至多一个普通 Start commit，内容完成已验证
- **THEN** host SHALL 从 Git 核验实际 commit、parent/数量、clean poststate 与内容连续性，记录真实 SHA 并 STOP

#### Scenario: 已有 exact 状态无需强制 transport
- **WHEN** 所需 accepted repository/history/OpenSpec runtime 已可取得
- **THEN** Start SHALL 直接验证复用；缺失则停止到外部恢复，不强制 ZIP/bundle 或 Archify runtime

## REMOVED Requirements

### Requirement: Delivery Architecture Finalization package binds exact passed verification and derived-input prestate without Owner mutation authority

**Reason**: Owner 取消活动架构 operation，不能保留其 package、null-authority 执行分支或兼容成功步骤。
**Migration**: 活动调用直接按已有权限使用 Full Test 与 Final；旧 package 仅作为历史原始材料保留，不转换或重新执行。
