## MODIFIED Requirements

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
