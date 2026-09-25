## 1. Policy 与结构边界

- [x] 1.1 扩展纯 Policy 输入与判定：上游唯一 tip 提供 `preparedCurrentRunId`、`preparedRunContext`、`preparedResult`，核对三者 runId、CurrentAction identity、`prepared/author` 与四个 null 槽后才允许现有 stage matrix 的同阶段/更早 revise；以 Policy 单元测试核对缺项、错 RunId/identity/state/role、non-null outcome、缺失/错配 authority、Reviewer prepared、archive/completed、前跳的确定 BLOCKED，以及无 correction 的原 Action。
- [x] 1.2 增加不改变 `prepared/terminal` 状态集的有界 supersession structural transition，普通 prepare 仍拒绝 prepared slot；以 lifecycle 单元测试核对合法/非法 target、单 current 和原 slot 不变。

## 2. 新 occurrence 与执行顺序

- [x] 2.1 在 Action start 中绑定同一 Policy 决定、Owner authority、target、GuidanceRef 和新 ActionPackage，按先校验再 create-once 保存/读回开始 descriptor 的顺序暂存 supersession；以 start 测试证明校验失败不改旧 Run、不开始业务工作。
- [x] 2.2 让 canonical Run-chain 接受精确 Owner-linked 的 prepared Author → revise child，保持旧三文件/proof 原字节、null outcome 与唯一 tip；以链读取测试核对合法 child、错误/缺失 authority、错误前序和竞争后继。
- [x] 2.3 处理新 occurrence 的开始读回、业务工作、context/result 保存失败：保留 partial 或真实 prepared 记录、报告 exact incomplete 并 STOP；以故障注入测试核对不清理、不回退猜测、不自动补成功。

## 3. 连续性验证

- [x] 3.1 用 LP `089/prepared apply` 的等价只读 fixture 覆盖 `revise-apply`、`revise-propose`、`revise-explore` 与未授权拒绝；以 fixture 哈希和测试结果证明 LP 原件未修改、旧 outcome 未转成 PASS。
- [x] 3.2 验证新 revise terminal 后稳定地进入对应独立 `review-*`，且旧自动检查不被当作新 Apply 验收；运行适用的类型检查、单元测试、OpenSpec strict validation 和 repository quality gate，记录真实结果与限制。
