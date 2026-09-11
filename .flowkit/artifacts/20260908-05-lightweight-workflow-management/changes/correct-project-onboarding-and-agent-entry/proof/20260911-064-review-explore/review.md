# Review Explore：新项目接入与 Agent 薄入口

结论：**approved**。审查目标为 `20260911-063-explore`，本次真实独立审查为 `20260911-064-review-explore`，Change `correct-project-onboarding-and-agent-entry`，projectOrdinal 39。无阻断 finding。

## 当前步骤与依据

这是 Explore 的 Proposal readiness 审查，不是实现、安装或跨会话验收。采用独立 `.agents/skills/review-explore/SKILL.md`；未读取、调用或委托 candidate review-explore HOW 管理 D05。

核对 Owner 授权、active Change/ordinal/dependency、当前 OpenSpec 合同、相关已接受设计、实际源码及 063 原始证据。开始与结束均核对 56 个输入引用。Author 的六项命令记录均为真实退出 0；91 项包清单只证明 dry-run 内容，不证明已安装。

Reviewer 在独立临时 target 复验 exact OpenSpec 初始化及 7 个查询场景：idle、doctor、planned blocked、合成 activation 后首个 explore、拒绝 caller Run override、缺 runtime、歧义 target。负例按语义与真实退出码判断，不把退出 0 等同可执行。现有业务示例 bytes 保持，未创建 Action Run。合成 activation 不构成 Owner authority。

三份明确退役目标均独立以只读 Git 内容核对当前 bytes 与恢复出处。源码仍读取当前 Start 的 planning artifact，因此本结论只支持三份既有开发规划按限定范围退役，不支持删除任意项目的活动规划。历史 Run/archive/D04 manifest 不重写；D05 原 Start 引用保留历史出处语义。删除后的消费者与链接检查留在 Apply。

命令、原始流引用及校验摘要见 `evidence-audit.json`、`observations.json`、`probe/command.json`。非本次 Reviewer 路径的 Git tracked/nonignored 文件共 5361 项，前后字节摘要与 HEAD 一致；ignored .tmp 仅为可丢弃实验 target，不据此声称全文件系统未写。

## 复杂度与最小性

方向足够小：固定发行包及必要工具的接入说明、项目短入口、README 当前/历史用法分离、精确三文件退役，同属 Owner 明确授权的单个 correct Change。现有 proof 不支持内核重构，也不必因四项交付内容另拆四个 Change。

项目入口只指向所选安装与随包说明。Agent 使用已有查询/Role/Action Guidance，不复制系统 Skills，不增加 CLI init/自然语言路由、第二套 Policy、Registry、自动循环或 SHA/clean 准入门槛。首次项目 identity、manifest/activation 与 ordinal 沿用既有 Owner/bootstrap 边界，不把空目录或 doctor PASS 当作初始化授权。

## 新内容与范围漂移

未发现 scope drift。三份根规划清理和真实新会话要求均已由 063 的真实 sourceRef 交接，不因 Reviewer 当前聊天未复述就否定授权；未重开前六个 archived Changes。

Proposal 应保留 Explore 已明确的验收区分：固定实际包下的一次真实有界 Author 工作、独立 CLI 进程读回、真实不继承聊天的新 Agent 会话读取。最后一项只需找到安装、实际当前状态、合法下一边界与正确 Skill 并 STOP，不强制第二次 Action、制造 finding 或演完整 Delivery。当前这些最终接入验收尚未执行，不能用本轮实验替代。

## 交接与 STOP

可交 Author 进入 `propose`；此 continuation 来自既有 Policy 映射，不是 Reviewer 新增 authority，也不自动执行。Proposal 只需把上述既定范围落成最小可验收合同，无需继续扩大 Explore。

本轮未修改 Author 生产文件、Skill、README、manifest 或历史记录，未删除目标文档，未执行 Propose/Apply、Formal Full Test 或 Git mutation。批准仅表示 Explore 可进入 Proposal。三文件 Result 保存并读回后 STOP。
