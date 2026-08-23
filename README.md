# flowkit-next

This repository is in **pre-OpenSpec project initialization state**, not an active OpenSpec Change.

The project/repository identity is fixed as `flowkit-next`. Public runtime conventions remain:

```text
CLI:          flowkit
state dir:    .flowkit/
runtime home: FLOWKIT_HOME
```

## What is in Git

- project source/config skeleton
- `.flowkit/project.json`
- canonical `skills/`
- vendored OpenSpec 1.10.0 Skills
- vendored Archify 2.15.0 Skill/reference source
- project tool adapter Skills
- exact toolchain/runtime manifests and hashes

## What is NOT in Git

- OpenSpec CLI runtime
- Archify CLI runtime
- `node_modules`
- pnpm store
- platform runtime archives

Those are external managed environment assets.

## Agent bootstrap

The repository ships with a Git-tracked `AGENTS.md` from the initial commit so the first AI session has stable authority, toolchain, Skill, Git and artifact-safety boundaries before formal Foundation lifecycle work begins.
