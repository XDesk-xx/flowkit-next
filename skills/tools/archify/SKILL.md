---
name: project-archify
description: Use the repository-distributed Archify 2.15.0 guidance with the exact externally managed Archify runtime. Archify is derived visualization only.
---

# Project Archify Tool Skill

## Authority

Archify is a derived architecture visualization/validation tool.
It does not own OpenSpec facts, Policy, Verification, Review, Git history, or lifecycle next.

## Runtime identity

Required version: `2.15.0`.

Canonical runtime root:

```text
<FLOWKIT_HOME>/tools/archify/2.15.0/
```

Canonical entrypoint after normalized installation:

```text
<FLOWKIT_HOME>/tools/archify/2.15.0/bin/archify.mjs
```

Do not vendor the runtime into the Git repository and do not silently use another Archify installation.

## Upstream guidance

The exact upstream Skill text is retained at:

```text
skills/vendors/archify/UPSTREAM-SKILL.md
```

Its supporting reference documents are retained at:

```text
skills/vendors/archify/references/
```

When the upstream Skill shows a relative command such as:

```text
node bin/archify.mjs ...
```

resolve `bin/archify.mjs` against the managed runtime root above, not against the repository Skill directory.

Schemas/examples/renderers remain runtime assets and are resolved from the managed runtime, not copied into Git merely to satisfy relative paths.

## Update rule

A toolchain upgrade must update together:

```text
Archify runtime version
+ runtime SHA256
+ upstream Skill/reference bytes
+ upstream source SHA256
```
