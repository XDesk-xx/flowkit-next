# lightweight-engineering-gate Specification

## Purpose
为普通 bounded development 提供一个几秒级、repository-local、high-signal 的机械工程质量 Gate，在不吸收 Full Test 或后续 D02 correctness/dependency/entropy 职责的前提下阻止 selected mechanical regression。

## Requirements

### Requirement: Stable lightweight engineering Gate
仓库 SHALL 提供一个稳定、显式的 Lightweight Engineering Gate 命令。该命令 SHALL 组合本 capability 定义的 selected mechanical checks；所有 selected checks 通过时退出码 MUST 为 `0`，任一 selected check 失败时退出码 MUST 为非 `0`。

该 Gate MUST NOT 执行或声称拥有 typecheck、build、domain tests、acceptance tests、OpenSpec validation、Archify、dependency-cruiser、Knip 或 Formal Full Test，也 MUST NOT 产生 Formal Verification verdict、Owner authority、Reviewer verdict 或新的 Flowkit lifecycle fact。

#### Scenario: Selected mechanical checks pass
- **WHEN** repository 满足本 capability 的 bounded formatting、selected static lint 与 source-size 规则
- **THEN** stable Lightweight Engineering Gate 命令退出 `0`

#### Scenario: A selected mechanical rule fails
- **WHEN** 任一 selected mechanical rule 检测到 violation
- **THEN** stable Lightweight Engineering Gate 命令退出非 `0` 并保留对应工具/检查的可读诊断

#### Scenario: Correctness checks remain outside the Gate
- **WHEN** stable Lightweight Engineering Gate 被执行
- **THEN** 它 MUST NOT 因为 typecheck、build、tests、OpenSpec、Archify、dependency-cruiser、Knip 或 Formal Full Test 的状态而扩大自身检查面

代码 Gate SHALL 不聚合 Git diff whitespace 或 forbidden tracked-artifact 检查；这些检查归 Git 节点的独立诊断/提交内容核对，不作为代码 Full Test verdict。源码格式/lint/size 的实际违例仍 SHALL 使代码 Gate 失败。

### Requirement: Tracked whitespace and bounded formatting

Gate SHALL 对 bounded source/test/Gate-owned config-script 执行 formatting，不以 HEAD、index 或 tracked 状态决定代码格式扫描。范围包含 src/tests、Gate 配置/脚本、TypeScript config 与 package.json，不扩张至真实 .flowkit/openspec/architecture/.tmp/runtime/生成目录。Git whitespace 可独立诊断，但历史证据/测试输入的空白 SHALL NOT 自动阻断 checkpoint，不得为通过而修改原始材料。

#### Scenario: Tracked trailing whitespace is introduced
- **WHEN** 当前 governed 源码引入 trailing whitespace
- **THEN** 代码 formatting Gate SHALL 检出，无论是否 tracked；非产品历史材料空白不适用该阻断

#### Scenario: Bounded source or Gate config is not formatted
- **WHEN** bounded 格式范围文件不符合 formatter
- **THEN** 代码 Gate SHALL fail

#### Scenario: Durable history remains outside Gate formatting ownership
- **WHEN** 真实 .flowkit/openspec/architecture 历史材料存在或新增
- **THEN** Gate SHALL 不因存在或暂存而将它们加入源码格式范围

#### Scenario: Checkpoint reports unrelated historical whitespace
- **WHEN** Git diff check 对历史 proof/.bin/原始流/已接受脚本报告空白
- **THEN** checkpoint SHALL 不仅因此中止或要求额外豁免，不伪报代码 PASS、不改写历史、不逐 Change 添加 attributes

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
独立 Git 提交内容检查 SHALL fail when Git-tracked paths contain the following selected forbidden artifacts:

- any path segment named `node_modules`、`dist`、`coverage` or `.tmp`;
- repository-root directories `tools/` or `runtime/`;
- files whose names match `*.node-modules.tar.gz` or `*.pnpm-store.tar.gz` at any repository path.

The matcher MUST preserve legal nested paths such as `config/tools/**` and `skills/tools/**` and MUST NOT evolve into a general repository path-mutation policy。

#### Scenario: Force-added root runtime artifact is tracked
- **WHEN** a path such as `runtime/probe.txt` becomes Git-tracked even if `.gitignore` was bypassed
- **THEN** 独立 Git 提交内容检查 MUST fail and identify the forbidden tracked path

#### Scenario: Generated directory segment is tracked
- **WHEN** a Git-tracked path contains a `node_modules`、`dist`、`coverage` or `.tmp` path segment
- **THEN** 独立 Git 提交内容检查 MUST fail

#### Scenario: Environment archive is tracked
- **WHEN** a Git-tracked file name matches `*.node-modules.tar.gz` or `*.pnpm-store.tar.gz`
- **THEN** 独立 Git 提交内容检查 MUST fail

#### Scenario: Legal nested tools path remains allowed
- **WHEN** a Git-tracked path is under `config/tools/**` or `skills/tools/**` and does not match another forbidden rule
- **THEN** 独立 Git 提交内容检查 MUST NOT fail solely because the path contains the name `tools`
