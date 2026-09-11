## Why

D05 已有安装分根、只读查询与真实 Action 记录，但首次接入和新 Agent 会话入口尚未形成可直接使用的说明；README 还混合 D02 历史与当前行为。本 Change 按 Owner 授权补齐接入能力并退役三份旧根规划，不认定新的内核故障，也不重开前六个 Change。

## What Changes

- 随固定实际发行包交付接入说明及项目短入口模板，说明安装、exact OpenSpec runtime、按用途准备的最小项目材料，保留已有内容。
- Agent 先确认 target、实际 Role 和安装来源，再查询合法边界并读取对应 canonical Action Skill；不新增自然语言代码路由、CLI 写命令或自动流程。
- 整理 README 的当前产品说明与历史记录；真实 Author 工作、独立 CLI 进程读回、真实新会话读取分别验收，不以 fixture/重启 CLI 补跨会话 PASS。
- 删除 Explore 明确列出的三份根 flowkit*.md；在清理交接中保留原路径和 Git 恢复出处，不改旧 Runs/archives 或活动 Start 的规划输入合同。

## Capabilities

### New Capabilities

无；复用已有发行、查询及 Action Guidance 归属。

### Modified Capabilities

- `foundation-cli-surface`：补充随包首次接入说明、薄 Agent 入口及真实新会话可用性条款；三命令与查询/Policy/Run 实现合同不变。

## Impact

- README.md、新随包 docs/onboarding.md（含可复制的短 AGENTS 入口区块）、package.json 的文档发行 allowlist；有界安装/文档回归。
- 精确删除 flowkit-next-d04-stable-core-closure-final-reference(1).md、flowkit-next-d05-decoupling-analysis.md、flowkit-next-delivery-change-plan.md；仅在当前 D05 bootstrap 说明增加必要退役提示，保持原 Start reference 和旧历史 bytes。
- 不计划修改 src、十个 Action Skill 或 .agents bootstrap Skill，不新增依赖、Registry、Runtime/Policy/Run schema、安装服务或永久胶水。若实现确实需要改变这些合同，先停止核定，不能以本计划授权内核重构。
- 依据：explore.md E063-01～04 与 064-review-explore#proposalHandoff；Explore 原始实验不冒充 Apply 验收。本轮只生成计划，下一边界为独立 review-propose。
