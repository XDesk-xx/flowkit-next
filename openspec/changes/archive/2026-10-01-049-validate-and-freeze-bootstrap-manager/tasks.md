## 1. 当前候选检查

- [x] 1.1 记录当前 Git 基线、相关未提交发行输入、Node/pnpm 版本和确切检查命令；核对来源与原始输出，且不将 `20261001-062-apply` 的失败改写成 PASS。
- [x] 1.2 聚焦诊断 `test:domain` 的 managed evidence index fixture 失败和 `check:forbidden-tracked-artifacts` 的 `ENOBUFS`；仅作必要的窄范围修复或可证实的环境归类，再运行受影响检查并核对真实退出状态。
- [x] 1.3 运行当前适用的 typecheck、build、主要回归、quality gate、结构/熵检查和发行文档命令核对；保存必要原始流与结果，任何未解决的新失败均保持 E 未完成。

## 2. 实际包与固定入口

- [x] 2.1 从通过检查的当前候选产生实际 tgz，保存原始包、SHA-256、包名版本和成员清单；核对 `bin`、运行依赖、全部被引用的自有 Skills/references、帮助、onboarding 与工具 lock 均在发行包内。
- [x] 2.2 在不覆盖 D07 外部 Stable manager 的新目录仅安装生产依赖；从安装内 CLI 及 exact OpenSpec 运行 `doctor/status/next`，分别核对缺 OpenSpec root 的拒绝与正确接入后的结构结果，并确认不借源码 checkout 或 devDependencies。
- [x] 2.3 以现有回归和隔离 fixture 核对安装内固定 Action/支持命令的合法调用、冲突输入、prepared/partial 和必要 proof 拒绝；保存命令/结果引用，确认标准调用不需要临时生命周期脚本或动态执行字段。
- [x] 2.4 完成 Linux x64 glibc detached 主验收及既有 Windows 兼容性模拟，核对环境身份、实际结果和未覆盖宿主限制；不把任何 fixture 结论描述为真实独立项目或新 Agent 会话验收。

## 3. 发行候选交接

- [x] 3.1 读回当前包、隔离安装、固定命令、适用检查和平台证据；逐项核对新 Owner 范围与原计划保留的历史事实，任何必需项缺失则报告未满足而不冻结。
- [x] 3.2 仅在本次发行验收成立后形成包外简洁候选记录，列出构建来源、包名版本、tgz SHA-256、工具及 Skills、安装位置、检查引用和真实使用未验证范围；核对无包/提交自引用，也不宣称 Owner 已选定 Stable manager 或授予 Full Test、Final、Git 权限。
