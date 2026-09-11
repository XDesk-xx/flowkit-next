## 1. 项目配置与测试输入

- [x] 1.1 实现固定 config/verification/full-test.json 的 closed 配置读取与检查身份解析，拒绝 caller checks/priorFacts；通过缺配置、未知字段、重复检查、argv/cwd 和工具身份测试验证。
- [x] 1.2 实现独立文件系统 inputs/exclude 枚举及 full-test-input 身份；通过 ignored/untracked 产品、无 Git/HEAD、exclude 边界、缺失/不可读/链接输入与配置不可排除的测试验证。
- [x] 1.3 绑定配置 bytes、实际 executable、声明环境与检查资源；验证产品/命令/环境变化失效，ignore/index、真实 artifacts/Runs 和非产品图文变化不改变测试集合或身份。
- [x] 1.4 为本项目配置明确存在的产品输入和串行命令，拆出命令内部 Git/真实历史扫描；以扫描范围测试验证命令确实遵守配置边界，读写器继续使用 fixture，不新建测试 Registry。

## 2. 当前 attempt 与真实执行材料

- [x] 2.1 在既有 invocation 建立 UUID create-once attempt，写入并读回 start.json 后窄写 manifest fullTestAttempt/fullTestStatus；通过发布顺序和非目标 YAML bytes 保持测试验证，发布失败不启动进程。
- [x] 2.2 改造 Full Test operation facts 与 executionRef，绑定 attemptId/configRef/inputRef/orderedChecks；验证同输入不同尝试身份不同、Owner/Guidance 精确约束不变，以及 Start 和普通 Action package 回归。
- [x] 2.3 串行执行配置命令，保存 Buffer 原始 stdout/stderr 和真实 command.json；通过非零退出、spawn/signal、非 UTF-8、大输出与写流失败测试验证，不重试或截断后报 PASS。
- [x] 2.4 保存并读回 result.json，执行前后核对输入和当前关联，再窄写最终状态；验证输入漂移、未执行项、结果保存/状态发布失败保持失败或 partial，不回退旧 PASS。
- [x] 2.5 增加 target 当前 attempt 只读 reader，验证跨会话/.tmp 清除后可读、旧 PASS→新失败/partial 不回退，错归属、缺失、篡改、逃逸和非 regular 引用被拒绝；历史材料不迁移、不遍历。

## 3. 必要消费者与发行入口

- [x] 3.1 将已发行 invokeDeliveryFullTestOperation 及直接调用方接到项目配置与当前 attempt，撤出 Full Test priorFacts/reused-passed；通过真实入口集成测试验证，不增加写 CLI、target adapter 或 Agent transport。
- [x] 3.2 将 Final 前置改为从 target reader 派生当前 Full Test 来源，保留完整 required Change closure；验证 caller 任意 outcome/旧 PASS 无法替换当前结果，材料无效与测试输入 stale 分别准确拒绝。
- [x] 3.3 同步 Final/必要 Integration validator 的 verifiedCandidateRef 值域和 executionRef/evidence 接点；以黄金向量和前后置漂移测试验证，保留 projection 顺序、独立 finalized Git 投影及非目标 coordination bytes。
- [x] 3.4 验证普通 Action 的 v2 candidate/合法 prior reuse、Start 和独立 Git integration 边界未扩大；通过既有相关回归，不用 fake ActionPackage 接入 Full Test。

## 4. 代码 gate 与 Git 节点分离

- [x] 4.1 将 quality:gate 收敛为 bounded formatting 与 lint/既有行数规则，forbidden tracked-artifacts 保持独立命令；通过聚合命令测试及真实代码格式、lint、650 行边界负向测试验证原代码约束未削弱。
- [x] 4.2 修订 AGENTS.md、相关 bootstrap .agents/skills 与产品 skills/actions 对应 HOW，明确 Git 空白诊断不因非产品历史材料自动阻断 checkpoint、禁止入库内容独立核对；用条款/行为测试验证两套 HOW 边界，不改变 Runtime/Policy/Run schema。
- [x] 4.3 用历史 proof .bin/.mjs/原始流空白 fixture 验证 checkpoint 诊断与代码 verdict 分离；确认不逐 Change 增补 .gitattributes、不重写已接受材料、不修改其他项目 Git 配置。

## 5. 验收与交接

- [x] 5.1 从发行 API 完成非 Git target 与本项目配置的有界集成验收，覆盖完整成功、当前失败替换旧成功、持久化失败、重读和必要 Final 消费链；这是实现验收，不声称 D05 Formal Full Test 或自管理生命周期。
- [x] 5.2 执行适用 format/lint/typecheck/build/domain/acceptance 及 strict OpenSpec 验证，按实际影响核对依赖/entropy；保留命令、原始流和真实结果到本次 Apply artifacts，不复用 Explore PASS，不为凑 gate 格式化证据。
- [x] 5.3 核对新增/修改 source/tests 的文件规模和职责，超出适用行数上限先按职责拆分再复验；核对变更仅覆盖配置、Full Test、必要消费者和 gate/HOW，无历史 Run 修改或额外平台。
- [x] 5.4 更新实际任务状态并记录 Apply 三文件 Run 与必要证据引用，携带 Owner gate/材料保留/004 当前分组决定，交独立 review-apply 后 STOP；不自动 Archive、Full Test、Commit 或 Push。
