# Action — Apply

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: apply
projectOrdinal: 031
changeStartSequence: 006
run: 20260906-054-apply
input: 20260906-053-review-propose
```

Verdict: **PASS — implementation complete, native-Windows review proof pending**.

Applied only the approved corrective surface:

```text
tests/unit/domain/action-guidance-execution.test.ts
tests/unit/domain/delivery-operation-execution.test.ts
+
existing OpenSpec delta from Proposal
```

Both unreadable-Guidance fixtures now decide enforceability from the actual read capability used by the resolver. If `chmod(0o000)` still permits the read, the project-local test emits an explicit capability-bound SKIP with a stable reason and returns without claiming semantic PASS. Linux/root retains the existing low-privilege child-process permission-denial proof before the direct capability probe.

No production Guidance resolver bytes changed. No Core skipped status/evidence persistence, ACL layer, filesystem abstraction, registry/store, platform lifecycle, new candidate identity, sixth planned capability, or D05 was introduced.

Fresh exact Linux proof on the corrected candidate:

```text
focused Guidance tests  19/19 PASS, 0 skipped
Domain                  241/241 PASS, 0 skipped
Acceptance                5/5 PASS, 0 skipped
OpenSpec                 23/23 strict PASS
Typecheck                PASS
Build                    PASS
Format                   PASS
Lint                     PASS
Forbidden artifacts      PASS
Dependency health        80 modules / 359 dependencies / 0 violations
Repository entropy       40/40 reachable
Entropy tests              7/7 PASS
git diff --check         PASS
```

The first Acceptance attempt without managed detached prerequisites failed only because `FLOWKIT_HOME`/built `dist` were absent. After restoring exact managed OpenSpec 1.10.0 + Archify 2.15.0 and building the same candidate, Acceptance passed 5/5 with no tracked-byte mutation.

Native Windows cannot be truthfully produced from this Linux detached environment. Per Reviewer 053, fresh native-Windows Domain + Acceptance proof on this corrected exact candidate remains mandatory at review-apply. Old `227/229` Windows evidence is trigger evidence only.

Outstanding task proofs before archive:

```text
3.1 unavailable-fixture explicit SKIP branch → fresh native Windows proof required
3.2 native Windows Domain → pending review-apply
3.3 native Windows Acceptance → pending review-apply
3.5 post-archive checkpoint / Full Test restart → archive boundary, not executed in Apply
```

Next legal boundary:

```text
review-apply
```

STOP.
