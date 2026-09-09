## MODIFIED Requirements

### Requirement: Formal Full Test executes only the exact project-local check contract bound to the package

系统 SHALL 从 target 的单一项目配置读取显式 ordered checks、cwd、输入和排除范围，并在执行前绑定配置/检查身份；不得使用 caller 临时 checks、Git 可见性或 package scripts 自动推断配置。每个 check 的 program、argv 顺序、cwd、实际工具与声明环境身份 SHALL 精确绑定。所用命令及扫描器 SHALL 实际遵守项目范围，不声称父配置可以沙箱化任意命令。

#### Scenario: Execute the exact ordered project-local check set
- **WHEN** 有效配置与 package 声明 checks [A, B, C]
- **THEN** 系统 SHALL 按 A → B → C 实际执行且不跨尝试复用旧 PASS

#### Scenario: Reject inferred or malformed Full Test plan
- **WHEN** 配置缺失、未知字段、空/重复检查或输入无效
- **THEN** 系统 SHALL 在执行前拒绝并报告具体原因，不补齐默认测试集合

#### Scenario: Git visibility is not test scope
- **WHEN** 产品文件被 ignore 或尚未 tracked，而项目范围包含它
- **THEN** 系统 SHALL 仍覆盖该文件；只改 Git ignore/index 不改变测试集合

### Requirement: Full Test evidence is admitted only for the exact current candidate and exact material check identities

Formal Full Test SHALL 使用项目文件范围与配置/工具/环境形成独立测试输入身份，不使用 shared Git-visible candidate 作为测试输入。每次实际尝试 SHALL 独立执行全部声明检查；当前关联、真实完整结果、必要材料与当前输入均有效时才可消费 PASS。旧执行对象的局部结构校验、相同内容摘要或 caller priorFacts SHALL NOT 取代当前尝试选择。

#### Scenario: Same candidate and same check identity can retain unaffected PASS
- **WHEN** 同输入/check 有旧 PASS，用户启动新 Full Test
- **THEN** 系统 SHALL 为新尝试实际执行全部检查，不继承旧 PASS；未启动新尝试时当前已完成有效结果仍可读取

#### Scenario: Candidate drift rejects prior evidence
- **WHEN** 测试相关输入相对当前完成结果变化
- **THEN** 系统 SHALL 拒绝把该 PASS 用于当前 Final；非产品图文/真实产物/合法管理状态变化不自动导致测试失效

#### Scenario: Material check identity drift forces affected rerun
- **WHEN** 配置/program/argv/cwd/声明环境身份变化
- **THEN** 系统 SHALL 不沿用旧完成结论，后续授权调用建立新实际尝试

#### Scenario: 同序旧算法 PASS 不复用
- **WHEN** 旧 v2 Git candidate 或更早算法记录被提供给新 Full Test 消费者
- **THEN** 系统 SHALL 不迁移、重签或使用其替代当前新尝试结果

### Requirement: Pure external correction may remain on the same candidate but repository correction ends the current Full Test attempt

Full Test SHALL 不修改产品或授予 correction 权限。任何后续重跑均使用新实际 attempt 并执行声明检查，不自动延续/恢复或复用 prior PASS；环境修正可保持产品输入身份，但不保持 execution occurrence。产品修正仍走既有 Change/revise 边界，当前失败/partial 保留。

#### Scenario: External fixture correction keeps the same candidate
- **WHEN** 仅修正外部环境而产品输入未变，后续调用已获授权
- **THEN** 系统 SHALL 可保持产品输入身份并创建新 attempt；完整重跑，不覆盖原执行

#### Scenario: Repository correction creates a new Full Test attempt
- **WHEN** 修正修改实际测试相关 source/tests/config 等输入
- **THEN** 系统 SHALL 停止当前尝试，经正常修改权限后建立新测试，不继承旧候选完成证明

#### Scenario: Memo-only 不产生隐含修改权
- **WHEN** 测试中发现需要改变 Memo
- **THEN** 系统 SHALL 保持 Memo 自身权限边界，不因测试排除历史目录取得修改权

## ADDED Requirements

### Requirement: Full Test input selection is bounded and independent of repository tracking

配置 SHALL 明确输入文件/递归目录与 exact path/prefix 排除，直接读取文件系统，不依赖 Git 根、HEAD 或 ignore/index。配置自身及实际消费的产品/检查资源 SHALL 覆盖，不能按 JSON/Markdown 扩展名泛化排除。选中链接/特殊文件、必要路径缺失或不可读 SHALL 明确拒绝，不静默漏测。被排除历史目录不扫描，相关读取器自身用 fixture 验证。

#### Scenario: No commit is needed to test a project
- **WHEN** 有效项目与配置存在但没有 Git 仓库/commit
- **THEN** Full Test SHALL 可建立并执行；Git 不是 prerequisite

#### Scenario: Process material is not a product scan input
- **WHEN** 仅增加真实 artifacts/Runs、临时工作或已排除非产品图文
- **THEN** 系统 SHALL 保持测试集合和测试输入身份，不遍历历史证据

#### Scenario: Unsafe selected paths do not disappear silently
- **WHEN** 选中输入逃逸 target、为链接/特殊文件或无法读取
- **THEN** 系统 SHALL 在本轮有界支持模型下准确拒绝，不猜测 normalize 或静默跳过

### Requirement: Each Full Test attempt is durably selected before checks start

真实入口 SHALL 为每次调用建立独立 create-once attempt 和开始记录，发布并读回既有 Delivery 当前关联后才执行检查；不产生 Standard Action Run。发布前失败不执行且不宣称本次测试完成；发布后失败/partial/中断不得回写旧关联或选择旧 PASS。未知保存状态 SHALL 重读并报告，不自动接管。

#### Scenario: Repeated identical inputs create distinct attempts
- **WHEN** 相同项目/Delivery/配置连续执行两次
- **THEN** 系统 SHALL 产生不同 attempt，旧材料保持原样，不把 package hash 当 occurrence

#### Scenario: Start or selection cannot be saved
- **WHEN** 开始记录、当前关联写入或读回失败
- **THEN** 系统 SHALL 不启动检查，保留已写材料，不宣称新尝试完成；关联不可确认时不从旧缓存报告 PASS

#### Scenario: New failure cannot fall back to old pass
- **WHEN** 已发布的新 attempt 失败、中断或缺结果
- **THEN** 消费者 SHALL 报告当前失败/未完成，不返回旧成功

#### Scenario: A later authorized attempt follows a partial one
- **WHEN** 已有 partial 被明确核对，后续调用已获授权
- **THEN** 系统 SHALL 使用新目录和当前关联，保留旧 partial，不补造旧成功

### Requirement: Necessary Full Test results and raw streams remain in the target

开始/真实命令/结果及必要输出 SHALL 在 target .flowkit/artifacts/<delivery>/full-test/<attempt>/ 保存并读回，不仅留 .tmp、不保存到 manager 或依赖仓库外 evidence root。stdout/stderr SHALL 保留原始 bytes。身份/归属/可读性/完整性/结果一致性 SHALL 在生成、接纳及相关消费时验证；必要保存失败不可 PASS，不遍历无关历史。

#### Scenario: Fresh session consumes current saved outcome
- **WHEN** 当前关联与完整结果/必要原始流有效，.tmp 已被清除
- **THEN** 新会话 SHALL 从 target 读取当前结论，不依赖旧进程或外部 adapter

#### Scenario: Output persistence fails
- **WHEN** 打开输出失败或执行中流/结果保存失败
- **THEN** 系统 SHALL 不启动或停止对应进程并报告失败/partial，不截断后声明完整 PASS

#### Scenario: Current result is damaged or misowned
- **WHEN** 当前结果或必要引用缺失、损坏、链接逃逸、project/Delivery/attempt 不匹配
- **THEN** 相关消费者 SHALL 拒绝使用该结果，不以重新跑代码代替材料核对
