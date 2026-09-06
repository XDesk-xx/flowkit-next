# Action — Revise Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: revise-propose
projectOrdinal: 031
changeStartSequence: 006
run: 20260907-059-revise-propose
input: 20260907-058-review-explore
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
```

Run `058` approved the Owner-corrected Explore and selected
`revise-propose` because Proposal artifacts already existed but still encoded
the superseded capability-bound-SKIP direction.

This Action converged the existing Proposal in place:

```text
canonical platform-fixture requirement
→ already sufficient; no delta spec

native Windows
→ current-user SID + temporary-file RD deny ACE
→ metadata/path checks remain valid
→ direct read genuinely fails
→ both real resolver null assertions execute
→ exact deny ACE is removed and normal read is restored
→ zero unreadable-fixture SKIP

POSIX/root
→ existing low-privilege real permission-denial proof remains
```

`.openspec.yaml` now declares `skip_specs: true`; the obsolete MODIFIED delta
was removed. Proposal, Design, and Tasks now describe only the shared test-only
fixture correction. All thirteen revised tasks are pre-archive and unchecked;
the prior rejected Apply does not satisfy the new contract.

No production source, tests, canonical spec, archive, Git state, external
Flowkit manager, or candidate CLI was modified or executed by this Action.
`.flowkit/runs/**` records this real Author execution and Result while OpenSpec
remains the Change planning authority.

Next boundary:

```text
review-propose
```

STOP.
