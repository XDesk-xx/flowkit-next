## Context

见 [proposal.md](proposal.md)。已审 Explore 的隔离探针证明过一次打包、生产依赖安装和最小查询，也指出空 target 需要 exact OpenSpec root；其 tgz 不是当前最终包。Owner 后续收窄 E 验收范围，原选定计划与 Explore 字节保留为历史依据，当前范围由明确修订决定和本 Proposal 约束。D07 自身继续由外部 Stable manager 管理。

## Goals / Non-Goals

**Goals:**

- 用可读回的包、安装、固定命令和适用检查证据判断发行候选是否完整且与当前源码一致。
- 形成可区分同版本不同构建的包外记录，明确真实项目与新会话仍未验收。
- 让失败停在对应的检查、产品修订或正式 Delivery 边界，不把同会话 fixture PASS 推广成实际使用证明。

**Non-Goals:**

- 新增产品命令、状态、Registry、Agent 自动调度或通用发行平台。
- 由 E 自动完成 Formal Full Test、Delivery Final、Git checkpoint/push/merge，或把候选接管当前 Delivery/其他项目。
- 在 E 中建立真实新目标、跑完整独立角色 Change、制造 `changes-requested`，或把 CLI 重启冒充新 Agent 会话。

## Decisions

### 1. 将一次候选身份绑定到实际 tgz 和隔离安装

从当前候选记录 Git 基线、相关未提交输入和确切构建命令，再执行适用的 typecheck、build、主要回归、发行文档/命令及 pack。保存 tgz 原始字节与 SHA-256，核对包名版本、`files` 成员、运行入口、所有被引用的 Skills/references、工具 lock 和生产依赖。将此 tgz 安装到新目录，以安装内入口和受管理的 exact OpenSpec 执行检查；安装路径只是定位，包摘要区分同版本不同字节。若发行输入变更，重新打包并重验受影响的包与安装事实。

选择实际安装作为受测对象，因为 checkout 中的 `dist` 或 devDependencies 会掩盖缺失的发行资产。候选记录放在包外，不向包内回写其最终摘要，也不把尚未形成的提交 SHA 写入同一提交。

### 2. 用隔离安装和受控 fixture 验证发行入口

隔离 fixture 不复制 manager 的源码或 devDependencies。按安装内 onboarding 建立 exact OpenSpec root，以安装内 CLI 读取 `doctor/status/next` 的结构结果；只把 `doctor.status=pass` 当作健康结论，不从进程退出 0 推断。用当前已有的固定 Action 和支持命令测试覆盖合法请求、输入冲突、prepared/partial 拒绝和必要 proof 闭合集，再选择少量包内入口调用核对发行文件与源码测试一致。诊断脚本只复现和收集实验，不代替标准 `flowkit action start/finish` 或支持命令。

这些 fixture 只证明固定命令及安装机制。真实独立项目、实际 Author/Reviewer 质量、修改往返、新 Agent 会话续接和宿主审批表现均列在候选记录的未验证范围；后续真实使用按当时 Owner、Role 与 Git 权限开展，不能把本次记录倒写成那些验收的 PASS。

### 3. 对当前失败做有界分类并维持正式边界

`20261001-062-apply` 的当前候选检查实际出现两项失败：`test:domain` 一项 managed evidence index fixture 失败，`check:forbidden-tracked-artifacts` 因 `git ls-files -z` 超过 `spawnSync` 默认缓冲而返回 `ENOBUFS`。先用聚焦复现确认各自原因、基线关系和修复层级；检查脚本或 fixture 的真实缺陷可在 E 中做最小修复，产品合同缺陷则返回 Owner 授权的更早边界。原始失败证据保持不变，新运行使用新材料，不覆盖失败输出。Linux x64 glibc detached 是主验收；Windows 仅报告兼容性模拟与本机实测限制。

正式 Full Test、Final 和 Git 是 E 归档后 Delivery 的独立节点。当前 fixture 或包检查不赋予这些操作权限，也不作为 Formal Full Test 的替代。

### 4. 包外记录只汇总可验证事实

发行检查通过后才写包外候选记录：构建输入和 Git 基线、包名版本与 tgz SHA、安装位置、OpenSpec/Skills 组合、固定命令/平台检查引用、已知失败与限制。引用按实际归属保存并读回；原始 stdout/stderr 保留原字节，摘要记录命令、退出状态和时间。记录不把包自身摘要写回包内，也不引用尚未形成的提交 SHA。它说明包和固定入口达到本次收窄验收，不宣称已证明真实工作可靠性、Owner 已选择 Stable manager 或 Delivery 已 Final。

## Risks / Trade-offs

- [隔离 fixture 无法证明真实工作] → 候选记录明确未验证范围；后续首次采用时按真实项目事实判断，不制造 Reviewer 或新会话证据。
- [发现安装包或固定命令缺陷] → 保留失败原始证据，按当前已批准合同做最小修复；若需改变合同则返回 Owner 授权的 Proposal 边界，重新打包并重验受影响事实。
- [构建来源含未提交更改或测试环境差异] → 在记录中列出实际输入与环境；缺少可重建来源时不称为可冻结候选。
- [Linux 主验收或适用检查未完成] → 保持 E 未完成，不以 Windows 模拟或旧 PASS 代替。

## Migration Plan

无产品数据迁移。完成候选验收后仅交接包外记录与证据；现有外部 Stable 安装、D07 Run/Proof、原选定计划与历史 Git 保持原状。Owner 后续若选用该包，按新目标自身的授权和接入边界安装；发现问题时暂停该候选资格并重新验收新包，不修改历史证据。
