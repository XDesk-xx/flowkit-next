## ADDED Requirements

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
