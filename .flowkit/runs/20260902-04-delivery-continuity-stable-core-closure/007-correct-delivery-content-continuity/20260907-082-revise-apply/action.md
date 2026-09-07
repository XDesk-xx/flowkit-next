# Revise Apply 082 — 闭合 081 补审发现的两个实现缺口

Owner 请求：`根据最新run 080 081，revise-apply`。`080-review-apply` 对 079 的原七项 finding 给出 approval；随后 Owner 授权的 `081-review-apply` 对同一候选补审并以 `changes-requested` 修正当前整体 readiness。本次以 081 为直接修订输入，同时保留 080 的真实检查和已闭合事实。批准计划仍为 `074-review-propose`；Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：081 新增的 `D04-RA007-008/009` 已在原批准合同内完成最小实现修正，Author 结论为 `PASS`，交回独立 `review-apply`。`001–007` 保持闭合。本轮未修改 Proposal、design、delta specs 或 tasks，未执行 Formal Delivery Full Test、archive 或项目 Git 操作。

## 修正结果

1. `D04-RA007-008`：Integration preparation 不再把 accepted base 同时为当前 HEAD/target ancestor 当作通用准入条件。现在先确认 exact `acceptedBaseCommit` Git object 存在，再由既有可信 authorization source 精确绑定 accepted base、当前 HEAD、target prestate、operation 与 Owner authority。全新 preparation 对同 tree 的非祖先 HEAD/target 在 exact source 明确匹配时通过；不存在的 base object、错 source、未经授权历史替换仍 fail closed。create-new 唯一普通 parent、prepared invocation prestate drift、内容与必要证据检查保持不变。
2. `D04-RA007-009`：Start artifact refs 改为在 strict closed validator 后按 `artifact/contentSha256/bytes` 和数组位置比较；Integration checkpoint operation 按 `kind` 及适用时的 `checkpointCommit` 比较，并在 ref/record 输出中使用既有固定 clone。对象字段插入顺序不再改变 Start/Integration 语义或 Integration ref；未知字段、真实值变化和有序数组改序仍拒绝。

## 最小性与文件 gate

- 仅修改 3 个既有实现文件并新增 1 个针对性测试文件；没有新增依赖、Registry、provider 策略、canonical-JSON 框架、证据平台、Runtime/Policy/Run schema 或自动 lifecycle。
- Proposal、design、7 份 delta specs 与 tasks 未修改；tasks 仍为 35/35。
- 所有本轮受影响代码与测试文件均不超过 650 行；最大为 `src/domain/delivery-repository-integration-execution.ts`，643 行；新增测试为 502 行。

## 实际验证

- 聚焦 7 个测试文件：42/42 PASS，0 fail，0 skip；新增定向回归 3/3 PASS。
- `080` 的 15 项原闭合 finding 诊断再次全部符合预期。
- Native Windows domain：269/269 PASS，0 fail，0 skip；tracked/untracked ACL read-denial 均真实 PASS。
- Native Windows acceptance：5/5 PASS，0 fail，0 skip。
- Linux x64 glibc 2.36：Node 22.23.2、uid/gid 1000、`--network none`、repository readonly 输入复制到临时 worktree、无 Windows `node_modules`；build PASS，domain 269/269 PASS，acceptance 5/5 PASS。Acceptance 使用只读 `FLOWKIT_HOME/tools` exact OpenSpec 1.10.0 与 Archify 2.15.0。
- `pnpm typecheck`、`pnpm build`、`pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm test:entropy`、`pnpm quality:entropy`、`git diff --check HEAD` 全部 PASS；dependency health 为 97 modules / 489 dependencies，production reachability 为 45/45。
- exact managed OpenSpec `1.10.0`：当前 Change strict PASS；`--all --strict` 为 23/23 PASS。该结果只证明 OpenSpec 结构。

## 交接与 STOP

下一边界是独立 `review-apply`。这只是正常 review matrix handoff，不代表已完成 review、archive、Formal Delivery Full Test 或 Delivery checkpoint。082 不创建 Reviewer、Verification、Owner 或 Git authority，不自动执行下一 Action。

STOP。
