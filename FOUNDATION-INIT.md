# Foundation Initialization Snapshot — Historical

> This file is retained as the immutable **conceptual bootstrap reference** for how `flowkit-next` was initialized before the first Foundation OpenSpec Change.
> It is **not** the current repository status or current lifecycle guidance. Current repository rules are in `AGENTS.md`; current formal Change/spec facts are in OpenSpec.

## Bootstrap facts frozen before the first OpenSpec lifecycle

```text
Development assumption at bootstrap: Windows Native
Detached target: Linux x64 glibc
CLI: flowkit
State directory: .flowkit/
Runtime home: FLOWKIT_HOME
Repository Skill roots: skills/ plus repository-managed .agents/ bootstrap aids
OpenSpec: 1.10.0
Archify: 2.15.0
Node deterministic fixture: 22.23.2
pnpm: 11.22.0
CodeGraph: not required
```

## Source/runtime separation established at initialization

Git repository contains source, Skills/guidance and identity manifests.
External managed environment contains executable runtimes and platform dependency artifacts.

```text
repository manifests / Skills
              │
              │ exact version/hash contract
              ▼
FLOWKIT_HOME/tools/**
```

OpenSpec/Archify runtime packages, `node_modules`, pnpm stores and platform runtime archives are not repository truth and are not committed as normal source assets.

## What happened after this snapshot

The initialization skeleton was followed by Delivery:

```text
20260824-01-foundation-lifecycle-kernel
```

That Delivery established the Foundation Lifecycle Kernel, archived all required Changes, passed Formal Delivery Full Test on exact candidate `aa6735f247ed89777dc2eae20d3011cbdb25faa7`, and completed post-verification Archify/guidance Delivery Final materialization.

Therefore old statements such as:

```text
"no implemented lifecycle CLI"
"no formal OpenSpec lifecycle yet"
"source/tests will be materialized later"
```

are historical bootstrap conditions only and must not be used to override current repository/OpenSpec facts.

## Long-term rule preserved from initialization

The following initialization principles remain valid:

- OpenSpec does not cease to be Change/specification authority merely because Flowkit exists.
- Git remains repository byte/history authority.
- executable managed runtimes remain external to the repository.
- Skills/guidance do not create Owner, Reviewer, Verification or Policy authority.
- Archify remains derived visualization, never specification/lifecycle truth.
- no Action/Review/Verification/Git/promotion artifact may be fabricated merely to continue a workflow.
