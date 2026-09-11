## 1. 有界上下文与三命令入口

依据：021-revise-explore / 022-review-explore approved。保留勾选仅表示 019 中原要求对应工作未被本次方向改变；不等于修订后候选验收。受影响任务以下列未勾选项重新核定，旧 25/27 清单保存在本次 proof 的 prior-plan/tasks.md；不补造 019 Result。

- [x] 1.1 实现 target/exact OpenSpec root 与 Delivery/Change 选择，复用 trusted coordination；用隔离 fixture 验证唯一 active、无 active、明确 planned/completed/cancelled、多个候选、缺 manifest/activation/dependency 与 root mismatch 的诊断。
- [x] 1.2 收敛 canonical previousRunId 链读取，移除对 prepared 的协议专属 invocationFailure 要求；测试唯一根/末端、Role/Policy 边、分叉/缺父/重复、prepared null outcomes、真实 terminal FAIL 与 Owner correction，不 max 选 current。
- [x] 1.3 核对空历史、partial/损坏、semantic bootstrap 与混合历史诊断；测试不忽略未完成、不迁移历史、不把 bootstrap 当 canonical，不读取其他 Change proof。
- [x] 1.4 从 request/entrypoint/foundation-cli 撤出 action 命令、transport 导入与错误帧，只留 status/next/doctor；测试旧 Run 参数迁移诊断、未知 action 非零退出、Policy blocked 保持正式结果及查询零写入。

## 2. Agent 真实记录与持久化直接接点

依赖 1；不引入产品写命令、会话服务或新的 Runtime/Run schema。

- [x] 2.1 依实际 import 撤出 action-command/action-protocol/action-run-reservation 及其专属测试，必要读取负向用例归回读取测试；通过类型检查和依赖/可达性确认没有空壳、伪消费或整套既有内核删除。
- [x] 2.2 对既有 complete-record writer 做最小修正：本次部分写入失败保留目录并报错，既有目录拒绝/sequence 唯一/完整 round-trip 不变；注入 context/result 写失败，验证原 bytes 与 partial 均不被清理。
- [x] 2.3 按 design 的 Agent 文件写入顺序准备可用 HOW 示例：受控新地址、exact package/Role、只读准备、action.md 开始、最终 context/result 只写缺项与读回；用既有发行校验器验证示例，不能仅调用旧 writer 或填终态 JSON。
- [x] 2.4 对该记录顺序做有界合成检查：准备阻断无执行、开始保存失败不做业务写入、开始后中断/保存失败可见、重复完成不覆盖、prepared/业务 FAIL 分开；明确合成记录不构成真人执行或独立 Review。

## 3. 必要材料与通用原始流

依赖 2；本组只包含当前实际生产/消费所需检查。

- [x] 3.1 从旧回交机制中收敛 proof/path 检查与 facts 示例，撤出无实际消费者的 action-proof/action-target-files；验证必要引用归属、真实路径/链接逃逸、regular/readable、size/hash/结果一致，旧 Run 无新增材料键仍可读。
- [x] 3.2 验证 Agent 在生成/接纳及相关消费边界保存和核对材料，必要材料不只在 .tmp，原始流保留 Buffer；测试查询不扫描 proof、无关历史不阻断 next、无必要材料不创建空目录。
- [x] 3.3 保留原 5.1 已实施的四条通用 raw-stream attributes 替代逐 Change 例外；既有 Git fixture 覆盖四种命名及跨 Delivery/Change/Full Test 路径、原始 bytes 与结构化文本负向控制，不 renormalize 历史、不联动 .gitignore。

## 4. 产品与 bootstrap HOW、直接说明

依赖 1–3；只改各文件相关条款，超出单文件 gate 时按职责拆分，不改 vendor mechanics。

- [x] 4.1 更新产品 explore/propose/apply 的 canonical HOW：撤出 JSONL，纳入 Agent Run 字段、实际开始/结束/未完成、必要材料及读回；用 2.3 的示例验证可以按已发行资产操作，不要求 target callback 或胶水工程。
- [x] 4.2 更新产品三个 revise 与 archive HOW 的对应条款；核对 exact Action/Role、同 package、既有 admission、一次 STOP，revise 不重做已收敛范围，archive 不新增审批。
- [x] 4.3 更新产品三个 Reviewer HOW：独立审查并记录自己的真实 verdict，携带相关 Owner 决定；验证不以 Author 自填 approved 代替 Review，不默认依赖全部历史 proof。
- [x] 4.4 独立核对并必要时修订 bootstrap 七个 Author 和三个 Reviewer HOW 的材料/交接/未完成说明；验证仍为 independent-bootstrap，不调用产品 HOW、不转换 D05 历史、不创建新审批。
- [x] 4.5 同步 README/AGENTS 的三命令和验收边界，并仅窄改 manifest 中本 Change 的宿主说明（scope.included 相关项、该 goal/首项 output）；读回证明 id/state/ordinal/依赖/Owner facts/其他 Changes 未变。

## 5. 修订后最小候选验收与交接

依赖 1–4；这些检查不是 Formal Delivery Full Test。

- [x] 5.1 在一个普通测试 target 完成一个有界真实 Author 工作及按 HOW 记录，使用本机同一 build 的独立查询进程读回正确 current/next，调用时不提供 Run 编号；保存实际操作证据，不要求第二套安装、第二个 Change 或制造 finding，不让 candidate 管理 D05。
- [x] 5.2 用明确标为合成的 fixtures 验证 review/revise/Owner correction 与负向链、未完成和跨进程读取；查询不得触发模型、Action、Reviewer、Git 或改项目。合成 approved 不作为正式审查。
- [x] 5.3 对新候选运行相关 Windows 原生读写/进程检查及 Linux fixture 回归；记录真实平台、不可适用限制与新结果，删除的 JSONL/PTY 矩阵不再是验收义务，保留适用安装/分根回归。
- [x] 5.4 执行 typecheck/build、domain/相关 acceptance、format:check/lint、dependency-health/entropy 与适用源码测试 gate；650 行含空行注释，超限拆分，不压行或放宽，不把旧 PASS 当新候选验收。
- [x] 5.5 使用 exact OpenSpec 1.10.0 strict validate，核对 Proposal/design/delta/tasks 与真实完成项；记录当前实现验收引用、相关 Owner 决定及限制，交独立 review-apply 并 STOP，不自动 Archive/Git。
