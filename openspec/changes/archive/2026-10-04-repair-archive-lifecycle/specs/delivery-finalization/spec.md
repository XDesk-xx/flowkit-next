## MODIFIED Requirements

### Requirement: Delivery Final consumes complete exact prerequisite outcomes

Final SHALL 从 canonical coordination、只读 OpenSpec、可信已接纳完成来源及当前 Full Test 消费 prerequisites。Delivery SHALL active，manifest required Changes SHALL 全部 completed，active OpenSpec set SHALL empty；集合不得由 caller 缩小。各 Change SHALL 具有当前唯一可信完成终点，即已接纳的 terminal Archive PASS，并关联到真实 approved review-apply 及该 Review 的 direct Author。没有 retry 时保留直接 Review 关联；存在 retry 时 SHALL 通过同一 Change 唯一 parent 链穿过连续、完整、已接纳的安全失败 Archive，定位批准来源，而不要求成功 Archive 的直接父 Run 是 Review。

完成终点、相关失败节点、Review/Author 的身份、Role、terminal、outcome/verdict、链接、来源及必要三文件完整性 SHALL 有效。partial、未知/缺失失败 outcome、错目标、fork、不连续链接、过期 PASS 或绕过其他阶段 SHALL 拒绝；不得修改失败 parent、用旧 Review 替代直接失败前序，或把存在多个 Archive Run 本身视为完成来源歧义。旧已接纳 Archive PASS 仍按原直接 Review 合同兼容；旧 FAIL 不自动取得安全失败语义。

Full Test SHALL 来自 target fullTestAttempt 指向的当前真实完整 PASS，实际来源/项目/Delivery/execution 匹配，当前输入等于 inputRef。失败、partial、开始未完成、必要材料缺失/损坏、输入改变 SHALL 拒绝，不回用旧 PASS。SHALL NOT 使用 Git candidate、架构结果或 standalone hash 代替这些事实；bootstrap 历史不得转成 canonical 产品 Run。完成来源接纳 SHALL NOT 产生 Full Test、Final 或 Git 授权。

#### Scenario: Prepare from complete accepted prerequisites
- **WHEN** 上述 required 完成事实、空 active set 和当前测试有效且没有任何图
- **THEN** Final SHALL 可准备，不遍历全部原始 proof 或重放祖先 admission

#### Scenario: Reject incomplete Change or active OpenSpec state
- **WHEN** required Change 未完成、完成来源不符或 active set 非空
- **THEN** Final SHALL 在写入前拒绝并指出具体事实

#### Scenario: Reject stale or partial verification
- **WHEN** 当前 attempt 失败/未完成、材料无效或测试输入变化
- **THEN** Final SHALL 拒绝，不用旧 PASS 重建当前验证

#### Scenario: Reject stale or partial verification and Architecture facts
- **WHEN** caller 用旧测试或 Architecture outcome 补充当前资格
- **THEN** Final SHALL 拒绝这些替代输入，不要求任何架构证明

#### Scenario: 缩小证据集合不能通过
- **WHEN** manifest required 为 A/B，但仅 A 存在 accepted completion
- **THEN** Final SHALL 指出 B 的缺口，不仅凭 completed 字段放行

#### Scenario: A successful retry is accepted without rewriting its parent
- **WHEN** R15 为批准的 review-apply、R16 为同目标已接纳安全失败 Archive、当前 R17 为可信 terminal Archive PASS，R17.parent=R16、R16.parent=R15，且其他 prerequisites 有效
- **THEN** 完成来源 SHALL 接纳 R17 与 R15 的关联，不要求 R17.parent=R15，不覆盖 R16，也不因先前存在失败而拒绝当前成功

#### Scenario: An older success cannot replace an invalid current completion
- **WHEN** 所选 PASS 不是当前可信完成终点，或它到 Review 的关联包含 partial、未知结果、错目标、fork 或其他阶段
- **THEN** Final SHALL 拒绝该 Change 的完成来源，不回退挑选更早 PASS 或目录号最大的记录

### Requirement: Final 消费相关已接纳终点而不建立第二证据快照

系统 SHALL 由可信宿主的既有完成来源能力定位 manifest 所选 Change 的当前可信 Archive PASS 终点，并复用与 Archive/checkpoint 一致的 outcome-aware 来源解析，沿其真实 previousRunId 穿过零个或多个连续安全失败 Archive，停在 approved review-apply，再核对该 Review 的 direct Author。入口选择与接纳校验 SHALL 使用同一关系，返回的 archive/review 必须与该解析结果一致。所选终点及相关链项 SHALL 从 target 受控地址读回，核对已接纳来源、归属、terminal/Role/outcome/verdict/linkage 和必要三文件 bytes 完整性；不能仅取消直接 parent 相等检查而不验证中间失败链。

普通 caller SHALL NOT 任意注入 reader JSON、地址、approved 或自签 hash 取得完成资格；来源能力缺失 SHALL 报告 completion-source-unavailable，而非临时生成成功记录。选择器 SHALL NOT 按目录时间或最大序号猜 Review，不要求整个历史只有一个 Archive occurrence，也不能跳过 partial/未知节点或替换原父链。

本次 changeCompletions SHALL 仍仅含每个 required Change 的 changeId、archiveRunId、reviewApplyRunId、archiveResultRef、reviewResultRef，按 manifest 顺序，用于准备及相关事实复验，不持久复制为完成数据库。安全失败节点只作为证明所选成功来源的相关链项，不成为新的完成终点。SHALL NOT 重放所有祖先 ActionPackage/admission、扫描整个 artifacts 或要求长期保留所有原始实验来通过 Final。Action owner 的严格执行和完整性合同 SHALL 保持不变；Final Owner、当前 Full Test、确认发布与 Git 分权不变。

#### Scenario: 必需 Run 缺失或损坏
- **WHEN** 所选 archive/review、必要 Author 或中间失败链项的三文件缺失，或 bytes/来源/归属/Role/outcome/verdict/linkage 不符
- **THEN** Final SHALL 拒绝并指出该 Change，不用 hash 自洽或当前 completed 字段放行

#### Scenario: 无关历史追加不影响覆盖
- **WHEN** 相关完成来源有效，仅追加无关历史或 .tmp 不存在
- **THEN** Final SHALL 不扩大 required 集合，不重验无关 proof，不要求清理或转存

#### Scenario: 错项目或自签来源拒绝
- **WHEN** 返回记录结构合法但不是受控已接纳来源，或不能确定当前唯一可信完成终点
- **THEN** Final SHALL 报告来源缺失/歧义，不按最大目录号猜测

#### Scenario: 外部证据必须可真实取回
- **WHEN** 读取历史外部 Full Test 记录
- **THEN** 历史 SHALL 原样按原 owner 可读；当前 Final SHALL 只消费 target 当前 attempt，不迁移或用历史补齐当前

#### Scenario: 无架构证据的完整输入
- **WHEN** required 完成来源与当前 Full Test 有效且没有架构来源
- **THEN** Final SHALL 可完成；必要材料保留原处，不删除、不新增“不适用”证明

#### Scenario: Repeated safe failures preserve the compact completion result
- **WHEN** 当前成功 Archive 通过两个或更多已接纳安全失败 Run 唯一关联到 approved Review，所有相关来源完整
- **THEN** 消费者 SHALL 返回成功终点的 archiveRunId 与该 Review 的 reviewApplyRunId，并保持既有五字段 changeCompletions；不把失败项误作 Review、不持久复制一份完整链

#### Scenario: Source selection and later revalidation agree
- **WHEN** 完成入口已选定成功终点，但相关复验发现中间失败记录损坏、链接改变或返回的 Review 与共享解析不一致
- **THEN** 接纳 SHALL 拒绝该来源，不复用第一次的成功布尔值、不执行归档或补造 Final 确认
