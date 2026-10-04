## MODIFIED Requirements

### Requirement: Archive preparation performs real package-bound readiness before archive mutation
当前product/bootstrap Archive HOW SHALL 将package-bound preparation限定为Flowkit自有admission：active、唯一Policy/Role、可信Review与未漂移候选、ordinal/identity、Guidance及记录完整性。有效普通archive不要求第二次Owner授权，也不要求预存completed。HOW SHALL 先保存started Run，再调用真实受控OpenSpec archive并如实记录结果；不得先运行隔离convergence、项目checks、仓库/依赖快照或shim解析来避免真实失败。

安全失败 SHALL terminal保存FAIL；同候选可在外部条件修复后经新明确调用创建新Archive Run。需要修改已审内容时 SHALL 请求既有Owner revise-propose/revise-apply并重新独立Review，不引入revise-archive。partial/unknown SHALL inspect和交接恢复，不盲重试、删Run或补成功。

#### Scenario: Archive readiness passes without a second Owner archive authorization
- **WHEN** approved review-apply绑定exact候选且Policy使archive合法
- **THEN** HOW SHALL 完成轻量admission后开始Run，不要求额外Owner archive审批

#### Scenario: Correction-requiring blocker stops before archive mutation
- **WHEN** admission发现已审候选漂移，或真实archive安全失败后发现需要修改候选
- **THEN** HOW SHALL 停止直接归档，区分尚未开始与已记录失败；经Owner修订和fresh review-apply后才再次archive

#### Scenario: Environment-only blocker can retry the same candidate
- **WHEN** 真实Archive已安全失败且候选未变，外部条件已修复
- **THEN** HOW SHALL 保存原terminal FAIL，并在新明确调用下创建新Archive Run，不覆盖失败或重复同Run原生执行

### Requirement: Author HOW separates candidate bytes correction from metadata completion and observed recovery
Author HOW SHALL 在形成候选时保留实际raw identity，并使用fixed finish只读生成/核对包含相关stage-0 indexBasis的受支持Git projection；不能把正常CRLF→LF差异统一当成内容错误，也不能把已有CRLF索引下合法的auto identity误改成LF预期。无索引hash结果不能单独证明普通staging语义。不能为了checkpoint强制所有文件改LF、自动renormalize或用真实/临时add预测。项目格式规则仍在Author编辑和适用验证时遵守；实际raw、有效规则或非预期索引输入变化不能默默继承旧绑定，EOL存储支持不扩大Verification PASS复用。

HOW SHALL 区分 clean/EOL 内容与普通 add 的最终 index。raw 等于原 index blob 而 clean 不同时 SHALL 在保存成功候选前明确 unsupported；仅 stat 变化的对照仍拒绝，不指示自动 touch、refresh、renormalize、改配置或 stage 后重绑。该窄支持限制不提供自动迁移，不增加持久 stat 记录；已核实预期输出与 absent 对照按既有支持合同核对。

纯缺字段且有原证据的terminal补齐 SHALL 走Owner明确授权action correct；无原candidate proof、内容变化或下游冲突走真实revise/review，不改原Run，也不借correction为旧结果追认candidateGit。Archive SHALL 使用真实执行及诊断合同；same-Run仅在descriptor-only且已证实剩余步骤时继续，安全terminal FAIL用新Run，partial明确阻断。HOW SHALL 使用同安装fixed命令，不动态导入内部callback、不自造PASS、不自动retry/next/Git。

#### Scenario: Author corrects source formatting before declaring candidate identity
- **WHEN** 本次文件违反项目格式要求或其实际内容/属性发生变化
- **THEN** Author SHALL 在编辑/验证阶段形成真实新候选并独立审查，不追改历史hash；合法Git EOL存储差异本身不触发该修订

#### Scenario: Author preserves a supported indexed CRLF candidate
- **WHEN** 原index含非binary CRLF且自动文本规则保留修改后raw，或正常暂存已经形成绑定的预期输出
- **THEN** HOW SHALL 使用fixed只读校验保存或消费相应identity及indexBasis，不要求仅为无索引hash差异改文件、改索引或重做业务；不可解释状态在成功候选前明确停止

#### Scenario: Archive continuation starts with actual effect observation
- **WHEN** 已开始Archive遇unknown/incomplete
- **THEN** Author SHALL 先inspect实际效果，只有可证descriptor-only剩余步骤才同Run继续；terminal安全FAIL用新Run，partial不能用替代Run掩盖

#### Scenario: Author does not repair an unsupported prediction by touching files
- **WHEN** raw 与旧 CRLF index 相同而属性变化令 clean 为 LF，普通 add 存在 cache 跳过分支
- **THEN** HOW SHALL 报告具体路径和支持边界并停止成功候选接纳，不自动触碰时间戳或伪造稳定 LF 预期
