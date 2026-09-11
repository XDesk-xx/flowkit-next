# 013 review-apply

Owner 指令：根据最新run，review。

有效目标：`008-explore → 009-review-explore approved → 010-propose → 011-review-propose approved → 012-apply`；本次只审查 `separate-manager-assets-from-target-project` 的最新 Apply，不以最大目录号猜阶段。

依据独立 `.agents/skills/review-apply/SKILL.md` 执行；不读取或使用 candidate `skills/actions/review-apply/SKILL.md` 作为 HOW。沿用当前 D05 manifest 的 independent-bootstrap，不调用 candidate 接管真实仓库生命周期。

## 审查结论

`approved`，无阻断 finding。

- 安装来源由自身模块/package 决定；target 同名 package/lock/Guidance 不接管。Action 与四种 Delivery operation 的准备和实际读取使用 manager，项目 I/O、cwd 和历史仍属 target。
- CLI machine request、Action/Run/Policy/权限语义保留；所需 OpenSpec 仍来自 exact FLOWKIT_HOME runtime，缺失不回退，非工具路径不新增 runtime preflight。
- 真实发行安装共 75 文件；41 个生产模块与当前源码隔离干净编译输出一致。生产依赖声明仍仅 yaml，未打入开发历史、bootstrap HOW 或 executable runtime。
- 独立复跑 131 项定向 domain、6 项 Windows 安装验收及 typecheck/diff-check 均通过；Author Linux 262 + 6 的适用证据经核对，不冒称本次 Linux 重跑或 Formal Full Test。

## 必需评估

- current step：核对 approved Proposal、实际 diff、全部直接调用点、安装验收与当前证据绑定。
- complexity / minimality：一个小型安装描述及明确参数传递属于必要闭包；Integration ref 的局部抽取保持 650 行 gate，无新增平台、注册表或依赖。
- new content / scope drift：NONE；宿主 Action 接通、Full Test 范围/保存、Start 去 Git 前置、Final 简化和 Git 调用仍留给后续 Changes。

独立复核方法与实际输出见本次 proof；失败启动保留且明确属于 Reviewer 自有脚本/环境，没有修改 Author。受保护 1929 个文件/删除标记的前后摘要一致。

后续仅报告既有 approved → archive 交接事实，不执行 Archive，不产生 Owner/Git authority。terminal 后 STOP。
