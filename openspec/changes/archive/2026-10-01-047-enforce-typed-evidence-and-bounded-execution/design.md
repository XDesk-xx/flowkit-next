## Context

见 [proposal.md](proposal.md) 和已批准的 Explore。现有 `action finish` 在 `src/cli/action-commands.ts` 调用 `checkDeclaredProofs`，但该函数只检查传入引用；`executeScopedCheckpoint` 将所有 exact 路径放入一次 `git add` argv；`tsconfig.json` 只覆盖 `src/**/*.ts` 与 `tests/**/*.ts`。这三个现有接点足以完成修正。D07 的 formal lifecycle 仍由外部 Stable manager 执行。

## Goals / Non-Goals

**Goals:** 在已有 finish、checkpoint 和源码检查接点强制本 Run proof 闭合集、超长路径的精确有界暂存，以及新增自有执行源码的可验证检查。权限说明只给选定安装与可见 target 的可选窄示例。

**Non-Goals:** 不引入新状态、通用 Git/代码执行器或证据 Registry；不迁移历史 proof；不处理 F 的 prepared checkpoint 准入；不修改用户全局宿主规则或把 typecheck/Full Test 并入 `quality:gate`。

## Decisions

### 1. 在既有 finish 检查点核对本 Run proof 目录

扩展 `checkDeclaredProofs` 或其紧邻的 finish 专用校验，而非另设证据入口。先由固定的 Delivery/Change/Run 标识计算唯一正式目录，仅枚举该目录的实际条目；逐项拒绝链接、非普通文件、逃逸、不受支持的嵌套形状或不可读取条目，并用既有 `inspectActionProof`、原始 Git 字节规则及摘要检查验证引用。将规范化的实际相对路径集合与引用集合做双向、唯一匹配。正式目录不存在时只接受显式 `proofRefs: []`；不创建空目录。若此前 Run 的引用是本次 handoff 所需材料，只按需核对，不能拿历史目录当作本次生产集合。

校验位于 `context.json`/`result.json` 首次写入之前；失败保留 `action.md` 和全部材料，并沿用现有 `proof-invalid` 诊断。选择这一接点，是因为现有引用检查已在那里运行，而且 Result admission 与 Policy 不应代替文件完整性判断。替代的“只检查 Result 中列出的引用”已被三文件只声明一项的证明否定；扫描所有历史 proof 会改变既有按需消费边界。

### 2. 将精确路径作为有界数据送给现有 Git checkpoint

在现有 Git 宿主内部加入一个只供 checkpoint 暂存使用的 stdin Buffer 调用：`git --literal-pathspecs add --pathspec-from-file=- --pathspec-file-nul`，Buffer 由已验证、排序去重的 `operation.paths` 以 UTF-8、NUL 结尾编码。保持现有 `isExactGitPath` 等路径安全约束，拒绝编码往返失败与 NUL；不接受 caller 提供 Git 参数、目录、glob 或可执行源码。这样 argv 长度固定，单次 Git 调用仍覆盖完整授权集合；无需批次暂存形成额外中间状态。若目标 Git 版本或受支持平台不具备该语义，明确失败，不静默回退为超长 argv 或 shell。

保留 `executeScopedCheckpoint` 已有的 preflight、Owner 来源重验、分支/HEAD、工作树/index 指纹、无范围外 staged、managed evidence 原始字节及提交对象读回。进入 stage 前标记可能副作用；异常时读回 index/HEAD，只报告已确认效果，不能从子进程失败码推断“没有写入”，也不自动重试或清空。对暂存之后、commit 之前的核验仍按完整授权路径集合执行。替代的多批次 `git add` 增加部分成功分叉；把 pathspec 写到可复用文件会引入额外持久输入与归属问题。

### 3. 使用现有源码树证明新增执行代码被检查

受控发现从仓库根递归读取当前工作树的普通文件，包含未跟踪文件、新建目录、`src/**`、`tests/**`、`scripts/**`、`skills/**`、`.agents/**`、根配置和其他自有位置；识别 `.ts/.mts/.cts/.tsx/.js/.mjs/.cjs/.jsx/.py/.ps1/.sh/.cmd/.bat`。只排除明确非产品源码的 `.git/**`、`node_modules/**`、`dist/**`、`coverage/**`、`.tmp/**`、`.flowkit/**`、`openspec/**`、`architecture/**` 与已标明上游来源的 `skills/vendors/openspec/**`。遍历中的链接或不能分类的可执行文件不得静默跳过。排除仅表示材料/产物不参与这个源码检查，不允许在这些位置存放正常生命周期执行入口；标准 HOW 与请求形状另行核对。该发现以当前文件内容为输入，不借用 Git HEAD、index 或旧提交判定“新”。

默认批准的自有执行源码位置是 `src/**/*.ts`（产品）和 `tests/**/*.ts`（测试）；它们进入 `tsconfig.json`、Prettier、ESLint，产品 TS 进入 `tsconfig.build.json`，测试进入实际相关测试命令。新辅助逻辑也应落在其中，必要的发行薄入口须逐文件说明工具约束、格式/语法及运行检查。受控发现中的其他新增可执行文件一律失败，直到以明确的受检 TS 位置或逐文件合同修订解决。`dist/**` 的 JS 只由构建产生，不算手写例外。以下是当前完整的七项**未触达遗留 JS**，其 exact 路径和 SHA-256 同时构成当前内容例外；没有泛化的 `scripts/**` 或 `tests/**/*.mjs` 豁免：

| Exact 文件 | 当前 SHA-256 | 分类与保留原因 | 现有对应执行检查 |
|---|---|---|---|
| `dependency-cruiser.config.mjs` | `b2faff94dd1bb58d59f645ebdde50788c976da9ff638ba3c5ce16500e256b833` | 工具配置，现存 JS 模块 | `pnpm quality:dependency-health` |
| `eslint.config.mjs` | `03d491ab3aa03396a4780763cfb99bfdfb0edac71e22239964423f30047ccadd` | ESLint 配置，现存 JS 模块 | `pnpm lint` |
| `scripts/build-production.mjs` | `6984d2ea55d874885731d2b6217bf9d10b8c77788648eebcc744862f1ca5df2b` | 现存构建入口 | `pnpm build` |
| `scripts/check-forbidden-tracked-artifacts.mjs` | `0b821d01dc5f1b7494d7b95410f21b7b2e76eaf6d8b6fcdedfcab317e8d2c968` | 现存仓库卫生检查入口 | `pnpm check:forbidden-tracked-artifacts` |
| `scripts/check-production-reachability.mjs` | `3fda79c8084234030a03184e9f490641124e26cb90e8c4d7ac085e7571107294` | 现存生产可达性检查入口 | `pnpm quality:entropy` 与 `pnpm test:entropy` |
| `skills/delivery/repository-integration/references/git-host.mjs` | `cd57ff06916b35d8b68ea92734b4e6c3c46ba9cf492ece101f1574713434313b` | 发行 Skill 对构建产物的现存 ESM 薄导出 | Git 宿主 acceptance 测试及打包后导入 |
| `tests/unit/quality/production-reachability.test.mjs` | `1ea696ce7575ba5ec9097635683390e34aa38837e54d9b817d67cde16e504ec2` | 可执行 `node:test` 测试套件，**不是 fixture** | `pnpm test:entropy` |

这七项只在路径和原始 SHA 同时匹配时享有未触达遗留例外；内容变化或新文件不能用“历史文件”名义自动通过。确需改动其中的 JS 时优先迁入受检 TS；若特定工具必须保留 JS，先逐文件说明原因并将 `node --check`、适用格式/lint、对应运行检查纳入验收，更新精确例外供 Reviewer 审查。真正跨语言 fixture 只在 exact 原始字节为测试输入且不作为执行套件时单独列明；当前受控发现内没有此类 JS fixture。小型发现检查验证范围与七项内容身份，配合测试证明未跟踪的新 `scripts/`、`skills/`、根目录或新自有目录 helper 会失败，合法 TS 与构建 JS 不误报。`quality:gate` 保持原有轻量组成，typecheck/build/运行另行执行。

`.tmp` 保存可丢弃请求、诊断与隔离实验；正式 proof 如需保留实验脚本，生产 Run 必须声明其 exact bytes、归属与复现用途，并接受决策 1 的闭合集。更新 C 的固定命令 HOW，清除标准生命周期步骤对临时 Node/Python 程序的依赖。发行 JS 属于受检 TS 的构建输出，不作为手写 JS 例外计数。

### 4. 权限示例只描述可见宿主调用

在发行接入文档按只读、受控记录、项目检查以及 Git/网络分别给出可选示例，写明安装的绝对固定入口、确切子命令及其**实际支持**的可见 target 参数。`proof inspect` 和适用 support 命令可由入口核对可见目标与 JSON；Foundation `status/next/doctor` 当前只接受 `--input`，不能用请求文件路径或 stdin 冒充宿主前缀可匹配的项目绑定，也不为它们给出“按 target 自动放行”示例。宿主前缀规则不能检查 JSON 的全部含义；示例不得包含裸 `node`/`python`、其他安装或所有子命令的通配放行。能实际运行宿主规则时验证匹配及其他安装/target/命令反例；当前宿主若不提供交互式规则测试，只记录未验证，不承诺零提示。由 Owner 选择是否安装规则。

## Risks / Trade-offs

- [Proof 目录结构或链接判定遗漏] → 针对遗漏、重复、链接、目录、摘要漂移及空目录分别做正反例；失败前后读回 Run，确保没有 terminal 文件。
- [stdin pathspec 在 Windows/平台层编码或子进程响应异常] → 用足以复现 argv 上限的隔离真实 Git fixture 验证精确 staged/commit 对象，另测响应丢失与部分 stage 后的读回；不在真实远端试验。
- [源码检查误伤 fixture 或遗漏新增辅助代码] → 列明 exact 例外与原因，测一个落在旧盲区的新 helper 负例，分开运行 typecheck、格式、构建与相关行为测试。
- [宿主规则被误解成 Owner 授权] → 文档分清命令前缀匹配与 CLI 数据校验，交互式宿主效果未实测时明确记为未验证。

## Migration Plan

只修改当前候选与其测试/发行说明；历史 Run、proof、Git checkpoint 及用户权限配置保持原样。实现与回归在独立 Review 通过后由正常 Delivery 继续，仍由外部 Stable manager 管理。若验收失败，修正当前候选源码；不重签历史证据或自动回滚用户 index。
