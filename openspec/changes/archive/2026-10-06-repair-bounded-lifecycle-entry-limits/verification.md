# Apply verification

日期：2026-10-05。直接 OpenSpec Apply；当前 Change 没有 Flowkit Delivery/Run 或独立 Reviewer verdict。本文件仅汇总实际执行的实现验证，不创建 Runtime/Owner authority。

## 已实现范围

- E01：已解析的三个 Git 命令选择 1,048,576 bytes，默认请求与内部 JSON 仍为 65,536；文件/stdin 按实际 Buffer bytes 有界读取，安全 budget 诊断及 help 同步。910 路径请求进入原业务授权核对，新额度不改变 exact paths/index/blob/提交后规则。
- E02：六种 ordinary Author terminal FAIL/null 只经 exact Owner revise-action、reached-stage 和原 readiness 进入新修订。三个失败 revise 同名采用窄结构边；内核、start/inspect/finish/chain 绑定直接失败 parent/Owner/唯一 occurrence，旧三文件不变，新 PASS 重新进入自己的 Review。
- E03：仅 canonical product first Explore 无 baseline 时核对 initialized project、全部 coordination/activation、唯一 OpenSpec active、Run/proof/archive；fresh 返回候选 1，入口不写编号。descriptor-only/proof continuation 仍可重检；实际 HOW 重读 manifest bytes/eligibility 并窄写，terminal Explore PASS 与持久编号核对；未编号真实 FAIL 保留，Owner correction 不绕过 readiness。bootstrap HOW 只澄清边界，保留原无 baseline Owner 决定。
- E04：共享 facts DFS nodes=4,096，bytes=65,536、depth=16；caller 与生成 candidateGit 后均在 machine 首写前诊断。生成后的 byte/node 超限保留 descriptor/proof；真实修正可同 Run 完成；较大 absent/entry 候选通过共同 finish/readback/Review/Archive admission。

## 实际命令与结果

| 检查                        | 命令/结果                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                  | pnpm typecheck：PASS                                                                                                                                              |
| Build/package build         | pnpm build、pnpm pack --pack-destination .tmp/bounded-apply-package（含 prepack build）：PASS                                                                     |
| 完整 domain                 | node --import tsx --test --test-concurrency=4 tests/unit/domain/*.test.ts：473 项，470 PASS、3 SKIP、0 FAIL                                                       |
| 最新容量补充                | node --import tsx --test --test-reporter=spec tests/unit/domain/bounded-json-input.test.ts：6/6 PASS（补充最新 file/stdin caller-facts 与 envelope machine 诊断） |
| Guidance                    | author-action-guidance.test.ts + action-guidance-execution.test.ts：17/17 PASS                                                                                    |
| Acceptance                  | pnpm test:acceptance：7 PASS、1 SKIP、0 FAIL                                                                                                                      |
| Bootstrap                   | pnpm test:bootstrap：9/9 PASS                                                                                                                                     |
| Formatting/lint             | pnpm quality:gate：PASS                                                                                                                                           |
| Dependency health           | pnpm quality:dependency-health：PASS，232 modules / 1,539 dependencies，无违规                                                                                    |
| Entropy                     | pnpm test:entropy：7/7 PASS；pnpm quality:entropy：102/102 production modules reachable                                                                           |
| Owned source                | pnpm quality:owned-source：2/2 PASS                                                                                                                               |
| Forbidden tracked artifacts | pnpm check:forbidden-tracked-artifacts：PASS                                                                                                                      |
| Git whitespace              | git diff --check：PASS；未 stage                                                                                                                                  |
| OpenSpec                    | exact managed OpenSpec 1.10.0 validate repair-bounded-lifecycle-entry-limits --strict：PASS                                                                       |

初次完整 domain 的唯一失败是 Explore HOW 的旧文字断言未找到 persist it exactly once。恢复一次性持久化措辞后 Guidance 17/17 PASS，最终完整 domain 0 FAIL。fresh 对抗测试中的空目录清理曾使用 rm，已改为 rmdir，并在 source 完整回归/安装版重放中通过。没有剩余未关闭失败。

平台跳过项保留原条件；这里不声明额外 native Windows 或 detached Linux whole-manager acceptance，也不是正式 Delivery Full Test。测试中的历史/Reviewer verdict/Owner facts 均为隔离 synthetic fixtures，不构成当前 Change 的独立 Review。验证脚本未导入本 Change 的 Explore probes/observations。

## 隔离安装

使用 pnpm --dir .tmp/bounded-apply-manager install --force --ignore-workspace --offline --ignore-scripts 安装同一 tarball；该目录只用于候选验收。

- 包：flowkit-next@1.0.0。
- tarball SHA-256：b77e44c2154133ca59c27ef7eb72c0199a7c743717f79af1b1553a0ef9225ef9。
- 137 个 dist/Guidance/docs/lock 发行文件与当前 build 原 bytes 一致；CLI 从安装自身定位 Guidance 和 toolchain。
- FLOWKIT_APPLY_TEST_ENTRY 指向隔离安装的 dist/cli/entrypoint.js。四个独立构造的容量/failed-author/fresh/generated-facts 测试文件：初次最终组合 30/30 PASS；最新容量文件 6/6 PASS（新增 1 项），最新实际修改候选与新 Review descriptor 的 correction 文件 3/3 PASS。31 个当前安装用例全部通过。
- 实际跨进程 start → Author 工作 → inspect → finish → next/readback 覆盖六个失败来源和三个同名 revise；旧 bytes、新直接失败 parent/Owner、竞争/漂移拒绝及新 Review binding 均核对。
- Git checkpoint/push/integrate >64 KiB、1 MiB 拒绝和默认 64 KiB；fresh 首次 Explore/proof/持久 ordinal/失败前置；生成后超限与较大 absent/entry 候选，共用同一 installed build。

当前 external stable manager D:/tools/flowkit-manager/node_modules/flowkit-next 未替换；未更新真实本地 manager。

## 七项 delta 与实现核对

| Delta                                     | 主要实现/证据 seam                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| foundation-cli-surface                    | request.ts / request-input.ts / entrypoint.ts；bounded-json-input.test.ts                                           |
| policy-and-next-boundary                  | Policy exact FAIL 分支与 shared correction guard；policy-owner-correction / failed-author-lifecycle                 |
| action-lifecycle                          | 窄 reviseFailedTerminalAuthor，普通 terminal prepare 仍拒绝；failed-author-core                                     |
| single-action-execution-terminal-boundary | 封闭内部 failureSource、target prepared context/Owner/parent/sequence，失败 preparation 不发布；failed-author-core  |
| stable-action-command-execution           | start/inspect/finish shared guard 与原 chain Policy；project-ordinal / fresh-first-explore / generated-facts-budget |
| author-action-guidance                    | 发行六个 Author HOW、onboarding、Git host HOW；independent bootstrap 仅边界澄清                                     |
| run-result-persistence                    | 共享有界 facts measurement/validator，无历史回写；生成后诊断与实际较大候选读回/消费                                 |

## 交付边界

main / HEAD=96179b50b70a7582e264a7af111436d3ca52f788；当前 index 未 stage。只修改本 Change、直接相关 src/tests/Guidance/onboarding/bootstrap HOW；主 specs、历史 archive、Delivery manifests、.flowkit Runs/proof、toolchain lock 与 dependencies 未改写。没有新增 command/state/registry/seed/dependency。

Apply 候选完成后 STOP。独立 Review、Archive、checkpoint/push 与真实 manager 更新仍在后续独立授权边界。
