# 030 Explore — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `explore`
- Run: `20260830-030-explore`
- Role: `author`
- Base: `45bf8355448ef8a279cc68405cf1d9b89ab2c5c7`

## Authority

Owner activation was persisted as:

```text
decision=activate-change
exact Delivery + Change
scope=["explore"]
ref=owner:80a65e4f9741fab0908c353d88cc654711a235139af1df303b94ccefff360203
```

Corrected trusted coordination + Policy returned:

```text
READY_ACTION(explore)
```

## Explore result

```text
PASS — Proposal-ready
```

The proof converged on two high-confidence blocker surfaces only:

```text
1. production orphan source
   → dependency-cruiser orphan semantics
   → scan src only
   → explicit roots:
      src/cli/entrypoint.ts
      src/domain/index.ts

2. unused direct package dependency declarations
   → Knip 6.32.2
   → dependency-unused findings only
```

### Current baseline

```text
production src modules: 18
reachable from explicit roots: 18
orphan baseline: 0
unused dependency baseline: 0
```

### Counterexamples

```text
new orphan src file
→ dependency-cruiser entropy proof FAIL

the same source imported only by tests
→ still FAIL as production orphan

new unused direct devDependency
→ Knip dependency-only proof FAIL
```

### Knip boundaries

Default Knip in the exact 4 GiB detached environment fails due OXC raw-transfer allocation. `KNIP_DISABLE_RAW_TRANSFER=1` makes it stable and interactive.

Knip file detection is not accepted as blocker because:

```text
default discovery
→ legitimate entry/config false positives

--production file mode
→ failed to report a disposable orphan

regular file mode
→ test-only import hid a production orphan
```

Broad current Knip findings also include:

```text
13 unused exports
21 unused types
```

These are explicitly not selected blockers.

### Ownership boundaries

Structural Dependency Health retains ownership of:

```text
unresolved imports
runtime cycles
prod→test/spec
runtime prod→devDependency
undeclared/unlisted external package use
```

Entropy Hygiene does not duplicate those rules and does not join `quality:gate`.

### Performance

Selected serial proof:

```text
Knip dependency-only
+
dependency-cruiser production-orphan
→ ~1.76s
```

No changed-file planner, baseline, cache, waiver registry, finding database, or Quality Platform is justified.

## Artifact

Full proof and Proposal constraints are captured in:

```text
openspec/changes/establish-high-confidence-repository-entropy-hygiene/explore.md
```

No Proposal/Spec/Design/Tasks or production implementation was created.

## Next boundary

```text
review-explore
```

STOP after this Explore payload.
