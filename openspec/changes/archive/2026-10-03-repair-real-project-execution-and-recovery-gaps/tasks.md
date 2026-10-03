## 1. 保留现场并修正 Run 分配

- [x] 1.1 核对并保留既有未提交编号草案，实施按Delivery已验证occupancy分配首次Run、持久group/start sequence及exact finish复核；用多Change/跨日期fixed CLI fixture证明首次与后续编号和三文件读回一致。
- [x] 1.2 加入旧跨Change重号/缺口兼容和有界诊断；用1–11、12–22、1–11历史fixture证明新Change从23开始、旧Change查询有效且旧Run/Proof hashes逐项不变。
- [x] 1.3 核对partial占用、未知归属、bootstrap不确定上界、同Change断链/重复、后续跨Change占用及sequence耗尽；用反例证明具体阻断、不猜编号、不改previousRunId或跳号。

## 2. 候选绑定、字节身份与 Reviewer 结果

- [x] 2.1 在三个Review finish阶段核对reviewedRunId、原descriptor/direct Author、已有alias和candidate map，Archive复用同一绑定；用missing/wrong/conflicting与有效Review→Archive fixture证明写前拒绝/有效接续。
- [x] 2.2 保留旧完整Review只读兼容，新mutation拒绝缺失binding；用历史fixture证明status可读而Archive不能仅凭approved绕过identity。
- [x] 2.3 复用既有raw candidate核对，前移apply/revise-apply PASS及review-apply start/finish的raw/filter guard；测试LF、CRLF、-text、filter失败/属性漂移及不存在deletion，证明失败时新machine文件未写、未自动normalize。
- [x] 2.4 同步Policy、finish与Run-chain，允许known rejected/null boundary成为terminal stopped；三个Review阶段fixed CLI测试真实保存、独立进程读回review-rejected及unknown/non-null boundary/角色防伪反例。
- [x] 2.5 扩展fixed start支持既有合法terminal Owner revise及rejected对应revise，保留prepared合同；测试exact Owner/缺失或wrong fact、stage skip、Author FAIL/invalid链、structural enterability及新Run绑定原tip且原verdict不变。

## 3. 有界不可变 terminal correction

- [x] 3.1 实现action correct严格parser、可见target一致性及closed additions/Owner decision；测试重复JSON key、未知字段、wrong role/target、scope/sourceRef不合法、archived/bootstrap/非允许Run和试图改verdict/已有值均写前拒绝。
- [x] 3.2 实现每Run至多一个外部create-once correction，绑定original三文件hash与原Result声明的candidate-manifest proof或唯一Author binding；测试无原证据不追认当前worktree、相同请求只读、冲突/partial拒绝及原bytes不变。
- [x] 3.3 实现共享的original/effectiveFacts/correctionRef读取，接入Review/Archive相关identity消费，Policy outcomes始终取original；用correction后新进程读回与原件/proof/correction tamper反例证明统一验证且不静默忽略。
- [x] 3.4 实现直接已消费Reviewer的一致性/失效规则；测试纯缺字段且exact候选一致可保留原判定，conflicting/来源不足不能继承准入，Author不能代填Reviewer correction，不生成Review/Verification PASS。

## 4. Archive 独立依赖与失败诊断

- [x] 4.1 用scratch独立依赖snapshot替换source junction，安全复制普通/hardlink文件、内部相对/绝对链接和workspace映射；fixture验证scratch写入不改变source、逃逸/未知外部链接/不完整snapshot明确拒绝。
- [x] 4.2 处理可识别pnpm.bin shims的source绝对NODE_PATH重定位，并收敛子进程环境；Windows fixture证明wrapper和实际依赖解析位于scratch，source env不被修改，未知外部shim引用拒绝。
- [x] 4.3 实现禁止install的pnpm11源依赖preflight、复制前后package/lock/metadata绑定及scratch局部no-sync；两处archive preflight回归证明未匹配依赖阻断、环境override不能绕过源验证、声明scripts确实执行且失败仍阻断。
- [x] 4.4 在清理scratch前保留create-once command/raw流和真实退出/分类/ref，支持无Run的独立attempt及16MiB截断失败；测试非UTF8/CRLF、非零/command-missing/timeout/output overflow/存储失败，证明原bytes或明确前缀可读、不伪造Run/PASS。

## 5. partial 可观察性与同 Run 剩余步骤

- [x] 5.1 实现只读action inspect及普通incomplete诊断的exact inspect定位；fixture覆盖descriptor-only、machine partial、Guidance/root drift、fork和未知格式，证明inspect无写入且canContinue来自真实核对。
- [x] 5.2 为真实archive保存有界create-once pre/postcondition与实际effect观察，含完整迁移suffix/hash集合、spec前后态、coordination前后hash及唯一允许字段差异，由terminal Result绑定exact材料refs，不新增Run文件；fault-injection验证archive前、OpenSpec响应丢失、rename后、coordination响应丢失的记录与真实目录/spec/coordination一致，未terminal材料不提供checkpoint依据。
- [x] 5.3 让明确same Run change archive仅执行可证剩余步骤；fixed CLI恢复测试证明none重新preflight、已归档只rename/coordination、completed只读、mixed/unknown/machine partial阻断且无OpenSpec重复执行或替代Run。

## 6. Git candidate tree 和 managed correction 准入

- [x] 6.1 在existing scoped checkpoint中校验授权raw/filter及reviewed effective身份；未变文件核对原hash，归档文件/spec/coordination按同Change已接纳Archive和候选树内可信材料核对允许后态。stage前核对拟写入树，stage后核对实际index及commit后blob；临时Git仓库覆盖合法目录迁移/spec收敛/仅当前state更新、未staged输出、已在HEAD但不属staging的候选，以及CRLF/属性变化、错映射/额外删除或漂移、缺失/未terminal/worktree-only证据、范围外staged和commit后异常交接，证明不改原Run、不扩张paths/不reset。
- [x] 6.2 为新增correction建立候选Git树的独立managed准入，验证immutable original/role/Owner/proof/直接消费和index原bytes；fixture证明worktree-only证据不能准入、无需改parent proofRefs、诊断材料不生成权限。

## 7. 发行 HOW 与合同一致性

- [x] 7.1 同步Author/Reviewer/Archive/Git Skills、onboarding、CLI help和仍有效示例，给出inspect/correct的closed请求及rejected→明确Owner revise步骤；对照parser/Policy回归检查示例可解析、普通Action无额外审批、无临时callback或自动next。
- [x] 7.2 检查src生产可达性和新增helper的既有concept ownership；执行适用quality:dependency-health、quality:entropy及quality:owned-source，证明没有Registry/第四Run文件/新lifecycle/candidate自管理依赖，历史归档未改写。

## 8. 当前输入回归和验收交接

- [x] 8.1 运行当前candidate的typecheck、test:domain、quality:gate、build与受影响fixed CLI/安装acceptance；对适用Linux detached回归使用其独立依赖环境，按baseline/candidate区分旧债与新regression，记录实际命令/退出/范围，不用旧PASS抵扣。
- [x] 8.2 执行native Windows + pnpm11真实archive acceptance：隔离convergence、声明领域/完整checks实际运行，成功与真实check失败都覆盖，source candidate/依赖hash与junction/shim事实读回；保留raw输出，不以Windows simulation充抵。
- [x] 8.3 集成验证失去响应后的同Run观察/恢复→finish→新进程status/next、correction后Review/Archive/checkpoint和rejected后Owner revise链；在隔离fixture中覆盖候选包含Change规划文件和coordination的Review→Archive→授权checkpoint正常路径，证明原路径移除、归档hash不变及合法后态可准入，归档后额外漂移仍阻断。记录实际证据并保持未执行项未勾选，不伪造独立Review、Formal Full Test、Final或真实项目Git授权。
- [x] 8.4 以exact OpenSpec1.10.0执行validate --strict并核对proposal/design/七份delta/tasks一致，形成供独立审查的变更与验收摘要；确认没有热改安装/消费项目、历史bytes迁移、commit/push/merge或发布。
