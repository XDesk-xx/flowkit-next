## ADDED Requirements

### Requirement: Checkpoint preserves raw candidate identity through index and Git blobs

create-new checkpoint SHALL 在既有Owner范围/index核对之外，对授权现存regular paths校验raw与Git-filtered身份一致。关联可信reviewed candidate时，SHALL 经exact Run/effective identity确定被审raw SHA-256。未归档候选及不受Archive影响的文件 SHALL 在原路径保持原hash；合法Archive转换 SHALL 仅按下述可信后态规则核对，不把所有原candidate paths永久固定在归档前位置。stage前 SHALL 以当前index和授权paths的拟写入/删除核对预期树，stage后 SHALL 核对实际index，commit后 SHALL 读回最终blob。已在HEAD/index且不在本次staging范围的必要路径 SHALL 只读核对，不扩大授权paths或夹带staged。deletion SHALL 按授权删除事实处理，不伪造artifact hash或自动豁免被审文件消失。filter异常/属性漂移/mismatch SHALL 在commit前阻断，不normalize或建立任意映射。普通无Review关联checkpoint不要求伪造Reviewer凭证；reuse-existing/push不触碰无关index或追溯改写旧历史。

归档后的转换依据 SHALL 为同Delivery/Change的exact Author→approved Review→已接纳terminal Archive及其绑定的完整可验证材料，并在候选Git树中核对原Run和材料的归属、bytes、SHA-256。只允许当前Change目录source前缀到真实ordinal archive前缀的替换、该Archive检查过的canonical spec收敛，以及仅当前Change state从active到completed的coordination更新。迁移文件集合、suffix与原raw hash SHALL 一致且旧路径已移除；spec/coordination SHALL 匹配被绑定的真实前后态和允许差异。其他candidate paths SHALL 仍匹配原身份。caller映射、自称completed、未terminal的Archive、仅worktree材料、错误Run/路径或额外漂移 SHALL 不提供豁免。系统 SHALL 不重写旧Author/Reviewer身份、不回填历史证据、不重新执行归档或创建generic迁移平台。

#### Scenario: Filter changes reviewed source bytes
- **WHEN** CRLF/filter/attributes令本次raw候选与Git候选blob不同
- **THEN** checkpoint SHALL 在commit前拒绝并指出路径，要求重新形成候选及适用独立review

#### Scenario: Reviewed file outside staging remains exact
- **WHEN** reviewed candidate某文件已在HEAD且不属于本次授权paths
- **THEN** checkpoint SHALL 只读验证HEAD+index中的该文件，不staging它；bytes漂移仍阻断受管理candidate准入

#### Scenario: Reviewed planning files survive a legitimate archive move
- **WHEN** 已审proposal/design/tasks/delta文件随同一已接纳Archive移到exact ordinal目录，candidate tree中的原路径已删除、迁移文件集合和内容hash一致，spec/coordination与可信归档后态匹配
- **THEN** checkpoint SHALL 按归档目标及已确认后态核对，不因原路径消失或合法coordination变化阻断，也不修改原Run

#### Scenario: Archive evidence cannot excuse unrelated candidate drift
- **WHEN** 归档目标错误、文件被额外删除/修改、源码漂移、spec与已确认收敛结果不同，或coordination包含其他字段变化
- **THEN** checkpoint SHALL 在commit前阻断，不能仅凭Archive PASS或相同文件名放行

#### Scenario: Incomplete or worktree-only archive evidence is insufficient
- **WHEN** 只有业务completed响应、未接纳的Archive，或候选Git树缺少必要Run/转换材料及其可信绑定
- **THEN** checkpoint SHALL 拒绝使用归档转换，不从目录存在或当前worktree补造历史成功

#### Scenario: Authorized unstaged archive output is checked after staging
- **WHEN** 归档输出和必要证据尚未staged但包含于exact授权paths
- **THEN** preflight SHALL 按拟写入后的候选树核对，并在stage后核对真实index；不得因旧index仍含归档前状态而误拒绝，也不得自动stage范围外材料

#### Scenario: Commit readback finds an unexpected blob
- **WHEN** commit已形成但其blob与已确认预期身份不同
- **THEN** 命令 SHALL 报实际commit SHA及未确认问题，不reset/重写或宣称完全confirmed

### Requirement: Managed metadata supplements are admitted from immutable candidate Git bytes

本次新增correction材料 SHALL 作为独立有界managed artifact准入，验证候选Git树内原三文件hash、exact所属Run、封闭additions、原role、Owner/证据和直接消费一致性；index/raw bytes SHALL 与已记录材料一致。它不要求修改原Result proofRefs，不冒充原Run新Proof或新Reviewer/Verification PASS。仅worktree中可见但未包含于候选Git树的证据/纠正 SHALL 不提供checkpoint准入；partial/linked/conflicting材料 SHALL 拒绝。原始diagnostic/effect材料保留字节与归属，不成为新权限。

#### Scenario: Correction is committed without rewriting its original Run
- **WHEN** 授权paths包含真实correction且HEAD+index能验证immutable原件与必要证据
- **THEN** checkpoint SHALL 接纳其原bytes而保留原Run，不要求追写父Result

#### Scenario: Worktree-only correction cannot authorize a different candidate tree
- **WHEN** checkpoint候选树缺必要correction/original/proof或与worktree事实冲突
- **THEN** 准入 SHALL 阻断，不从未提交worktree补造候选树证明
