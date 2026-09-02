## MODIFIED Requirements

### Requirement: Project Change ordinal is a durable sequence fact assigned only when a Change first actually enters Explore
`semantic ChangeId` SHALL remain the canonical Change identity. A Change that actually enters Explore SHALL have exactly one durable `projectOrdinal` project-wide monotonic sequence / archive-naming fact persisted on its exact Delivery Change coordination entry. For product-managed execution, canonical `skills/actions/explore/SKILL.md` SHALL own the assignment/persistence HOW only after Flowkit/Owner has already made exact Explore current/legal. During D03/D04 independent self-development, existing `.agents/skills/explore-proof-based/SKILL.md` SHALL independently own the same bootstrap assignment/persistence HOW and SHALL NOT consume candidate `skills/actions/explore/SKILL.md`. A planned-only Change SHALL NOT reserve or carry a `projectOrdinal`. Once assigned, `projectOrdinal` SHALL remain stable through review/propose/apply/archive and SHALL remain consumed if that explored Change is later cancelled. The number SHALL NOT become Policy authority, Owner authority, Action identity, Run identity, `changeStartSequence`, ActionPackage identity or a replacement Change identity.

#### Scenario: First actual Explore owns ordinal materialization without deciding legality
- **WHEN** Flowkit/Owner has already made an exact Change's `explore` Action current/legal and that exact Change has no `projectOrdinal`
- **THEN** the applicable product or independent bootstrap Explore HOW SHALL derive the next project-wide ordinal from durable assigned facts, persist it exactly once on the exact Change coordination entry, and SHALL NOT treat that assignment as activation or legality authority

#### Scenario: Bootstrap Explore remains independent from product candidate
- **WHEN** flowkit-next itself performs D03/D04 Explore through the independent `.agents` development plane
- **THEN** `.agents/skills/explore-proof-based/SKILL.md` SHALL perform the same projectOrdinal assignment/persistence discipline without reading or executing `skills/actions/explore/SKILL.md`

#### Scenario: Planned-only Change does not reserve a number
- **WHEN** an exact Delivery Change remains `planned` and has never actually entered Explore
- **THEN** its coordination entry SHALL have no `projectOrdinal`, and the next numeric value SHALL remain unassigned until an actual Explore materializes it

#### Scenario: Current explored Change preserves its assigned number
- **WHEN** an exact Change has already entered Explore and its coordination entry records a valid assigned `projectOrdinal`
- **THEN** every later Action for that exact Change SHALL preserve that ordinal unchanged without substituting Run sequence, `changeStartSequence` or physical group prefix

#### Scenario: Explored then cancelled Change keeps the gap
- **WHEN** a Change was assigned `projectOrdinal: 8` after actually entering Explore and is later cancelled
- **THEN** `008` SHALL remain consumed and SHALL NOT be compacted or reused by a later Change

## ADDED Requirements

### Requirement: Archive preparation performs real package-bound readiness before archive mutation
Canonical product/bootstrap archive HOW SHALL treat preparation as a real non-mutating readiness/self-check bound to the exact ActionPackage/Guidance identity before archive execution mutates repository/canonical state. Existing lifecycle/Policy legality that makes `archive` ready SHALL be sufficient to enter this preparation; archive SHALL NOT require a second Owner execution authorization. The readiness SHALL use `completion-transition readiness` rather than requiring a pre-existing `completed` Change. A blocker that requires accepted repository/canonical bytes to change SHALL STOP before archive mutation; after such correction, a fresh `review-apply` after `apply`/`revise-apply` acceptance SHALL be required before archive preparation is attempted again.

#### Scenario: Archive readiness passes without a second Owner archive authorization
- **WHEN** exact `review-apply` after `apply`/`revise-apply` has accepted the exact candidate and existing Policy/lifecycle makes `archive` the ready Action
- **THEN** archive preparation MAY execute its package-bound readiness without requiring a separate Owner archive execution authorization

#### Scenario: Correction-requiring blocker stops before archive mutation
- **WHEN** archive preparation discovers a blocker whose resolution requires modifying accepted repository or canonical bytes
- **THEN** archive execution SHALL NOT begin, the prior review boundary SHALL remain correction-capable, and corrected bytes SHALL require a fresh `review-apply` acceptance before archive is retried

#### Scenario: Environment-only blocker can retry the same candidate
- **WHEN** archive preparation fails only because of an execution/environment condition and accepted candidate bytes remain unchanged
- **THEN** the same exact candidate MAY retry archive preparation after the environment condition is corrected without inventing a repository correction

### Requirement: Continuation handoff preserves all materially required uncommitted state
Author product/bootstrap handoff HOW SHALL ensure that continuation can reconstruct the exact materially required uncommitted candidate state, not merely the latest delta. The handoff MAY use one cumulative package or exact retrievable ancestor payload references; when deletions are material, it SHALL carry exact removal information. It SHALL NOT require copying every historical Run/proof transcript or introduce a payload registry, continuation database, background sync or second lifecycle.

#### Scenario: Latest delta depends on an uncommitted ancestor
- **WHEN** the next session needs bytes introduced by an earlier uncommitted Action in addition to the latest delta
- **THEN** handoff SHALL carry those materially required bytes cumulatively or provide exact retrievable ancestor references sufficient to reconstruct the exact candidate

#### Scenario: Deletion survives continuation reconstruction
- **WHEN** a materially required handoff includes deletion of a previously present tracked path
- **THEN** the handoff SHALL carry exact removal information sufficient to prevent the deleted path from reappearing during reconstruction

### Requirement: Proof-based Explore classifies concept ownership and mutation ordering proportionally
Canonical product Explore HOW and the independent D03/D04 proof-based Explore bootstrap HOW SHALL, when a proposed new concept/mechanism is material, first classify whether the need is already owned by an existing capability/entity, operation, state, configuration, validation/proof mechanic or Guidance/HOW before proposing a new capability. When state or mutation ordering is material, Explore SHALL identify validation and commit points and SHALL prove failure-before-commit versus failure-after-commit consequences, including retry/rollback/correction legality. These checks SHALL remain proportional and SHALL NOT be performed as ceremony when neither concept ownership nor mutation ordering can affect the contract.

#### Scenario: Existing mechanism prevents a redundant new concept
- **WHEN** Explore proposes a new named mechanism but proof shows the required behavior is already owned by an existing operation/state/HOW boundary
- **THEN** Explore SHALL prefer the existing mechanism and SHALL NOT promote the new name into a product capability without independent proof

#### Scenario: Mutation ordering determines correction legality
- **WHEN** a design can fail either before or after committing a material state mutation and that ordering changes recovery/correction legality
- **THEN** Explore SHALL identify the commit point and prove both failure consequences before converging Proposal direction

#### Scenario: Simple non-mutating work remains simple
- **WHEN** a Change introduces no material new mechanism and no state/mutation ordering risk
- **THEN** Explore SHALL NOT invent concept-ownership or transaction analysis merely to satisfy a checklist

## REMOVED Requirements

### Requirement: Change 2 preserves temporary shared Run guidance and historical archive paths
**Reason**: The requirement encoded Change-2-era transition facts that are no longer current canonical truth: Reviewer Guidance convergence is complete, the temporary bridge has been retired, and historical archive normalization was completed by a later corrective Change.

**Migration**: Preserve the durable semantics in current generic requirements (bootstrap/product ownership, projectOrdinal durability, canonical artifact convergence and handoff continuity). Preserve exact chronology only in archived OpenSpec Changes, Runs and Git history; do not rewrite those historical artifacts.
