# Review Propose：管理资产与目标项目分根

结论：`approved`，无阻断 finding；精确目标 `20260908-010-propose`，沿用 `projectOrdinal: 34`。

## 当前步骤

Owner 请求“根据最新run，review”。已核对 active Change、激活来源、`008-explore → 009-review-explore approved → 010-propose` 的实际交接，按有效链执行独立 review-propose，不按目录序号猜 current。

使用独立 `.agents/skills/review-propose`，对照已接受 Explore、Owner D05 规划、现行规范与直接源码接口。未读取/调用 candidate 同名 Reviewer HOW 或 candidate lifecycle。

## 合同审查

- manager 安装定位与 target 请求分离：自身模块位置/package 元数据提供系统来源，CLI 不接受 managerRoot 覆盖，也不扫描 target/cwd 提名安装。内部只读描述是必要位置参数，不是新 authority/身份数据库。
- Action 与四个 Delivery operation 的 prepare/read 明确同源；固定相对路径、内容绑定和现有失败保护保留。Run/coordination/Git/测试 cwd 仍属 target；未修改持久化 package/Run/Policy schema。
- OpenSpec 仍从 FLOWKIT_HOME 解析 exact runtime，观察 cwd 与 returned-root 校验指向 target；非工具路径无额外 preflight，无 PATH fallback/下载/Archify。
- 发行要求实际干净包与 production-only 安装，doctor/status 使用真实 bin 和合法 selected Run/coordination fixture；安装移位、target 同名资产、缺 manager entry、缺 runtime、四 operation 消费以及 target-only 写入均有验收任务。不得用旧 Explore 组合实验或旧测试 PASS 代替实现验收。
- Guidance 的必要静态资产归 manager，项目输入示例归 target；HOW/README/AGENTS 与 manager 工具 Purpose 有明确同步范围，历史和自开发 bootstrap 不迁移、不重写。

独立核查 8 份计划文件、5 个能力的 8 条 MODIFIED + 2 条 ADDED requirement、30 个场景及 12 项未实施任务；原修改条款的场景身份保留。43 个当前输入引用、OpenSpec 1.10.0 strict/status 与 diff check 均核对通过。结构通过不替代以上语义判断；未运行实现测试、安装产品或执行 Formal Full Test。

## 复杂度与最小性

通过。一个小型安装定位模块和既有调用参数调整足以覆盖已批准分根目标；无 Registry、通用 loader、全包/全 runtime hash、存储平台或自动升级机制。低层 breaking change 明确迁移所有调用，不保留含混 fallback；实际安装验收与依赖闭包属于必要实现细节。

## 新内容与范围漂移

scope drift: NONE。宿主接入、current 自动发现、Full Test 范围/持久化协议、Start 去 Git 前置、Final 简化和 Git 执行保持后续 Change 归属。现有权限、生命周期与内容检查不借分根放宽。

## 非阻断记录观察

`D05-RP011-OBS-001`：010 的 `check.mjs` 在同一 Result 对象先写 `action: 'propose'`，后又写 `action: <action.md ref>`，后者覆盖前者。实际 result.action 为文件引用对象；该引用 hash 正确，受绑定 context.action 为 propose，kind、previousRun 和阶段交接一致。

这是 independent-bootstrap 记录生成问题，不是 canonical Runtime Result 的准入成功，也不构成当前 Proposal 的歧义或合同缺陷。本次保留旧 terminal bytes，不擅自修复、不因它另造 corrective Change；后续新记录应分开 action id 与 runArtifacts.action，避免重复 key。

## 证据与 STOP

[Reviewer proof](../../../../artifacts/20260908-05-lightweight-workflow-management/changes/separate-manager-assets-from-target-project/proof/20260908-011-review-propose/README.md) 保存本次方法、原始输出和精确引用。未运行会生成/修改 Author Result 的 check.mjs。

1783 个受保护文件前后摘要一致；只新增本次三文件 Run 与自有 proof，不改 Author 计划、产品或旧 Run。报告 Apply readiness，未执行 Apply、Archive、Git 或下一 Action。Reviewer approved 不是实现/Verification PASS 或新 Owner authority。STOP。
