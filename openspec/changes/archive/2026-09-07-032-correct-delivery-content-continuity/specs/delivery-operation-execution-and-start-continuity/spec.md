## MODIFIED Requirements

### Requirement: Delivery Start package facts are minimal and anchored to exact accepted repository truth

`delivery-start` SHALL 保持 closed operation facts，绑定 exact `acceptedBaseCommit` 与 Owner-approved planning reference identity/content SHA-256。可信 host SHALL 从 Git/OpenSpec/Memo/Previous-Actual 各 owner 读取实时输入，验证 canonical repository 当前处于 exact accepted base 且满足 clean-start，不能把 caller 声明当成这些事实。Start SHALL 要求精确匹配 Delivery 且包含 `delivery-start` scope 的 Owner authority；只有明确要求执行专属 checkpoint 时才 SHALL 另外要求 `single-delivery-start-fixed-point-commit` 权限，内容完成本身不要求该权限。

#### Scenario: Accept exact Delivery Start facts and authority

- **WHEN** accepted base、planning reference/hash、Delivery 与 create-delivery authority 匹配且包含 delivery-start
- **THEN** host SHALL 允许形成 Start package，不要求同时具有 commit scope

#### Scenario: Reject stale base or wrong planning reference

- **WHEN** preparation 或实际 mutation 前的 HEAD、规划或 canonical 输入不匹配
- **THEN** Start SHALL 拒绝，不以另一 SHA 内容等价为由静默重新绑定原 package

#### Scenario: Reject missing bounded Start authority

- **WHEN** authority 缺失、Delivery 不符或没有 delivery-start scope
- **THEN** 系统 SHALL 不形成 executable Start package

### Requirement: Delivery Final package binds exact accepted closure facts and exact Final authority

`delivery-final` SHALL 保持既有 package envelope，绑定 verified candidate、Full Test execution、Architecture closure、post-materialization candidate、coordination prestate、manifest-order completed required Change IDs，并增加 `requiredEvidence`。后者 SHALL 由可信 host 从各自 durable owner 与被绑定的完整 prerequisite outcomes 派生，覆盖每个 required Change 的 accepted archive/review 及其必要完整性链接、Full Test 与 Architecture 来源，不能由 caller 缩小列表。

Final SHALL 保持 exact `finalize-delivery` singleton authority 与 matching canonical Guidance；extra/malformed/stale/mismatched facts、来源不明、coverage 不完整或 Guidance/authority 不符 SHALL 拒绝。Package SHALL 不决定 next operation 或产生 Git 权限。

#### Scenario: Form a valid Delivery Final package

- **WHEN** complete prerequisites、必要证据覆盖/来源、canonical Guidance 与 singleton Final authority 全部匹配
- **THEN** host SHALL 形成 content-bound Final package，保留各 owner 的因果链接

#### Scenario: Reject caller-substituted or stale Final facts

- **WHEN** caller 提供 boolean completion、任意 path/digest、遗漏 Change 的证据集合、伪造来源或 stale candidate
- **THEN** host SHALL 拒绝，不用 package 自洽 hash 代替可信事实

#### Scenario: Final package cannot select repository integration

- **WHEN** Final package 形成或执行完毕
- **THEN** 系统 SHALL 不选择 repository integration、不取得 Git authority

### Requirement: Repository Integration package binds exact finalized continuity Git prestate and exact Git authority

`delivery-repository-integration` SHALL 绑定 trusted Final identity、`finalizedCandidateRef`、必要证据快照、`preIntegrationHead`、Delivery branch、`targetMainRef`、`targetMainPreIntegrationCommit`、exact accepted-base provenance 与 `checkpointOperation`。checkpointOperation SHALL 只能是 `{kind:"create-new"}` 或 `{kind:"reuse-existing", checkpointCommit:<exact SHA-1>}`，由可信 host 依据本次独立明确的 Owner Git 操作决定绑定；caller 不得利用相同 singleton authority 的外形切换操作。

Package SHALL 仍要求 exact `authorize-repository-integration` singleton authority 与 matching canonical Guidance。acceptedMainCommit SHALL 不预声明，只在 acceptance 后从 Git 读取；未知字段、旧 package、漂移 prestate、错误对象格式/来源/authority SHALL 拒绝。所需 acceptance 关系 SHALL 与 Owner 指定操作一致，不能只凭内容等价授予任意 Git 操作。

#### Scenario: Form a valid Repository Integration package

- **WHEN** Owner 指定的 checkpoint 操作、Final 来源、必要证据、Git prestate 与权限均已验证
- **THEN** host SHALL 冻结对应 variant，不猜测 create-new 或 reuse-existing

#### Scenario: Reject stale or caller-substituted Git facts

- **WHEN** preparation 后 HEAD/target/operation 或复用 checkpoint 改变，或 caller 预声明 accepted main
- **THEN** package SHALL 失效；系统 SHALL 不静默重绑定，也不自动提交/重整历史

#### Scenario: Existing Delivery operation boundaries remain unchanged

- **WHEN** Integration 形成或完成
- **THEN** 其他 Delivery operations 的各自 authority/STOP SHALL 保持，不转换为 Git/promotion lifecycle

## REMOVED Requirements

### Requirement: Delivery Start uses one state-first continuity path and closes at an exact fixed point

**Reason**: 专属新 commit 不应成为通用内容完成条件；原 surface validated 也不足以证明完成。
**Migration**: 使用“Delivery Start 在内容完成边界返回可核验记录”，Git checkpoint 独立授权；历史 Start commit/Run 不改写。

## ADDED Requirements

### Requirement: Delivery Start 在内容完成边界返回可核验记录

Start SHALL 保持 state-first：exact repository/history/environment 已有则 verify/reuse，缺失则只恢复必要状态并重新验证同一 preparation；不得引入 local/detached/ZIP/bundle lifecycle mode。Start SHALL materialize manifest、Current、Planned、Current→Planned compare，并由可信 host 对实际输出及要求的 OpenSpec/Archify/Git/receipt validation 取得完整证明。

成功 terminal SHALL 返回 `contentCompletion`，绑定 project/Delivery、exact accepted base、planning reference、四个固定输出的 artifact/hash/bytes、输出后 v2 candidate 与真实 validation 来源；仅 Agent 返回 validated、伪造 hash 或缺少实际输出 SHALL 不足以成功。后续 Change SHALL 使用这些被核验的内容事实，而非要求虚构的专属 Start SHA。

没有 checkpoint 请求/权限时，内容完成 SHALL 可成功且 `fixedPointCommit=null`、不得调用 Git mutation。明确要求 checkpoint 时 SHALL 验证该权限及实际 Git 结果；checkpoint 失败不得谎报 Git 完成，已形成内容事实不等于授权自动重试。一次 invocation SHALL 在该明确边界 STOP，不创建第二 Start lifecycle。

#### Scenario: 无 Git 权限也可完成内容

- **WHEN** Start authority 有效，四个输出及验证来源完整，无 checkpoint 请求/权限
- **THEN** terminal SHALL 返回完整 contentCompletion 与 null fixedPointCommit，Git callback SHALL 不执行

#### Scenario: validated 标记不能充当证明

- **WHEN** Agent 只返回 validated，或输出缺失/漂移、验证输入不匹配或来源不明
- **THEN** host SHALL 拒绝内容完成，不把 stopped-before-commit 简单更名为成功

#### Scenario: 显式 checkpoint 独立核验

- **WHEN** Owner 明确要求且授权至多一个普通 Start commit，内容完成已验证
- **THEN** host SHALL 从 Git 独立读取并核验实际 commit、parent/数量、clean poststate 与内容连续性；成功后记录真实 SHA 并 STOP

#### Scenario: 已有 exact 状态无需强制 transport

- **WHEN** 所需 accepted repository/history/runtime 已可取得
- **THEN** Start SHALL 直接验证复用；缺失时 SHALL 停止到外部恢复并重验，不强制额外 ZIP 或 bundle
