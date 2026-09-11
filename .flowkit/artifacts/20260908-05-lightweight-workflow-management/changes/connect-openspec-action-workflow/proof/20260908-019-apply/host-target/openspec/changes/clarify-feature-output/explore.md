# clarify-feature-output Explore

结论：PASS，已具备最小 Proposal 输入；不代表实现验收或 Reviewer approved。

范围为 `feature.mjs` 仅以单个 `--help` 参数调用时，stdout 精确输出 `Usage: node feature.mjs [--help]\nFixed description; not a health probe.\n`，stderr 为空、exitCode 为 0。无参数原有 `status: available\n`、空 stderr、exitCode 0 保留。其他参数及多参数组合不在此次目标内。

事实：canonical `feature-description` spec 仅约束无参数固定说明。现有程序没有参数分支；现有测试仅覆盖无参数。真实执行无参数和 `--help` 均得到 `status: available\n`，stderr 均为零字节，exitCode 均为 0。因此 `--help` 尚未满足需求，无参数现状满足原约定。

风险 → 问题 → 最小 proof：新增帮助是否改变无参数契约？读取 spec/source/test，并分别执行无参数与 `--help`，足以证明当前差异与必须保留的基线。无需新 parser、依赖、服务或健康检查。最小方向是在既有程序中区分单个 `--help`，未来 Apply 使用真实 Node 子进程检验两种调用的精确字节与退出状态。

证据位于 `.flowkit/artifacts/host-acceptance/changes/clarify-feature-output/proof/20260908-001-explore/`：`capture.mjs`、`commands.json`、`no-args.*.txt`、`help-baseline.*.txt`、exact OpenSpec version/list/scaffold/status 流。原始 stdout/stderr 保存为 Buffer；这些是 Explore 基线与 scaffold 证据，不能当作未来实现 PASS。

OpenSpec 1.10.0 已真实创建 `.openspec.yaml`。只存在一个 Delivery manifest，已有唯一有效 ordinal 1；当前 Change 首次分配 projectOrdinal 2。该编号不同于当前 Run sequence 1 与物理 Run-group 前缀 001。

假设/限制：只研究已明确的单个 `--help`；不新增其他参数、通用 CLI、外部状态查询、Flowkit 生命周期能力或异常参数契约。没有剩余会改变此最小契约的 unknown；未执行实现或新测试，也未生成 Proposal/design/tasks。

Owner 边界引用 `acceptance-fixture:approved-task-6.2:owner-apply-input`：这是隔离验收合成 activation 前提，不是实际项目授权。必要 proof 默认长期保留在 target；不接管 D05。终止于 `review-explore`。
