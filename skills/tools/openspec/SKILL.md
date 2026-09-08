---
name: project-openspec
description: Use the repository-distributed OpenSpec 1.10.0 skills with the exact managed OpenSpec runtime. This skill never decides lifecycle next.
---

# Project OpenSpec Tool Skill

## Authority

OpenSpec owns Change proposal/design/spec/tasks/archive facts.
This Skill explains HOW to use the exact OpenSpec tool selected by the manager installation toolchain.
It never decides the current Flowkit Action, Role, Owner authority, Review verdict, or next boundary.

## Runtime identity

系统 lock 位于 `<manager-installation>/config/tools/toolchain.lock.json`；本 Skill 与以下 vendor 路径也相对该安装解析。OpenSpec 的 cwd/观察根仍为 target repositoryRoot，不要求 target 复制 lock、Skills 或 Flowkit scripts。安装包 name/version 只标识 manager 来源，不要求 target commit 或上一 Delivery SHA。缺 runtime 仅阻断实际依赖该工具的操作；Guidance/next 不新增此依赖。

Required version: `1.10.0`.

Canonical runtime root:

```text
<FLOWKIT_HOME>/tools/openspec/1.10.0/
```

Canonical entrypoint after normalized installation:

```text
<FLOWKIT_HOME>/tools/openspec/1.10.0/bin/openspec.js
```

Do not silently fall back to an arbitrary `openspec` found on PATH.

## Official action skills

Official OpenSpec skills are vendored unchanged under:

```text
skills/vendors/openspec/openspec-*/SKILL.md
```

Action execution should load only the applicable official OpenSpec skill(s), not all of them.

## Update rule

A toolchain upgrade must update together:

```text
OpenSpec runtime version
+ runtime SHA256
+ vendored official Skills
+ upstream source SHA256
```
