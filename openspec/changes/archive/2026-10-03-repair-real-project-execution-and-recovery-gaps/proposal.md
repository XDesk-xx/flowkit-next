## Why

LearningPlatform 和 MenDi 的真实执行暴露了候选身份在 Review/Archive 间不一致、Run 编号重置、pnpm 归档隔离失败及失败记录无法安全续接的问题。当前入口还不能保存真实 `rejected`，迫使正常诊断与历史纠正依赖项目特例；需要在现有固定命令内统一证据和失败边界。

## What Changes

- 在 Review finish 前核对 exact Author Run 与候选身份，将 raw/Git-filtered 字节差异检查前移到候选接纳和审核；checkpoint 对未变化候选核对原身份，对合法归档迁移、spec 收敛和 coordination 更新消费可信 Archive 后态，再核对实际 index/blob。
- 新 Change 从同 Delivery 已验证占用最大序号后分配；兼容旧跨 Change 重号和缺口，保留每个 Change 内唯一链与所有历史 bytes。
- Archive 使用包含独立依赖副本的 scratch，统一两处 preflight 的执行环境，禁止自动安装原依赖；保留原始 stdout/stderr 和可归属诊断。
- 新增固定只读 `action inspect`，报告 partial 的真实材料和副作用；`change archive` 仅在观察证据允许时继续同 Run 剩余步骤，禁止重放归档。
- 新增 Owner 授权、角色归责的固定 `action correct`，以追加文件补齐 terminal Author 候选身份或 Reviewer binding 的缺失字段。每 Run 至多一个 correction，不覆盖旧三文件、既有值、verdict 或候选内容；消费方统一校验 effective view 和下游引用。
- 将 Reviewer `rejected` 保存为 terminal 并返回确定 blocked boundary；扩展既有 Owner `revise-action` 入口支持已识别拒绝后的对应 revise，不自动转成 `changes-requested`。
- 同步产品 Skills/onboarding、必要 delta specs 与 fixed CLI 回归；真实 native Windows + pnpm 11 acceptance 单独列为必需证据。

## Capabilities

### New Capabilities

无。新命令和追加材料属于既有 Action/Run 支持，不新增 Registry、恢复平台或生命周期状态。

### Modified Capabilities

- `stable-action-command-execution`：Review binding、candidate Git bytes、terminal rejected、terminal Owner revise、只读 inspect 与有界 correct 固定入口。
- `run-result-persistence`：Delivery 新编号、旧重号兼容、terminal rejection 读回、追加 correction 与 effective facts。
- `policy-and-next-boundary`：known rejected 的 deterministic blocked diagnosis 及明确 Owner revise 后继。
- `stable-delivery-support-command-execution`：Archive 独立依赖隔离、原始失败诊断、证据绑定的同 Run 剩余步骤恢复。
- `repository-integration-and-next-base-continuity`：已审 raw candidate 经有界 Archive 转换后与实际 index/blob 一致、correction 的 managed Git bytes 准入。
- `author-action-guidance`：隔离检查、失败观察、候选字节前移与不可变纠正的 Author HOW。
- `reviewer-action-guidance`：exact binding、真实 rejected 和 Reviewer-owned correction 的独立责任。

## Impact

修改既有 CLI/parser、Run/Policy/Archive readiness 与 scoped checkpoint/evidence helper，增加必要 TypeScript helper、相关 unit/acceptance，并同步发行 HOW。沿用 exact OpenSpec 1.10.0、既有 Node/pnpm 身份、三文件 Run、single-writer 与 prepared/terminal；不新增依赖管理器或自动安装。

输入与逐项依据见 [explore.md](explore.md) A–G。Owner 已明确授权本 Change 直接 OpenSpec、不走 Runs；规划及其修订不把 Explore 结论标为 Reviewer approved，也不声明实现已验收。后续实现与独立审查、Verification、Full Test/Final、Git 和安装升级仍是独立边界。

不修改两个消费项目、不迁移旧 Run、不重命名 MenDi 历史、不追认已推送候选、不发布新包。已有未提交编号草案只作为 Apply 待纠正输入，不能视为当前实现已验收。
