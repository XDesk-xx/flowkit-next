# Review Apply

- Change：`allow-prepared-author-same-stage-continuation`
- 日期：2026-10-09
- 基线：`main / 0e0d8106d2cdf632e9aacbc61311cbe6e6d762db`，审查对象为当前未提交候选。
- 结论：**approved**
- Findings：无 actionable critical/high/medium 问题，无阻断项。

## 当前步骤与合同一致性

本次独立 review-apply 消费已批准 Proposal、当前实现、测试和真实检查记录。沿用直接 OpenSpec 方式，没有创建 Flowkit Run。外部固定 manager 的 doctor 通过；status/next 仍报告当前 Change 无 coordination，未将 candidate CLI 当作管理自身的 Runtime authority。

实现只改三个生产文件：结构层允许同名 revise prepared candidate；Policy 保留普通 reuse，并将 correction 统一送入 supersession；历史链对同名 prepared revise edge 强制检查 child 的 exact Owner fact，不允许 normal READY fallback。same Delivery/Change、完整 prepared pair、四槽 null、角色、阶段和单项 scope 约束仍生效。普通 prepare、terminal PASS、terminal FAIL correction、安全 Archive retry 及普通 prepared 历史读取兼容保持原边界。

已核对 start/helper、finish、inspect 的实际消费路径：先用绑定的 Owner 和 parent 评估 Policy，再重建结构/package/Guidance；无需复制一套授权规则。新 descriptor-only 仍使普通查询报告 incomplete；完整后继读回成为唯一 tip。重复 finish 仅接受相同结果，旧 Run 不被重写。

批准时的 11 份规划输入逐项核对：仅 tasks 的完成勾选变化，其他 bytes 保持原审批输入。9 个实现/测试/文档文件与 Author 交接身份一致。

## 复杂度与范围

复杂度与最小性：满足最小实现要求。没有新依赖、命令、状态、字段、注册表或通用重试框架。测试覆盖新增多轮行为及其负例，docs/onboarding.md 解释 normal READY 与新 occurrence 权限差异。

scope drift: **NONE**。Guidance 的 11 个文件保持原 SHA-256；未扩大容量修复、原项目业务开发或 manager 更新范围。真实 fixture 中的 Review start 是机械验收，未将其称为实际独立 Reviewer 批准。

## OCR 辅助覆盖

使用 Open Code Review 插件的 delegate 模式，OCR 提供文件选择和规则解析，没有调用 OCR 外部 LLM。

- OCR selected：18/18 reviewed，0 skipped，coverage_rate=100%。
- OCR excluded：32/32 补充审查，包括五份测试、文档、规划和原始日志。
- 工作树初始范围合计：50/50 accounted for。每个文件以 path/status 与 SHA-256 记录；本次新增 Reviewer 文件不混入初始候选。
- 最终 verdict 由本次独立语义审查与复验形成。

## 独立验证

| 检查 | 本次结果 |
| --- | --- |
| 12 份相关 domain/CLI 回归 | 67 PASS，0 FAIL |
| 候选安装包的三个阶段多轮续跑及负例 | 6 PASS，0 FAIL |
| 候选安装 acceptance | 7 PASS，1 SKIP，0 FAIL |
| 重新 build、typecheck、quality:gate | exitCode=0 |
| 精确 OpenSpec 1.10.0 strict validate | exitCode=0 |
| 候选安装/重建身份 | 139 个安装 payload hash 匹配；其中 138 个非 metadata 文件与重建源码输出逐项一致 |
| 旧完整 prepared 兼容 | 候选只读 inspect 原 Run 015 为 complete/prepared，三文件查询前后不变；337 个 proof 引用逐项 bytes/SHA-256 匹配 |

候选包 SHA-256：`830bd98eaaa49051bbd7636234b72fa5422bbfc974c7ab5773cf840f945e9158`。Author 的原始日志 bytes/hash 和 TAP 计数已核对；原有检查记录没有被覆盖。本次检查原始流、命令、退出状态、覆盖清单与候选身份见 [review-apply-20261009.json](evidence/review-apply-20261009.json) 及其引用材料。

限制：当前主机为 Windows；native Windows exact OpenSpec 专项因既有条件未启用而 SKIP。本次没有执行 Linux x64 detached 验收，也不声明 Formal Full Test PASS。

## STOP

本轮实现审查通过。已保存并读回 Reviewer 报告与证据，停止于 review-apply；未执行 Archive、原项目新 Run、固定 manager 更新或 Git mutation。
