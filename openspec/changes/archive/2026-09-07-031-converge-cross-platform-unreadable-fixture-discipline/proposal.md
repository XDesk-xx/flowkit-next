## Why

D04 closure hardening 在 native Windows/NTFS 上暴露出两个既知 unreadable-Guidance fixture 问题：`chmod(..., 0o000)` 不能在该环境中制造真实 read denial，当前 superseded implementation 因而将两个 semantic assertions 记为 `SKIP`。Production Guidance resolvers 已经以真实 `readFile` failure 为准 fail closed；缺陷位于 test fixture，而不是产品行为。

Canonical `formal-full-test-execution-and-correction` 已允许不同平台使用不同 fixture mechanics，同时禁止因平台差异跳过或弱化同一 semantic obligation。因此本 Change 不修改 canonical requirement；它只用 native-Windows 可执行的临时文件 ACL fixture 替换 capability-bound SKIP，使 Linux 与 Windows 都运行真实 resolver assertions。

## What Changes

- 增加一个由两处测试共享的小型 test-only unreadable-file fixture helper：
  - POSIX 保留现有真实 permission-denial mechanics，包括 root runner 的 low-privilege child proof；
  - native Windows 对新建临时 Guidance file 使用当前用户 SID 和 `icacls.exe` 设置 read-data (`RD`) deny ACE；
  - Windows fixture 必须保持 `lstat` / `realpath` 成功、使 direct `readFile` 以 permission outcome 失败，并实际执行 resolver `null` assertion；
  - ACL setup、semantic assertion、ACE restoration 或 cleanup 任一失败都使测试失败，不允许 `t.skip()` 或 fabricated PASS。
- 只替换以下两个测试中的 superseded capability-bound-SKIP 分支：
  - `tests/unit/domain/action-guidance-execution.test.ts`
  - `tests/unit/domain/delivery-operation-execution.test.ts`
- Production Guidance resolver bytes 保持不变，除非后续独立 proof 发现新的 product defect；当前 Proposal 不提供该 mutation authority。
- Corrected candidate 必须取得 fresh native-Windows focused/Domain proof，且 unreadable fixtures 为 zero SKIP；同时保留 fresh Linux Domain 和 Linux/Windows Acceptance proof。
- Tracked test correction会形成新 exact candidate。Archive、Owner-authorized Git checkpoint和后续 Formal Full Test restart仅作为完成本 Change后的 continuation facts，不属于本 Change tasks。

## Capabilities

### New Capabilities

无。本 Change 是 project-local test fixture correction；`.openspec.yaml` 使用 `skip_specs: true`。

### Modified Capabilities

无。Canonical platform-fixture requirement 已完整表达不同 mechanics、同一 semantic obligation 与 no-skip/fail-closed boundary，不需要 delta spec。

## Impact

- 预计修改范围：一个由两处 domain tests 共享的 test-only helper，以及上述两个既有 tests。
- 预计不修改：`src/**`、canonical `openspec/specs/**`、Core check/evidence status、Full Test terminal facts、process adapter、production dependencies 与 runtime toolchain。
- 不新增 generic ACL/filesystem abstraction、skip registry、evidence database、platform lifecycle、新 candidate identity、第六个 planned D04 capability 或 D05。
- Windows proof 环境必须允许当前用户修改自己新建临时文件的 DACL；缺少该能力是显式 verification-environment failure，不是 SKIP authority。
