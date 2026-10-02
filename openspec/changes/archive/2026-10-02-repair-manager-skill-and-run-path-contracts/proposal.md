## Why

两个真实项目暴露出 manager 对 Change 的语义 ID、编号 Run 分组和项目根相对产物路径使用了不同解释：LearningPlatform 的编号 Proof 无法检查且可能被 finish 漏检，MenDi 的 Proposal 在 Review 前被重复拼接路径。现有 Skill 文案还会引导 Agent 使用有歧义的 Proof 目录，而已启动 Run 的 Guidance 摘要禁止直接热替换。

## What Changes

- 为 Action Proof 定义统一的 Run 归属与目录解析：新材料使用与 canonical Run 分组同名的 `NNN-<changeId>` 目录；已有语义 `<changeId>` 目录继续可读。inspect、finish 全量闭合、后续引用和受管理 Git checkpoint 采用同一规则；同一 Run 两种目录并存、编号目录被空 `proofRefs` 漏报等情况在写入前拒绝。
- 统一 Proposal `artifactHashes` 的项目根相对路径合同，在 Author Propose 成功 Result 接纳时及 Review Propose 启动前核对真实文件、范围与 bytes，修复重复拼接。
- 澄清发行 Action Skills、仓库 bootstrap `.agents/skills/**` 中的同类说明、onboarding 与相应规格中的 Proof 路径和未完成 Run 恢复说明；保持已绑定 Guidance 的 exact `package-drift` 保护，通过受控安装/切换顺序处理现有 prepared Run。
- 增加编号与语义路径、双目录冲突、漏报 Proof、Proposal→Review Proposal、受管理 checkpoint 及 prepared 恢复的回归测试；两个目标只读核对原始绑定与材料，隔离 fixture 验证相同路径形态的机制，不把复制后的目录冒充原 Run 恢复。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `action-guidance-execution`: 明确发行 HOW 为新 Run 选择编号 Proof 目录，读取旧语义目录，并说明已开始 Run 的 Guidance 绑定与恢复。
- `stable-action-command-execution`: 对 inspect、finish、后续 Proof 消费及 Proposal artifact 路径实施一致的归属和字节检查。
- `repository-integration-and-next-base-continuity`: 受管理 checkpoint 对两种合法 Proof 目录使用与 Action 相同的 Run 归属，拒绝模糊或未声明材料。

## Impact

影响 `src/cli/action-proof.ts`、`src/cli/action-readiness.ts`、Propose Result 接纳、`src/internal/managed-evidence-checkpoint.ts`、相应产品与 bootstrap Skills、`docs/onboarding.md` 和有界回归测试。LearningPlatform 与 MenDi 的现有 Run/Proof/Proposal bytes 保持不变；不新增通用路径注册表、迁移器、自动工作流、Git 或 Owner 权限。本 Change 的 Proposal/Apply 不自行切换两个目标的 manager，也不执行它们的正式 Action。
