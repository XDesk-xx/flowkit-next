## Purpose

为 repository-local 工程开发提供一个独立、只读、确定性的 production entropy 边界，只阻断存在于 `src` 但无法从明确 production roots 到达的源代码，而不扩张为通用 dead-code、unused-package 或质量平台。

## ADDED Requirements

### Requirement: Stable repository entropy hygiene command
Repository SHALL expose one stable repository-local entropy-hygiene command that evaluates production-source reachability and exits non-zero when any resolved `src` source module is outside the reachable closure of the exact production roots.

The exact current production roots SHALL be:

- `src/cli/entrypoint.ts`
- `src/domain/index.ts`

#### Scenario: Healthy production graph passes
- **WHEN** every resolved `src` source module is reachable from at least one exact production root
- **THEN** the entropy-hygiene command MUST exit successfully

#### Scenario: Unreachable production source fails
- **WHEN** any resolved `src` source module is not reachable from either exact production root
- **THEN** the entropy-hygiene command MUST exit non-zero and identify the unreachable production source module

### Requirement: Production liveness is defined by production-root reachability
A production source module SHALL be considered live only when it belongs to the local `src` dependency closure reachable from at least one exact production root.

The capability SHALL NOT treat an isolated/no-edge property as equivalent to production-root unreachability, and references originating only from tests/specs SHALL NOT make a production source module live.

#### Scenario: Internally connected dead subgraph fails
- **WHEN** two or more `src` source modules depend on each other but none is reachable from either production root
- **THEN** every module in that unreachable production subgraph MUST be reported as an entropy finding and the command MUST fail

#### Scenario: Test-only reference does not create production liveness
- **WHEN** a `src` source module is referenced by tests/specs but remains unreachable from both production roots
- **THEN** the module MUST remain an entropy finding and the command MUST fail

### Requirement: Entropy hygiene remains independent and bounded
Repository Entropy Hygiene SHALL remain an independent, read-only, deterministic repository check and SHALL NOT be embedded into `quality:gate` or `quality:dependency-health` by this Change.

This capability SHALL NOT own unused dependency, unused export, unused type, unused test-file, undeclared package, unresolved import, cycle, production-to-test/spec, automatic cleanup, baseline, waiver, cache, changed-file planning, registry/platform, Formal Full Test, or lifecycle-state behavior.

#### Scenario: Existing quality commands remain independently scoped
- **WHEN** Repository Entropy Hygiene is introduced
- **THEN** `quality:gate` and `quality:dependency-health` MUST retain their existing responsibilities without gaining this reachability check as part of this Change

#### Scenario: Zero baseline needs no exception state
- **WHEN** the current repository has zero production-unreachable findings
- **THEN** the capability MUST NOT create baseline, waiver, cache, or changed-file-planning state merely to support adoption
