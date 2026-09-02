---
name: implementation-convergence
description: Keep Flowkit Apply implementation minimal, reusable, traceable to the approved contract, and free of opportunistic redesign or unnecessary new abstractions.
metadata:
  author: flowkit
---

# Implementation Convergence Skill

## Purpose

Converge an approved Proposal into the smallest faithful implementation that satisfies the accepted contract and verification requirements.

This skill is an auxiliary Apply-stage discipline. It does not replace the normal Apply mechanism and does not own lifecycle authority.

The Apply stage is for implementation, not renewed architecture exploration.

## Core Principle

```text
Approved Proposal
+ existing repository seams
+ required verification
→ reuse first
→ minimum source/test mutation
→ no speculative abstraction
→ faithful implementation
```

A correct implementation is preferred over a generalized implementation.

## Required Inputs

Before implementing, read:

- approved Proposal/spec/design/tasks;
- latest review-propose verdict;
- Owner scope/authority decisions;
- existing source/test seams that already satisfy part of the contract;
- explicit non-goals and deferred concerns.

Do not silently import requirements from rejected Explore branches or unrelated future work.

## Implementation Discipline

### 1. Trace every material mutation

Every material source/config/test mutation SHOULD answer:

> Which approved requirement or verification need requires this change?

Valid reasons include:

- explicit requirement;
- approved design decision;
- task needed to realize the contract;
- test needed to verify a required invariant;
- minimal supporting refactor strictly necessary to implement the above.

If there is no traceable reason, do not make the mutation.

### 2. Reuse before introducing

Prefer, in order:

1. existing domain types and validators;
2. existing repository/path seams;
3. existing serialization patterns;
4. existing test helpers;
5. a small local helper;
6. a new abstraction only when the approved contract actually requires one.

Do not create a framework merely because several future Changes might someday use it.

### 3. Keep the implementation surface small

Avoid opportunistic:

```text
renaming unrelated modules
repository-wide cleanup
new dependency introduction
new framework layers
new generic registries
new plugin abstractions
new persistence engines
new concurrency machinery
future-proofing for non-goals
```

When two implementations satisfy the approved contract, prefer the one with fewer new concepts and smaller mutation scope.

### 4. Preserve explicit non-goals

Apply MUST NOT reintroduce capabilities that Explore/Proposal deliberately deferred.

Examples include, when excluded by the current Change:

```text
multi-Agent orchestration
scheduler/automatic-next execution
locking/WAL/database machinery
crash-recovery framework
generic filesystem API
unrelated CLI/integration work
future Delivery features
```

A theoretically useful capability is not sufficient justification.

### 5. Do not repair a defective contract inside Apply

If implementation reveals that the approved Proposal is materially wrong, incomplete, or impossible without changing its contract:

```text
STOP
→ record the blocker
→ report the smallest contract defect
→ require Owner-authorized return to revise-propose / earlier boundary
```

Do not silently rewrite Proposal semantics through code.

A small implementation detail that does not alter the approved contract may be resolved locally.

## Verification Discipline

Verification SHOULD be selected by actual contract risk.

Prefer:

- focused tests for new invariants;
- existing regression suites affected by the mutation;
- type/format/build checks already required by the repository;
- OpenSpec validation when formal artifacts are involved.

Do not create a generic evidence platform or unrelated acceptance matrix merely to make Apply look more rigorous.

## Simplicity Check

Before declaring Apply complete, ask:

```text
1. Did we implement every approved requirement?
2. Did we add anything not needed by the approved contract?
3. Could an existing seam have been reused instead?
4. Did we introduce a new abstraction/dependency for hypothetical future use?
5. Did implementation discover a Proposal defect that should have caused STOP?
6. Are tests focused on actual required behavior and regressions?
```

If (2), (4), or (5) is yes, converge further or stop for the proper boundary decision.

## Output Boundary

A converged Apply should leave:

- the smallest necessary implementation/test mutations;
- completed tasks that correspond to real work;
- real verification results;
- explicit note of any blocker requiring boundary return;
- no claim of Review, Verification, Archive, or checkpoint authority.

## Anti-Patterns

Avoid:

```text
"while here" refactors
"might be useful later" abstractions
framework extraction before proven reuse
new dependency for a tiny local requirement
implementing deferred non-goals
changing spec semantics in code
broad test infrastructure unrelated to the Change
```

## Final Rule

> Apply should make the approved contract real with the least new machinery possible.

Reuse existing seams. Keep mutations local. Stop when the contract itself must change.

## Handoff continuity

When Apply hands off uncommitted work, preserve the latest delta plus all materially required uncommitted ancestor state using cumulative payload or exact retrievable ancestor references. Carry exact removals for deleted/renamed paths. Do not introduce a payload registry/database.
