## ADDED Requirements

### Requirement: Distribution provides a bounded project onboarding path

发行 SHALL 携带与当前产品行为一致的接入说明及短项目入口模板，说明固定实际发行包与运行依赖、兼容 Node、exact managed OpenSpec runtime、manager 与 target 分根，以及项目按查询、Delivery/Change 执行和 Full Test 用途准备的材料。说明 SHALL 可从随包 README 找到，不要求 target 复制 Flowkit 系统 Skills、lock、开发源码或长期 glue scripts，不暗示尚不存在的公开 latest 包或新 CLI 写命令。

首次接入 SHALL 保留已有代码、OpenSpec、Agent 指令及配置，仅补充明确需要且已授权的内容；同名冲突 SHALL 报告，不以全文件覆盖或强制初始化消除。doctor PASS、空历史或接入完成 SHALL 不产生 activation、Role、Review、Git 或其他 Owner authority。现有首次 project/Delivery/ordinal 事实准备边界 SHALL 保持，不从空目录推断有效历史。

#### Scenario: Use a selected package without a development checkout
- **WHEN** 用户按随包说明从选定实际发行包建立独立 manager 安装并提供所需 runtime
- **THEN** 用户 SHALL 能定位同一安装的 bin、接入说明和系统 Guidance，以既有请求访问 target，不安装 Flowkit 开发依赖到 target

#### Scenario: Existing project content survives onboarding
- **WHEN** target 已存在 OpenSpec 配置、Agent 指令或业务文件
- **THEN** 接入 SHALL 保留非本次授权修改的 bytes，只做必要的有界补充；内容冲突先报告，不强制覆盖

#### Scenario: Query readiness is not Action readiness
- **WHEN** doctor 通过而 next 返回 idle、blocked 或缺少可信 activation/历史
- **THEN** 说明 SHALL 区分工具/root 可用与 Action 就绪，交接实际缺失事实，不初始化成功 Run 或自动激活

#### Scenario: Full Test configuration belongs to its target and operation
- **WHEN** 项目只进行首次查询，或之后进入已授权 Full Test
- **THEN** 接入 SHALL 分别要求当前操作需要的材料，Full Test 使用该 target 自有配置，不因首次查询强制复制 manager 项目的测试目录/命令或绑定 Git 可见性

### Requirement: Thin Agent entry resolves requested work through existing query and Guidance ownership

项目薄入口 SHALL 使 Agent 从 target 位置、明确的安装定位信息及实际 Role/用户请求找到随包说明，先通过既有 status/next 核对事实和唯一合法 Action，再读取该安装内对应 canonical Skill。入口 SHALL 不持久化第二份 current/next、不以最大 Run 编号选择状态，不把上一 Run 的执行角色当作下一 Action 的角色。

review/revise 等阶段简称 SHALL 仅在真实查询给出唯一匹配 Action 且实际 Role/请求适配时展开；不匹配、歧义、partial、blocked 或仅 bootstrap-history 时 SHALL 报告并停止，不自动切 Role、迁移历史或回退旧 PASS。仅请求读取下一步 SHALL 不执行该 Action。入口不增加自然语言代码路由、模型调用、统一 Skill Registry 或第二套 Policy；Action 内部 normative HOW 与既有 content-bound canonical Skill 归属 SHALL 不变。

#### Scenario: Review shorthand points to the actual legal review
- **WHEN** 实际 Reviewer 收到 review 请求，查询给出唯一合法 review-propose
- **THEN** Agent SHALL 读取该安装的 review-propose Skill，而不是猜 review-apply、执行 CLI review 写命令或复制 target 同名 Skill

#### Scenario: Role or phase does not match
- **WHEN** 请求的阶段或当前实际 Role 与查询所得合法 Action 不匹配
- **THEN** 入口 SHALL 指出冲突并停止，不因命令简称、上一 Run role 或查询成功自动切换身份和执行

#### Scenario: Read-only continuation stays read-only
- **WHEN** 用户仅要求查询下一步，或查询只能报告 idle/blocked/歧义/partial/bootstrap-history
- **THEN** Agent SHALL 如实报告对应事实并停止，不生成 Action Run、补成功字段或自动继续

#### Scenario: Installation relocation does not move project truth
- **WHEN** 已选 manager 安装迁移且用户更新入口的定位信息
- **THEN** Agent SHALL 从更新后的安装读取说明和 Skills，target Run/配置不迁移，安装路径不成为持久 lifecycle 身份

### Requirement: Onboarding usability is verified without conflating process fixtures and fresh Agent sessions

接入可用性 SHALL 分别验证固定实际安装下的一次真实有界 Author 工作及其记录、后续独立 CLI 进程读回、真实新 Agent 会话的独立读取。新会话 SHALL 不继承前一聊天或预给出的 Run/Action/Skill 答案，仅从项目位置及短入口自行找到安装、实际当前记录、合法下一边界与对应 Skill，提供实际依据后停止。该读取验收 SHALL 不要求额外第二次 Action、制造 finding、独立 Review verdict 或完整 Delivery 演练。

说明与验收报告 SHALL 区分当前产品行为、历史快照、合成负例、真实工作与实际新会话；未执行的项 SHALL 保留未执行，不以 pack dry-run、doctor PASS、CLI 重启或合成 Reviewer 代替完成。历史规划退役 SHALL 保留有界原路径/Git 出处交接，不把旧引用伪装成当前文件，也不由此放宽活动 planning input 的读取合同。

#### Scenario: Real work can be read after the query process exits
- **WHEN** Agent 在实际安装与独立 target 下完成合法真实 Author 工作并保存记录，原查询进程退出
- **THEN** 新 CLI 进程 SHALL 从 target 读取实际 current 与下一边界；报告仅将其计为独立进程验收，不计为真实新会话

#### Scenario: A fresh Agent uses only the project entry
- **WHEN** 真正独立且不继承聊天的新 Agent 会话收到 target 位置与项目短入口
- **THEN** 该会话 SHALL 自行读出实际 Run、合法边界与正确 Skill 的依据后停止，无需执行下一 Action

#### Scenario: No fresh session is available
- **WHEN** 尚未实际安排或完成独立新会话读取
- **THEN** 该验收项 SHALL 保持未执行/未完成，报告其余真实结果，不用本会话或合成测试补 PASS

#### Scenario: Historical material is not the current user guide
- **WHEN** README 描述当前安装和测试方式，或旧规划文档退出当前工作树
- **THEN** 当前说明 SHALL 与实际发行/项目配置一致，历史内容和 Git 恢复出处清楚标为历史，不重写旧 Run/archive 或删除仍被当前操作使用的规划
