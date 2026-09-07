## Context

两个 unreadable-Guidance tests 需要证明同一产品语义：canonical regular non-symlink Guidance file 在真实读取失败时，resolver 返回 `null`。POSIX `chmod(0o000)` 可配合现有 low-privilege child mechanics 建立该条件；native Windows/NTFS 不遵循相同 mode-bit enforcement，因而需要不同的 fixture mechanic。

Native-Windows focused proof 已验证：对新建临时 Guidance file 的当前用户 SID 设置 `RD` deny ACE 后，`lstat` 和 `realpath` 保持成功，`readFile` 立即以 `EPERM` 失败，Action 与 Delivery 两个真实 resolvers 均返回 `null`；移除该 ACE 后读取恢复，完整 lifecycle 连续执行 `5/5 PASS`。Exclusive `FileShare.None` prototype 虽能产生 `EBUSY`，但出现超过 30 秒的阻塞，不适合作为确定性 unit-test fixture。

Canonical `formal-full-test-execution-and-correction` 已要求 platform-specific mechanics 证明同一 obligation，并对跳过该 obligation fail closed。本 Change 因而是 test-only correction，不修改 canonical spec。

## Goals / Non-Goals

**Goals:**

- Native Windows 对两个 unreadable-Guidance cases 建立真实 read denial 并执行 resolver `null` assertions，相关 fixture zero SKIP。
- POSIX/root 保留现有真实 permission-denial enforcement proof。
- 两处测试共享一个小型、边界明确的 test-only Windows ACL helper。
- ACL setup/restoration/cleanup 与 native-Windows proof fail closed。
- Corrected exact candidate 取得 fresh Windows 与 Linux proof。

**Non-Goals:**

- 修改 production Guidance resolver 或增加 production Windows branch。
- 修改 canonical product specs。
- 建立 generic ACL/filesystem abstraction 或引入 production `icacls` dependency。
- 增加 `ApplicableCheckStatus=skipped`、skip registry、evidence database 或 cross-platform result store。
- 执行 Archive、Git checkpoint、Formal Full Test、Architecture Finalization、Delivery Final 或 Repository Integration。

## Decisions

### 1. Preserve the existing canonical requirement

本 Change 使用 `.openspec.yaml#skip_specs=true`，不保留 superseded MODIFIED delta。不同平台可以选择不同 fixture mechanics，但不得选择是否执行 semantic obligation。

```text
POSIX permission denial
or
native-Windows ACL read denial
↓
direct read genuinely fails
↓
real resolver executes and returns null
```

### 2. Use a shared test-only Windows ACL helper

两处 tests 共享一个位于 `tests/**` 的小型 helper。它只接受由当前 test 新建的 temporary root 与其内部 exact Guidance file；在任何 ACL mutation 前验证目标 real path 仍位于该 root 内，且不得接受 repository-owned 或任意 caller path。

Windows path SHALL：

1. 通过 native process 获取 current user SID，不依赖 localized account name；
2. 以 argv 方式直接调用 `icacls.exe`，不得使用 shell；
3. 仅对 exact temporary Guidance file 增加 current-SID read-data (`RD`) deny ACE；
4. 要求 command 正常启动、exit code 为 `0`；
5. 要求目标仍是 regular file、`realpath` 仍在 temporary root 内，且 direct `readFile` 以 permission outcome 失败；
6. 在该状态内执行调用方提供的真实 resolver assertion；
7. 在 `finally` 中从同一 exact file 移除 current-SID deny ACE，要求 exit code 为 `0`；
8. 证明 normal read access 已恢复，再删除 temporary root。

Helper 对 setup、assertion、restoration 与 cleanup 分别报告 exact failed operation 和 process outcome。不得解析 localized `icacls` prose 来推断成功；以 spawn outcome、exit code 和 Node read behavior 为准。

### 3. Preserve POSIX/root enforcement

POSIX 非 root path 可在 actual read probe 确认 denial 后执行 resolver assertion。Root runner 保留既有 `uid/gid=65534` low-privilege child proof；parent process 可读取文件不构成跳过理由。两条 POSIX path 都不得调用 `t.skip()`。

### 4. Keep product and Core bytes outside the correction

现有 production resolvers 已对 `readFile` failure 返回 `null`。Apply 只获得 test fixture/helper mutation authority，不修改 `src/**`、Core status/evidence model、process adapter 或 canonical specs。

### 5. Verification is pre-archive; lifecycle continuation is not a task

Apply/Review 必须在 archive 前取得 corrected bytes 的 focused、Domain、Acceptance 与工程 gate proof。Native Windows focused/Domain evidence 必须证明两个 unreadable cases 实际执行并保持 zero unreadable-fixture SKIP。

Tracked test mutation 使 prior Formal Full Test evidence 对新 candidate 失效；Archive、Owner-authorized checkpoint 与 Formal Full Test restart 在本 Change 完成后由各自 authority 决定，不写入 active Change task。

## Risks / Trade-offs

- **ACL cleanup failure:** deny ACE 可能保留在临时文件上。Helper 必须在 `finally` 中恢复，并在失败时报告 retained exact temporary path；不得将 repository path 作为目标。
- **Restricted Windows environment:** sandbox 或 policy 可能拒绝 DACL mutation。该结果使 native-Windows verification fail closed，不转换为 SKIP。
- **SID/localization:** account name 和 command prose 可能本地化。身份使用 SID，command success 使用 process outcome/exit code，semantic success 使用 Node read behavior。
- **Process termination:** 外部强制终止可能绕过 `finally`。Unique OS temporary root 限制影响范围；正常 test cleanup 仍必须验证恢复后再删除。
- **Platform branching:** `process.platform` 只用于选择 fixture mechanic，不用于跳过 obligation。

## Validation Plan

Apply/Review 至少证明：

```text
native Windows focused Guidance tests → successful; both target assertions execute; zero unreadable-fixture SKIP
native Windows Domain / Acceptance    → successful; no unexplained failure
Linux focused Guidance tests          → successful; target assertions execute; zero unreadable-fixture SKIP
Linux Domain / Acceptance             → successful; no unexplained failure; root proof retained
OpenSpec current Change --strict      → PASS
OpenSpec --all --strict               → PASS
typecheck / build / format / lint     → PASS
dependency health / entropy / forbidden artifacts → PASS
git diff --check                      → PASS
```

Apply evidence SHALL record the actual observed suite totals and target-test
outcomes for that exact candidate; current repository cardinalities are not
normative acceptance constants.

Focused proof 还必须确认：

- Windows `lstat` / `realpath` 成功且 direct read 确实失败；
- 两个 real resolver assertions 都执行而非跳过；
- deny ACE 移除后 normal read 恢复；
- ACL setup、restoration 或 cleanup failure 不会产生 PASS/SKIP；
- production resolver 与 canonical spec bytes 不变。
