# delivery-operation-execution-and-start-continuity Specification

## Purpose

为 Flowkit Delivery-level execution 建立 closed exact-operation、content-bound canonical Guidance 与 minimal execution package contract，并以 Delivery Start 首次证明 accepted-base continuity、显式 authority 与固定点提交边界。

## Requirements

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

### Requirement: Delivery Guidance identity is exact, content-bound, and product-canonical

系统 SHALL 只从 trusted manager 安装根与 exact `DeliveryOperationId` 解析 Delivery Guidance，绑定 exact canonical manager-relative path 与 exact file-content SHA-256。canonical entry SHALL 为 readable regular file；missing、unreadable、non-regular、symlink、wrong-operation mapping 或 content mismatch SHALL fail closed。caller / Agent SHALL NOT 任意指定 Guidance path/content identity，product execution SHALL NOT fallback 到 target 同名资产、`.agents/skills/**`、conversation memory、Run prose 或 repository-wide discovery。

四个既有 operation 的 package preparation 与 execution read SHALL 使用同一 manager 来源，保持既有 content mismatch 检查。项目输入、输出、Git/测试 cwd、coordination、Run 和必要 artifacts SHALL 仍指向 target；系统 SHALL NOT 用 manager 根替换项目事实根。其余 operation facts、权限和生命周期要求保持不变。

#### Scenario: Guidance byte drift changes exact identity
- **WHEN** canonical Delivery Guidance path 不变但 bytes 改变
- **THEN** 后续解析的 `contentSha256` SHALL 不同，旧内容绑定不因此获得新的有效性

#### Scenario: Wrong or redirected Guidance fails closed
- **WHEN** `delivery-start` 被绑定到其他 Guidance、`.agents/skills/**`、symlink 或 non-regular entry
- **THEN** 系统 SHALL 不形成 executable Delivery Guidance identity

#### Scenario: Missing product Guidance does not use bootstrap fallback
- **WHEN** manager 的 Start Guidance 缺失，但 target 同名文件或 bootstrap HOW 存在
- **THEN** preparation SHALL fail closed，不读取这些替代文件

#### Scenario: Split roots remain consistent through preparation and execution
- **WHEN** 任一既有 Delivery operation 在 manager 与 target 分离时完成 preparation 并读取冻结的 Guidance
- **THEN** 两次访问 SHALL 都使用 manager entry，项目事实及实际项目写入 SHALL 留在 target，同名 target 文件不接管 HOW

#### Scenario: Relocation does not redefine project facts
- **WHEN** 同 bytes 的 manager 安装移位后访问同一个 target
- **THEN** Guidance path/content identity SHALL 不变，系统 SHALL 不搬迁或清理 target 历史，也不以 manager 路径改变项目测试配置

### Requirement: DeliveryOperationPackage binds exact already-decided execution facts without owning lifecycle authority
系统 SHALL 从 exact Delivery identity、already-decided valid `DeliveryOperationId`、与该 operation 精确匹配的 `DeliveryGuidanceRef`、通过该 operation closed validator/resolver 得到的 exact `operationFacts`，以及该 boundary 所需的 structural-valid existing `OwnerAuthorityFact` 或 explicit `null` 形成 closed `DeliveryOperationPackage`。任一 wrong Delivery identity、wrong operation/Guidance mapping、malformed or mismatched operation facts、missing/mismatched required authority、unknown extra package field 或 stale exact-state fact SHALL fail closed。Package SHALL NOT 复制 Standard Action 的 `CurrentAction` prepared/terminal state、Action role、Action Run occurrence 或 Action Policy ownership，也 SHALL NOT 创建新的 candidate/state identity subsystem。

#### Scenario: Form a valid exact Delivery operation package
- **WHEN** exact Delivery identity、already-decided operation、matching exact Guidance、validated operation facts 与该 operation 所要求的 exact authority facts 全部一致
- **THEN** 系统 SHALL 形成一个只冻结这些 exact execution facts 的 `DeliveryOperationPackage`

#### Scenario: Reject wrong Guidance or wrong Delivery identity
- **WHEN** package formation 的 Guidance 不对应 exact operation，或 Delivery identity 与 validated operation facts / authority target 不一致
- **THEN** 系统 SHALL fail closed，且 SHALL NOT 形成 executable package

#### Scenario: Package cannot select another operation
- **WHEN** package 已针对 `delivery-start` 形成
- **THEN** package formation / execution SHALL NOT 将其改写为其他 Delivery operation、自动 activate Change 或决定 next boundary

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

### Requirement: Candidate Delivery execution remains independent from D04 bootstrap acceptance
D04 当前 Delivery 的 self-development SHALL 继续使用 repository-local `.agents/skills/**` bootstrap/fallback HOW；candidate `skills/delivery/**` 与 `DeliveryOperationPackage` SHALL NOT 作为证明同一 D04 candidate 正确性的 lifecycle/acceptance authority。该隔离 SHALL NOT 要求 Stable Core 完成后删除、同步或自动收敛 `.agents/skills/**`。

#### Scenario: D04 does not self-prove with candidate Delivery Start Guidance
- **WHEN** Change 1 实现 `skills/delivery/start/SKILL.md` 与 candidate Delivery package mechanism
- **THEN** 当前 D04 的 acceptance SHALL 仍由独立 bootstrap/Reviewer/Verification/Owner boundaries 证明，而不得把 candidate Start Guidance 当作其自身接受权威

### Requirement: Delivery Full Test package facts bind one exact candidate, one exact ordered check set, and exact Full Test authority
`delivery-full-test` SHALL 使用一个 closed operation-facts contract，绑定 trusted current repository `candidateRef` 与非空 exact ordered project-local Formal Full Test checks；每个 check SHALL 使用 existing applicable-check declaration semantics 并携带由其 exact material identity 派生的 `checkRef`。Package formation SHALL 保留声明顺序、拒绝 duplicate check id/ref、拒绝 declaration/checkRef mismatch，并 SHALL 要求 structural-valid `OwnerAuthorityFact` 精确满足 `decision=authorize-formal-full-test`、exact current Delivery、`changeId` absent 与 scope exactly `["delivery-full-test"]`。这些 facts/authority SHALL 只支持已决定的 `delivery-full-test` execution，不得决定 correction、Git、finalization 或 next-operation lifecycle。

#### Scenario: Form a valid Delivery Full Test package
- **WHEN** exact Delivery、`delivery-full-test` Guidance、trusted current candidate、non-empty ordered resolved checks 与 exact Full Test Owner authority 全部匹配
- **THEN** 系统 SHALL 形成 executable `DeliveryOperationPackage` 的 `delivery-full-test` concrete variant，同时保持原有 `delivery-start` package 行为不变

#### Scenario: Reject stale candidate, malformed checks, or wrong Full Test authority
- **WHEN** candidate 不是 trusted current candidate、ordered checks 存在 duplicate/mismatched declaration/checkRef，或 authority decision/Delivery/changeId/scope 不精确匹配
- **THEN** `delivery-full-test` package formation SHALL fail closed

#### Scenario: Full Test package cannot fabricate an Action execution envelope
- **WHEN** `delivery-full-test` 需要执行 project-local checks
- **THEN** 系统 SHALL 复用 existing check declaration/ref/process mechanics，但 SHALL NOT 构造假的 Standard Action / ActionPackage 作为 Delivery Full Test 的 execution authority

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
