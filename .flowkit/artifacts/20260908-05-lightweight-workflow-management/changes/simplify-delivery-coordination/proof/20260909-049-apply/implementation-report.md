# 049 Apply 交接：simplify-delivery-coordination

## 结论与边界

消费 048 review-propose approved → apply，实施 047 批准的计划。Author 实现验收完成，待独立 review-apply；没有自行产生 Reviewer verdict。

本轮仅更新当前实现、直接测试、三份产品 HOW、AGENTS 对应说明及 tasks 勾选。Proposal/design/delta specs 不改语义；D05 manifest 保留进入 Apply 前的 activation bytes。历史 archive/Runs 不改写，没有 Git mutation、实际 D05 Formal Full Test、Archive 或自动下一 Action。

## 实现与任务对应

| Tasks | 当前实现 | 当前验证 |
| --- | --- | --- |
| 1.1–1.3 | Start input/facts/contentCompletion 删除 Git SHA、validation receipt 和 commit callback；固定 manifest create-once/精确复用 | delivery-start-execution：真实 unborn Git 与无关 dirty、旧字段、错项目/授权/规划、junction/symlink、并发目标、不同但合法的写后 bytes、write-then-throw；无覆盖或 Git mutation |
| 2.1–2.3 | 保留 host-owned ReadDeliveryRequiredEvidence 名称，能力收敛为 readChangeClosure；只读 accepted archive/直接 review-apply，内存最小 completions | delivery-required-evidence-source：两个 required Changes；24 次读取只涉及四个相关三文件 Run；不读取无关祖先/proof/Full Test 日志；来源、Role/verdict/linkage/bytes 负例与具体 Change 诊断 |
| 3.1 | Final 复用当前 Full Test reader、manifest required 集合、空 active OpenSpec；没有 Git candidate | delivery-final-execution、delivery-without-archify、现有 Full Test 回归；final-material-01 实际检查损坏 stdout、缺 result、pending，均拒绝且恢复原始 fixture 后可准备 |
| 3.2–3.4 | 第一笔 completed/null confirmationRef；相关复验与发布前核对后第二笔原子发布；只读 reader 不补确认 | delivery-final-confirmation 八个场景覆盖正常、第一笔读回失败、输入/相关 Run 漂移、发布前中断/输入漂移、发布失败、确认后响应丢失；新进程 reader/Integration；两笔全量非目标 bytes 比较与 golden vector |
| 4.1–4.3 | Integration 只消费确认后的局部 Final，不重放完成来源/Full Test；新局部 ref；保留现有独立 Git 来源与对象核对 | integration 两组回归、新 projection golden、确认在最后来源读取中漂移时 callbacks=0、create/reuse/错误对象/target drift/acceptance 失败；失败后实际 HEAD/target 读回 |
| 5.1–5.2 | start/final/repository-integration HOW 与 AGENTS 最小对应条款；产品不读 .agents | 三份 Skill quick_validate、delivery-guidance-contract、安装分根回归、定向源代码/导出检索；旧字段只保留为拒绝负例或明确禁止说明 |
| 6.1–6.3 | 当前源码独立 Windows/Linux 依赖与实现验收 | win-current-*、linux-current-*：各 domain 303/303、acceptance 6/6、entropy tests 7/7；format/lint/typecheck/build/dependency-health/entropy 全通过；OpenSpec 1.10.0 strict PASS |
| 6.4 | 真实 049 三文件 Run、精确候选/规划/证据引用与结果读回 | finish-apply.mjs 从原始命令结果核验后 create-once 保存 result，再读回；不把下一步 Review 当作已执行 |

## Breaking 直接消费者清单

- Start：prepare(root,input,installation)；invoke(root,input,boundedSurface,installation)，surface 仅使用 host 的 writeManifest。旧 operationFacts 输入、SHA、validation 与 commit callback 已删除。delivery-operation-execution、Start tests 和 without-archify fixture 同步。
- 完成来源：旧完整 DeliveryRequiredEvidence / RequiredRunEvidence 等快照类型与 clone/validator 删除；EvidenceArtifactRef 留给实际材料引用。full-test-current 仅解除对旧快照的类型引用，运行语义不改。
- Final：package facts 换成 bounded completions/current attempt；新 delivery-finalization 模块承担局部 record/ref/只读 reader，既有 execution 出口导出。invoke 来源缺失报告 completion-source-unavailable；相关来源拒绝可携带 completionChangeId。operation fixtures、Final tests、guidance 与语义边界测试同步。
- Integration：移除 deliveryFinalOutcome 和 required-evidence 参数、finalizedCandidateRef 槽与 v2 内容复验；facts/record/ref/validator 与全部直接测试消费者同步。共享 delivery-integration-fixture 替代两份重复 setup；保留不同 Git 历史但可信本次接受关系成立的既有场景，不新增 ancestry gate。
- 删除两个不再有消费者的旧测试辅助文件：delivery-start-validation-fixture.ts、delivery-evidence-outcome-fixture.ts。可由 Git 历史恢复；未删除历史事实。
- 没有修改 Runtime/Policy/Run schema、Full Test 配置、工具 lock、.gitattributes 或 .gitignore。所有生产文件仍在 650 行限制内；实际文件清单与行数见 candidate-files.json。

## 验证的真实含义

- Windows：在本机 win32/Node 22.23.2 实际运行源码测试、临时 Git 仓库与 NTFS junction 场景。acceptance 中 windows-compatibility-simulation 仍只是 simulation，不声称穷尽原生 cmd/shim。
- Linux：固定 Node 22.23.2 linux/amd64 镜像，network none，pnpm 11.22.0 offline/frozen-lockfile，单独安装 Linux node_modules，以非 root node 用户运行测试。linux-source-02.json 保存本轮复制的代码输入 bytes 引用，交接再次逐项核对与当前代码相同。
- 合成 fixture 的 accepted archive/Review/source 明确是测试宿主输入，不宣称真实独立 Review。真实 D05 仍由 independent-bootstrap 管理。
- candidate-checks.mjs 直接运行适用工程命令，没有调用 Full Test coordinator，也没有改 D05 fullTestAttempt/Full Test 结果。沿用检查列表不等于创建 Formal Full Test 事实。
- 本轮早期失败/EPERM/迁移中断言或语法错误原始输出全部保留。final-reader-02、final-existing-04 等局部修正已被最终当前两平台整组结果覆盖；win-final 的格式漏项由 format-03 修复，最终 win-current-format-check PASS。最终 Start 精确读回修正后重新执行 win-current/linux-current，不借前版 PASS。

## Owner 决定与保留

sourceRef：043 Explore context.json#ownerDecisionHandoff（由 047/048 真实交接继续携带）。

D05 使用独立 bootstrap；必要材料保留本 target 的 artifacts，.tmp 只放可丢弃工作内容；历史不重写。当前 049 的原始 stdout/stderr 保留 Buffer bytes，结构化元数据单独保存，不追加 attributes 例外。前序实验/审查 PASS 仅为已接受依据，不作为本轮实现 PASS。

## 下一边界

独立 review-apply。未执行 review-apply、Archive、checkpoint/commit/push 或实际 D05 Full Test；STOP。
