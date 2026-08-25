## 1. Action lifecycle domain shape

- [x] 1.1 新增 `src/domain/action-lifecycle.ts`，定义 `ACTION_LIFECYCLE_STATES`、`ActionLifecycleState`、`ActionIdentity`、`CurrentAction` 与 `CurrentActionSlot`，并通过 `pnpm typecheck`（或 detached exact Node 的等价 `tsc --noEmit`）验证类型边界无错误。
- [x] 1.2 实现 `isActionLifecycleState`、`isActionIdentity`、`isCurrentAction` runtime validators，复用既有 canonical identity/Standard Action validators；增加 malformed state、malformed Delivery/Change id、unknown ActionId 与 semantic object-copy tests，并验证 targeted domain tests 通过。
- [x] 1.3 从 `src/domain/index.ts` re-export Action lifecycle capability，并把现有 `state.test.ts` 的“Action lifecycle 不存在”断言收窄为 `state.ts` module separation invariant；验证现有 authority/identity/state tests 无 regression。

## 2. Structural transition reducer

- [x] 2.1 定义 `prepare/resume/terminal` lifecycle event shape，并实现单一 pure `transitionCurrentAction(current, event)` reducer；验证 `empty -> prepared A`、`prepared A -> resumed A`、`resumed A -> resumed A`、`prepared A -> terminal A`、`resumed A -> terminal A` 全部通过 targeted tests。
- [x] 2.2 实现 exact semantic ActionIdentity comparison 与 non-terminal single-current protection；验证 `prepared/resumed A -> prepare B`、resume/terminal identity mismatch、empty resume/terminal 均 deterministic reject 且 reducer 不 mutate 输入。
- [x] 2.3 实现 terminal absorbing 与 atomic different-identity replacement；验证 `terminal A -> resume A/B`、`terminal A -> terminal A/B`、`terminal A -> prepare A` 全部 reject，而 `terminal A -> prepare B` 仅在 canonical `B != A` 时产生 `B/prepared`。
- [x] 2.4 增加测试证明 reducer 不消费 OwnerAuthorityFact、Review/Verification/OpenSpec/Policy facts，也不编码 Standard Action next ordering；通过 module/API inspection 与 targeted tests 验证本 Change 只提供 structural lifecycle legality。

## 3. Change verification

- [x] 3.1 运行完整 domain test suite，确认新增 Action lifecycle matrix tests 与既有 authority/identity/state tests 全部 PASS，且没有引入 Run/Result persistence、Policy、CLI、OpenSpec adapter 或 Git mutation behavior。
- [x] 3.2 运行 typecheck 与 repository-declared format check，确认新增 domain/test 文件满足当前 TypeScript/format baseline，且 `package.json`/lockfile 不需要新增 dependency。
- [x] 3.3 运行 `openspec validate establish-action-lifecycle-domain-contract --strict`（使用 OpenSpec 1.10.0 的等价 exact invocation），确认 proposal/design/specs/tasks 与 `action-lifecycle` delta contract 完整可验证，再停止于 apply 前边界。
