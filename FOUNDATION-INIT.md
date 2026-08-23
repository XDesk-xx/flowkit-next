# Foundation Initialization Snapshot

## Frozen before OpenSpec lifecycle

```text
Development: Windows Native
Detached acceptance: Linux x64 glibc
CLI: flowkit
State directory: .flowkit/
Runtime home: FLOWKIT_HOME
Canonical Skill root: skills/
OpenSpec: 1.10.0
Archify: 2.15.0
Node: 22.23.2
pnpm: 11.22.0
CodeGraph: not required
```

## Source/runtime separation

Git repository contains Skills and manifests.

External managed environment contains executable runtimes and platform dependency artifacts.

```text
repository/skills/**
              │
              │ exact version/hash contract
              ▼
FLOWKIT_HOME/tools/**
```

Skills are always distributed with the source/stable project package.
OpenSpec/Archify runtime packages are restored once per environment and do not need to be uploaded with every later source snapshot.

## Next formal step

The project/repository identity is fixed as `flowkit-next` and this structure is the initial Git materialization.

Next:

1. install/restore exact external managed runtimes;
2. validate toolchain on Windows;
3. only then start the first OpenSpec Foundation Change.


## Agent bootstrap contract

`AGENTS.md` is part of the initial repository materialization and must exist before the first formal Foundation Change.

It defines the repository-level rules required for the first AI session to behave correctly, while explicitly treating the current repository as pre-OpenSpec initialization state.

Future Foundation Changes may formalize Role, Action, Gate, Run/Result and Git lifecycle contracts, but they must not weaken the initial authority, Git safety, toolchain separation, Skill ownership or artifact-integrity rules.
