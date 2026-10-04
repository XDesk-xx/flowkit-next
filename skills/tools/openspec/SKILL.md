---
name: project-openspec
description: Use the repository-distributed OpenSpec 1.10.0 skills with the exact managed OpenSpec runtime. This skill never decides lifecycle next.
---

# Project OpenSpec Tool Skill

## Authority

OpenSpec owns Change proposal/design/spec/tasks/archive facts.
This Skill explains HOW to use the exact OpenSpec tool selected by the manager installation toolchain.
It never decides the current Flowkit Action, Role, Owner authority, Review verdict, or next boundary.

Agent 在已确定的 Flowkit Action 内用下述 exact OpenSpec runtime 处理需要由 Agent 操作的 OpenSpec 自有文件；同一 Action 的开始、proof 核对与结果记录使用所选 manager 的固定 `action start`、`proof inspect`、`action finish`。`change activate` 使用发行支持命令建立 Change；`change archive` 由发行支持命令同时执行 OpenSpec archive 和 Flowkit 协调写入，Agent 不预先手动移动 Change。新 Archive start 仅 admission，无 validate/dry-run、项目 checks 或依赖 snapshot。started Run 每次至多实际调用一次 exact archive；结果为 completed/safe failed/partial，参见 [Archive HOW](../../actions/archive/SKILL.md)。成功后态来自实际工具，不从 scratch 推断；intent 无可验证结果不能重放。上游 OpenSpec 提示或命令成功不跳过 Flowkit Run、Review 或 Owner 边界。

## Runtime identity

系统 lock 位于 `<manager-installation>/config/tools/toolchain.lock.json`；本 Skill 与以下 vendor 路径也相对该安装解析。OpenSpec 的 cwd/观察根仍为 target repositoryRoot，不要求 target 复制 lock、Skills 或 Flowkit scripts。安装包 name/version 只标识 manager 来源，不要求 target commit 或上一 Delivery SHA。缺 runtime 仅阻断实际依赖该工具的操作；Guidance identity 解析不依赖 executable，status/next/action 的 target 上下文观察使用 exact OpenSpec。

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
