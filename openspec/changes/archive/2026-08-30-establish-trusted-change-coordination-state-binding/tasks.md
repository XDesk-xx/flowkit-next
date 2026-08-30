## 1. Package truth and trusted coordination reader

- [x] 1.1 Add `yaml` as a directly declared production dependency and update `pnpm-lock.yaml`; verify frozen-lockfile installation/package resolution succeeds without relying on managed OpenSpec or undeclared transitive modules.
- [x] 1.2 Implement the read-only trusted Delivery-Change coordination resolver over the exact repository-owned Delivery manifest; verify focused tests reject missing/unreadable/invalid YAML, Delivery-id mismatch, missing/duplicate exact Change, and invalid owned coordination fields.
- [x] 1.3 Implement exact activation-provenance recognition (`activate-change` + exact Delivery/Change + exact `scope=["explore"]`) using the existing structural OwnerAuthorityFact validator; verify wrong scope, wrong Change, wrong Delivery, missing provenance, and historical provenance on non-active states all fail closed.
- [x] 1.4 Implement direct `dependsOn` completion validation for lifecycle-enterable active state; verify missing/duplicate dependency targets and any non-`completed` dependency fail closed while an empty or fully completed direct dependency set succeeds.

## 2. CLI request and composition convergence

- [x] 2.1 Remove authority-bearing `changeState` from shared `status` / `next` request parsing/types and update all in-repository fixtures/callers; verify malformed legacy requests cannot override trusted state and TypeScript compilation passes.
- [x] 2.2 Wire `status` through the trusted resolver and report only the resolved canonical `changeState`; verify acceptance tests show caller input cannot self-upgrade or downgrade the reported state.
- [x] 2.3 Wire `next` through the same trusted resolver before pure Policy composition; verify a durable planned Change cannot reach `READY_ACTION(explore)` by caller assertion and a valid exact Owner-authorized active Change with satisfied dependencies can.
- [x] 2.4 Map resolver failures to a deterministic machine-distinguishable non-zero CLI failure without converting them to Policy `BLOCKED`; verify status/next integration tests distinguish untrusted coordination input from a valid Policy blocked decision.

## 3. Authority and Policy contract preservation

- [x] 3.1 Keep `evaluatePolicyAndNextBoundary(...)` repository-IO/provenance-resolution free and preserve the existing normal transition matrix; verify focused Policy tests run without repository/manifest fixtures and existing domain Policy cases remain green.
- [x] 3.2 Preserve Policy-owned exact `revise-action` Owner correction eligibility and the separate checkpoint-authorization evaluator; verify existing correction/checkpoint tests remain green and trusted coordination resolution does not accept those decisions as activation provenance.
- [x] 3.3 Add focused tests proving `status` and `next` consume the same trusted coordination state for exact Delivery+Change identity; verify no split-brain caller-state behavior remains.

## 4. D02 dependency and regression proof

- [x] 4.1 Add a controlled D02-style fixture where a normal quality Change depends on `establish-trusted-change-coordination-state-binding`; verify it is not lifecycle-enterable until the corrective dependency is `completed`, then becomes eligible only after its own exact Owner activation provenance is present.
- [x] 4.2 Run `typecheck`, formatting check, build, domain tests, acceptance tests, `git diff --check`, and strict OpenSpec validation; verify all applicable checks pass on the exact candidate.
- [x] 4.3 Confirm the implementation introduced no second coordination store, registry, background sync, automatic activation, Policy filesystem IO, generic authority subsystem, or internal V1/V2 contract family; verify final diff and Reviewer handoff explicitly report these non-goals as absent.
