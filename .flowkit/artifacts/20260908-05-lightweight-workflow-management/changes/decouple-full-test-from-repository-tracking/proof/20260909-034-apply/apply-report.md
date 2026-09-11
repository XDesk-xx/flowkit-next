# 034 Apply 实现与验收交接

## 边界与结论

Author 根据 033-review-propose approved 执行 `decouple-full-test-from-repository-tracking`，projectOrdinal 36，当前物理分组 `004-...`。20/20 tasks 已完成；下一边界为独立 `review-apply`，不是 Archive、D05 Formal Full Test 或 Git 授权。

本次使用 OpenSpec Apply、implementation-convergence 与相关实现/安全/Skill HOW 约束：只实现已批准合同；按输入、存储、进程、结果读取职责拆分；bootstrap 与产品 HOW 独立。未建立新 Registry、CLI 写入口、Runtime/Policy/Run schema、自动 Reviewer 循环或外部 manager。

## 实现接点与任务对应

| 任务 | 实现 | 当前验收 |
| --- | --- | --- |
| 1.1–1.3 | `src/internal/full-test-input.ts`；固定 closed 配置、文件系统 inputs/exclude、实际 executable 流式摘要、声明环境与独立 inputRef | `full-test-input.test.ts`；无 Git、ignored 产品、配置错误、缺失/不可读/链接输入、环境漂移 |
| 1.4 | `config/verification/full-test.json`；9 个明确串行检查；真实 bootstrap/history 自检拆至 `tests/unit/bootstrap` | Linux 代码副本不含真实 .git/.agents/openspec/.flowkit/architecture，完整 9 项检查通过；历史自检另跑 9 项 |
| 2.1–2.5 | `full-test-storage/process/result/current.ts`；UUID create-once、窄写当前关联、原始流、真实结果、当前 reader | 发布/保存失败、输入漂移、旧 PASS 不回退、错归属/篡改/逃逸/链接拒绝、YAML 非目标 bytes、1 MiB 输出、spawn/signal；新进程及清除 .tmp 后读回 |
| 3.1–3.4 | 既有 Full Test API、operation facts、Final/current evidence、必要 Integration validator；普通 Action v2/reuse 保留 | 完整 domain 回归覆盖 Start、Action、Final、Integration；黄金向量按新 verifiedCandidateRef 域更新，finalized Git 投影不改域 |
| 4.1–4.3 | quality:gate 只聚合 format/lint；AGENTS、两套 Apply/revise-apply HOW；禁止入库检查独立 | `code-gate-boundary.test.ts`：格式/lint/651 行仍失败；历史 .bin/.mjs/raw stream 的 Git 空白诊断与代码 verdict 分开；HOW 条款核对 |
| 5.1–5.4 | README、任务状态、真实 Apply Run 与必要证据引用 | Linux 发行 API fixture；Windows 回归及最后修正的 targeted 复验；strict OpenSpec；文件规模、边界与 refs 核对 |

## 最终证据入口

- `linux-07/command.json`：无网络 Linux x64 glibc，Node 22.23.2，当前 lock 的 pnpm 11.22.0 offline/frozen 安装；不是镜像内旧依赖。`linux-07/linux-source.json` 记录仅复制的产品输入与无历史前提。
- `linux-07/linux-outcome.json`：已构建发行模块的实际 `invokeDeliveryFullTestOperation` 在合成 `apply-full-test-fixture` target 执行，9/9 配置检查通过。domain 282/282、acceptance 6/6、entropy tests 7/7，format/lint/typecheck/build/dependency/entropy 全部通过。
- `linux-07/linux-fixture/.flowkit/artifacts/apply-full-test-fixture/full-test/`：该实现 fixture 的原始 start、result、9 组 command/stdout/stderr；不是 D05 的 Formal Full Test attempt。Owner fixture 明确是合成测试输入，不产生真实 Owner authority。
- `linux-07/linux-readback.json` 与 `fresh-reader.stdout.txt`：当前结果有效、清除 fixture .tmp 后有效、独立 Node 进程重新读取有效。
- Windows `domain-05` 为完整 282/282 回归；其后仅修正大输出 fixture 退出时机和同步 spawn 异常捕获，`focused-final-02` 将全部 9 个 Full Test 入口测试重新运行通过。最终全部代码配置检查以 Linux `linux-07` 为主验收。
- Windows `acceptance-02` 6/6；`build-03`、`typecheck-04` 通过；`bootstrap-01` 独立 9/9；`openspec-02` strict 通过；四个 `skill-*-0*` 结构校验通过。
- `audit-06`：新增/修改 source/tests 最高 650 行；真实 D05 manifest 与 033 review 时 bytes 完全一致；未改历史 tracked Runs、Archify、.gitattributes、Policy/Run 源文件。673 行既有测试已按职责拆出 `delivery-guidance-contract.test.ts`，断言保留。

各 command.json 带实际命令、时间、退出状态及原始输出 bytes/hash；`evidence-index.json` 只索引本轮必要材料，不是产品 Registry，也不作为独立 PASS authority。

## 失败与修正均保留

- `domain-01`、`audit-02`、`entropy-02` 是沙箱子进程 EPERM；原命令在允许子进程环境重跑，不修改代码规避权限。
- `domain-02` 的旧 Final fixture/ref 黄金值/HOW 文案断言已随新合同修正；后续完整 domain 通过。
- `linux-01` 在环境中断后无完成记录，不能补造退出码；Docker 恢复后新建尝试。
- `linux-02` 核对发现镜像依赖不是当前 lock，拒绝复用；`linux-03` offline 缺策略 metadata，随后挂现有缓存成功 frozen 安装，未禁用策略或修改 lock。
- `audit-01` 揭示测试仍超行数，继续职责拆分；中间 lint 的未用 import 已清除。
- `linux-04/05` 在大输出断言处 SIGKILL，不能当 PASS。`stream-probe-01` 确认立即退出只刷出 146176 bytes，等待写回调能刷出完整 1048576 bytes。fixture 改为写回调后退出，字节断言保留且失败诊断不再展开巨大 Buffer。
- `linux-06` 发现 Linux 的同步 spawn ENOTDIR；补齐 process-failed 保存分类，`linux-07` 全部通过。executable 摘要采用流式读取，仍每次核对实际 bytes，不增加缓存。

## Owner 决定与 STOP

- 来源：本次 Owner `根据最新run，apply` / `继续 apply`；033 review 引用的既有 gate 授权、材料保留决定和当前分组决定随 context 交接，不复制全部聊天。
- 非产品历史空白不自动阻断 checkpoint，不重复补 attributes、不改历史；必要 proof 保存在当前项目 artifacts，.tmp 可丢弃。此前材料移动曾获 Owner 授权，不倒推为 Author 越权。
- 仅当前 Change 使用 `004` 分组；projectOrdinal 36 与 Run sequence 34 分开，历史不重命名。
- D05 始终 independent-bootstrap；candidate 只用于普通 fixture 验收，不接管 D05。不执行正式 D05 Full Test、Archive、Git add/commit/push/merge/tag，也不冒充独立 Reviewer verdict。
- Reviewer 从 033 accepted Proposal、034 实现与上述当前证据核对；不要求全部祖先 proof，不把 Explore 实验当实现 PASS。完成 Author 交接后 STOP。
