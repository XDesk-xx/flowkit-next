## 1. 目标与真实上下文解析

依赖：已批准 Proposal；入口范围为 CLI/context 及相应 fixture，每项预期 2–5 个直接文件。以下校验点不是新增审批或 Git checkpoint。

- [x] 1.1 实现 target/exact OpenSpec root 与 Delivery/Change 选择，复用 trusted coordination；用隔离 fixture 验证唯一 active、无 active、明确 planned/completed/cancelled、多个候选、缺 manifest/activation/dependency 与 root mismatch 的诊断。
- [x] 1.2 实现所选 Change canonical group 和 previousRunId 链解析；用现有 reader/Policy 验证根/末端/Role/合法边，测试目录重排、高号无关根、分叉/缺父/环/duplicate sequence、Owner correction 与 prepared 失败续接，不取 max 作为 current。
- [x] 1.3 支持首次 Explore 的空历史、只读 bootstrap-history 及 partial/unknown history 诊断；验证已有历史缺失不能变 idle、混合 bootstrap 不自动转换、其他 Change 无关原始 proof 不被遍历。
- [x] 1.4 更新 status/next 请求及 entrypoint 直接消费者，拒绝旧 Run 参数、保留 doctor/checkpoint evaluator；通过 CLI fixture 验证不填 Run 编号、新输出状态、原 Policy blocked/权限语义和无写入。

## 2. 单次 Run 占用与失败保留

依赖：1.2；范围为 Run persistence、必要内部接缝和定向测试，按职责拆分而非堆进现有大文件。

- [x] 2.1 增加仅本次存活 invocation 持有的内部 reservation：受控目录和 action.md 在派发前 create-once；测试完整/partial sequence 冲突、非法路径、占用失败不派发，原三文件 writer/reader round-trip 不退化。
- [x] 2.2 实现同一 reservation 的 context/result 缺失文件一次写入与读回，移除该执行路径的 catch-rm 清理；注入 context/result 写失败，验证已有 partial 保留、旧 bytes 不覆盖、第二 invocation 不能接管补写。
- [x] 2.3 保存实际 EOF/协议拒绝后的 prepared failure 三文件及 null outcome 槽；测试新会话识别失败、明确同 Action 再次调用创建新 occurrence、强制中断/partial 不回退旧 PASS、完整 terminal 响应丢失不重演。
- [x] 2.4 技术校验点：执行上下文、Policy、single-action、persistence 相关定向回归及 `pnpm typecheck`，确认没有新 lifecycle state/第四 Run 文件/自动重试，结果按实际执行记录。

## 3. 必要 proof 与相关交接

依赖：1.2、2.1；范围为内部 proof/结果接缝与专属 fixture，不建设平台。

- [x] 3.1 定义并校验设计固定的 facts.proofRefs、handoff、入口保留 invocationFailure；测试新字段形态、existing facts/Verification 保留、大小限制与 host 伪造保留键被拒绝，旧 canonical Run 可读。
- [x] 3.2 实现 target 内本次必要文件和前序声明引用的有界消费；测试 realpath/父目录归属、symlink/junction 逃逸、非 regular/unreadable、缺失、hash/size/错误 Change、重复冲突路径；不得用哈希替代语义真实性。
- [x] 3.3 接通 producer 的必要材料保存/回交纪律；隔离 fixture 验证原始 Buffer bytes、create-once、删除自有 `.tmp` 后仍可读、保存失败不接纳、无必要 proof 不创建空目录、无关历史增长不触发全量 proof 扫描。

## 4. 真实交互宿主单次入口

依赖：1–3；范围为最小 JSONL transport、entrypoint/single-action 组合与测试，每项只改直接依赖。

- [x] 4.1 实现 `flowkit action --input <path>` 的 closed 请求/帧协议及 machine errors，保留 stdout 协议/stderr 诊断；测试 prepare/execute 同 package、错帧/错序/重复、EOF、超限输入、非法 Role/Action 在派发前拒绝。
- [x] 4.2 组合只读 host preparation、持久占用、一次 execution、必要 proof 校验及 exact admission；测试 preparation blocked 保留原 current、无 preparation Run、Guidance identity/manager-target 分根、ordinary Action 无额外 Owner 关卡。
- [x] 4.3 组合最终 Policy 一致性、写入读回和完成报告；验证错 next 被拒绝、真实业务 FAIL/changes-requested 不伪装 PASS、archive 使用真实 completed 读回、写失败不输出 terminal、没有自动下一步或 Git mutation。
- [x] 4.4 技术校验点：运行 CLI/transport/证据/持久化集成回归和 `pnpm typecheck`、`pnpm build`；核对发行安装可运行，不需要 target callback/glue scripts/开发依赖，不声称这些合成回归等于真实宿主验收。

## 5. 一次性原始流规则与独立 HOW

依赖：3 的命名和 4 的协议已固定；这部分必须在本 Change 完成，不推迟到 Git Change。

- [x] 5.1 在 `.gitattributes` 用四条通用 raw-stream 模式替代逐 Change 八条例外，其他模式不变；隔离 Git fixture 验证跨两个 Delivery/Change 的四种命名及 Full Test 路径形态原始 bytes 保真，源码/Run JSON/人工摘要仍触发空白错误，历史日志不 renormalize。
- [x] 5.2 更新产品 explore/propose/apply 的各自 canonical HOW，只纳入本协议、必要 proof 与相关 Owner 交接；定向 Guidance 测试验证 identity 随实际规范文字变化、无新增公共 normative graph。
- [x] 5.3 更新产品三个 revise HOW 及 archive HOW 的相同直接条款，保留各自批准范围/preparation/STOP；验证 revise 不重做已收敛工作、archive 不新增授权关卡、必要材料不混入 Run。
- [x] 5.4 更新产品三个 Reviewer HOW，明确独立审查、必要相关引用和“未收到说明不等于未授权”；验证没有 Author 自审/自动下一步或历史 PASS 代替当前验收。
- [x] 5.5 独立更新 bootstrap explore-proof-based/proposal-convergence/implementation-convergence 中受影响的材料/原始流交接条款；检查不读取/委托 candidate HOW，不改为调用新 product action。
- [x] 5.6 独立更新 bootstrap revise-explore/revise-propose/revise-apply/archive 的对应条款；检查不强制逐 Change attributes 修改，不改变 OpenSpec vendor mechanics 或历史 Run。
- [x] 5.7 独立更新三个 bootstrap Reviewer HOW 与 AGENTS 当前 CLI/目录/文本说明；定向核对 D05 仍 independent-bootstrap、两套 HOW 不相互读取、`.gitignore`/Full Test/Archify 范围未变。

## 6. 真实接入与完整候选验收

依赖：1–5；工作位置是隔离 target，必要验收材料保留在本 Change proof，不用 candidate 管理 D05 自身。

- [x] 6.1 从实际发行包建立分根安装，以既有交互宿主真实完成第一个隔离 OpenSpec Change 的 Author/独立 Reviewer Action 链并归档；保存真实工作/回交/Run 证据，不以回显脚本或预制 approved 替代独立审查。
- [ ] 6.2 以同一实际支持方式完成第二个隔离 Change，包含真实 finding → revise → 独立复审；在中途换新会话且不提供 Run 序号续接，读回每次三文件与准确 Role/合法边，确认不要求每步 commit。Reviewer/宿主不可用则验收未完成，不勾选。
- [x] 6.3 针对已实现入口执行 Windows 原生进程/终端失败矩阵和 Linux x64 fixture 回归：EOF、强制中断、缺失/损坏材料、写入失败、响应丢失、无下一 Action；分别记录平台与证据，simulation 不充当 native PASS。
- [x] 6.4 执行 `pnpm test:domain`、相关安装 acceptance、typecheck/build、format:check/lint、dependency-health/entropy 和适用源码 gate；650 行含空行注释，超限按职责拆分，不压行/放宽；这不是 Formal Delivery Full Test。
- [ ] 6.5 用 exact OpenSpec 1.10.0 执行本 Change strict validation，复核 proposal/specs/design/tasks 一致与所有任务真实完成；保存当前候选验收引用和必要 Owner 决定，交独立 `review-apply` 并 STOP，不自行 Archive/commit/push。
