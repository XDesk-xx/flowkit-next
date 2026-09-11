# flowkit-next

Flowkit 是面向 Agent 的轻量流程管理软件：OpenSpec 管理 Change 与代码合同，Flowkit 查询当前事实和合法边界，Agent 读取对应 Skill、完成一次真实工作并保存 Run 后停止。不调用模型，不自动切 Role 或连续执行。

## 安装与新项目接入

从明确选定的实际 tgz 安装到独立 manager 目录，再按[接入说明](docs/onboarding.md)准备 exact OpenSpec runtime 与项目短 AGENTS 入口。说明包含 Windows/PowerShell 命令、已有项目保护、首次 Delivery/Change 准备和阶段指令用法。当前包为 private，不假设公开 latest。

manager 拥有发行代码、系统 Skills、工具 HOW/vendor 与 lock；target 拥有业务代码、OpenSpec、Run、必要证据和测试配置；FLOWKIT_HOME/tools 单独提供 executable runtime。target 不复制 Flowkit 开发依赖、Skills 或长期胶水。安装路径不是生命周期身份。

CLI 仅提供 `status / next / doctor --input <request.json>`。请求包含 repositoryRoot、flowkitHome，可选 deliveryId/changeId；当前记录来自唯一有效 Run 链，不接受 currentRunId/changeStartSequence。doctor 成功不意味着已激活 Change。

收到阶段指令后，Agent 核对 target、实际 Role、安装来源和查询边界，再读安装内 `skills/actions/<actionId>/SKILL.md`。歧义、blocked、partial、bootstrap-history、角色或阶段冲突先报告并停止。只问下一步不执行 Action；Author 不自审。

## 当前能力与事实归属

- OpenSpec：proposal/design/specs/tasks/archive；不重建第二套 Change 状态机。
- Runtime / Policy：prepared/terminal、单个当前 Action、三文件 Run/Result 接纳、合法边界计算；不自动下一步。
- Owner / Reviewer / Verification：分别决定授权、独立审查、提供真实测试证据。
- Delivery：轻量 Start、required Change 完成事实与当前 Full Test 的 Final 确认。
- Git：版本、分支、提交和历史；在独立授权节点调用，PASS 或 Final 不自动授权 commit/push/merge。
- Skills：改善已确定操作的 HOW；Memo：仅保留未来重议事项，不自动成为需求。

不提供 Registry、模型平台、自动 Author/Reviewer 循环或证据平台。D05 自身按 Owner 授权的 independent-bootstrap 开发，不让 candidate 安装接管管理自己。

## 测试与执行材料

项目 Full Test 由 `config/verification/full-test.json` 的 inputs/exclude/environment/checks 配置，与 .gitignore、Git index、HEAD 独立。每次真实执行形成新 attempt，由 Delivery fullTestAttempt 关联 target 的 `.flowkit/artifacts/<delivery>/full-test/`；新失败或 partial 不回用旧 PASS。不是所有项目固定共用六项测试。

Action 必要 proof 在 target `.flowkit/artifacts/<delivery>/changes/<change>/proof/<run-id>/`，按需交接引用；.tmp 仅承载可丢弃材料。旧证据不代替当前实现验收，原始 stdout/stderr 保留 bytes。

本仓库开发检查见 package.json：typecheck、build、test:domain、test:acceptance；quality:gate 聚合 bounded 格式、lint 与既有 650 行要求。历史/bootstrap 自检单独用 test:bootstrap，不属于代码 Full Test。禁止入库内容检查与 Git 空白诊断独立，不把非代码历史日志空白当作代码失败。

主要 detached 验收平台为 Linux x64 glibc；Windows compatibility simulation 不自动代表 native Windows 全面 PASS，报告以实际执行范围为准。Windows/Linux node_modules 不共用。

接入可用性分别验证真实固定包安装与有界 Author 工作、独立 CLI 读回、真实新 Agent 会话读取；合成用例、CLI 重启不冒充新会话或独立 Review。以上不自动等于 Formal Delivery Full Test。

## 工具与开发环境

Node 兼容范围 >=22.20.0，确定性 fixture 为 22.23.2；仓库包管理器 pnpm@11.22.0。OpenSpec exact runtime 为 1.10.0，身份由安装内 config/tools/toolchain.lock.json 规定，executable 位于外部 FLOWKIT_HOME，不随 Flowkit tgz 或 Git 保存。缺失不自动下载或回退全局版本。

Archify 是独立派生架构工具；Start、Full Test、Final、repository integration 不要求图、render 或 skip 证明。历史 architecture 文件不是代码事实，不因接入而迁移。

## 历史说明

D01 Foundation、D02 工程质量及后续 Delivery 的执行与结论以对应 OpenSpec、历史 Run 和 Git 为准；旧六项测试、旧 exact candidate SHA 或架构描述不代表当前所有项目的前置条件。

源码仓库中的 FOUNDATION-INIT.md 是历史初始化快照，不是当前使用手册。退役的根规划文档从 Git 历史恢复；旧 Run/archive 保持原始记录。发行包使用本 README 与随包接入说明，不要求开发仓库历史材料。
