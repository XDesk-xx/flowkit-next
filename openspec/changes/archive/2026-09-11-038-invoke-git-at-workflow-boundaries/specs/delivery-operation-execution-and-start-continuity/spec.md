## MODIFIED Requirements

### Requirement: Repository Integration package binds exact finalized continuity Git prestate and exact Git authority

Integration SHALL 从本项目 completed manifest 实读已确认的最小 Final record，绑定 deliveryFinalizationRef、preIntegrationHead、Delivery branch、targetMainRef、targetMainPreIntegrationCommit、现有 Git accepted-base provenance 与 checkpointOperation。SHALL NOT 要求 Final 全 package、finalizedCandidateRef、requiredEvidence、替代整仓摘要或历史证据遍历。

checkpointOperation SHALL 为 closed union：create-new 包含且仅包含 kind、paths、commitMessage、commitShape；reuse-existing 包含且仅包含 kind、checkpointCommit。paths SHALL 是非空唯一排序的 target-relative exact 文件路径集合；commitMessage SHALL 是非空单行文本；commitShape SHALL 是 explicit null 或仅含 parents/count 的 exact 形状，parents 为有序唯一 SHA-1 数组、count 为正整数。reuse-existing checkpointCommit SHALL 为 exact SHA-1。该操作 SHALL 与可信 Owner 来源一致绑定，不从 HEAD/全仓 clean 自动生成形状，不用缺字段兼容旧输入。

singleton authorize-repository-integration authority、manager Guidance、Git 对象/来源/本次 prestate 核验保持；create-new 的 scope 需在实际写入前对照 index。acceptedMainCommit SHALL 仅在真实接受后读取，不能预声明；此处 Git base 不回流为 Start 或下一 Delivery SHA 准入。普通授权 Git 节点不是该 package 的 variant，不因调用 commit/push 就需要 Final。

#### Scenario: Form a valid Repository Integration package
- **WHEN** 实读 Final 已确认，Owner 指定的完整操作、路径/形状或复用对象与 Git 来源/目标/prestate 有效
- **THEN** host SHALL 冻结该 closed operation，不读取旧 Final evidence snapshot 或默认注入 parent/count

#### Scenario: Reject stale or caller-substituted Git facts
- **WHEN** HEAD/target/operation/授权路径或复用对象漂移，输入缺必需字段，或 caller 预声明 accepted main
- **THEN** 系统 SHALL 拒绝，不静默重绑定、补默认值或自动重整历史

#### Scenario: Existing Delivery operation boundaries remain unchanged
- **WHEN** Integration 形成或完成，或普通 Git 节点被单独授权
- **THEN** 各 operation 的 authority/STOP SHALL 保持，普通节点不套用 Final package；CLI/Policy 不取得 Git 写权限
