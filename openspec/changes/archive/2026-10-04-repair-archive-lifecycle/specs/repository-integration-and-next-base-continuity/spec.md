## MODIFIED Requirements

### Requirement: Checkpoint preserves raw candidate identity through index and Git blobs
create-new checkpoint SHALL 保留Owner范围、完整pending index、Git操作状态及candidate integrity核对，同时区分已审raw bytes和预期Git blob。对新versioned候选，系统 SHALL 先核对已绑定raw identity、有效Git规则与相关stage-0 indexBasis，再按普通staging语义确定的预期blob核对projected tree、真实index和最终commit；不能直接把raw hash当成所有文本的blob hash，也不能单凭无索引hash预测暂存结果。只允许已确认Git内建EOL差异，不允许任意filter/encoding/ident、真实内容漂移或未绑定转换。Run/proof/原始日志和binary/-text等字节敏感材料仍须原bytes==index==blob。

受管理归档后的转换依据 SHALL 为同Delivery/Change的exact Author、approved Review、已接纳terminal Archive PASS及其完整材料。Archive retry链可包含已接纳安全failed节点，成功来源须按唯一父链解析，不能假设PASS的直接前序总是Review；partial/unknown或错误绑定不能跳过。只允许完整source suffix/raw集合到真实ordinal路径的移动、真实原生Archive捕获的canonical spec after，以及仅本Change active→completed的coordination变化。材料及Run自身须在候选Git树中逐字节可验证；随后以归档目标路径自身有效规则及相关stage-0 indexBasis所绑定的Git projection核对存储身份，而非要求入库blob等于移动前raw hash；source为既有CRLF而destination为absent时，不得继承source的自动保留分支。

stage前 SHALL 使用当前index加exact授权路径的已绑定预期blob/删除形成只读内存候选树，并独立核对worktree raw未漂移。相关索引条目必须为绑定的输入依据或满足既有mode/path合同的预期输出；其他变化、未合并或不可解释状态在staging前拒绝。不能通过真实/临时add试算，不能因当前index不同而悄悄替换已审blob预期。

普通 add 的 clean/EOL 内容 SHALL 不被无条件当作最终 index。输入仍为原 entry，raw 等于其 blob bytes 而 clean/EOL 不同时，checkpoint SHALL 复用候选接纳的 unsupported 边界，在真实 staging 前拒绝，无论 stat 命中或仅时间戳改变。普通无 Review checkpoint、归档目标 after projection 与新候选 SHALL 使用同一规则；已核实预期输出按既有输出合同消费。SHALL NOT 自动 touch、refresh、renormalize、修改配置或 stage 后回写预期绕过歧义。

真实stage后 SHALL 核对预期输出blob与cached有效属性，commit后读回最终blob；不再要求stage后的index等于旧输入OID。预期结果已经在index中时 SHALL 只读核对，不将正常暂存视为候选修改。参与转换的版本化属性必须已在候选树或属授权paths；只有worktree未暂存属性不足以证明候选Git树。相关外部设置/属性漂移 SHALL 阻断。既有HEAD/index但不属staging的路径只读核对blob，不扩大授权、不夹带staged。deletion按授权事实，不造hash或自动豁免被审文件消失。

旧无projection的记录只按原raw==blob合同兼容，不能回填或追认历史。普通无Review关联checkpoint不伪造Reviewer凭证，但其授权文件也必须由同一有界index-aware规则形成可验证预期blob。reuse-existing/push不触碰无关index或追溯改写历史。Git正常EOL warning不是独立失败；真实Git错误、内容/规则不符仍拒绝。不自动normalize、renormalize或reset，不建立通用迁移平台。

#### Scenario: Filter changes reviewed source bytes
- **WHEN** 非受支持EOL的filter/encoding/ident、真实内容变化或未确认属性令候选与预期blob不符
- **THEN** checkpoint SHALL 在commit前拒绝并指出路径，不用normalized等价掩盖实际变化

#### Scenario: Reviewed file outside staging remains exact
- **WHEN** 已审文件已在HEAD/index且不属本次授权paths
- **THEN** checkpoint SHALL 只读验证其绑定blob，不stage它；已确认EOL的blob不必等于raw，真实漂移仍拒绝

#### Scenario: Reviewed planning files survive a legitimate archive move
- **WHEN** 已审文件经可信Archive移动到ordinal目录，完整suffix/raw一致、旧路径删除且spec/coordination符合真实后态
- **THEN** checkpoint SHALL 根据归档转换及目标路径Git projection核对，不因原路径消失或合法EOL转换误拒绝，不改原Run

#### Scenario: Archive evidence cannot excuse unrelated candidate drift
- **WHEN** 错目标、额外删改、源码漂移、spec不符实际后态或coordination有其他字段变化
- **THEN** checkpoint SHALL 在commit前拒绝，不能仅凭Archive PASS或相同文件名放行

#### Scenario: Incomplete or worktree-only archive evidence is insufficient
- **WHEN** 仅有completed响应、未terminal的Archive或Git候选树缺必要Run/材料
- **THEN** checkpoint SHALL 拒绝归档转换，不从当前worktree补造历史成功

#### Scenario: Authorized unstaged archive output is checked after staging
- **WHEN** 归档输出和必要证据未暂存但属exact授权paths
- **THEN** preflight SHALL 按预期blob候选树验证，stage后核对实际index；不能误用旧index或扩大范围

#### Scenario: Commit readback finds an unexpected blob
- **WHEN** commit已形成但blob不符绑定预期
- **THEN** 命令 SHALL 报实际commit SHA和问题，不reset、重写或宣称完全confirmed

#### Scenario: Supported EOL conversion is not a new implementation change
- **WHEN** 已审raw未变、确认规则仅将CRLF入库为LF、实际index/commit符合预期
- **THEN** checkpoint SHALL 允许该转换，不修改工作区、不要求仅为Git入库转换重做Review

#### Scenario: Raw streams remain immutable through staging
- **WHEN** 原始CRLF或non-UTF8日志按-text作为必要证据暂存
- **THEN** index和commit SHALL 保留原字节与已记录SHA，不套用文本projection

#### Scenario: Attribute inputs cannot silently change the candidate
- **WHEN** 相关.gitattributes只在worktree变更却不在候选树/授权paths，或stage前后有效规则变化
- **THEN** checkpoint SHALL 拒绝，不替用户stage属性或用新规则追认旧候选

#### Scenario: Existing CRLF auto text reaches the expected staged blob
- **WHEN** 候选原index为非binary i/crlf，text=auto或继承autocrlf的自动模式使修改后的raw CRLF绑定为identity，Review有效且授权暂存范围正确
- **THEN** checkpoint SHALL 允许普通staging保留新CRLF，并核对index/commit等于绑定raw blob，不在暂存后拿错误LF预期拒绝

#### Scenario: Normal staging is not an unexpected index drift
- **WHEN** 本次普通staging将输入absent/LF/CRLF条目替换成事先绑定的预期输出
- **THEN** stage后及后续只读消费 SHALL 验证输出而非要求旧输入OID；实际输出不同仍拒绝，不能回写预期适配它

#### Scenario: Archive destination has its own index history
- **WHEN** source与新archive路径具有相同text=auto属性，source原index含CRLF而destination原index不存在，迁移raw一致
- **THEN** 归档after projection SHALL 使用destination的absent依据，并按其普通文本入库规则验证LF输出，不复用source的CRLF identity预期

#### Scenario: Git failure does not reopen a completed Archive
- **WHEN** Archive已terminal PASS而后续Git EOL/identity/commit步骤失败
- **THEN** 系统 SHALL 只交接Git已知效果与剩余步骤，不再次运行OpenSpec或重开Change

#### Scenario: Attribute-only clean ambiguity stops before real staging
- **WHEN** 授权路径 raw 等于旧 i/crlf blob，属性已改为显式 text eol=crlf，clean 为 LF，而普通 add 可因 stat cache 保留 CRLF
- **THEN** checkpoint SHALL 在 staging 前明确 unsupported 且不写 index；仅改变文件 stat 的对照同样拒绝，不用 stage 后重绑预期修补错误预测
