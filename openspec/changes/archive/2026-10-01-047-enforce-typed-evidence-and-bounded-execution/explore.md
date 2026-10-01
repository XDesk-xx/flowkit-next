# D07 Change D — typed evidence and bounded execution Explore

## 当前问题与边界

Owner 已授权激活 D、做有效修正并进行 proof explore。D 的真实目标是让 A/B 的固定命令和 C 的自有 HOW 在新增代码、正式 proof 与宿主权限上形成可检查的闭环。当前 Delivery 仍由外部 Stable manager 管理；本 Change 的候选实现不接管 D07。

本次基线为 Git `50f483b1c36284d325882d831e6e7b65dc1c825e`。A/B/C 已归档并 checkpoint。D 与 F 分工固定：D 约束**新产生的**自有材料与普通执行；F 单独处理合法 `prepared` Run proof 首次进入 checkpoint 的 canonical 链兼容性。历史 Run/Proof 不迁移或重签。

## 已证事实

| 风险与问题 | 最小证明 | 决策影响 |
|---|---|---|
| C 规定生产者完整声明本 Run proof 目录，但固定 `action finish` 是否强制？ | 候选 `checkDeclaredProofs` 只遍历提交的引用。对 C 归档 Run 的实际 23 文件目录，传 `[]` 和只传 1 条引用均返回成功。原始复现程序、stdout/stderr 和来源摘要见本 Explore Run 的 `proof/20261001-038-explore/`。 | D 应在 finish **写终态前**核对本 Run 正式目录的文件闭合集与 `proofRefs`；空目录不应被制造，无目录配空引用有效。只扫描本 Run，不遍历所有历史材料。后续 Reviewer 的按需交接仍可只取已声明引用。 |
| 普通 checkpoint 的精确路径是否可在 Windows 大批量执行？ | C 的真实 202 文件 checkpoint 中外部宿主单次 `git add` 返回 `ENAMETOOLONG`。同一 202 路径清单的隔离 Git 复现再次报该错误；NUL pathspec 输入则完整暂存 202 项。候选 `executeScopedCheckpoint` 当前也把全部 `:(literal)` 路径放进一次 argv。 | 这是 D 的有界执行修正：为现有普通 checkpoint 使用有界、精确的路径输入，保持完整 index 范围、Owner 重验、证据字节和提交对象读回。不得扩张为通用 Git 执行器，也不得靠人工直提作为正常路径。 |
| 新自有可执行代码是否都被类型与质量检查覆盖？ | `tsconfig.json` 只含 `src/**/*.ts`、`tests/**/*.ts`；现有 `scripts/*.mjs` 受 Full Test 输入跟踪，但不受 TypeScript 编译。`quality:gate` 的格式目标只列一个既有脚本。 | Proposal 需冻结新增/实质修改的自有源码范围和精确既有例外；令必要新 TS 辅助代码进入类型检查与实际检查。编译产物、vendor、历史证据、明确测试 fixture 不被误判。不能仅看扩展名或 GitHub 语言比例。 |
| 固定入口是否自动给宿主窄权限？ | 现有入口的可见 target 与 JSON 绑定是产品检查；审批规则仅匹配命令前缀，不能检查所有数据语义。本会话的宿主审批策略不提供交互式规则安装/提示实验。 | 只提供可选、由 Owner 审核的精确安装入口和子命令示例；正反路径/不同 target/不同安装验证须在可测试宿主环境完成。不修改用户全局规则，不允许裸 `node`、`python` 或全部 Flowkit 命令。 |

上述复现使用当前 C 的真实 proof 字节作为只读输入，以及 `.tmp` 内隔离 Git fixture；它不创建 Owner authority、checkpoint 或 Reviewer verdict。隔离实验中的脚本是精确复现输入，已按原字节留在本 Run 的正式 proof；其余 `.tmp` 工作目录可丢弃。来源文件、bytes 和 SHA-256 记录在 `source-boundary.json`，不能把实验 PASS 当作未来 D 实现验收。

## 最小合同方向

1. 在现有 Action finish 证据校验位置加入**本 Run**目录闭合集：每个实际常规文件恰有一条同归属、可读、摘要匹配的引用；引用无文件、目录内遗漏、重复、链接或不可解释条目均拒绝终态。检查发生在 Result 持久化前，不回扫旧 Run；`proof inspect` 的单文件功能仍可用于按需核对。
2. 在现有 checkpoint 宿主内处理大批量 exact 路径：采用受控 NUL pathspec 数据或等效有界机制；路径由已验证 operation 生成，仍逐项检查安全性、工作树/index 身份、无范围外 staged、Owner 当前授权、managed proof 字节与实际提交对象。失败时报告已确认副作用并保留 index，不盲重试、清空或自行提交。
3. 对本 Delivery 新增/实质修改的自有可执行代码、测试与辅助脚本建立小范围可检查规则。现有手写脚本逐文件判断是否触达；少数工具确实要求 JS 时记录精确路径及原因。明确 `.tmp` 数据、可复现 fixture 与正式 proof 用途，拒绝用改名、`-e/-c` 或 stdin 代码绕开正常固定入口。
4. 宿主权限说明仅覆盖选定的固定安装/固定子命令及可见 target；数据内目标须由入口继续核对。只读、记录写入、项目检查和 Git/网络分开处理，保留审批与沙箱边界。

## Proposal 前可闭合的验证边界

- 用实际 finish 负例覆盖“目录三个文件只声明一个”、空引用但有文件、伪路径/链接；正例覆盖完整声明及无新材料。失败前后三文件状态必须可读回，不能报告 terminal 成功。
- 用超过 Windows argv 限制的精确多路径 fixture 验证宿主成功 checkpoint 与对象/范围读回；另测范围外 staged、index 漂移、部分 stage 失败和 response loss。测试不对真实远端操作。
- 证明新增 TS 辅助代码确实进入类型/格式/运行检查；既有精确例外与跨语言 fixture 保留。窄权限示例的匹配与不匹配需要实际宿主能力，无法在本 Explore 的审批配置中声称已验证。

不引入证据平台、Registry、全仓历史扫描、通用脚本执行器或新的生命周期状态；不在 Explore 中修改生产实现、生成 Proposal/Review verdict、执行 Full Test、checkpoint 或 push。

**Explore 结论：PASS（Proposal-ready）。** 两个直接阻断正常路径的缺口已由有界复现定位，修正归属和失败边界可在 D 的 Proposal 中冻结。宿主交互式授权体验与修正后的实现效果仍待相应阶段验证。
