# Action — Revise Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: revise-apply
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-065-revise-apply
input: 20260907-064-review-apply
priorApply: 20260907-063-apply
finding: D04-RA006-001
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Verdict: **PASS — D04-RA006-001 resolved**.

## Classification

`D04-RA006-001` 是 approved contract 内的 implementation defect。Proposal
要求 setup、assertion、restoration、cleanup 全部 fail closed；不需要修改
Proposal、Design、Tasks 或 canonical spec。

## Minimum correction

修正仍严格限制在批准的三个 test-only 文件：

```text
tests/unit/domain/unreadable-guidance-fixture.ts
tests/unit/domain/action-guidance-execution.test.ts
tests/unit/domain/delivery-operation-execution.test.ts
```

Shared helper 现在先完成 bounded safe-path validation，再通过
`onCleanupOwnershipTaken` 显式通知 caller 已接管 cleanup；Windows SID discovery
随后在 helper 自己的 failure lifecycle 内执行。结果是：

```text
safe-path validation fails
→ ownership 未转移
→ caller 清理自己创建的 root

safe-path accepted
→ helper 接管 cleanup
→ SID/native setup、mutation、assertion、restoration 任一失败
→ helper 删除 accepted root
→ 若 restoration/cleanup 无法完成，报告 retained exact path
```

新增 native-Windows regression 将 child-command search path 置空，真实触发
`whoami.exe ENOENT`。Observed proof：ownership 已转移、resolver callback 未执行、
helper 返回原 setup error，accepted temporary root 随后为 `ENOENT`。测试自己的
`finally` 只负责恢复环境与失败情况下的 proof-fixture hygiene。

原有 current-SID `RD` deny、无 shell argv invocation、ACL removal、exact-byte
read recovery、两个 real resolver assertions、POSIX/root low-privilege proof 和
zero unreadable-fixture SKIP 均保留。

## Gate / size boundary

```text
tests/unit/domain/unreadable-guidance-fixture.ts          211 lines
tests/unit/domain/action-guidance-execution.test.ts      269 lines
tests/unit/domain/delivery-operation-execution.test.ts   620 lines
eslint hard max-lines gate                               src/**/*.ts, 650 lines
src/** mutation                                          NONE
```

没有文件超过 applicable hard line gate，没有调整 gate、添加 waiver，或引入
generic process/filesystem abstraction。

## Exact verification

```text
Native Windows focused Guidance       20/20 PASS, 0 skipped
Native Windows Domain                242/242 PASS, 0 skipped
Native Windows Acceptance              5/5 PASS, 0 skipped
Linux focused Guidance                20/20 PASS, 0 skipped
Linux Domain                         242/242 PASS, 0 skipped
Linux Acceptance                       5/5 PASS, 0 skipped
OpenSpec current strict                    PASS
OpenSpec all strict                    23/23 PASS
Typecheck                                  PASS
Build                                      PASS
Format                                     PASS
Lint                                       PASS
Forbidden tracked artifacts                PASS
Dependency health               81 modules / 365 dependencies / 0 violations
Entropy tests                          7/7 PASS
Repository entropy              40/40 production modules reachable
git diff --check                           PASS
temporary fixture roots remaining              0
```

Linux detached proof 使用 exact OpenSpec `1.10.0` 和 Archify `2.15.0`；未使用
OpenSpec `1.7.0`。No external Flowkit manager was used，candidate CLI 仅作为
Acceptance test target，不是 lifecycle authority。

没有修改 `src/**`、OpenSpec planning/canonical specs、dependency/toolchain、Core
status/evidence model 或其他 subsystem。

Next boundary: `review-apply`.

STOP.
