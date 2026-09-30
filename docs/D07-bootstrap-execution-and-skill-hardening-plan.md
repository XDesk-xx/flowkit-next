# 旧 Flowkit 修复计划：固定操作入口、Skills 收敛与 Bootstrap 加固

> **供旧 `XDesk-xx/flowkit-next` 项目使用的 Delivery / Change 规划，不是新 Flowkit 的重写计划。**
>
> 原建议日期：2026-09-29；Owner 选定日期：2026-09-30
> 版本：D07 Start 选定版（原 v1.0 加 prepared proof checkpoint 兼容性 Change）
> 仓库观察基线：`d5453dbecae1e9cc5c8dcaf6214334aa52555b23`
> 建议 Delivery ID：`20260929-07-bootstrap-execution-and-skill-hardening`
> 建议标题：**D07 — 固定操作入口与 Skills 执行加固**
> 项目内保存位置：`docs/D07-bootstrap-execution-and-skill-hardening-plan.md`
>
> **Owner 选定范围：**2026-09-30 的指令要求在 D07 中解决本文的固定操作入口 / Skills / Bootstrap 问题，以及 `flowkit-prepared-proof-checkpoint-compatibility.md` 的 prepared proof checkpoint 兼容缺口，并启动 D07。Start 只登记下列六个 required/planned Change；不激活、不分配 Run / projectOrdinal、不执行产品实现、测试或 Git checkpoint。原根目录两份输入保留原字节，本文是本次 Start 的固定规划引用。

---

## 1. 结论：必须同时修代码入口和 Skill

此次目标是让旧 Flowkit 成为新项目可用的稳定管理器：**保留已经有效的流程与权威边界，修掉标准操作依赖 Agent 临时编程的使用方式。**

仅增加 CLI，而保留 Skill 中“编写 Node 文件、调用内部模块、手工保存 Run”的正常执行路径，不能算修复完成。反过来，只删掉 Skill 示例而没有可用命令，也会让 Agent 无法完成原来能完成的工作。

此次成套交付：

**固定发行入口 + 被测试的 TypeScript 实现 + 配套的自有 Skills / 使用说明 + 必要证据规则 + 可审查的宿主权限接入。**

选定一个维护 Delivery、六个 required Change。它不是新架构的第一次全面重写，也不以消灭全部脚本或全部权限弹窗为目标。

### 1.1 对问题严重性的准确界定

临时脚本、解释器授权和 GitHub 语言占比本身，不证明已有所有执行结果无效，也不证明旧 Flowkit 无法开发新项目。需要修正的是标准工作依赖临时胶水的可用性、可维护性和误操作风险。

本计划将“能够不用临时生命周期脚本管理新项目”设为选用新 bootstrap manager 的验收门槛。**不以重签旧结果、删历史脚本、改变语言统计或放宽宿主安全限制来通过门槛。**

### 1.2 必须保留的原语义

- OpenSpec 管理规格与 Change 产物；Flowkit 管理协调、角色、操作记录和合法边界，不再建立一套规格权威。
- Owner、Author、Reviewer、Verification 的结论和权限分开；Author 不得自审。
- 每次明确调用只执行对应操作，完成后 STOP。自动 Review、自动修订和自动下一 Action 不在本 Delivery 实现。
- 现有完整 Run 不可覆盖，partial 不等于完成，旧 PASS 不代表新候选通过。
- 旧 D06 的 Guidance 来源、prepared Owner correction、证据原始字节、真实生产入口识别四项修复不得回退。
- 正式 Full Test 与 Git 仍需各自授权；测试失败不自动取得修改产品或操作 Git 的权限。

---

## 2. 核对到的事实，以及不应误读的地方

本节依据固定仓库源码与当前文档，不代表对本机 manager 和所有历史执行做了全面审计。固定来源见文末 [S1]—[S9]。

| 观察 | 依据 | 本次含义 |
|---|---|---|
| 当前公开 CLI 以 `status / next / doctor` 查询为主；接入示例使用 JSON 请求文件 | `docs/onboarding.md`、`src/cli/entrypoint.ts` | 缺少完整、稳定的正常写操作入口；JSON 数据文件本身不是问题。 |
| Review Skill 包含 `currentForExecution`、`startRecord`、`checkProof`、`finishRecord` 等 JavaScript 示例，调用 manager 模块和文件 API | `skills/actions/review-apply/SKILL.md` | 部分机械编排留在指导文本和执行者手中，需要收回受测发行代码。 |
| `startCanonicalActionRun` 已由 manager 实读、绑定、复核 Guidance，保存开始 descriptor | `src/domain/canonical-action-run-start.ts` | 不重造已经存在的可信开始规则；补齐调用、结束和分进程接续的稳定入口。 |
| 开始接口返回 `StartedCanonicalActionRun`，其中包括执行包、prepared context 等内存对象 | 同上 | 不能把“加两个命令”当作完整实现，必须处理 start 与 finish 是两个进程时的真实关联。 |
| Delivery Start 有固定 manifest、create-once 与 written-unconfirmed 等规则；不自动 Git | `skills/delivery/start/SKILL.md` | 稳定入口要实现这些规则，不只是包一层任意回调。 |
| 发行清单已包含自有 Skills、上游 vendor Skills 与工具 lock | `package.json` | 命令、Skills、接入文档和工具组合必须作为同一候选一起验收。 |
| 正式 Full Test 已规定独立授权、新 attempt、当前关联和失败修正边界 | `openspec/specs/formal-full-test-execution-and-correction/spec.md` | 此次只提供稳定调用入口，不引入新重写规划中的“有界直接产品修复”。 |

**不采用以下推论：**固定 executable 不自动等于安全；Node / Python 命令不自动等于有问题；摘要一致不证明执行真实；GitHub 的 JS 百分比不等于生产源码使用 JS 的比例。本文不把此前对语言占比的数字当作实施验收基线。

---

## 3. 有界范围：本次做什么，不做什么

### 3.1 本次必须完成

1. 将正常 Flowkit 管理操作收敛到发行包稳定入口，使用受控子命令和结构化数据，不要求用户生成 Python / JS / TS 生命周期胶水。
2. 更新所有受影响的自有 Action / Delivery / Tool HOW、公共示例、接入文档和项目短入口；保留分析、实现和审查的实质规则。
3. 将重复的 Run 地址、Guidance、Proof 核对、结束记录等机械逻辑复用或收回 TypeScript 实现，并进入类型检查、回归和生产可达性范围。
4. 明确新产生的证据、临时数据、实验脚本、被测 fixture 与发行代码边界，不再把标准操作的临时脚本当作默认长期产物。
5. 发布独立候选并做真实接入验收，证明新 Agent 会话只凭发行资产和目标项目即可正常工作。
6. 修复合法后续接续的 `prepared` Run proof 首次进入 Change checkpoint 时被 terminal-only 校验拒绝的问题；保留 Run 原始字节及现有严格证据校验。

### 3.2 明确不做

- 不全面重写 Core / Application / Drivers，不做通用插件中心、Agent 调度器、常驻服务或自动 Author / Reviewer 循环。
- 不升级 OpenSpec，不增加、重新接入或为 Archify 创建适配器。已有历史文件和用户安装不因此删除。
- 不重写 LP 或其他受控项目的业务、测试框架和依赖；不把 TypeScript 要求强加给 Python / Rust / Go 项目。
- 不把 Node、Python 或 Shell 加入无条件全局允许规则；不关闭 sandbox，不自动覆盖用户配置，不承诺以后没有任何审批提示。
- 不将 `.tmp` 全面禁用；不把必要实验脚本一律删掉，也不把脚本改扩展名冒充日志或数据。
- 不迁移或重签历史 Run / Proof，不全仓把旧 `.mjs` 改成 `.ts`，不以 GitHub 语言条变绿作为目标。
- 不改变三文件 Run 的基本事实语义，不增加第二套 current 状态库；如稳定分进程入口确实需要最小格式补充，必须在对应 Change 明确兼容范围与失败语义，不能静默添加。
- 不直接部署候选去管理本 Delivery；不在尚有活动执行时更换 manager / Skills。

---

## 4. 目标使用方式与权威边界

### 4.1 正常操作的前后对比

旧方式容易演变为：

```text
Agent 读 Skill 示例
→ 临时写 Node / Python 程序
→ 导入 manager 内部模块
→ 拼接 Run / Proof、调用回调、写结果
→ 再次临时写脚本核对
```

修复后的目标：

```text
Agent / Owner 提交明确操作意图和数据
→ 固定发行入口解析并校验
→ 调用既有可信规则、存储和工具能力
→ Agent 完成实际分析 / 编码 / 独立审查
→ 固定入口接纳真实结果、保存并读回
→ 报告当前及合法后续边界，STOP
```

**入口可以仍由 Node 运行。** 不要求第一版提供 `.exe`。允许 `node <已选 manager 的固定入口> <固定子命令>`；不把它换成 `node -e <随机代码>`、`python -c <随机代码>`、stdin 程序或可修改的目标项目 helper。

### 4.2 稳定入口的最小合同

下列是接口要求，命令拼写由 A/B 的 Proposal 冻结；不是现有可执行命令，也不是允许提前调用的说明。

- 简单请求可用显式参数；复杂请求支持 `--input -` 接收 JSON stdin，也允许数据文件。stdin 是数据，不是可执行源码。无需 Shell heredoc 才能使用。
- 输入只表达意图、目标、真实授权来源、材料位置及角色的实际工作结论。Guidance 摘要、Run 地址、编号和 current/next 由 manager 解析生成，不信任调用者自签替代品。
- 一个明确请求对应一个实际操作。不提供 `eval`、任意 `scriptPath`、动态 `modulePath`、调用者提供的 JS 回调、泛化 `exec` 或“透传所有参数”的后门。
- `--project` 等宿主授权可见参数与 JSON 内目标必须一致，重复、冲突和覆盖字段拒绝；不能用固定命令前缀掩盖 stdin 中另一个目标。
- JSON 输出区分 ready、blocked、incomplete、failed、written-unconfirmed / unknown 等实际状态。兼容已有查询的退出码合同；脚本不能只看 exit 0 就推断流程成功。
- 解析安装来源由可信选择决定，不允许 target 数据静默替换 manager 源码路径。
- 固定操作入口对自己的机械写入负责。Agent 编写代码、判断需求和审查质量仍然是实际工作，不因 `finish` 校验通过而变成自动证明。

### 4.3 操作覆盖表：不能只修 start / finish 两个命令

| 正常能力 | 稳定方式要求 | 本计划归属 |
|---|---|---|
| status / next / doctor | 保留既有读取语义，增加必要的数据输入便利；不执行修复 | A |
| 标准 Action 开始 / 结束 | 固定开始、精确身份、结果接纳、历史读回 | A |
| 编号与 prepared Owner correction | manager 内部读取可信链及合法授权，不让 Agent 临时算号 | A |
| 证据定位、摘要与引用核对 | 固定辅助能力或开始/结束服务内置，不能只返回“请自行写脚本核对” | A；D 约束新增材料 |
| Project 接入 / Delivery Start | 保护既有文件，创建或读回固定内容，不要求用户 callback | B |
| Change 建立 / 激活 / Archive | 使用固定 OpenSpec 和现有合法协调；机械写入和归档读回不依赖临时程序 | B |
| Full Test / 当前结果 / Final | 固定入口封装既有执行、接纳与完成规则；不改验收政策 | B |
| Memo 读写 / promote / dismiss | 受控数据与现有 Owner 权限，不直接让 Agent 改 JSON | B |
| Checkpoint / Git 集成 | 既有受控宿主固定入口，或明确授权的原生 Git / 远端工具与固定结果观察；不要求运行 Agent 生成的 JS 回调 | B |
| Author / Reviewer 工作方法 | 各自 Skill 保留实质方法，改为消费上述稳定操作 | C |

原生 Git、固定 OpenSpec CLI、项目声明的 `uv run pytest` 等不是“临时生命周期胶水”，可以继续按授权使用。关键是 Flowkit 自己的记录、校验和协调不要求外部临时编程。

---

## 5. Delivery 与 Change 总览

选定 Delivery：`20260929-07-bootstrap-execution-and-skill-hardening`。六项均为 required；Delivery Start 时全部保持 planned。

| 槽位 | 建议 Change ID | 能力出口 | 直接依赖 |
|---|---|---|---|
| A | `expose-stable-action-and-record-commands` | 标准 Action 的固定输入、开始、结束、证据引用与 correction 接入 | 无 |
| B | `expose-stable-delivery-and-support-commands` | Delivery / Change / Memo / Archive / Git 辅助的固定操作闭环 | A |
| C | `converge-owned-skills-on-supported-commands` | 全部自有有效 Skills / HOW / 文档与发行命令一致，不再要求临时胶水 | A、B |
| D | `enforce-typed-evidence-and-bounded-execution` | 新增代码语言、证据用途和窄权限接入的实际约束 | A、B、C |
| E | `validate-and-freeze-bootstrap-manager` | 固定发行包、真实新目标/新会话验收与管理器选择材料 | C、D、F |
| F | `admit-canonical-prepared-proof-at-checkpoint` | 合法 supersession / continuation 的 prepared Run proof 经 canonical 链验证后可进入 managed Change checkpoint | B |

执行顺序建议 A → B → C → D → F → E。这里比前轮“约四个 Change”的概略建议增加了明确的 Skills 交付边界，并将 Action 与 Delivery 写操作分开；F 是 Owner 本次追加的独立兼容性修复。数量不是上限：若 B 经 Explore 证明无法共同验收，可显式拆分；不能以保留六个槽位为由删去操作，也不能顺势实现新重写架构。

---

## 6. Change A — 标准 Action 与记录的稳定入口

### 6.1 目标

在现有 Core、Run、Policy 和 Guidance 能力上增加受测、可发行的命令门面，解决开始 / 结束 / 引用校验的临时编程问题。

### 6.2 实现范围

1. 读取可信 target、实际角色与当前合法边界；由 manager 分配并校验 Run 标识、序号和目录。
2. 复用 `startCanonicalActionRun` 及既有 Guidance / admission 规则，不能绕过 package-bound readiness 或机械返回 ready。
3. 将 Skill 中重复的通用开始/结束/Proof 核对行为收敛成 TypeScript 函数；已存在的同等函数直接复用，不建立第二实现。
4. 提供数据化的工作输入和结果提交方式；保留普通 Author / Reviewer 实质结果与 Verification 的区别。
5. 固定方式接入已支持的 prepared Owner correction，生成合法新 successor，保留旧记录。
6. 支持实际需求范围内的 `review` / `revise` 意图解析或明确阶段参数；只按当前唯一合法动作匹配，不加入多步执行器。

### 6.3 必须先证明的技术点：start / finish 不共享 Node 内存

当前开始接口返回的内存对象不能靠“后面调用 finish”自动存在。A 的 Explore/Proposal 必须证明一个最小接续方案：

- 开始记录中的真实 descriptor、执行包、前序和实际授权可被固定入口核对；结束输入中的 handle / request 仅是定位和对照数据，不独立构成可信 current 或授权。
- 不把唯一执行上下文只保存在 `.tmp`，也不让用户再次填 Guidance hash、编号和准备后的全部内部对象。
- 优先复用已存记录与可重建字段。不新增通用会话数据库、后台进程或历史全量迁移。
- 新入口只能完成它所能验证为本次实际开始的执行；遇到来源未知的旧 partial，保持原语义并报告，不能通过“收据存在”自动接管。
- 结束请求重复到达时，不重写历史或重复发生业务效果。可以只读返回已确认的同一结果，或按既有明确错误合同拒绝；冲突结果必须拒绝。
- 业务代码在 Apply 中合法变化，不能用“开始前后源码必须完全相同”禁止真正实施。Review 及结果接纳要绑定所审查/完成的候选，而不是冻结所有 Action 都不能改源码。
- 目标默认仍是顺序单写者。重入/并发写应有明确拒绝；若需要窄的并发保护，在本 Change 证明，不引入分布式锁服务。

### 6.4 必须同步更新的消费者

A 同时更新新入口帮助、受影响的调用示例和最小 Action 指导链接，删除与已实现入口直接冲突的自有规范措辞。不能只改代码而继续让新发行文档声称“禁止任何写命令”。C 再做全目录语义收敛与整体验收。

旧的稳定安装与其 Skills 原样保持，继续管理本 Delivery。源码中的候选 Skills 改变，不代表正在执行中的历史 Guidance 可以被替换。

### 6.5 验收出口

- 两个真实 CLI 进程完成一次 Action 的开始和结束，无临时生命周期源码。
- 错目标、错误 Action、错误角色、caller 伪造 current/Guidance、材料损坏、旧记录覆盖、竞争 successor 全部拒绝。
- 开始写入失败不进行业务；结束持久化或读回失败不报完成；已完成响应丢失不重做业务。
- 旧 D06 的 Guidance provenance 和 prepared correction 回归仍通过。
- 通过的是机械机制，不冒充真实 Reviewer 判断正确。

---

## 7. Change B — Delivery 与辅助操作的稳定入口

### 7.1 目标

避免只修标准 Action 后，Delivery Start、归档、Full Test、Final、Memo 和 Git 节点仍迫使 Agent 写临时脚本。

### 7.2 实现范围

- **接入与 Start：**从结构化规划/真实授权建立项目或 manifest，验证 create-once / 冲突 / written-unconfirmed；不自动激活或提交。
- **Change：**保留 OpenSpec 权威，固定建立/激活/归档的机械步骤及结果读回；归档前置检查不能仅靠输入布尔值声明已通过。
- **Full Test / Final：**调用既有正式操作，固定数据入口和当前结果观察；保存真实命令、输出、attempt 与确认关系。
- **Memo：**固定读写边界，保留 Owner-gated、非阻塞、非自动需求。
- **Git：**复用受控宿主与真实原生/远端工具；固定准备与结果核对，不执行调用者上传的代码。明确目标、范围和授权，Start / Archive / Final 不夹带 Git。
- 当前方法中的通用 `writeManifest`、文件检查等 callback 若必须对外提供实现，应由受测 manager 模块固定实现；不能把“请写一个 callback”重新塞给 Agent。

PR/merge 可以继续由已有工具或人工交接完成，未完成时如实报告。无需为所有 Git provider 开发新客户端，但不能用自报 SHA 代替真实接受事实。

### 7.3 不随此次入口改动迁入的未来政策

新 Flowkit 重写规划中讨论的 Full Test “有界直接产品修复”不是旧版已具备权限。本 Delivery 保持现行规则：环境处置按授权进行；产品修正回到合法 Change / revise；正式重跑建立新 attempt，不覆盖旧失败。

如本次维护中确有必要改变该政策，应单独提出范围变更和审查，不能通过修改 Skill 顺手开放。

### 7.4 验收出口

- 一个最小目标可接入、Start、激活、创建/读取 Memo、归档、正式验证及 Final，各自不要求临时 Node / Python glue。
- 无 Git / 无首个 commit / 无关 dirty 情形继续遵守原合同，不引入回退式硬前置。
- 归档失败、Full Test 失败、Final 未确认、提交已发生但远端未接受，均保留真实状态，不以万能 retry 修复。
- 更改 test config 或目标代码不能通过固定入口绕过既有授权和结果失效规则。
- 原始命令和机械调用的变动未削弱实际独立审查、验证或 Git 范围核对。

---

## 8. Change C — 自有 Skills、HOW 与接入说明的统一收敛

### 8.1 目标

**这是本次明确的产品 Change，不是完成实现之后可省略的文案整理。**

让新的发行资产只描述新的稳定使用路径：Skill 管分析/实现/审查方法，代码管机械操作。既不能保留两套互相冲突的默认做法，也不能为了缩短 Skill 删掉真实审查标准。

### 8.2 必须逐项核对的自有资产

| 范围 | 处理方式 |
|---|---|
| `skills/actions/explore/SKILL.md`、`revise-explore/SKILL.md` | 保留 proof-based Explore、范围/概念归属与决定；机械开始、记录、结束改为固定入口。 |
| `skills/actions/propose/SKILL.md`、`revise-propose/SKILL.md` | 保留方案收敛、任务/验收合同；不要求临时程序写 Run 或手算引用。 |
| `skills/actions/apply/SKILL.md`、`revise-apply/SKILL.md` | 保留实施、任务进度、验证、preflight；prepared correction 指向同发行的稳定入口。 |
| `skills/actions/review-explore/SKILL.md`、`review-propose/SKILL.md`、`review-apply/SKILL.md` | 保留独立审查、证据、复杂度、范围、findings/verdict；不复制 Author 手册，不留生命周期 JS 实现。 |
| `skills/actions/archive/SKILL.md` | 保留规范收敛、准备失败、归档身份和 STOP；通过固定机械操作完成。 |
| `skills/delivery/start/`、`full-test/`、`final/`、`repository-integration/` 及其有效 references | 与 B 的入口、权限、失败/部分成功语义同步；不能继续要求 Agent 实现模块 callback。 |
| `skills/tools/openspec/SKILL.md` | 保留 OpenSpec 版本与规格权威；区分固定工具调用和 Flowkit 自有记录，不允许上游提示跳过 Flowkit 边界。 |
| `docs/onboarding.md`、`README.md`、CLI help、当前有效示例 | 不再把“CLI 只读”当作新发行的能力限制；给出实际可执行的数据调用路径。 |
| `AGENTS.md` 的当前入口与短模板 | 指向实际选定安装及入口，保留其他项目说明；不覆盖整文件，不硬编码当前 Run。 |
| 当前仍被调用的 `.agents/skills/**` 或旧入口镜像 | 先辨认使用方。候选使用指引可更新或退役；本 Delivery 的旧 bootstrap 指导保持固定，不能被候选提前替换。 |
| `openspec/specs/**` 中与新公开入口直接冲突的现行要求 | 通过本 Change 的正常 delta 与 archive 收敛；保留权威/验证语义，不只改 README。 |

### 8.3 上游与历史边界

`skills/vendors/openspec/**` 的上游原始 Skills 原则上保持原字节；由自有 Tool Skill 解释与当前 Flowkit 的配合，不修改 vendor 来伪装上游合同变化。

历史 `.flowkit/runs/**`、`.flowkit/artifacts/**`、归档 Change 中绑定的 Guidance、报告和 proof 均不批量改写。当前自有 Skill 字节改变会形成新 Guidance 身份；旧 Run 保持其当时身份，不重签。

### 8.4 新 Skill 应保留的内容

建议结构：适用阶段与角色 → 输入与权威 → 实质工作方法 → 输出与证据要求 → 固定操作调用 → 失败处理与 STOP。

必须保留：独立 Review、批准方案忠实性、scope drift / minimality、实证要求、适用测试、原始流保护、归档准备、prepared correction 权限、历史不可变，以及 Review approved 不等于 Verification PASS。

应移出：手工编号、手工生成 ActionPackage、手算 Guidance hash、`fs.writeFile` 保存 canonical Run、手写 `checkProof`/`finishRecord`、正常操作依赖动态 import 内部 `dist` 的样板程序。

不得用“详见另一个文档”把同一套临时编程要求隐藏到 references。不得用拒绝词扫描删除用于描述用户项目的合法代码示例。判断对象是**生命周期机械步骤是否还需要临时执行程序**。

### 8.5 验收出口

- 十个标准 Action 的自有 Skill 均有明确处置；Delivery / Tool HOW / onboarding 与 CLI 行为一致。
- 新 Skill 中出现的正常操作，全部由实际发行命令覆盖；帮助、参数、错误状态和数据示例可验证。
- 独立角色从当前项目与短入口出发，能够定位同一安装、同一 Guidance 和正确边界，不靠上一段聊天说明。
- Semantic stale scan 只针对当前有效资产，发现“新 CLI 不支持写命令”“请生成临时 start/finish 脚本”等实质矛盾。
- 上游 vendor 和历史材料原字节保持；没有把同一程序搬到另一个 Skill 当作完成。
- A/B 的必需说明已随实现更新；C 是完整性收口，不是允许前面发布长期不一致版本。

---

## 9. Change D — TypeScript、证据用途与窄权限执行约束

### 9.1 目标

让修复后的使用方式能够被检查和安全采用，而不是仅靠一句“以后不要写脚本”。

### 9.2 TypeScript 范围

本 Delivery 新增/实质改动的自有产品、测试、辅助脚本默认使用 TypeScript，并进入类型检查、构建与可达性验证；不能因文件放入 scripts 或 proof 就绕开语言要求。

Node 执行编译后的 `.js` 是正常发行行为，不等于手写语言违规。第三方上游、编译产物、原始历史材料以及明确作为测试输入的跨语言 fixture 不强行改写。少量工具确实不支持 TS 配置时，记录 exact-file 例外和原因，不能泛化为 scripts/** 全部允许 JS。

本次触达的旧手写 helper 优先收敛为 TS；未触达存量记录为后续迁移范围，不为语言条做全仓历史清洗。

### 9.3 临时数据和必要证据

| 材料 | 允许与处理 |
|---|---|
| `.tmp/*.json` 请求、诊断数据、可丢弃输出 | 允许；删除后不影响正式状态或唯一必要证据。 |
| 随机 `.tmp/*.py/.js/.mjs/.ts` 用于开始、结束、归档或写状态 | 不再是标准路径；相同代码放到其他目录、`-e/-c`、stdin 或改名也不构成合规。 |
| 项目正式测试脚本、固定检查命令 | 保留；按目标项目授权/配置执行，不因目标语言不同而禁止。 |
| 新 proof 中的标准生命周期 glue | 不作为默认产物保存；应以稳定入口、安装身份、输入引用及执行输出表达。 |
| 必要实验脚本、被测脚本、精确复现夹具 | 可以保留；说明用途、受影响断言和为何需要其精确字节。不能只保存摘要却丢失唯一复现输入。 |
| 历史 proof 中的脚本 | 原样保留；不追溯删除、改名或翻译。 |

证据脚本并非天然没有价值。长期可复用的审计/验证程序应进入 `src/tests/scripts` 等受测代码区域；一次性、确有必要的实验按原字节保留及用途说明。需要减少的是正常操作反复生成同一胶水，而不是抹去真实证据。

新增材料检查可使用有限的类型/用途声明和 bounded 路径检查，但不能建一个通用证据平台。GitHub 语言识别配置即便将来调整，也只是展示，不算程序修复。

### 9.4 权限模型：稳定入口不是免检外壳

依据宿主实际能力提供可选、由用户审核安装的窄规则示例；不自动编辑用户 `.rules` 或全局配置。Codex 的规则按命令参数前缀匹配，且宿主存在额外审批/沙箱策略；要在实际目标环境验证匹配行为。[S9]

- 只读查询、受控记录写入、项目检查、Git/网络操作分别说明权限，不提供“所有 flowkit 子命令永久允许”。
- 固定解释器 + 固定已安装入口 + 子命令 + 必要目标，优于裸 `node`/`python` 全放行。固定脚本或安装包仍可被替换，因此需明确实际选定发行身份。
- JSON stdin 通常不是命令前缀规则的授权维度。若目标在 stdin 里可随意变化，不能声称规则限定了项目；要由 CLI 可见目标绑定和入口验证补足。
- 项目内的检查配置、测试和 package scripts 本身能执行代码，纳入信任范围；被它们启动的子进程、网络和系统写入不能借 wrapper 绕过宿主策略。
- 不允许通用 `flowkit exec --program ...` 成为新的任意程序通道；既有检查只读取已审定的目标配置，修改配置触发已有审查和结果失效规则。
- 不以加 `.exe`、改成 pnpm、包一层 Shell 来宣称权限问题已消失。必要的新权限、敏感操作和沙箱外访问仍可能正确地提示审批。

### 9.5 验收出口

- 新增自有可执行逻辑为 TS 并被实际检查；发行 JS 可追溯到构建输入。
- 完整标准工作样例没有新的临时生命周期程序，也没有把程序伪装为 JSON/string 执行。
- 必要实验/fixture 例外被接受，无理由的新 glue 被识别；旧历史不受追溯清洗。
- 宿主规则有匹配/不匹配与冲突输入测试；任意解释器、不同 target、不同安装、Git/网络越权未被顺带允许。
- 报告实测减少的重复请求和仍需审批的情况，不以“零弹窗”作为必须达成的虚假目标。

---

## 10. Change E — 发行验收与 Bootstrap Manager 冻结

### 10.1 目标

证明发布的不是“源码中看似有入口”，而是新项目真正可用的一套 manager、Skills、工具约定和接入方式。

### 10.2 发行检查

- 使用确切版本的构建/打包流程产生实际 tgz；核对 `files` 中包含新入口依赖、自有 Skill references、帮助和工具 lock。
- 安装到新目录，不覆盖管理本 Delivery 的旧稳定安装；从候选安装执行，不能借源码 checkout 或 target helper 才能工作。
- 运行依赖正确安装，用户不需要 Flowkit 开发仓库的 devDependencies；TS 可以构建为 JS 后发行，不要求用户配置 TS 开发工具。
- Typecheck、build、主要回归、文档命令检查和正式 Full Test 按当前所管理的授权节点执行，不因为这个 Change 叫“发行验收”就自动取得 Git/部署权限。

### 10.3 必需真实用例

选一个小型、真实、有明确需求的独立 target；不是完整 LP，也不是直接把新 Flowkit 项目的正式管理记录当作被测写入对象。

| 用例 | 必须证明 |
|---|---|
| 首次接入 | 保护既有文件，定位安装/OpenSpec，建立短入口；无临时生命周期程序。 |
| 完整 Change | 明确激活 → Explore → Review → Propose → Review → Apply → Review → Archive；实际工作和角色结论分别存在。 |
| 修改往返 | 至少一次有真实依据的 changes-requested → revise → review；不能为了凑流程编造缺陷。 |
| 新会话 | 独立新 Agent 会话只凭 target/短入口找到当前边界和 Skills；CLI 重启不能冒充新会话。 |
| prepared / partial | 受控 fixture 验证合法 correction 与未知 partial 的拒绝；不要求破坏真实工作才能证明。 |
| Full Test / Final | 隔离 fixture 中覆盖失败与新 attempt；真实目标在明确授权下完成正式验证与 Final。 |
| Git / 接受 | 至少真实本地隔离 Git 验证对象、范围、部分成功；远端未实际测试时明确声明，不冒充 push/merge 通过。 |
| 权限与证据 | 实际使用固定入口，日志保留原字节，必要实验与标准 glue 区别清楚；宿主审批限制如实记录。 |

假 Agent 和故障注入只能证明机制；不替代独立实际 Reviewer、新会话和真实安装验收。不以单次“所有模型都批准”证明 Review 质量。

### 10.4 冻结与选择输出

输出一份简洁的 manager 选择记录：对应源码基线/构建来源、包名版本、tgz 摘要、所选 OpenSpec/Skills 组合、实际安装位置、验证结果和未覆盖平台/宿主限制。

位置不是身份；同版本不同构建必须能区分。不要把一个包的自身最终摘要写入该包再计算，不把当前 commit 的 SHA 写入必须产生该 SHA 的同一提交，避免循环引用。

验证、Delivery Final、Git 和“将该包选为新项目 manager”是不同边界，按实际授权依次处理。稳定选择完成后默认不再添加功能；后续发现缺陷仍可以进行明确维护，冻结不等于永久禁止修复。

### 10.5 验收出口

真实新会话能用确切安装完成受控工作；整个标准流程不需要临时 Python/JS/TS 生命周期胶水；新 package 和配套 Skills 一致；旧历史和旧稳定安装未被破坏。满足后，才可在另一次明确授权中让它管理新 Flowkit 项目。

---

## 10A. Change F — Prepared Run proof 的 managed checkpoint 兼容

### 10A.1 问题与边界

来源：`flowkit-prepared-proof-checkpoint-compatibility.md` 记录 LearningPlatform D07 H 的真实兼容缺口。Flowkit canonical 链已能接续 `prepared` Apply，包括 `089 apply → 090 revise-propose` 的 Owner correction 和 `092 apply → 093 apply` 的同 Action continuation；但 managed evidence checkpoint 仍要求 proof owner 为 `terminal`，使这些真实 proof 首次进入 Git 时被拒。该项目当时采用 Owner 授权的人工 exact-scope checkpoint，不能把 workaround 当成产品修复。

### 10A.2 目标语义

保留 terminal proof 的现有 admission；仅当 `prepared` owner 的 context/result 合法、未带 author/reviewer/verification verdict 或 nextBoundary、proof 在 Result 中唯一声明且 path/bytes/SHA 匹配，并且整个 canonical Run chain 有唯一合法后继时，允许该 proof 进入 managed Change checkpoint。对 Owner supersession 与同 Action continuation，复用现有 Run-chain 和 Policy edge 判断；不能只改为 `terminal || prepared`，不能在 checker 中重写第二套状态机。

当前 prepared tip、partial `action.md` only、fork、断链、非法 edge、未声明 proof、身份或摘要不符仍须拒绝。不得改写历史 Run、把 prepared 伪装成 terminal、降低 Git index/path/bytes 校验，或让 checkpoint 自动修复 Run。正式合同和实现由 F 的 Explore/Proposal 收敛。

### 10A.3 验收出口

- terminal proof 保持 PASS；合法 Owner supersession 与同 Action continuation 的 prepared proof 可首次进入 managed checkpoint。
- current tip、非法 child、fork、未声明/重复声明 proof、bytes/SHA mismatch 和 prepared 伪 verdict 全部拒绝。
- 使用只读的真实历史副本或有界 fixture，核对 LearningPlatform 089/092 类场景；不修改该项目的真实 Run/Proof，也不在本 Delivery Start 执行 checkpoint。

---

## 11. Skill 与代码必须同批交付的规则

A/B 负责各自能力的最小消费者更新，C 负责全套有效指导语义的一致性，D 增加证据/权限语言约束。**不存在“先发布只有命令的半套版本，再等以后改 Skills”的交付。**

| 情况 | 判定 |
|---|---|
| 命令已实现，Skill 仍要求 Agent 创建 start/finish 脚本 | 不通过 |
| Skill 写了新命令，实际发行包没有入口或漏打包依赖 | 不通过 |
| 删除代码片段，同时删除了独立 Review、证据或失败规则 | 不通过 |
| 大段机械代码挪到新的 references，Agent 仍要复制执行 | 不通过 |
| 将上游 vendor 改成自有规则但保留原始身份声明 | 不通过 |
| 只给 `.flowkit` 加语言统计忽略，正常执行仍不断生成 glue | 不通过 |
| 正常路径固定，实质方法完整，必要实验另按用途留痕 | 可以进入真实验收 |

活动源码中的规范可按正常 Change 收敛；历史归档/Run 所绑定的规范与 Guidance 原字节不改。新发行的 Guidance hash 自然改变，不能要求沿用旧 hash，也不能反过来使旧历史记录全部失效。

---

## 12. 验证计划：实现对应验证，最后收口，不无限重复 Full Test

### 12.1 各 Change 的最小验证

| Change | 优先验证 |
|---|---|
| A | 参数/JSON/角色/阶段测试；真实文件读写；两个 CLI 进程 start→finish；旧 Guidance/correction 回归。 |
| B | 最小目标中的 Start/激活/归档/Memo/Full Test/Final 接线；Git 使用临时本地仓库；验证原语义。 |
| C | 当前资产扫描、示例与真实命令一致、角色方法保留、vendor/历史不变；跨进程只读消费。 |
| D | TS/新增材料范围、必要脚本例外、审批规则匹配与错误输入；不得让检查扫描所有历史。 |
| F | terminal 保持有效；合法 supersession/continuation 的 prepared proof 可接纳；tip、fork、非法 edge、伪 verdict、未声明或摘要不符均拒绝。 |
| E | 实际打包安装、真实 Author/Reviewer、新会话、端到端流程与平台限制报告。 |

测试尽量复用已有 fixture、已验证核心和固定检查。纯规则不反复启动真实 OpenSpec；全流程只选少量有意义的目标。准备、执行、清理、材料处理耗时分别观测，不在没有数据时承诺具体加速百分比。

### 12.2 不改变当前正式验证合同

当前 manager 管理这次修复时，仍遵守原正式 Full Test 规则。命令观察超时不等于进程结束；确认同一任务后继续观察，不因聊天超时重新启动。每次新正式 attempt 实际执行所声明的全部适用检查，不拼接旧通过结果。

错误若要求修改产品，返回合法 Change / revise。新重写项目里拟议的快速修复机制不能靠本计划自行生效。

### 12.3 Release 阻断条件

下列任一项未解决，不得把候选作为新项目的稳定 manager：正常流程仍需临时 glue、配套 Skill 未更新、源码与发行行为不一致、旧有效语义退化、必要证据损坏、未知任务被重复执行、宽解释器放行替代真实修复、或真实安装/独立会话验收缺失。

这里不把“某个无关一次性实验使用 Python”或“仍有正确审批提示”当作阻断；判断的是所承诺的标准路径。

---

## 13. 开发与切换顺序：避免候选管理自己

```text
M0：已经选定的稳定旧 manager / 固定独立 bootstrap 方法
      ↓ 管理本修复 Delivery 的正式过程
旧 flowkit-next 源码：依次完成 A—F（E 为最终发行验收）
      ↓ 构建 M1 候选，不覆盖 M0
M1：只操作隔离验收 target
      ↓ M0 下的 Review / 正式验证 / Final / Git 各按授权完成
固定选择 M1
      ↓
用 M1 管理新 Flowkit 项目
```

本修复 Delivery 的初期仍可能不得不用 M0 的旧方式。这是限于当前迁移窗口的事实，不应伪装为零脚本。对确有必要的旧机制脚本按用途保留精确证据，但不将其复制成 M1 新目标的默认路径。

候选 Skills 和入口开发完成后，也不在本 Delivery 中途覆盖 M0 的已安装文件。已有运行应完成、停止或明确处置后再做受控选择；本次不能静默把 LP 或其他正在运行的项目切到候选。

如果旧 `.agents/skills` 正被 M0 的开发上下文使用，必须保留其固定来源与适用范围；针对候选的旧默认引导应退役或更新，不能通过无条件 fallback 让新会话重新走旧示例。

---

## 14. 交给 Author 的执行说明

执行时先只读核对本地仓库、分支、未提交改动、最新 manifests、实际稳定 manager 及 OpenSpec 安装，不假定远端基线等于本机状态。本文本身不是这一步核对的证据。

核对并输出本文与实际情况的偏移，确认 D07 ID 可用，保存规划文档。Owner 已于 2026-09-30 明确授权 Delivery Start；按当前稳定 manager 规则创建规划清单，六个 Change 为 required/planned；不提前分配 projectOrdinal、Run 号或激活 A。

只有明确激活后才进行对应 Explore。A 的重点是分进程 start/finish、不可伪造的事实来源与旧格式兼容；B 的重点是操作覆盖和实际回调收回；C 不能被降格成可跳过的文案工作；D 不得靠扩权/历史清洗过关；F 必须坚持 canonical 链及 proof 严格校验；E 不得用 fixture 冒充真实会话。

每个 Change 沿用当前 Author / Reviewer 流程。每轮停止点由本次指令确定，不自动下一步，不在 Apply 中顺手执行 Git。若范围必须变更，先给出理由、影响和更新后的覆盖表，再由 Owner 确认，不把这次维护升级为全面重写。

原 v1.0 中“本轮仅核对和规划准备”的首次交接提示词已由 2026-09-30 Owner 的 D07 Start 指令取代，不再作为当前执行指令。

---

## 15. 与新 Flowkit 重写路线的关系

这次维护解决“旧管理器怎样可靠地管理新项目”，不替代新路线中的完整应用分层、测试成本治理、旧项目迁移矩阵及自动化。

新项目可复用本次已经验收的 TS 门面、请求/结果合同、修订后的 Skills 和测试；不要求重新发明。但仍应在新架构下验证，不能只引用 M1 的 PASS 宣称新实现通过。

新项目建立前，将实际选定 M1 的身份加入其管理基线，而不是只写一个可能被覆盖的绝对路径。旧代码和新代码不共用可变的运行源码安装。

---

## 附录 A. 固定来源与核对范围

原 v1.0 基于固定仓库的直接读取；本次 Start 又核对了当前 Git/manager/OpenSpec 状态。源码/规范事实以以下文件为依据，方案中的新命令、接续协议和六个 Change 均待后续正式实现与验证。

- [S1：当前接入说明](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/docs/onboarding.md)
- [S2：当前 review-apply Skill](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/skills/actions/review-apply/SKILL.md)
- [S3：当前 CLI entrypoint](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/src/cli/entrypoint.ts)
- [S4：可信 Action 开始实现](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/src/domain/canonical-action-run-start.ts)
- [S5：Delivery Start Skill](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/skills/delivery/start/SKILL.md)
- [S6：发行与检查配置](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/package.json)
- [S7：旧 D06 清单与四项修复](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/openspec/delivery-groups/20260924-06-action-boundary-corrections.yaml)
- [S8：现行 Formal Full Test 合同](https://github.com/XDesk-xx/flowkit-next/blob/d5453dbecae1e9cc5c8dcaf6214334aa52555b23/openspec/specs/formal-full-test-execution-and-correction/spec.md)
- [S9：OpenAI 官方 Codex Rules 说明（实施时复核宿主版本）](https://developers.openai.com/codex/rules)

S9 只支持审批/规则边界说明，不表示实际用户规则已经读取、安装或验收。仅从 `.tmp` 或解释器名称无法判断每个审批提示的真实原因。

## 附录 B. 文档自检范围

本文件可机械检查六个 Change ID 唯一、依赖存在且无环、A—F 均有范围和验收、代码与 Skills 联动条款、历史/vendor 保留、零临时生命周期 glue 出口，以及不修改用户权限/不自我接管等边界。

该类文档检查只能证明规划结构一致；不能证明软件实现、CLI 参数、Role 隔离、审批规则或新会话验收已完成。全部实现结果必须在旧项目正常流程中另行产生。
