## 1. Shared unreadable fixture

- [x] 1.1 Add one small test-only helper shared by the Action Guidance and Delivery Guidance unreadable tests; keep it outside `src/**` and restrict it to a caller-created unique temporary root and its exact internal Guidance file.
- [x] 1.2 On native Windows, resolve the current user by SID, invoke `icacls.exe` without a shell, add only the current-SID read-data (`RD`) deny ACE to the exact temporary file, and fail on spawn/setup errors or non-zero exit.
- [x] 1.3 Before the resolver assertion, prove the Windows target remains a regular file inside the temporary root, `realpath` succeeds, and direct `readFile` fails with a permission outcome.
- [x] 1.4 In `finally`, remove the current-SID deny ACE from the exact file, require successful restoration, prove normal read access is restored, and then clean the temporary root; report the exact retained path if cleanup cannot complete.
- [x] 1.5 Preserve the existing POSIX/root low-privilege child enforcement path and require a real denied read before the resolver assertion; do not add a POSIX or Windows `t.skip()` path.

## 2. Two resolver assertions

- [x] 2.1 Replace the superseded capability-bound-SKIP branch in `tests/unit/domain/action-guidance-execution.test.ts` with the shared fixture and execute the real Action Guidance resolver `null` assertion.
- [x] 2.2 Replace the superseded capability-bound-SKIP branch in `tests/unit/domain/delivery-operation-execution.test.ts` with the same fixture and execute the real Delivery Guidance resolver `null` assertion.
- [x] 2.3 Keep production Guidance resolver bytes, Core status/evidence models, process adapters, canonical specs, dependencies, and runtime toolchain unchanged.

## 3. Pre-archive proof

- [x] 3.1 Run both named focused Guidance test files successfully on native Windows and prove both unreadable resolver assertions executed, zero unreadable-fixture SKIP, ACL removal succeeded, and normal read access was restored; record actual observed totals in Apply evidence.
- [x] 3.2 Run the named native-Windows Domain and Acceptance suites successfully on the corrected exact candidate with no unexplained failure; record actual observed totals and the two target-test outcomes without imposing whole-suite zero-SKIP accounting.
- [x] 3.3 Run the named focused Guidance, Domain, and Acceptance suites successfully on Linux with no unexplained failure, both target assertions executed without unreadable-fixture SKIP, and the root low-privilege enforcement proof retained; record actual observed totals in Apply evidence.
- [x] 3.4 Run exact managed OpenSpec `1.10.0` current/all strict validation, typecheck, build, format, lint, dependency health, entropy, forbidden-artifact checks, and `git diff --check`.
- [x] 3.5 Confirm the Change has no delta spec, no `src/**` mutation, no post-archive task, and no new Core/platform/verification subsystem.
