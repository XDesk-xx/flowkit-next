## Context

动机见 proposal.md。043 Explore 与 044 approved review 已收敛范围；本设计选择最小活动合同，不重做实验或历史迁移。涉及多个 operation 和直接消费者，因此需要 design。

## Goals / Non-Goals

目标是让 Start/Final 使用各自实际需要的事实，保留单次调用、局部写入保护、当前测试有效性与独立 Git 权限。

不改变 Standard Action/Run schema、Policy、OpenSpec mechanics、Full Test 配置/attempt 生产者。产品仍测试普通 target，不管理 D05 本身。无证据平台、全仓新摘要、自动恢复、清理器或完整 Git 节点重设计。

## Decisions

### 1. Start 只建立内容，不建立 Git 固定点

继续现有 operation envelope 和 manager Guidance。公开 preparation input 固定为 deliveryId、ownerAuthority、planningReference；planningReference 保留 artifact/contentSha256，必须来自 Owner 选定的 target 内可读规划材料。host 重读真实材料，不信 caller hash。

Start operationFacts 固定为 projectId、planningReference、coordinationPrestate；prestate 是固定 manifest 地址加当前内容引用或 null（目标不存在），不是 HEAD。project identity、Delivery scope 和目标地址必须匹配。Owner decision=create-delivery、无 changeId 且 scope 包含 delivery-start；本 operation 不解释额外 Git scope，也不调用 Git。

沿用 host/Agent 的 bounded surface callback，允许写入的唯一业务文件为 openspec/delivery-groups/<deliveryId>.yaml。不存在则 create-once；已有精确匹配的交付上下文可只读复用；不同目标、同名内容冲突、不安全路径或另一个活动 Delivery 引起歧义时拒绝，不把全仓 dirty 当冲突。

Start contentCompletion 固定为 projectId、deliveryId、planningReference、coordinationRef（artifact/contentSha256/bytes）。真实 manifest 解析、目标与范围核对、输出读回直接形成 receipt；不再要求外部 git-start-prestate/receipt PASS 报告，不复制一份 manifest。删除 acceptedBaseCommit、candidateRef、validation 快照、fixedPointCommit 及 commit callback 参数，返回 status=terminal、operationPackage、contentCompletion。

不新增 start receipt 持久文件：manifest 本身记录规划引用与 Change 组织事实，下一会话从 project+manifest+规划重读；历史 manifest 原样保留，不伪装成新 Start 输入。Git 分支可以由已有独立 Git 节点处理，但不是内容 Start 的准入条件。

替代方案：acceptedBaseCommit optional 或忽略 clean 仍留下内容完成阶段 Git candidate 依赖；因此不选。

### 2. 完成来源保持在现有 owner，Final 只消费终点

保留 ReadDeliveryRequiredEvidence 所在模块的 host-owned 来源边界，收敛为有限 readChangeClosure 能力，不建立新的仓库 Registry。最终 API 不接受 caller-supplied requiredEvidence、approved 布尔值、原始 outcome 或任意 reader JSON。

该能力由可信宿主配置，按 projectId/deliveryId/changeId 从已接纳 Run 存储选定唯一 archive 和其直接关联 review-apply。返回受控 Run 地址及 owner 的 admission/source 引用，而不是让普通 caller 随意指定 bytes。宿主用既有受控地址生成与 Run reader 实读这两个三文件记录，校验地址/身份、terminal、Author archive PASS、Reviewer approved、archive.previousRunId 指向该 review、context/result linkage，以及已接纳来源绑定的 exact bytes 引用。

归属/来源与结构校验分开：readDurableRun 结构合法不足以单独证明 admission；来源必须是已执行 Action 的 host 保存/接纳事实。既有宿主能力未提供这种来源时，返回 completion-source-unavailable，不由 Final 自签 hash 补齐。合成测试显式使用 fixture host，不宣称真正独立 Review。

选取集合始终来自 manifest required IDs，按 manifest 顺序；无来源、多个 terminal archive、仍有未完成工作与完成声明矛盾时报告具体 Change，不按目录最大号选。允许为定位所选 Change 检查其地址/终点元信息，不读取其他 Delivery 或重验全部祖先 proof。Action 自身链与 admission 规则不变；Final 不调用 resolveRunChain 重放全部历史，也不为每个旧 Run 重建 ActionPackage。

Final 的内存 changeCompletions 为 [{changeId,archiveRunId,reviewApplyRunId,archiveResultRef,reviewResultRef}]，只用于本次前后相关事实一致性校验；不嵌入完整三文件列表或整个 Run 链，不在 manifest 另存 accepted-completion 数据库。三文件实际完整性由 reader/来源能力核验。

替代方案：只看 completed 布尔值会丢失真实来源；全链 admission 重放会把外围变成第二审核器，二者均不采用。

### 3. Final 最小输入、落点和跨会话读取

公开 preparation input 沿用 deliveryId、ownerAuthority、flowkitHome；不再允许调用者提供 fullTestOutcome。host installation 与完成来源能力是宿主依赖，不在请求 JSON 中传入。Final authority 继续 exact singleton finalize-delivery/delivery-final。

Final operationFacts 固定为 projectId、coordinationPrestateRef、completedRequiredChangeIds、changeCompletions、fullTestAttempt、verifiedCandidateRef、fullTestExecutionRef。verifiedCandidateRef 继续表示 full-test-input ref，不是 Git candidate。current reader 必须通过，且 active OpenSpec set empty；Full Test reader 的配置、输入/材料完整性、当前失败不回用旧 PASS 规则原样复用。

只写现有 manifest：第一笔窄写将 delivery.state/finalizationStatus 改 completed，fullTestStatus 保持 passed，fullTestAttempt 保持原 current；finalization 段为 {state,ownerAuthorityRef,sourceRef,fullTestAttempt,verifiedCandidateRef,fullTestExecutionRef,confirmationRef}，confirmationRef 初始为 null。此时只是完成内容已写入，不是成功 Final。ownerAuthorityRef/sourceRef 来自本次实际授权；移除新写入的 gitCheckpoint 与重复 formalVerificationCandidate，不复制 outcome 或 changeCompletions，保留非目标 bytes。

Final record 固定为 projectId、deliveryId、ownerAuthorityRef、sourceRef、fullTestAttempt、verifiedCandidateRef、fullTestExecutionRef、deliveryFinalizationRef；只有 manifest 中 confirmationRef 等于重建的 deliveryFinalizationRef 才可返回该 record，不另存结果文件。confirmationRef 是本次成功确认的持久发布标记，不是 Owner 授权引用；其值不进入自身 projection，不含全 manifest hash、Git bytes 或祖先证据。

derive projection 顺序固定为 projectId、deliveryId、ownerAuthorityRef、sourceRef、fullTestAttempt、verifiedCandidateRef、fullTestExecutionRef；按该序 JSON，UTF-8、无 BOM/末尾 newline，前缀 flowkit-delivery-finalization + 0x00，SHA-256，输出仍为 delivery-finalization:sha256:<hex>。旧记录含旧字段的形状不当作新结果；本轮不重新签历史。

提供只读 readDeliveryFinalization(repositoryRoot,deliveryId)：从固定 manifest/project 核对 completed、delivery/fullTestAttempt 与 finalization 关联一致、以及 confirmationRef 精确匹配，才返回 completed 和 record；尚未进入 Final 返回 not-completed；完成内容存在但 confirmationRef 为 null/缺失/不符、或必要关联无法读回，返回 unconfirmed、record=null 和具体原因。无确认的旧形状不自动升级。reader 不写 confirmationRef，不从 Owner ref、自签 hash 或重新运行测试补造成功。

第一笔写入后的精确读回、相关完成来源、当前 attempt/输入与必要材料复验全部成功后，host 才准备第二笔仅将 confirmationRef 从 null 改为本次局部 ref 的窄写。第二笔发布前再次核对目标与本次已验证内容一致，并紧邻发布复核当前 attempt/输入；检测到 drift 则不发布。确认临时文件写入/flush 后的原子替换是成功确认提交点，之前任何失败/中断都没有可消费成功标记。这仍是同一次 Final 调用，不新增 Action 或审批。

确认提交点后只有标记读回/响应交付，不再追加决定本次 Final 是否成立的业务验收，以免重建同样的循环。正常读回返回 terminal；若确认可能已发布但响应/读回失败，返回未确认诊断且不自动重试，下一会话依磁盘实际标记区分：完整有效标记表示提交已成功、只是响应未知；无标记表示尚未确认。确认前的读回失败或输入 drift 永远不得走此成功分支。标记只说明提交时已完成验收，不证明未来代码永远未变；不引入连续监控或任意并发 writer 的强事务保证。

reader 与 Integration 只消费已发布的局部确认，不重放 Review 或 Full Test，不把临时 prestate hash 永久挂在资格上。相关事实在提交点之后被修改按实际后续操作处理，不回写或伪造当时执行结果。

### 4. 写入与失败边界

复用 source-range 编辑、同目录临时写入、flush、目标 bytes 再核对和 rename。临时文件不是 durable evidence，清理仅限本次自己创建的临时文件；不清理项目 .tmp 或历史 artifacts。

Start/Final 失败携带 mutationStatus=not-written/written-unconfirmed/unknown：明确未改业务目标才报告 not-written；内容已写但确认未发布，或确认已可能发布但未读回，报告 written-unconfirmed 并以 reason 区分 content-validation-failed 与 confirmation-readback-failed；无法确认是否替换则 unknown。失败返回 record/contentCompletion=null，不伪报本次 terminal。持久成功与否依上述 confirmationRef 提交点判断，不由这个返回 enum 决定。

Start callback 抛错可能已写入，host 应有界读回，不一律视为未写。Final 第一笔写后检查失败保留 completed 与 null confirmationRef，不回滚、不自动补确认；下一会话 reader/Integration 必须拒绝成功资格。确认发布后响应失败允许只读辨认已提交事实，不重新执行 Final。任何修改/重新 Final 都须按实际边界另行调用；不重开 Changes、不自动再测、恢复或补提交。

这是一次受控调用的失败诊断，不新增 persisted lifecycle enum、锁服务或事务日志；不声称处理任意多 writer 的强事务一致性。

### 5. Integration 同步直接消费，不保留虚假兼容字段

删除 deliveryFinalOutcome 全 package/requiredEvidence reader 参数，改由 host 从固定 target manifest 读取经 confirmationRef 确认的 Final record；preparation 与 Git mutation 前均要求 reader=completed，否则拒绝且不调用 Git callback，不由 Integration 补写确认或重复 Final 验收。request 仍显式绑定 Owner Git 操作、deliveryBranch、targetMainRef、acceptedBaseCommit 与 checkpointOperation。acceptedBaseCommit 仅为现有 Git 来源，不是 Start 或下一 Delivery SHA 准入；其余 Git 简化留下一 Change。

operationFacts/terminal projection 删除 finalizedCandidateRef，不添加同义 candidate ref；保留 deliveryFinalizationRef 与本次 Git prestate/实际 checkpoint/accepted-main。删除从 Final source/worktree/accepted object 重验 requiredEvidence、重建 Final 全包及比对 v2 内容的分支。

仍由 Git 和既有可信 acceptance source 核对实际 commit、明确 checkpoint 操作、目标 prestate 与实际接受关系。create-new 恰好一个普通 commit/parent/count/clean，reuse-existing 的已授权对象及 clean，暂按现行独立 Git 合同保留；不再用“内容等于 Final 全仓摘要”替代本次操作来源/对象核验。接纳必须来自本次 exact finalCommit 与 Owner 指定关系，不能仅接受 callback 的 SHA 或任意同内容 commit；无可验证来源则 STOP。这不是对最终代码验证的重跑。

Integration ref 的 projection 仅删除原 finalizedCandidateRef 槽，其他顺序为 deliveryId、deliveryFinalizationRef、preIntegrationHead、checkpointOperation、finalCommit、targetMainRef、targetMainPreIntegrationCommit、acceptedMainCommit；prefix 与 SHA 算法保持。golden vectors/closed validators 同步，旧形状不丢字段再签。

这一步是删除 Final 字段的必要闭包，不开发 PR API、Git 自动调度、新提交范围平台、宽泛 merge 策略或 native provider。Git 失败不撤销 Final，也不产生重开 Change 的权限。

### 6. Traceability 与 HOW

| 合同选择 | 已接受依据 | Apply 验证 |
| --- | --- | --- |
| Start 无 SHA/clean、保留目标冲突 | Explore Start proof；044 reminder 2 | 原生 unborn Git、dirty 对照、冲突/错目标/来源不符 |
| 有限 accepted completion 来源 | Explore Final；044 reminder 1 | 两个 required、缺失/歧义/错 Role/伪来源；不读取无关祖先 |
| 当前 Full Test 保持 | D05 已归档 Change4；现行 Full Test spec | 当前 FAIL/partial/材料损坏/输入 drift 拒绝，非产品追加允许 |
| 窄写、跨会话、写后失败 | writer proof；044 reminder 2 | 非目标 bytes、重读、rename 后故障注入 |
| Integration 删除字段闭包 | 源码消费者；044 reminder 3 | 新形状可消费、旧形状拒绝、Git authority/对象关系负例 |

Apply 同步 skills/delivery/start、final、repository-integration 的相关 HOW，以及 AGENTS 中确实受影响的内容；bootstrap aids 如有相应 Start/Final 文字仅独立修订，不让产品读取 .agents。不改写 archive/历史 Run，不调整 Full Test 配置来回避失败。

## Risks / Trade-offs

- 完成记录消费依赖可信宿主保存来源，而非防御拥有任意文件写入权的敌手 → 明确来源能力边界；缺来源拒绝，不建立签名基础设施。
- 取消外围全链重验不再为全部历史做审计 → Action owner 仍严格，Final 只验证其消费的终点；无关历史问题不变成全局 blocker。
- 写后失败可能留下 completed → null confirmationRef 将其与已确认成功区分；确认提交后响应未知只读核对，不自动回滚或续跑。代价是同一 manifest 的第二笔有界窄写，不新增结果库。
- 旧 API breaking → 同次修改所有直接消费者/导出/fixture/golden vectors；历史按历史类型读取，不迁移。

## Migration Plan

在本 Change Apply 内按 Start、有限 completion reader、Final、Integration 直接消费者顺序收敛，最终统一验证；不发布半兼容 dummy 字段。普通 target fixture 验收 Windows/Linux 与安装分根；本机 D05 继续独立 bootstrap。若实现需偏离本设计的来源/持久化边界，停止并回到计划修订，不新增平台。源码 650 行 gate 不变，超限按职责拆分。
