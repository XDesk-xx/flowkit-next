## Context

动机见 proposal.md。063 Explore 的四组结论经 064-review-explore approved 接受；本设计仅固定接入资产布局、入口职责、文档退役次序和真实验收交接。这涉及发行、项目指令合并和历史引用处理，满足跨文件与迁移说明的 design 条件，并非继续设计内核。

## Goals / Non-Goals

**Goals:** 让用户和新会话只凭项目短入口使用既有能力；计划的每一项可用当前实际发行包与真实工作验证。

**Non-Goals:** 不变更三命令、Policy、Role/Action/Run schema 或 current 解析；不增加 flowkit init、自动路由/切 Role/连续执行、Registry、安装服务、证据平台、每项目系统 Skill 副本、永久 helper；不更改 Archify、Full Test 选择或 Git 节点。D05 不用新产品入口接管自己。

## Decisions

### 1. 一个随包接入文档，项目只保存短入口

选择 docs/onboarding.md，README 链接它；package.json.files 仅加入该确切文档，保持现有运行资产及排除规则。模板作为文档中的可复制 AGENTS 区块，不增加独立可执行脚本或新 Skill。不用新顶级 canonical Action，也不让十个 Skill 反向依赖此文档执行内部规则。

项目入口列明本项目位置、Owner/宿主已选的 manager 安装定位、FLOWKIT_HOME/tools 的用途、实际 Role 来源及读取随包说明的步骤。已有 AGENTS.md 只合并这个小区块并保留其他原文；既有有效区块不重复追加，不接管用户原有规则。定位示例中的机器路径必须替换成实际值，空占位符不能当配置成功。安装移位时更新定位文本，不迁移 target 状态，不新增安装路径 schema/环境变量协议。

替代方案不取：为每个项目复制十个 Skill（资产漂移）、注册新入口 Skill/路由器（重复机制）、只修根 README 不入包（独立安装无法完整使用）。

### 2. 固定本地包安装与按用途准备

使用明确选定的实际 tgz，在独立 manager 安装目录通过包管理器安装其运行依赖，再定位安装包自身的 package.json/bin 和 docs/onboarding.md。README 提供可执行的 Windows/Node 调用示例；不承诺当前 private 包已公开发布，不自动下载 latest 或覆盖全局同名命令。安装包路径/内容与读回结果记录在本次验收材料，不把 Git SHA 变成日常 lifecycle 准入。

doc 区分：
- 查询：target OpenSpec root、兼容 Node、所选 manager/exact OpenSpec runtime，以及含 repositoryRoot/flowkitHome 的临时请求文件；按需加 deliveryId/changeId，不写旧 Run selectors。
- 首次项目/Delivery/Change：说明既有 .flowkit/project.json、规划、manifest 与真实 activation/ordinal 来源如何由已授权 Agent/Owner 准备；不把查询阶段的简化 fixture manifest 冒充完整 Start 输出。新项目 ordinal 无已赋值基线时按既有明确初始化授权处理，不借 D05 的 39 或从空目录猜历史。
- Action：已明确合法边界后读取安装内 canonical HOW，保存真实三文件与必要材料，不提前制造 Run 或 PASS。
- Full Test：进入该独立授权节点才准备 target 自己的 config/verification/full-test.json；.gitignore 不参与其范围选择。

无 OpenSpec root 时可使用已验证的 exact OpenSpec init --tools none，不用 --force；已有 root 先读后补，不将 init 当作“修复一切”。上游 init 的 /opsx:propose 提示不是 Flowkit 的跳阶段许可。doctor 只证明它实际检查的 runtime/root。

替代方案不取：一开始要求完整 Delivery/Full Test/干净 Git（把不同用途绑在一起）、用开发仓库路径作为唯一安装方式（不是独立产品接入）。

### 3. 入口只消费已有合法边界

实际调用目标是所选安装 package-declared bin，可用 node 加该路径调用，避免 PATH 同名软件选错。请求 JSON 是可丢弃输入，不是第二份配置/current truth。先 status/next，只有首次或工具诊断需要时再 doctor，不额外强制每步运行全部诊断。

短指令 review/revise 由 Agent 将用户请求与 next.decision.actionId 核对，不实现自然语言 parser 或转换表。匹配后读 manager 的 skills/actions/<actionId>/SKILL.md；其内部 package/admission/保存方法仍由该 canonical HOW 决定。当前真实 Role 来自明确的会话/用户职责，不取 status.currentRun.role 作为下一角色。

仅询问下一步只读后 STOP；有阶段执行请求但角色不符则交接独立角色，不本会话自动自审。idle、blocked、歧义、partial、缺安装或 bootstrap-history 各按既有事实说明，不从目录最大号或旧成功结果推断可执行。安装与入口本身不取得新 Owner/Git 权限。

本轮不需要改十个 Action Skill 或 .agents。若发现既有 Action 内 normative HOW 必須更改，不能把更改偷偷写进公共 onboarding 文档绕开 content identity，应停止核对本计划范围。

### 4. 三文件精确退役，不迁移历史

按以下次序执行：
1. 先完成当前 README/随包接入说明并验证当前引用可用。
2. 只读核对三个原路径及 Git 原始内容，记录到本次 Apply 清理交接（artifact 路径、bytes/hash、commit:path）。
3. 删除 proposal 明确列出的三文件，不使用根 flowkit*.md 通配批量删除。
4. 仅在当前 D05 manifest 的 bootstrap 说明中补一条简短提示：旧 reference 为 Start 时的历史规划出处；当前产品入口见 README。保持 reference 原值、旧 Owner facts、前六个 Change、D04 manifest、旧 Runs/archive 原 bytes。
5. 校验新文档活动链接、删除路径、可恢复出处及相关消费者。历史文字命中不是失败；不要求全仓 grep 零结果，不复制原长文到永久目录。

Git 恢复出处采用 Explore 已核实的 7af7d85788503dafc50ee162b14deaaf679f99cb:<原路径>，Apply 再核对实际 bytes；这是历史恢复信息，不新增 git: URI resolver，也不重演 Start。其他项目当前 planningReference.artifact 仍按现有合同必须可读。

### 5. 三类验收，不能互相抵扣

| 验收 | 实际动作及足够证据 | 不能声称 |
| --- | --- | --- |
| 固定包与真实工作 | 从实际 tgz 安装，独立普通 target 保留已有文件；按接入说明和既有授权/初始化边界完成一个有界真实 Author Action，真实记录保存并读回 | pack dry-run 或 synthetic terminal 等同真实执行 |
| 独立进程 | 退出旧查询进程，再用同一安装查询上述真实 target，取得实际 current/next | 已完成真实新会话 |
| 真实新会话读取 | 新 Agent 会话不继承本聊天，仅收到 target 路径与已放置的短入口；自行找出安装、Run、边界、Skill，返回引用依据并 STOP | 第二次 Action、独立 Review approved 或完整 Delivery 验收 |

真实 Author 示例选择最小且确有内容的工作，例如在有实际业务文件的演示 target 中执行一次获准 Explore并记录对真实需求的分析；不人为制造失败或靠只填 JSON 完成。测试 fixture 权限与真实示例来源明确区分，缺真实授权来源不伪造。无需整个 Delivery 演练。

真实新会话由可用的独立会话/Owner 新开会话完成，不能将同一上下文子流程换名。验收输入不预给 currentRunId、正确下一 Action 或答案链接；正常项目短入口可以给出安装与随包说明位置。留下实际会话输出及来源即可，不建身份认证平台。若没有这样的会话，则对应 task 保持未勾、如实交接未完成，不自动循环等待或改成 fixture PASS；这不要求现在的 Propose 启动会话。

安装回归使用真实发行包和隔离运行依赖，不跨 Windows/Linux 共用 node_modules；沿用适用平台回归。对说明中的 Role/歧义/blocked/partial 情况可用标明合成的负例补覆盖，但不能抵扣三类验收。本 Change 验收不是 Formal D05 Full Test。

### 6. 依据到交付的映射

| 已接受依据 | 本次交付 | 验证落点 |
| --- | --- | --- |
| E063-01 / 064 交接 1 | 固定包、随包文档、README 与 allowlist | 实际安装、包文件与链接可读 |
| E063-02 / 064 交接 1 | 按用途准备，保护现有内容 | idle/blocked/root/runtime 与有界合并 |
| E063-03 / 064 交接 2 | 短入口，Role/合法 Action/安装来源 | 指令匹配、角色冲突、只读不续跑 |
| E063-04 / 064 交接 3 | 精确三文件删除及历史出处交接 | 原 bytes/Git 出处、删除后相关读取 |
| Owner 真实跨会话 / 064 交接 4 | 三类独立验收 | 真实工作、独立进程、真实新会话分别记录 |

## Risks / Trade-offs

- 文档有用但尚未由新会话使用 → 真实新会话独立验收，不提前勾选。
- 本机路径或未公开包示例被照抄 → 示例明确替换项，实际安装读回；不构造自动发现服务。
- 新项目初始化被简化成合成 activation → 说明区分查询探针、真实 Owner/Start/ordinal 来源，不复制测试假权限。
- 删除旧路径被当作历史损坏或放宽活动输入 → 精确范围、Git 恢复出处与当前消费者核对；旧记录不重写。
- 新增测试文件膨胀 → 延续 src/tests 的 650 行 gate，必要时按安装/入口验收职责拆分，不压行或放宽。

## Migration Plan

没有数据库或 Runtime 迁移。按 tasks 先补文档与包，再做精确退役和当前实际验收。必要材料留 target artifacts，临时包/target 位于 .tmp 且不是唯一必要证据。

不自动清理用户安装、既有项目、历史 Runs 或 Git。后续发现计划合同缺陷按既有 revise 边界处理，不在 Apply 临时扩大内核范围。Propose 完成只交独立 review-propose；Apply/Archive/Full Test/Final/Git 分别遵守原边界。
