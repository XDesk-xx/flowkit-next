# 隔离宿主验收 Explore

本 Change 是 D05 已批准 tasks 6.1 的独立验收目标，不是 Flowkit 产品新需求。验收用 manifest/activation 是明确标记的 fixture 输入，不把它当作真实用户项目的 Owner 决定；Author 的观察与后续 Reviewer 审查必须真实执行。

目标：给这个空 target 增加一个可通过 Node 执行的小程序，运行 `node feature.mjs` 时输出单行 `status: available` 并正常退出。仅展示这个程序自身的固定功能说明，不读取 Flowkit 状态或宣称系统健康。

事实：已读取 manifest，当前唯一 active Change 为 describe-running-feature，已有 projectOrdinal 1；其他 Change 保持 planned、不预留 ordinal。已通过 exact OpenSpec 1.10.0 CLI 创建 scaffold 并读取 status。实际目录只有 openspec 与本次 .flowkit 过程材料，无既有生产代码或依赖可复用。Node host 为 v22.23.2，平台为 win32。

必要 proof 位于本次 Run 的 proofRoot：inspect.mjs 是实际观察方法，inspection.json 与各命令原始 stdout/stderr 记录真实命令、时间和退出状态。观察不是实现 PASS，也不是 Reviewer approved。

最小方向：一个无第三方依赖的 feature.mjs，加一个 Node 原生测试验证精确 stdout 与退出状态；不增加配置、注册表、模型调用、自动流程、Git 或 Full Test 能力。无参数是当前输入域，命令行参数行为留在范围外。

关键风险是把固定展示误当运行状态事实，因此合同应明确它仅是固定功能说明。没有文件写入或外部副作用，无需恢复机制。验收后用 OpenSpec 合同、代码和真实测试作事实来源，不让展示文本取得 authority。

结论：PASS，已具备最小 Proposal 方向；当前未实现 feature.mjs，交独立 review-explore。仅明确交接 inspection.json 与此 Explore，保留但不要求下阶段默认重读所有原始输出。
