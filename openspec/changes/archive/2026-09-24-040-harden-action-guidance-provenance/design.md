## Context

现有 resolver 已能从 trusted manager installation 读取 exact Action 的 canonical regular Skill bytes。`invokeSingleAction()` 在其内存执行路径使用该 resolver；实际产品 HOW 的分段 Run 启动却把普通 `GuidanceRef` 交给纯结构 `formActionPackage()`，然后由 Agent 创建 `action.md`。具体反例及审查见 `20260924-001-explore`、`20260924-002-review-explore`。本设计遵循 [proposal.md](proposal.md) 的两个现有能力边界。

## Goals / Non-Goals

**Goals:**

- 让产品 Agent 的正常新 Run 启动调用一个 manager 自有操作，由它绑定当前安装真实 Guidance、package、readiness 与 create-once 开始记录。
- 将 Guidance mismatch 和无效地址拒绝在目标 Run 目录创建前；写入后的失败保留实际 partial。
- 保持独立查询、历史读取、Result admission 与三文件 Run schema 的既有职责。

**Non-Goals:**

- 不拦截任意外部脚本直接写 target 文件，也不引入文件系统事务、跨进程锁或恶意安装并发改写防护。
- 不改第二个 Change 的 prepared Owner correction，也不重写旧 Run、加入新 CLI 写命令或自动 Author/Reviewer loop。

## Decisions

### 1. 将可信开始放在 manager 的单一有界操作

新增一个导出的 manager 操作，供十份产品 Action HOW 调用；实现可置于新的薄模块，以复用现有 resolver、package formation 与 Run 地址/完整性函数。输入是 trusted installation、已经确定的 exact prepared Action/Run context、受控地址及 package-bound readiness；caller 的 expected GuidanceRef 只用于与当前重新解析的结果比较，不能决定结果。操作先验证 identity、Role、context、occurrence、地址及唯一 sequence，再从当前安装解析 Guidance、形成 package 并完成只读 readiness。临近首次文件系统创建时再次解析并比较同一 canonical ref；只有一致才 create-once 写 `action.md`，返回 held package、Run 地址和刚写入的原始内容供后续接纳/读回。

选择 manager 自有写入边界，是因为仅返回一个普通 package/factory 对象仍允许现有 HOW 把手填 SHA 写入；只修改 `isActionGuidanceRefForAction()` 的结构规则也无法获得可信安装来源。操作不取代 `invokeSingleAction()` 的现有内存路径。

### 2. 把 provenance 拒绝放在任何目标 Run 创建之前

所有 Guidance、package、readiness 和受控地址失败先于目标 Run 目录创建。成功检查后沿用已有 create-once、序号唯一、路径/链接边界；若写入过程或后续完成失败，保留真实目录与已写 bytes，并报告 partial，不删除、不覆盖、不自动占用下一 occurrence。此处没有跨进程快照或锁承诺；测试覆盖准备后顺序发生的安装/bytes 漂移。

### 3. 保持纯结构校验与历史读取

`isActionGuidanceRefForAction()`、`isActionPackage()`、`formActionPackage()` 继续供结构、序列化及适用的内存执行使用，调用处与测试不再将其 PASS 称为 provenance proof。新启动通过可信开始操作绑定内容；`admitActionResult()` 仍只接纳 exact current package 的 Result。历史读取继续验证持久结构、地址和记录完整性，不按当前 manager Skill 重新计算旧 ref。

### 4. 更新实际 HOW，而非增加另一个流程层

十份 `skills/actions/**/SKILL.md` 中相同的 Agent start 示例改为调用 manager 的有界入口，finish/checkProof 继续使用原有接纳与材料检查边界。目标项目无需复制系统 Skill 或提供胶水工程；示例仍明确单 Action 后 STOP、异常 partial 保留。

## Risks / Trade-offs

- 当前安装的 Skill 在开始检查之外被并发改写，单次读取无法提供永久文件锁定。以开始前的再解析检测顺序漂移；不把并发恶意改写扩大为本 Change 的新协议。
- 启动操作涉及 Run 写入，若失败可能留下真实 partial。保持现有 create-once 规则与可观察诊断，不尝试自动清理。
- 十份 HOW 若漏改一份，正常 Agent 路径仍可绕过可信入口。用覆盖所有 Standard Action 的静态/执行回归检查对应示例。

## Migration Plan

更新生产入口与产品 HOW 后，以同一 build 的跨安装、同一路径 bytes 漂移、伪造/错 Action SHA、合法成功与历史读取回归验证。旧 Run 和 bootstrap/history 不迁移；发布或切换 manager 仍遵循 Delivery Final 与 Owner Git 边界。
