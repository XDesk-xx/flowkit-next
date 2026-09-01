## Purpose

为 Flowkit 的三个 Reviewer Standard Actions 建立稳定、Action-aligned、content-bound 的 canonical product HOW，使 Reviewer 能独立、基于事实且 mutation-free 地完成审查，并在不改变 Core lifecycle/authority 或 Stable Core bootstrap 独立性的前提下输出清晰 verdict 后 STOP。

## ADDED Requirements

### Requirement: Every Reviewer Standard Action has exactly one canonical product Guidance entry
Repository SHALL provide exactly one canonical product Guidance entry for each Reviewer-owned Standard Action: `review-explore`, `review-propose`, and `review-apply`. Each canonical path SHALL be `skills/actions/<actionId>/SKILL.md`; review-chain tracing, complexity/minimality assessment, scope-drift assessment, invariant/literal challenge, findings discipline and handoff concision SHALL remain internal Reviewer methods or disciplines and SHALL NOT become additional top-level Action Guidance identities.

#### Scenario: Three Reviewer entries are complete
- **WHEN** repository Reviewer Action Guidance coverage is inspected
- **THEN** all three Reviewer Standard Actions SHALL each have their own canonical `skills/actions/<actionId>/SKILL.md`, with no extra Reviewer top-level identity for an internal method or phase

#### Scenario: Canonical Reviewer Guidance remains Action-aligned
- **WHEN** exact current Action is `review-propose`
- **THEN** the product Reviewer HOW SHALL be owned by `skills/actions/review-propose/SKILL.md` rather than by a method-named or shared top-level Skill

### Requirement: Canonical Reviewer SKILL.md is identity-complete for execution-critical Reviewer HOW
Each canonical Reviewer `SKILL.md` SHALL itself contain the Flowkit-specific normative HOW whose change is intended to change that Action's product Guidance identity under the existing single-file `ActionGuidanceRef` contract. It SHALL NOT depend on a project-owned transitive normative Guidance file whose bytes can change while the canonical Reviewer entry content identity remains unchanged.

#### Scenario: Normative Reviewer behavior changes alter canonical Guidance bytes
- **WHEN** a Flowkit-specific normative rule for one Reviewer Action changes
- **THEN** the corresponding canonical `skills/actions/<actionId>/SKILL.md` SHALL change so the existing content-bound Guidance identity reflects that change

#### Scenario: Shared execution-critical dependency is not required
- **WHEN** common Reviewer discipline is needed by all three Reviewer Actions
- **THEN** each canonical Reviewer entry SHALL remain independently executable without requiring a new shared execution-critical Guidance dependency graph, Registry, Router or transitive identity subsystem

### Requirement: Reviewer Guidance preserves independent mutation-free authority boundaries
Canonical Reviewer Guidance SHALL inspect and judge the exact supplied Author artifact/candidate and materially relevant approved chain, and SHALL produce fact-based bounded findings plus a clear Reviewer verdict. Reviewer Guidance SHALL NOT modify Author artifacts or production implementation, execute revise/apply/archive work, create Owner authority, claim Verification PASS, decide the next legal Action, or silently continue into another Action after its Result.

#### Scenario: Reviewer approval does not become Verification truth
- **WHEN** `review-apply` concludes that the implementation faithfully satisfies the approved Proposal
- **THEN** it SHALL report the Reviewer verdict and SHALL NOT represent that verdict as Delivery Verification PASS or Git/Owner authority

#### Scenario: Reviewer requests correction without mutating the candidate
- **WHEN** a material review finding requires Author correction
- **THEN** Reviewer Guidance SHALL identify the bounded defect and minimum required correction while leaving Author artifacts and implementation bytes unchanged

#### Scenario: Reviewer stops after verdict
- **WHEN** a Reviewer Action has produced its bounded findings and verdict
- **THEN** it SHALL persist/report that Reviewer Result and STOP without executing the reported next boundary

### Requirement: Each Reviewer Action applies its action-specific acceptance focus while tracing prior accepted boundaries when material
`review-explore` SHALL judge truth, scope discipline, decisive proof and Proposal readiness; `review-propose` SHALL judge traceability to approved Explore, minimal/testable contract completeness and Apply readiness; `review-apply` SHALL judge approved-Proposal fidelity, implementation minimality/correctness and real matching evidence. When the current decision materially depends on an earlier accepted boundary or exact Reviewer finding, the Reviewer SHALL trace that relevant chain rather than inspect only the latest payload in isolation.

#### Scenario: Review Explore does not demand proof for explicit non-goals
- **WHEN** Explore explicitly excludes a theoretical concern outside the authorized input domain and that concern cannot change the approved contract
- **THEN** `review-explore` SHALL NOT block Proposal merely to obtain exhaustive proof for that non-goal

#### Scenario: Review Propose rejects an untraceable requirement
- **WHEN** Proposal introduces a material requirement that has no Owner decision, approved Explore decision/proof, accepted Reviewer finding, or preserved canonical contract basis
- **THEN** `review-propose` SHALL report that requirement as scope/traceability drift rather than approve it as useful future work

#### Scenario: Review Apply checks both finding convergence and approved-content preservation
- **WHEN** `review-apply` evaluates an implementation produced after an Author revision
- **THEN** it SHALL verify the exact Reviewer finding was converged and that already-approved unaffected content was not opportunistically redesigned

### Requirement: Every Reviewer Result explains step purpose, complexity/minimality, and new-content/scope drift
Every Reviewer Action SHALL briefly state what the current review step is validating, whether the candidate increased complexity or preserved the smallest approved boundary, and whether new capability/content or semantic scope drift appeared beyond the approved prior boundary. These explanations SHALL remain Reviewer HOW/reporting and SHALL NOT create new lifecycle state, Policy facts, or Verification facts.

#### Scenario: Minimal implementation is explicitly recognized
- **WHEN** an Apply candidate satisfies the approved contract by reusing existing seams without new subsystem growth
- **THEN** `review-apply` SHALL record that complexity/minimality remained bounded rather than demanding a more generalized architecture

#### Scenario: Scope drift is reported separately from implementation detail
- **WHEN** implementation details are necessary to realize an already-approved requirement and add no new capability/authority/lifecycle semantics
- **THEN** Reviewer SHALL distinguish those details from scope drift and MAY report `scope drift: NONE`

### Requirement: Reviewer Guidance challenges incidental literals as literals rather than durable invariants
When a material implementation/test/planning claim relies on a literal or current repository observation, Reviewer Guidance SHALL distinguish stable contract constants from configuration/environment values and incidental current-state observations. Incidental observations SHALL NOT be approved as durable invariants merely because they match the current repository state.

#### Scenario: Lifecycle-transient literal is rejected as a durable unit invariant
- **WHEN** a permanent unit test asserts that a currently active/planned Change must remain in that exact lifecycle state even though normal legal progression will change it
- **THEN** Reviewer SHALL require the durable semantic invariant to be tested instead of approving the transient state literal

### Requirement: Stable Core Reviewer bootstrap remains independent from candidate product Reviewer Guidance through D04 closure
During D03 and D04 Stable Core development, `.agents/skills/review-explore`, `.agents/skills/review-propose`, and `.agents/skills/review-apply` SHALL remain an independent bootstrap Reviewer execution plane. They MAY converge equivalent Reviewer discipline in their own bytes, but SHALL NOT read, execute, delegate to, or become thin pointers to candidate `skills/actions/review-*` Guidance for flowkit-next self-development/review.

#### Scenario: Bootstrap review does not prove the candidate with itself
- **WHEN** flowkit-next performs D03/D04 `review-propose` through the independent `.agents` plane
- **THEN** that bootstrap Reviewer SHALL execute its own repository bootstrap HOW without consuming candidate `skills/actions/review-propose/SKILL.md`

### Requirement: Reviewer durable Run and handoff prose remains concise and references canonical artifacts instead of duplicating them
Reviewer Guidance SHALL use the existing three-file Run persistence surface and SHALL keep Reviewer action prose focused on exact reviewed input, decisive reproduced facts, bounded findings, verdict, minimality/scope-drift assessment and continuation references. It SHALL NOT copy whole Author artifacts, Proposal/Explore transcripts, or large evidence bodies into Reviewer Run prose when exact artifact/Run references are sufficient.

#### Scenario: Reviewer finding references rather than reproduces the full Author artifact
- **WHEN** a Reviewer identifies one material defect in a large Author artifact
- **THEN** the Reviewer Run SHALL identify the exact affected claim/artifact and bounded finding without duplicating the full Author artifact into `action.md` or `result.json`
