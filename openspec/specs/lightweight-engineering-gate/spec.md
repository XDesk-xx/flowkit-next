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

### Requirement: New owned executable sources have verifiable typed coverage

本 Delivery 新增或实质修改的自有产品、测试与辅助可执行源码 SHALL 默认使用 TypeScript，并实际进入适用的 typecheck、格式/lint、构建或运行检查；发行 JavaScript 编译产物 SHALL 可追溯到受检查的 TS 输入。受控发现 SHALL 覆盖仓库当前自有源码树及新建自有目录中的执行源码，不仅检查 `src/`、`tests/` 或已跟踪文件；以 exact 路径加内容 SHA-256 冻结未触达的现存 JS 例外，新文件或内容变化 SHALL 重新进入 TS 默认规则或明确的逐文件工具约束评估，不依赖特定 Git 历史。已批准的设计 SHALL 列出每一现存 JS 文件的分类、原因与对应检查。`.flowkit/` 历史及当前 proof、`.tmp/`、构建输出与第三方 vendor 按材料或产物边界处理；其中的必要实验须遵守本 Run proof 声明，不能被改作标准生命周期执行入口。改变位置或扩展名、或使用 `-e/-c`、stdin 代码 SHALL NOT 规避新自有源码及固定 HOW 的规则。真正跨语言 fixture 按 exact 路径和用途界定，不能将可执行测试套件泛称 fixture。此要求的 typecheck/build/运行证明 SHALL 与既有轻量 `quality:gate` 分开，不能悄然将 Full Test 或正确性检查并入该 Gate。

#### Scenario: New owned helper is not checked
- **WHEN** 新增自有可执行 helper 位于原检查遗漏的目录，或仅靠改扩展名/位置规避 TS 与适用检查
- **THEN** 相关源码政策或验收 SHALL 失败，不能声称已满足 typed coverage

#### Scenario: Exact legacy exception or true fixture
- **WHEN** 一个 exact 现存 JS 文件仍为原始内容，或一个跨语言 fixture 的原始字节确为测试输入
- **THEN** 其路径、现存内容身份、用途、分类、例外原因和对应检查 SHALL 可核对；内容变化或新文件 SHALL 不继承该例外，可执行 `node:test` 套件 SHALL 按测试而非 fixture 分类

#### Scenario: New helper outside old checked roots
- **WHEN** 新 helper 位于 `skills/`、`scripts/`、根目录或其他新建自有源码目录，尚未进入受控 TS 与适用检查
- **THEN** 受控发现或验收 SHALL 拒绝它，不能靠 Git 未跟踪状态、目录命名或不在 `src/`/`tests/` 内规避检查

#### Scenario: Normal compiled output
- **WHEN** Node 运行由受检查 TS 构建产生的发行 JavaScript
- **THEN** 不得仅因运行时扩展名为 `.js` 判为手写源码违规

### Requirement: Temporary data and retained proof keep distinct purposes

新的标准 Flowkit 生命周期调用 SHALL 使用已发行的固定数据命令，不要求 Agent 生成临时 Node/Python 状态程序；`.tmp` SHALL 只承载可丢弃请求、诊断、隔离实验及必要过程材料。正式 proof 中保留可执行实验或被测脚本时，生产者 SHALL 在本 Run `proofRefs` 中声明 exact bytes、身份与具体复现用途；其原始输入不可由摘要、改名日志或后补无归属文件替代。历史 proof SHALL 不追溯删除、迁移或重签；此用途边界 SHALL 不创建通用证据 Registry，也不替代独立 Reviewer 对证据真实性的判断。

#### Scenario: Standard Action needs only fixed command data
- **WHEN** Agent 执行受支持的标准开始、结束或证据检查
- **THEN** 自有 HOW SHALL 指向固定数据命令，不把临时脚本、动态导入或嵌入代码字符串作为正常必需步骤

#### Scenario: Necessary experiment is retained
- **WHEN** 一个 bounded 实验必须保留精确脚本以复现结论
- **THEN** 生产 Run SHALL 按原始字节声明该文件与用途，并同该 Run 其他 proof 一起满足闭合集；不把它冒充标准生产执行入口
