# Applicable Check Execution Specification

## Purpose

Provide a bounded mechanical contract that executes already-required checks against the exact current repository candidate and admits or reuses their results only when all material identities match.

## Requirements

### Requirement: Applicable checks are supplied explicitly
The system SHALL execute applicable checks only from an approved formal execution input that explicitly declares the required check set. The system SHALL NOT infer check applicability from OpenSpec prose, package scripts, changed files, repository history, or other heuristic sources.

#### Scenario: Explicit required-check set is accepted
- **WHEN** approved formal execution input declares an exact required-check set for the current Action
- **THEN** the system binds and executes only that declared set

#### Scenario: Applicability is not inferred
- **WHEN** a repository contains additional package scripts or prose that mention checks not present in the approved formal execution input
- **THEN** the system does not add those checks to the required set

### Requirement: Candidate identity is derived from the actual Git-visible worktree
The trusted Flowkit Action host SHALL derive the current candidate identity from the host-owned canonical repository root and the actual Git-visible worktree rather than accepting a caller-supplied reusable candidate identity or caller-selected repository root. Candidate material SHALL include tracked paths plus non-ignored untracked worktree material with canonical path, kind, Git-visible mode, and content or symlink-target identity, including at least regular `100644`, executable `100755`, symlink `120000`, and tracked deletion states. `.flowkit/runs/**` SHALL be excluded so persistence of the current Run does not self-invalidate the candidate.

#### Scenario: Source content mutation changes candidate identity
- **WHEN** a Git-visible non-Run source path changes content
- **THEN** the newly derived candidate identity differs from the prior candidate identity

#### Scenario: Executable-mode mutation changes candidate identity
- **WHEN** a tracked path keeps identical bytes but changes Git-visible mode between `100755` and `100644`
- **THEN** the newly derived candidate identity differs from the prior candidate identity

#### Scenario: Run persistence does not change candidate identity
- **WHEN** only `.flowkit/runs/**` changes while all other Git-visible candidate material remains unchanged
- **THEN** the derived candidate identity remains unchanged

#### Scenario: Caller cannot override current candidate identity
- **WHEN** formal input attempts to supply a reusable candidate identity instead of allowing the trusted host to derive it
- **THEN** the system rejects that input rather than treating the supplied identity as current truth

#### Scenario: Caller cannot redirect candidate derivation
- **WHEN** applicable-check formal input attempts to supply or override the repository root used for candidate derivation or check execution
- **THEN** the system rejects that input and continues to use only the repository root owned by the trusted Flowkit Action host

### Requirement: Check identity includes all declared material execution identity
For every required check, the system SHALL derive an exact check identity from its declared program, ordered argument vector, configuration references, tool references, and material environment references. Duplicate or structurally incomplete declarations SHALL be rejected.

#### Scenario: Environment identity change invalidates the check identity
- **WHEN** command, configuration, and tool identity remain the same but a material environment reference changes
- **THEN** the newly derived check identity differs from the prior check identity

#### Scenario: Ordered arguments are part of check identity
- **WHEN** two declarations contain the same argument values in a different order
- **THEN** they derive different check identities

### Requirement: Execution uses one closed identity-bound input
Before check execution, the system SHALL bind the exact current ActionPackage, the Flowkit-derived candidate identity, and the complete declared required-check set into one closed execution input with a deterministic execution-input identity. Execution and Result admission SHALL consume the same execution-input identity.

#### Scenario: Declaration-set mutation changes execution input
- **WHEN** the declared required-check set changes after an execution input was formed
- **THEN** the changed declaration set does not match the original execution-input identity and cannot be admitted as the same execution

#### Scenario: Duplicate required-check declaration fails closed
- **WHEN** a closed execution input contains duplicate declarations for the same required check identity
- **THEN** the system rejects the input before execution

### Requirement: Declared checks execute exactly and produce compact mechanical facts
Each non-reused required check SHALL execute the declared program and ordered arguments without shell interpretation and SHALL record the actual process outcome as one compact mechanical check fact bound to the current execution-input, candidate, and check identities. Check facts SHALL distinguish successful execution, failed execution, and process failure; an explicitly eligible reused success SHALL be distinguishable from a newly executed success.

#### Scenario: Successful exact check execution is recorded
- **WHEN** a declared check executes its exact program and ordered arguments and exits successfully
- **THEN** the Result contains exactly one successful mechanical fact for that declared check identity

#### Scenario: Failed exact check execution is recorded truthfully
- **WHEN** a declared check executes and returns a failing process outcome
- **THEN** the Result contains a failure fact rather than converting the outcome into success or a Verification verdict

### Requirement: Result admission fails closed on candidate or fact-set drift
Result admission SHALL re-derive the current candidate identity and require exact equality with the execution input. Admission SHALL require exact execution-input and candidate identity matches and exactly one fact for every declared required check, rejecting missing, duplicate, unexpected, or mismatched facts.

#### Scenario: Candidate changes before admission
- **WHEN** repository candidate material changes after execution and before Result admission
- **THEN** the re-derived candidate identity differs and admission fails closed

#### Scenario: Required fact is missing
- **WHEN** the closed execution input declares checks A and B but the Result contains only a fact for A
- **THEN** Result admission fails closed

#### Scenario: Unexpected or mismatched fact is present
- **WHEN** a Result contains a check fact whose check identity is not exactly one of the declared required checks
- **THEN** Result admission fails closed

### Requirement: Reuse requires explicit prior successful fact with exact identity equality
The system SHALL allow reuse only from an explicitly supplied prior successful mechanical check fact whose candidate identity exactly equals the current Flowkit-derived candidate identity and whose check identity exactly equals the current derived check identity. Any candidate, command, configuration, tool, or material environment identity difference SHALL require current execution.

#### Scenario: Exact same candidate and check may reuse prior success
- **WHEN** an explicit prior fact is successful and its candidate identity and check identity exactly match the current derived identities
- **THEN** the current requirement may be satisfied by an explicit reused-success fact without rerunning the check

#### Scenario: Candidate drift forces rerun
- **WHEN** a prior successful fact has the same check identity but a different candidate identity
- **THEN** the prior fact is not reusable and the current check must execute

#### Scenario: Check identity drift forces rerun
- **WHEN** a prior successful fact has the same candidate identity but a different current check identity
- **THEN** the prior fact is not reusable and the current check must execute

#### Scenario: Prior failure is never reusable as success
- **WHEN** an explicit prior fact represents failed execution or process failure
- **THEN** it cannot satisfy the current required check as a reused success

### Requirement: Applicable-check facts do not carry lifecycle authority
Applicable-check execution facts SHALL remain mechanical evidence only and SHALL NOT become Formal Verification verdicts, Reviewer verdicts, Owner authority, Policy decisions, next-Action authority, or automatic lifecycle progression.

#### Scenario: Mechanical success does not advance lifecycle by itself
- **WHEN** every required applicable check has a successful or eligible reused-success fact
- **THEN** the facts remain admitted mechanical facts and do not independently authorize the next Action or a Verification verdict
