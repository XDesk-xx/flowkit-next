# Revise Apply 084 — 闭合 083 的 Start 数组边界回归

Owner 请求：`根据最新run，revise-apply`。最新真实 Run 为 `20260907-083-review-apply`，其唯一阻断 finding 是 `D04-RA007-010`；批准计划仍为 `20260907-074-review-propose`。本次只在 Change `correct-delivery-content-continuity` 的既有批准合同内进行最小修订。

结论：`D04-RA007-010` 已修正，Author 结论为 `PASS`，交回独立 `review-apply`。`D04-RA007-001` 至 `009` 保持闭合。本轮未修改 Proposal、design、delta specs 或 tasks，未执行 Formal Delivery Full Test、archive 或项目 Git 操作。

## 修正结果

1. Start 的 artifact-ref 数组比较现在先要求真实数组、每个索引都是 own property、每个元素都满足 closed artifact-ref validator，再比较 `artifact/contentSha256/bytes` 与数组顺序。
2. `source.outputs` 为 `undefined`、`null`、array-like、全稀疏、单槽空洞或 dense invalid 元素时，公开 Start invocation 均返回规范 `failed: content-completion-rejected`，不再抛出未分类异常或错误 terminal，并且 checkpoint callback 调用数为 0。
3. `surface.validation.artifacts` 的稀疏数组在 closed surface validator 处 fail closed，公开 invocation 返回 `failed: surface-validation-failed`，不会进入内容读取或 checkpoint。
4. 合法 dense 数组及对象字段重排成功路径保持；真实值变化、未知字段和有序数组改序仍拒绝。

## 最小性与文件 gate

- 本轮只修改 `src/internal/delivery-start-content.ts` 与 `tests/unit/domain/delivery-continuity-semantic-boundaries.test.ts`，没有新增依赖、抽象层、Registry、provider 策略、证据平台或 Runtime/Policy/Run schema。
- 本轮修订文件分别为 370 行和 575 行，最大 575 行；连同前序 Apply 累计受影响文件，最大仍为 643 行，均不超过 650 行。
- Proposal、design、7 份 delta specs 与 tasks 未修改；tasks 仍为 35/35。

## 实际验证

- 新增/扩展定向测试：3/3 PASS；聚焦 7 个文件：42/42 PASS；`080` 的 15/15 原诊断继续符合预期。
- Native Windows：domain 269/269 PASS，acceptance 5/5 PASS；均为 0 fail、0 skip，tracked/untracked ACL read-denial 实际通过。
- Linux x64 glibc 2.36 detached：Node 22.23.2、uid/gid 1000、`--network none`、只读 repository/tools 输入；build PASS，domain 269/269、acceptance 5/5，均为 0 fail、0 skip。
- `pnpm typecheck`、`pnpm build`、`pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm test:entropy`、`pnpm quality:entropy`、`git diff --check HEAD` 全部 PASS；依赖健康为 97 modules / 489 dependencies，production reachability 为 45/45。
- exact managed OpenSpec 1.10.0：当前 Change strict PASS，`--all --strict` 为 23/23 PASS；该证据只证明 OpenSpec 结构。
- 首次扩展测试把稀疏 surface 的规范失败原因误写成 `agent-result-rejected`，该次 2/3 不是产品 PASS；修正测试预期为实际合同边界 `surface-validation-failed` 后，以上套件全部重跑通过。

## 交接与 STOP

下一边界是独立 `review-apply`。084 不创建 Reviewer、Verification、Owner 或 Git authority，不自动执行下一 Action。

STOP。
