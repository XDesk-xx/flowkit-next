# 041 review-apply

## 结论

审查 `20260909-040-revise-apply`，批准合同为 `033-review-propose` 所确认的计划。Verdict：**approved**，无新增 finding、无 contract blocker。

这是当前 Change 的独立 Apply 审查通过，不是 D05 Formal Full Test PASS、Delivery completion 或 Owner/Git authority。

## Finding 收敛

- **D05-RA039-001：verified-corrected。** 原样独立重跑 `node --conditions development node_modules/review-tool/cli.cjs` 反例：实际工具改为失败后，inputRef/checkRef 改变，current reader 从 passed 变为 stale；新实际失败成为 current failed。见 `attempt-02/option-observations.json`。
- **D05-RA035-001：verified-preserved。** 直接启动工具反例仍检测 bytes 漂移；相关测试覆盖包内实现与 preload 变化，不扫描无关包。见 `attempt-02/observations.json` 及 focused 原始结果。
- **D05-RA035-002：verified-preserved。** 四类准备失败诊断仍明确；测试验证未知字段、缺输入/工具、malformed JSON 等不会伪造开始，也不回显受检敏感参数。
- **D05-RA037-001：verified-preserved。** 新建和覆盖已排除报告均为真实 check/Full Test/current passed，files/configRef/inputRef/toolRef 保持。见 `attempt-02/output-observations.json`；script、-- 和 eval 回归保持。

当前 helper 在明确支持的 Node 形式中消费选项值、识别入口/preload，并在脚本 argv 边界停止。不支持或无法可靠解析的启动形式在准备阶段具体拒绝，不静默接纳缺失资源身份。测试同时覆盖条件值同名文件不被误绑、后续 preload 不被漏绑、8 种不可靠形式不建立 attempt；没有把支持范围扩大为完整 Node CLI 解释器。

## 候选、证据与独立验证

- 221 个本次 Author 交接/证据引用已核对真实路径、bytes 与摘要；48 个累计候选文件覆盖祖先，仅申报的 2 个文件变化，其余 46 个保持。
- 8 份计划与真实 Delivery manifest 保持祖先 bytes；任务 20/20 的状态未改。没有扩大 Skill、Policy、Runtime、三文件 Run schema 或 Git 范围。
- 本次独立 focused **33/33**、typecheck、exact OpenSpec 1.10.0 strict 通过。三个探测退出 0 表示真实观察完成，审查判断来自其具体观察值，不把退出码自动当产品结论。
- Author 最终 Windows domain **296/296**、acceptance **6/6**；Linux linux-02 的 9 个配置检查、保存结果、start/input/config 对应及跨进程/.tmp 清除后读回已核对。其先前 domain-01/linux-01 的 --version 遗漏失败仍保留；最终明确补回无值 --version/-v，没有削弱旧测试。
- 本轮未重跑全部 Linux，也未调用 candidate 管理真实 D05；Author Linux 为普通 code-only target 验收，不是 D05 Formal Full Test。
- Reviewer sandbox attempt-01 的真实 EPERM 留存；相同命令获准在 attempt-02 执行，原始 stdout/stderr 和命令元数据 create-once 保存，未覆盖。
- 前后 tracked/nonignored untracked 文件与删除标记摘要相同，HEAD 相同，仅本轮 Reviewer Run/proof 被排除；此为 mutation isolation，不是新的产品 SHA 准入门槛。

## 必需评估

当前步骤：完成有界 revise-apply 的独立审查，核对上轮 finding 收敛、批准合同和未改候选连续性。

复杂度 / 最小性：修正在同一 helper 与对应回归测试内完成（144/396 行）；明确支持范围与失败诊断足够，没有新依赖、Registry、动态解释器或证据平台。

新内容 / scope drift：**NONE**。支持选项的具体识别和不可靠形式拒绝属于已经批准的工具身份要求，不是新的功能层。项目 inputs 和实际命令扫描范围仍须一致；不是通用命令沙箱或任意依赖图扫描。

## 当前解耦边界与交接

本 Change 将测试范围从 Git visibility 解耦：由 target 配置决定产品输入和检查，输入/工具/配置有效性与过程材料完整性分别核对。必要开始、命令原始输出和结果长期保留 target artifacts；Delivery 只关联当前 attempt，新失败或 partial 不回用旧 PASS。三文件 Action Runs 不扩张，.tmp 可丢弃；代码 gate 与 Git checkpoint 检查分开。

前序 Archify 独立化、manager/target 资产分离、Action 执行接通已在 manifest 标为 completed；当前审查不重演这些历史。Start、完整 Final/整仓摘要与 Git 调用的剩余耦合，仍由 planned 的 `simplify-delivery-coordination` 和 `invoke-git-at-workflow-boundaries` 处理，不能把本次 approved 表述为整个 D05 已全部解耦。

后续交接为既有 `archive` 边界，实际调用仍按相应 authority/host boundary。本轮不自动执行 Archive、真实 D05 Full Test、Git 或下一 Change；不修改 Author 内容或历史，保存本次真实结果后 STOP。
