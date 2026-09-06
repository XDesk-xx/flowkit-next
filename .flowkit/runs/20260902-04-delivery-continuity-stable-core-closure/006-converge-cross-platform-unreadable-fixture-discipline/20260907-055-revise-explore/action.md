# Action — Revise Explore

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: revise-explore
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-055-revise-explore
input: owner-input:2026-09-07:revise-explore:windows-real-read-proof-and-task-boundary
priorRun: 20260906-054-apply
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Owner corrected the Explore boundary:

```text
native Windows unreadable Guidance proof
→ MUST establish a real read failure
→ MUST execute both resolver null assertions
→ MUST NOT use capability-bound SKIP

active Change tasks
→ MUST be completable before archive
→ post-archive checkpoint/Full Test continuation is not a Change task
```

This project uses OpenSpec for Change planning and archive truth. No external Flowkit manager was used. `.flowkit/runs/**` records this real execution process and its result without replacing OpenSpec authority.

Focused native-Windows proof compared two fixture mechanics. Exclusive `FileShare.None` locking produced real `EBUSY` and resolver `null` but incurred unsuitable blocking. A temporary-file Windows ACL that denied only current-SID read-data (`RD`) preserved `lstat`/`realpath`, made `readFile` fail immediately with `EPERM`, and made both real resolvers return `null`. Five repeated apply/assert/restore/read/cleanup cycles passed 5/5.

The canonical Formal Full Test specification already forbids platform workaround SKIP and permits platform-specific mechanics for the same semantic obligation. The prior capability-bound-SKIP delta therefore weakens canonical truth and must be removed during Proposal revision.

Only `explore.md` was revised. No Proposal, Design, Spec delta, Tasks, production source, tests, Git state, archive, checkpoint, or later Action was modified or executed.

Next boundary:

```text
review-explore
```

STOP.
