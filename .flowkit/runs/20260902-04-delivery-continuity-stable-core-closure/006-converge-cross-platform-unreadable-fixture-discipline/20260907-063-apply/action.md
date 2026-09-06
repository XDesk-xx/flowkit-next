# Action — Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: apply
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-063-apply
input: 20260907-062-review-propose
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Verdict: **PASS — approved test-only correction complete**.

## Implementation

本次 Apply 只修改批准的三个 test-only 文件：

```text
tests/unit/domain/unreadable-guidance-fixture.ts
tests/unit/domain/action-guidance-execution.test.ts
tests/unit/domain/delivery-operation-execution.test.ts
```

新增的 shared fixture 在 Windows 上通过无 shell 的 `whoami.exe` 取得当前
SID，并仅对 caller-created temporary root 内的 exact Guidance file 使用
`icacls.exe /deny *SID:(RD)`。进入 resolver assertion 前，会证明目标仍是
root 内的 regular non-symlink file、`realpath` 成功，并且 direct `readFile`
真实返回 `EACCES`/`EPERM`。`finally` 删除 exact deny ACE、验证原 bytes 可读，
再清理 temporary root；restoration/cleanup 失败会报告 retained exact path。

POSIX non-root 继续用 `chmod(0o000)` 证明真实 denied read；Linux root 的既有
low-privilege child enforcement path 未改变。两个 resolver assertion 均不再有
capability-bound `t.skip()`。

## Gate / size boundary

```text
tests/unit/domain/unreadable-guidance-fixture.ts          207 lines
tests/unit/domain/action-guidance-execution.test.ts      231 lines
tests/unit/domain/delivery-operation-execution.test.ts   618 lines
eslint hard max-lines gate                               src/**/*.ts, 650 lines
src/** mutation                                          NONE
```

没有文件超过其 applicable hard line gate，因此没有为了拆分而增加额外抽象；也
没有修改 gate、添加 waiver 或 skip。若适用文件超过 hard threshold，必须先拆分。

## Exact verification

```text
Native Windows focused Guidance       19/19 PASS, 0 skipped
Native Windows Domain                241/241 PASS, 0 skipped
Native Windows Acceptance              5/5 PASS, 0 skipped
Linux focused Guidance                19/19 PASS, 0 skipped
Linux Domain                         241/241 PASS, 0 skipped
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
OpenSpec tasks                         13/13 complete
```

Windows focused/Domain completion proves the two ACL-backed resolver assertions
executed, the deny ACE was removed, exact bytes became readable again, and no
fixture temporary root remained. Linux completion proves both assertions executed
and preserves the root low-privilege denial path.

Linux verification used exact OpenSpec `1.10.0` from
`openspec-runtime-1.10.0:latest` plus exact Archify `2.15.0`; OpenSpec `1.7.0`
was not mounted, resolved, or executed. The first offline frozen install attempt
reported `ERR_PNPM_NO_OFFLINE_META` for a missing cache entry. The final isolated
run used the unchanged current `pnpm-lock.yaml`, completed frozen installation,
and passed all named suites. A preliminary `pnpm exec prettier` launcher lookup
failed on Windows; the repository-local Prettier entrypoint formatted only the new
helper, after which the formal format/lint gates passed.

## Boundary

The Change has `skip_specs: true`, no delta spec, no `src/**` or dependency/tool
lock mutation, no post-archive task, and no new Core/platform/verification
subsystem. No external Flowkit manager was used and the candidate CLI was exercised
only as an Acceptance test target, never as lifecycle authority.

Next boundary: `review-apply`.

STOP.
