## 1. Contract lifecycle state

- [x] 1.1 Remove `resumed` from Action lifecycle literals/types and remove the `resume` event/transition while preserving internal prepare, exact terminal and fail-closed single-slot behavior; verify focused action-lifecycle unit tests pass and legacy `resumed`/`resume` inputs are rejected.
- [x] 1.2 Update ActionPackage executable-state validation/formation/admission to accept only exact `prepared` current Action state while preserving exact Run occurrence, role and Result linkage checks; verify focused package/admission tests pass including stale prior Run rejection.

## 2. Single-Action invocation composition

- [x] 2.1 Add a thin invocation-entry helper/composition branch that internally prepares the target only from an empty slot or structurally eligible different terminal Action, but reuses exact same existing `prepared A` without duplicate prepare; verify tests cover empty prepare, terminal-to-different prepare, prepared-same reuse and prepared-different rejection.
- [x] 2.2 Add the minimal host execution callback seam and ensure a successfully formed ActionPackage invokes it exactly once per invocation with no registry/routing abstraction; verify a focused test counts exactly one callback call and package formation failure calls it zero times.
- [x] 2.3 Compose callback output through existing exact Result admission and terminalize only after successful admission; verify successful admission returns admitted Result plus exact terminal Action and mismatched Result leaves the exact Action prepared.
- [x] 2.4 Return one bounded invocation outcome that preserves admitted `nextBoundary` as opaque data and never loops/recurses into another Standard Action; verify success and failure tests both end after one invocation and do not execute a second callback.

## 3. Re-execution and regression verification

- [x] 3.1 Verify a failed admission can be followed by a later invocation that reuses the same exact `prepared A` with a new Run context/occurrence, forms a new ActionPackage, rejects the stale prior package and does not require `resume`, retry counters or duplicate prepare.
- [x] 3.2 Run repository `typecheck`, full domain test suite and declared `format:check`; verify all pass with no new dependency, persistence, Policy, transport, Git or CLI mutation.
- [x] 3.3 Run strict OpenSpec validation for this Change and all canonical specs; verify the three delta capabilities remain traceable to approved Explore/051 review clarification and no deferred non-goal has entered implementation tasks.
