# Revise Apply 077 — 修正内容连续性实现缺口

Owner 请求：`根据最新 run，revise-apply`。输入为 `20260907-076-review-apply`，批准计划仍为 `20260907-074-review-propose`；Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：076 的 7 项 finding 已在原批准合同内完成最小实现修正，Author 结论为 `PASS`，交回独立 `review-apply`。本轮未修改 Proposal/design/delta specs/tasks，未执行 Formal Delivery Full Test、archive 或项目 Git 操作。

## 修正结果

1. `D04-RA007-001`：Start 执行与 commit 两个 host callback 均只接收 defensive package copy；内部保留原始 authority/package 基准，并在 Git mutation 前重验原授权与 exact prestate。回调修改嵌套 scope 不能再扩大 commit 权限，未授权路径 commit 调用为零。
2. `D04-RA007-002`：Start 内容完成改由窄 `ReadDeliveryStartValidation` source 读取实际 validation material，核对 sourceRef、project/Delivery/base/planning、四个输出引用及实际 bytes 派生的 artifact refs；缺失、未知或错绑定来源 fail closed。
3. `D04-RA007-003`：Final required evidence 改为按 Change、Full Test、Architecture 三类窄 source capability 读取；Change chain 必须来自持久化 canonical Run 三文件并满足 accepted archive/review；Full Test 与 Architecture 必须携带完整 outcome bytes，分别通过 trusted PASS 校验或重新派生 ref，并与当前实际 outcome 一致。
4. `D04-RA007-004`：Repository Integration preparation 从独立 source 读取 Owner authorization，绑定 operation、target/prestate、accepted base 与 reuse checkpoint 来源；执行后还必须从独立 acceptance source 核对本次 accepted repository object。可信 source 明确授权时，不同历史仍可合法通过；相同内容不能代替授权。
5. `D04-RA007-005`：Start 与 Integration 的 create-new checkpoint 均读取完整 parent list，并要求恰好一个 parent 且等于已绑定 prestate；双 parent merge commit 被拒绝。
6. `D04-RA007-006`：Final requiredEvidence 的 clone/hash projection 改为逐层固定字段构造；对象 property insertion order 不再改变 Final ref，有序数组语义仍保留。
7. `D04-RA007-007`：`commitFinal` 只在 `create-new` 分支必需；`reuse-existing` 无需提供且保证零调用。Repository Integration product Guidance 已按两个 checkpoint variants 收敛，移除无条件新建 commit 指令。

## 最小性与文件 gate

- 新增的 source 都是当前批准合同所需的窄 host source/read seam；没有新增 Registry、统一 evidence/proof 平台、Runtime/Policy/Run schema 或自动 lifecycle。
- Proposal、design、7 份 delta specs 与 tasks 未修改；tasks 仍为 35/35，未以本轮修正重写已批准范围。
- 将 Final property-order 测试、accepted-object Integration 测试以及共用 outcome/fixture 拆到独立文件。所有当前受影响的代码、测试、Skill、计划文件均不超过 650 行；最大文件为 `tests/unit/domain/delivery-repository-integration-accepted-object.test.ts`，645 行。

## 实际验证

- 聚焦 7 项 finding 的测试：36/36 PASS，0 fail，0 skip。
- Native Windows domain：263/263 PASS，0 fail，0 skip；tracked/untracked ACL read-denial 两个子例均真实 PASS。
- Native Windows acceptance：5/5 PASS，0 fail，0 skip。
- Linux x64 glibc 2.36：Node 22.23.2、uid/gid 1000、`--network none`、repository readonly；domain 263/263 PASS，acceptance 5/5 PASS。Acceptance 使用只读挂载的 `FLOWKIT_HOME/tools` exact OpenSpec 1.10.0 与 Archify 2.15.0，并在临时容器副本中构建当前 candidate。
- `pnpm typecheck`、`pnpm build`、`pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm test:entropy`、`pnpm quality:entropy`、`git diff --check` 全部 PASS；dependency health 为 93 modules / 455 dependencies，production reachability 为 45/45。
- exact managed OpenSpec `1.10.0`：当前 Change strict PASS；`--all --strict` 为 23/23 PASS。该结果只证明 OpenSpec 结构。

Linux 前两次准备尝试分别在测试前因 PowerShell 探针引号和非 root Corepack cache 不可见而停止；随后直接执行 package.json 中的原始 Node test commands。第一次 acceptance 因未设置 `FLOWKIT_HOME` 按合同 fail closed，不记作 PASS；补入只读 exact tools mount 后同一 acceptance 命令 5/5 PASS。没有为获得 PASS 开网、skip 或弱化断言。

## 交接与 STOP

下一边界是独立 `review-apply`，仅为正常 review matrix handoff，不代表已完成 review、archive、Formal Delivery Full Test 或 Delivery checkpoint。077 不创建 Reviewer/Verification/Owner/Git authority，不自动执行下一 Action。

STOP。
