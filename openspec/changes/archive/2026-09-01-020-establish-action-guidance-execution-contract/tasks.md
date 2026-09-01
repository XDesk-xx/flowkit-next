## 1. Canonical Action Guidance identity

- [x] 1.1 Implement the closed `ActionGuidanceRef` contract and deterministic `skills/actions/<StandardActionId>/SKILL.md` path derivation, and verify unit tests reject invalid Action ids, malformed refs, and wrong canonical paths.
- [x] 1.2 Implement trusted repository-root Guidance resolution for regular canonical files with exact content SHA-256, and verify tests cover successful resolution, byte-content drift, missing entry, unreadable/non-regular entry, symlink/path redirection, and `.agents/skills/**` non-fallback behavior.
- [x] 1.3 Export only the bounded product Guidance contract/resolver surface needed by existing domain composition, and verify no Registry / Router / Planner / cache / method-discovery API is introduced.

## 2. ActionPackage contract integration

- [x] 2.1 Refactor `ActionPackage` into its own exact closed envelope containing existing RunContext execution facts plus exact `GuidanceRef`, while preserving RunContext projection validation; verify existing RunContext round-trip tests remain unchanged and package validation rejects missing/extra/malformed Guidance fields.
- [x] 2.2 Update `formActionPackage` to require an Action-aligned trusted GuidanceRef and verify tests reject wrong-Action Guidance substitution while preserving existing run/action/role/state/authority/predecessor mismatch failures and re-execution semantics.
- [x] 2.3 Verify durable `.flowkit/runs/**/context.json` / `result.json` schemas and the three-file Run persistence contract require no Guidance field or migration.

## 3. Single-Action execution binding

- [x] 3.1 Integrate trusted Guidance resolution into `invokeSingleAction` after exact prepared Action establishment and current RunContext validation but before Agent callback execution; verify a valid canonical GuidanceRef reaches the callback inside the exact ActionPackage.
- [x] 3.2 Reuse the existing bounded package-formation failure path when Guidance resolution fails, and verify missing/invalid canonical Guidance prevents callback execution without creating a new lifecycle state, retry path, or next-Action behavior.
- [x] 3.3 Update single-Action unit/acceptance fixtures with bounded temporary `skills/actions/**` Guidance files and verify existing Role, Result admission, terminalization, repeat-invocation, and STOP behavior remains unchanged.

## 4. Existing identity-chain propagation

- [x] 4.1 Update ActionPackage cloning/hash material so exact GuidanceRef participates in `deriveActionPackageRef`, and verify changing only Guidance content identity changes `ActionPackageRef` while identical package facts remain stable.
- [x] 4.2 Verify existing ApplicableCheck execution-input derivation naturally changes `executionInputRef` when only the ActionPackage Guidance identity changes, without adding a Guidance-specific execution ref or changing candidate/check identity semantics.

## 5. Change verification

- [x] 5.1 Run focused Action Guidance, ActionPackage, single-Action execution, ApplicableCheck, and acceptance tests and verify all relevant tests pass with no production use of `.agents/skills/**` as canonical fallback.
- [x] 5.2 Run repository TypeScript/typecheck and the minimum applicable D02 engineering checks required for handoff, and verify no unrelated mechanical regression is introduced.
- [x] 5.3 Run `openspec validate establish-action-guidance-execution-contract --strict` and canonical spec validation as applicable, and verify Proposal/spec/design/tasks remain internally consistent with the approved Explore and Stable Core self-hosting boundary.
