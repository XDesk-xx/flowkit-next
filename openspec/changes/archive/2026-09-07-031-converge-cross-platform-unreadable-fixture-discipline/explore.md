# Explore — converge-cross-platform-unreadable-fixture-discipline

## 1. Owner goal and bounded correction

This closure corrective Change fixes two native-Windows unreadable-Guidance tests. It is not a sixth planned D04 capability and not D05.

The required outcome is now exact:

```text
Linux/POSIX
→ retain real permission-denial enforcement

native Windows/NTFS
→ establish a real read-denial fixture
→ execute both resolver fail-closed assertions
→ zero unreadable-fixture SKIP
```

Changing an unexplained Windows `FAIL` into a capability-bound `SKIP` does not satisfy this goal. The two platforms may use different fixture mechanics, but both must execute the same semantic obligation.

The correction remains test-only unless new proof demonstrates a production defect. It must not add a production Windows branch, filesystem abstraction, verification registry, skipped status, evidence store, platform lifecycle, or new candidate identity.

## 2. Current repository and workflow facts

The exact Git base remains:

```text
875b7827867fd8489f9c3d05837fa3879ec15e2b
```

The current OpenSpec Change is:

```text
converge-cross-platform-unreadable-fixture-discipline
```

OpenSpec owns the Change proposal/design/spec/tasks/archive facts. This project does not currently use an external Flowkit manager to advance the Change. `.flowkit/runs/**` remains a durable record of real Action execution and results; it does not replace OpenSpec truth or choose the next Action.

The active working tree already contains the superseded capability-bound-SKIP implementation from the prior Apply. Those bytes remain evidence of the rejected direction until a later authorized Apply replaces them; Revise Explore does not modify tests or production source.

## 3. Exact failing surface

Repository inspection bounds the defect to two test fixtures:

```text
tests/unit/domain/action-guidance-execution.test.ts
tests/unit/domain/delivery-operation-execution.test.ts
```

Both tests originally assumed:

```text
chmod(entry, 0o000)
→ the current Node process cannot read entry
```

That assumption is false on native Windows/NTFS. The current process can still read the file, so the old test expected `null` while each resolver correctly returned a content-bound Guidance reference.

No production source uses `chmod(0o000)` to implement Guidance semantics. The two resolvers already implement the required contract:

```text
canonical regular non-symlink path
→ realpath remains inside the repository root
→ readFile succeeds: bind exact Guidance bytes
→ readFile throws: return null
```

The product behavior is therefore not the defect. The fixture fails to establish its required read-denial precondition on Windows.

## 4. Canonical specification already forbids SKIP

The canonical `formal-full-test-execution-and-correction` specification already says:

```text
platform fixture mechanics may differ
but semantic proof obligations remain invariant
```

It also requires Formal Full Test to fail closed when a platform workaround skips the semantic obligation.

Therefore the current Change delta that permits capability-bound `SKIP` weakens existing canonical truth and must not be retained in the revised Proposal. The correction does not require a new capability or a weakened Formal Full Test requirement. It requires platform-appropriate test mechanics that execute the existing requirement.

## 5. Native-Windows focused proof

### 5.1 `chmod(0o000)` counterexample

Fresh native-Windows execution of the current SKIP implementation produced:

```text
focused Guidance tests: 19 tests / 17 pass / 2 skip / 0 fail
full Domain:            241 tests / 239 pass / 2 skip / 0 fail
Acceptance:               5/5 PASS
```

Both skipped tests reported that the host/filesystem still permitted the resolver read after `chmod(0o000)`. This confirms the original mechanic is not a Windows read-denial fixture and that the current implementation does not meet the corrected Owner goal.

### 5.2 Exclusive-lock prototype

A repository-external prototype used a .NET `FileStream` with `FileShare.None` while Node executed the real resolvers:

```text
lstat    → success
realpath → success
readFile → EBUSY
Action resolver   → null
Delivery resolver → null
```

The semantic result is valid, but the combined probe blocked for more than 30 seconds before completion. A sharing-lock fixture therefore introduces avoidable timeout and flakiness risk and is not the preferred mechanism.

### 5.3 Windows ACL read-data denial prototype

A bounded Windows prototype used the current user SID rather than a localized account name and applied one deny ACE to temporary Guidance files:

```text
icacls.exe <temporary-guidance> /deny *<current-user-sid>:(RD)
```

Observed result outside the restricted sandbox:

```text
lstat(Action)        → success
realpath(Action)     → success
readFile(Action)     → EPERM in 0 ms
Action resolver      → null in 1 ms

lstat(Delivery)      → success
realpath(Delivery)   → success
readFile(Delivery)   → EPERM in 0 ms
Delivery resolver    → null in 1 ms
```

Five additional repetitions proved the complete lifecycle:

```text
apply deny-read-data ACE
→ both real resolvers return null
→ remove deny ACE in finally
→ both files become normally readable again
→ delete the exact temporary root

5/5 PASS
```

The restricted sandbox rejected ACL mutation with `icacls` exit code `5` (`Access is denied`). The unchanged proof passed outside that restriction. ACL-fixture execution therefore requires a native-Windows verification environment that permits the current user to update the DACL of its own temporary files. Lack of that environment is an explicit verification-environment failure, not grounds to skip the semantic test.

## 6. Minimum implementation direction

### POSIX/root path

Preserve the existing real permission proof:

```text
root test process
→ make parent path traversable
→ make Guidance readable only by root
→ spawn low-privilege uid/gid child
→ child executes the real resolver
→ resolver must return null
```

For a non-root POSIX reader, `chmod(0o000)` may be used only when an actual read probe confirms denial; the resolver assertion must then execute.

### Native-Windows path

Use a small test-only fixture helper shared by the two tests. The helper must:

1. resolve the current Windows user by SID, not localized account name;
2. operate only on a newly created temporary Guidance file;
3. invoke `icacls.exe` without a shell and deny only read-data (`RD`);
4. require ACL setup to succeed;
5. prove metadata/path validation still succeeds and direct `readFile` fails with a permission outcome;
6. execute the real resolver and require `null`;
7. remove the exact deny ACE in `finally`;
8. prove normal read access is restored before deleting the temporary root.

If setup, semantic assertion, restoration, or cleanup fails, the test must fail with the exact operation and process outcome. It must not call `t.skip()` and must not report fabricated PASS.

Selecting a Windows-specific fixture mechanic is permitted because the platform branch chooses only how to establish the same semantic condition. It does not choose whether the semantic obligation runs.

## 7. Planning and task boundary correction

Every task in the active Change must be completable before archive. A task such as:

```text
After archive, establish a new exact checkpoint ...
```

is invalid because it creates a circular boundary: the Change cannot finish while the task is incomplete, but the task cannot execute until after the Change is archived.

The revised Proposal tasks must end with pre-archive implementation and verification, including native-Windows zero-SKIP proof. Archive, Owner-authorized Git checkpoint, and subsequent Formal Full Test restart are continuation facts to report after the relevant operation; they are not active-Change tasks.

Tracked test correction creates a new exact candidate, so prior Full Test evidence cannot prove the corrected bytes. That invariant remains in the canonical specification and does not require an executable post-archive task.

## 8. Required Proposal correction

The existing Proposal direction is not reusable as written. Revision must:

1. remove capability-bound `SKIP` as an accepted Windows outcome;
2. remove the delta that weakens the canonical no-skip platform-fixture requirement;
3. require a real Windows read-denial fixture and execution of both resolver assertions;
4. keep Linux/root low-privilege enforcement proof;
5. keep production resolver bytes unchanged absent new product-defect proof;
6. limit implementation to test fixture/helper code;
7. require Windows focused/Domain results with zero unexplained failure and zero unreadable-fixture skip;
8. keep Linux Domain and Linux/Windows Acceptance proof;
9. remove every post-archive operation from `tasks.md`.

## 9. Risks and safeguards

- ACL mutation is safe only on exact temporary files. The implementation must never target repository-owned Guidance or a caller-provided arbitrary path.
- A killed test process can leave a denied temporary file. The fixture must use a unique OS temporary root, remove the ACE in `finally`, and report the retained exact path if cleanup fails.
- `icacls.exe` is a native-Windows fixture dependency, not a production dependency. Missing executable, non-zero setup, or denied DACL mutation fails the Windows proof explicitly.
- Account names and localized command output are unstable. Use the current user SID and judge exact process exit plus actual Node read behavior.
- Exclusive locking is not the fallback because the measured retry/blocking behavior is unsuitable for deterministic unit tests.

## 10. Explicit non-goals

```text
production Guidance resolver mutation
production Windows-specific behavior
generic ACL or filesystem abstraction
ACL persistence outside temporary test files
Core skipped status or evidence schema
skip registry or evidence database
platform lifecycle
new candidate identity
real D04 Formal Full Test
Architecture Finalization
Delivery Final
Repository Integration
Git add / commit / push / merge / tag
D05
```

## 11. Explore conclusion

```text
PASS — ready for independent review-explore
```

Native Windows can execute the real unreadable-Guidance semantic proof with a bounded temporary-file ACL fixture. Capability-bound `SKIP` is unnecessary and contradicts both the corrected Owner goal and the existing canonical platform-fixture requirement. The next Proposal must restore zero-SKIP cross-platform proof and correct the pre-archive task boundary without changing production behavior.
