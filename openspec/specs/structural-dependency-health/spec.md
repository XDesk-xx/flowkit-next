# structural-dependency-health Specification

## Purpose

为 repository-local 工程开发提供一个独立、廉价、可重复执行的结构依赖健康边界，只阻断已 proof 的高置信度 bad dependency edges，而不把依赖图检查扩张为 entropy、architecture layering、Verification 或质量平台。

## Requirements


### Requirement: Stable structural dependency health command
Repository SHALL expose one stable repository-local Structural Dependency Health command that evaluates the repository source/test dependency graph and exits non-zero when any selected structural dependency rule is violated.

The selected rule set SHALL be limited to unresolved imports, runtime circular dependencies, production-to-test/spec dependencies, production-runtime-to-devDependency use, and undeclared external package use.

#### Scenario: Healthy repository graph passes
- **WHEN** the command evaluates the current repository graph and none of the selected bad-edge rules is violated
- **THEN** the command MUST exit successfully

#### Scenario: Selected bad edge fails
- **WHEN** any selected structural dependency rule is violated
- **THEN** the command MUST exit non-zero and identify the violated rule/dependency

### Requirement: Unresolved imports are rejected
Structural Dependency Health SHALL reject source/test dependencies that cannot be resolved to a module on disk.

#### Scenario: Unresolved import is introduced
- **WHEN** a source or test module imports a module that cannot be resolved
- **THEN** Structural Dependency Health MUST fail

### Requirement: Runtime cycles exclude type-only-broken cycles
Structural Dependency Health SHALL reject circular dependency relationships only when the complete detected cycle is runtime-relevant.

A circular path containing a type-only dependency edge SHALL NOT be treated as a runtime circular dependency violation solely because the graph is circular.

#### Scenario: Runtime-only circular path fails
- **WHEN** modules form a circular dependency path whose cycle edges are runtime-relevant
- **THEN** Structural Dependency Health MUST fail

#### Scenario: Type-only edge breaks runtime cycle
- **WHEN** an otherwise circular dependency path contains a type-only edge such that the full path is not a runtime dependency cycle
- **THEN** Structural Dependency Health MUST NOT fail that path as a runtime circular dependency violation

### Requirement: Production cannot depend on test or spec source
Production source SHALL NOT depend on test/spec source.

This directionality is one-way: test/spec source MAY depend on production source.

#### Scenario: Production imports test source
- **WHEN** a production module depends on a module under a test/spec source location or a test/spec file convention
- **THEN** Structural Dependency Health MUST fail

#### Scenario: Test imports production source
- **WHEN** a test/spec module depends on production source and no other selected rule is violated
- **THEN** Structural Dependency Health MUST NOT fail solely because of that dependency direction

### Requirement: Production runtime cannot depend on dev-only packages
Production source SHALL NOT have a runtime dependency on an external package declared only in `devDependencies`.

Type-only production use of such a package SHALL remain allowed, and test/dev-tool source use SHALL remain allowed.

#### Scenario: Production runtime imports devDependency
- **WHEN** production source creates a runtime dependency on a package declared only in `devDependencies`
- **THEN** Structural Dependency Health MUST fail

#### Scenario: Production type-only import of devDependency
- **WHEN** production source uses a package declared only in `devDependencies` through a type-only dependency edge
- **THEN** Structural Dependency Health MUST NOT fail solely for that dependency

#### Scenario: Test uses devDependency
- **WHEN** test/spec source depends on a package declared in `devDependencies`
- **THEN** Structural Dependency Health MUST NOT fail solely for that dependency

### Requirement: External package use must be declared
Structural Dependency Health SHALL reject external package use that is not represented in repository package declaration truth.

This requirement owns package declaration health only; unused declared package detection is not part of this capability.

#### Scenario: Undeclared external package is imported
- **WHEN** repository source/test code depends on an external package that is absent from package declaration truth
- **THEN** Structural Dependency Health MUST fail

#### Scenario: Declared but unused package exists
- **WHEN** a package is declared but not used and no selected bad-edge rule is violated
- **THEN** Structural Dependency Health MUST NOT fail solely because the declaration is unused

### Requirement: Structural dependency health remains independent and bounded
Structural Dependency Health SHALL remain a separate repository-local command and SHALL NOT be embedded into the existing `quality:gate` command by this Change.

While whole-graph execution remains cheap and interactive, the capability SHALL evaluate the bounded whole graph directly and SHALL NOT require changed-file planning, known-violation baseline/cache state, waiver machinery, orphan/unused detection, architecture-layer rules, Formal Full Test, Verification planning, or new lifecycle state.

#### Scenario: Existing Lightweight Gate remains unchanged
- **WHEN** Structural Dependency Health is introduced
- **THEN** the existing `quality:gate` command MUST NOT gain Structural Dependency Health execution as part of this Change

#### Scenario: Historical zero baseline needs no exception state
- **WHEN** the selected whole-graph rule set reports zero current violations
- **THEN** the capability MUST NOT create a known-violation baseline, waiver store, or cache state merely to support adoption
