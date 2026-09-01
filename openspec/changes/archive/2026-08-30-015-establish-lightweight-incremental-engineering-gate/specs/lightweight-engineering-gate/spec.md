## Purpose

为普通 bounded development 提供一个几秒级、repository-local、high-signal 的机械工程质量 Gate，在不吸收 Full Test 或后续 D02 correctness/dependency/entropy 职责的前提下阻止 selected mechanical regression。

## ADDED Requirements

### Requirement: Stable lightweight engineering Gate
仓库 SHALL 提供一个稳定、显式的 Lightweight Engineering Gate 命令。该命令 SHALL 组合本 capability 定义的 selected mechanical checks；所有 selected checks 通过时退出码 MUST 为 `0`，任一 selected check 失败时退出码 MUST 为非 `0`。

该 Gate MUST NOT 执行或声称拥有 typecheck、build、domain tests、acceptance tests、OpenSpec validation、Archify、dependency-cruiser、Knip 或 Formal Full Test，也 MUST NOT 产生 Formal Verification verdict、Owner authority、Reviewer verdict 或新的 Flowkit lifecycle fact。

#### Scenario: Selected mechanical checks pass
- **WHEN** repository 满足本 capability 的 whitespace、formatting、selected static lint、source-size 与 forbidden tracked-artifact 规则
- **THEN** stable Lightweight Engineering Gate 命令退出 `0`

#### Scenario: A selected mechanical rule fails
- **WHEN** 任一 selected mechanical rule 检测到 violation
- **THEN** stable Lightweight Engineering Gate 命令退出非 `0` 并保留对应工具/检查的可读诊断

#### Scenario: Correctness checks remain outside the Gate
- **WHEN** stable Lightweight Engineering Gate 被执行
- **THEN** 它 MUST NOT 因为 typecheck、build、tests、OpenSpec、Archify、dependency-cruiser、Knip 或 Formal Full Test 的状态而扩大自身检查面

### Requirement: Tracked whitespace and bounded formatting
Gate SHALL 检查当前 repository checkpoint `HEAD` 相对 staged/unstaged tracked modifications 的 Git whitespace errors，并 SHALL 对明确 bounded 的 source/test/Gate-owned config-script surface 执行 formatting check。

Formatting ownership MUST include `src/**`、`tests/**`、Gate 自有 config/script、TypeScript config 与 `package.json`，并 MUST NOT 因 Gate 本身而把 `.flowkit/**`、`openspec/**`、`architecture/**`、`node_modules/**`、`dist/**`、`coverage/**` 或 `.tmp/**` 扩成 whole-repository formatting ownership。

#### Scenario: Tracked trailing whitespace is introduced
- **WHEN** staged 或 unstaged tracked modification 相对 `HEAD` 引入 Git 可检测的 trailing whitespace error
- **THEN** Gate MUST fail

#### Scenario: Bounded source or Gate config is not formatted
- **WHEN** bounded formatting surface 中的文件不符合 repository formatter
- **THEN** Gate MUST fail

#### Scenario: Durable history remains outside Gate formatting ownership
- **WHEN** `.flowkit/**`、`openspec/**` 或 `architecture/**` 存在 durable/formal artifacts
- **THEN** Lightweight Engineering Gate MUST NOT 仅因为这些目录存在而把它们纳入本 capability 的 formatting surface

### Requirement: Selected TypeScript mechanical lint boundary
Gate SHALL 对 production `src/**/*.ts` 与 test `tests/**/*.ts` 执行一个 zero-selected-debt static lint boundary。

Production source MUST reject selected recommended JavaScript/TypeScript mechanical errors、unused imports/types/declarations、explicit `any` 与不合规 TypeScript suppression directives。`@ts-nocheck` 与 `@ts-ignore` MUST fail；`@ts-expect-error` MUST satisfy the selected rule's required intentional-description behavior。

Tests MUST continue to reject selected unused-code violations while allowing the proven test boundary for explicit `any` and intentional discard names beginning with `_`。The intentional control-character regular expression in `src/domain/run-result-persistence.ts` MUST NOT be rejected by the generic control-regex rule; this exception MUST remain exact-file scoped rather than globally disabling that rule。

#### Scenario: Production explicit any is introduced
- **WHEN** production `src/**/*.ts` introduces an `any` rejected by the selected production rule surface
- **THEN** Gate MUST fail

#### Scenario: Forbidden TypeScript suppression is introduced
- **WHEN** governed TypeScript introduces `@ts-nocheck`、`@ts-ignore` or an undescribed `@ts-expect-error` rejected by the selected suppression rule
- **THEN** Gate MUST fail

#### Scenario: Test harness uses proven explicit-any boundary
- **WHEN** a test under `tests/**/*.ts` uses explicit `any` without another selected mechanical violation
- **THEN** Gate MUST NOT fail solely because of that explicit `any`

#### Scenario: Intentional underscore discard is used in tests
- **WHEN** a test binds an otherwise-unused variable or argument whose name begins with `_`
- **THEN** the selected unused-variable rule MUST treat it as an intentional discard rather than a Gate failure

#### Scenario: Exact control-regex exception remains bounded
- **WHEN** `src/domain/run-result-persistence.ts` contains its intentional control-character regular expression
- **THEN** Gate MUST NOT fail solely on the generic control-regex rule for that exact file

### Requirement: Production source-size hard boundary
Gate SHALL apply a hard production TypeScript source-size limit to `src/**/*.ts` only. A governed file with at most `650` physical/source lines MUST satisfy the size rule; a governed file with more than `650` lines MUST fail the Gate。

The approximate `600`-line target remains maintainability guidance only and MUST NOT become a second machine failure threshold in this Change。

#### Scenario: Production file is exactly 650 lines
- **WHEN** a governed `src/**/*.ts` file has exactly `650` counted lines under the selected line-count semantics
- **THEN** the source-size rule MUST pass for that file

#### Scenario: Production file exceeds 650 lines
- **WHEN** a governed `src/**/*.ts` file has `651` or more counted lines
- **THEN** Gate MUST fail

#### Scenario: Non-production artifacts are large
- **WHEN** a file outside `src/**/*.ts` exceeds `650` lines
- **THEN** this capability's production source-size rule MUST NOT fail solely because of that file

### Requirement: Forbidden tracked generated and runtime artifacts
Gate SHALL fail when Git-tracked paths contain the following selected forbidden artifacts:

- any path segment named `node_modules`、`dist`、`coverage` or `.tmp`;
- repository-root directories `tools/` or `runtime/`;
- files whose names match `*.node-modules.tar.gz` or `*.pnpm-store.tar.gz` at any repository path.

The matcher MUST preserve legal nested paths such as `config/tools/**` and `skills/tools/**` and MUST NOT evolve into a general repository path-mutation policy。

#### Scenario: Force-added root runtime artifact is tracked
- **WHEN** a path such as `runtime/probe.txt` becomes Git-tracked even if `.gitignore` was bypassed
- **THEN** Gate MUST fail and identify the forbidden tracked path

#### Scenario: Generated directory segment is tracked
- **WHEN** a Git-tracked path contains a `node_modules`、`dist`、`coverage` or `.tmp` path segment
- **THEN** Gate MUST fail

#### Scenario: Environment archive is tracked
- **WHEN** a Git-tracked file name matches `*.node-modules.tar.gz` or `*.pnpm-store.tar.gz`
- **THEN** Gate MUST fail

#### Scenario: Legal nested tools path remains allowed
- **WHEN** a Git-tracked path is under `config/tools/**` or `skills/tools/**` and does not match another forbidden rule
- **THEN** Gate MUST NOT fail solely because the path contains the name `tools`
