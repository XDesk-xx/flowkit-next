## 1. Minimal TypeScript Verification Baseline

- [x] 1.1 增加本 Change 所需的最小 TypeScript/test 配置与 package scripts（不新增 runtime/test framework dependency），并验证 `tsc --noEmit` 与 targeted Node/tsx test command 能在仓库根目录启动成功。

## 2. Canonical Identity Contract

- [x] 2.1 实现 `SemanticId` validator（ASCII、1..128 chars、`^[a-z0-9]+(?:-[a-z0-9]+)*$`）与 DeliveryId / ChangeId plain-data types，确保 Change 不存在第二个 canonical `key` identity；targeted tests 至少覆盖当前 Delivery/Change id PASS，以及 empty、uppercase、underscore、dot、slash、whitespace、leading/trailing `-`、连续 `--`、>128 chars 与 alias/normalize 输入 fail closed。
- [x] 2.2 实现固定 Standard Action identity catalog（`explore` 至 `archive` 的十个 canonical literals）与 validator；用 targeted tests 验证已知 Action 可识别且未知 literal 被拒绝。
- [x] 2.3 建立只作为组织元数据的 Change `group` 表达，并用 targeted test 证明 identity/lookup contract 不依赖 group 且不会生成 group lifecycle target。

## 3. Authority Separation Contract

- [x] 3.1 实现 `ActorRole`、`ActionExecutionRole` 与独立 `AuthoritySource` 基础类型/validator；用 targeted tests 验证 Owner 不能作为 Standard Action execution role、Reviewer 与 Author 保持分离、Verification 不被当作 actor role。
- [x] 3.2 实现冻结的 `OwnerAuthorityFact` wire validator：仅允许 `ref/decision/deliveryId/changeId?/sourceRef/scope`，其中 `ref=^owner:[0-9a-f]{64}$`、decision/deliveryId/changeId/scope token 使用 `SemanticId`、`sourceRef=^[!-~]{1,512}$`、scope 为 1..32 个 unique 且 bytewise ASCII lexicographic 严格递增的数组；targeted tests 覆盖合法 Delivery-scoped / Change-scoped fact、missing required field、`changeId:null`、extra field、bad ref、bad sourceRef、empty/duplicate/unsorted/malformed scope，并证明 structurally valid 但 Policy 未识别的 decision 不会在本 validator 中被赋予 eligibility。
- [x] 3.3 增加 authority invariants tests，验证 approved Review、PASS Verification 与 terminal Action result 均不能在缺少显式 Owner authority fact 时被当作 Owner authorization。

## 4. Delivery / Change Structural State Contract

- [x] 4.1 实现封闭 Delivery state 与 Change state literal validators，并用 targeted tests 覆盖所有合法 literal 与未知 literal fail-closed 行为；确认本模块未引入 Action prepared/resumed/terminal transition logic。

## 5. Public Domain Boundary and Verification

- [x] 5.1 通过 `src/domain/index.ts` 暴露本 Change 的稳定 public domain boundary，并用 typecheck/import test 验证下游可以只依赖该 boundary，而不需要 registry、Policy、persistence 或 CLI module。
- [x] 5.2 运行本 Change 的 targeted unit tests 与 TypeScript typecheck，记录实际命令/结果并核对 `git diff` 只包含 Proposal/Spec/Design 允许的 implementation、test 与最小 verification-config mutation。
