# author-action-guidance Specification

## Purpose

为 Flowkit 的七个 Author Standard Actions 建立稳定、Action-aligned、content-bound 的 canonical product HOW，并在不改变 Core lifecycle/authority 的前提下收敛 revise、Mechanical Preflight、archive naming、handoff 与 STOP discipline。

## Requirements

### Requirement: Every Author Standard Action has exactly one canonical product Guidance entry
Repository SHALL provide exactly one canonical product Guidance entry for each Author-owned Standard Action: `explore`、`revise-explore`、`propose`、`revise-propose`、`apply`、`revise-apply` 与 `archive`，其 canonical path SHALL be `skills/actions/<actionId>/SKILL.md`. Proof/convergence/preflight/handoff/archive-ordinal SHALL remain internal methods or disciplines and SHALL NOT become additional top-level Action Guidance identities.

#### Scenario: Seven Author entries are complete
- **WHEN** repository Author Action Guidance coverage is inspected
- **THEN** all seven Author Standard Actions SHALL each have their own canonical `skills/actions/<actionId>/SKILL.md`, with no extra Author top-level identity for an internal method or phase

#### Scenario: Canonical Author Guidance remains Action-aligned
- **WHEN** exact current Action is `revise-propose`
- **THEN** the product Author HOW SHALL be owned by `skills/actions/revise-propose/SKILL.md` rather than by a method-named or shared top-level Skill

### Requirement: Canonical Author SKILL.md is identity-complete for Flowkit-specific normative HOW
Each canonical Author `SKILL.md` SHALL itself contain the Flowkit-specific normative HOW whose change is intended to change that Action's product Guidance identity under the existing single-file `GuidanceRef` contract. It SHALL NOT require a project-owned transitive normative Guidance graph whose bytes can change while the canonical `SKILL.md` content identity remains unchanged. Vendor/tool mechanics MAY be referenced as subordinate mechanics only when they do not become an alternate Flowkit Action Guidance authority.

#### Scenario: Normative Author behavior changes alter canonical Guidance bytes
- **WHEN** a Flowkit-specific normative rule for an Author Action is changed
- **THEN** the corresponding canonical `skills/actions/<actionId>/SKILL.md` SHALL change so the existing content-bound Guidance identity reflects that change

#### Scenario: OpenSpec mechanics remain subordinate
- **WHEN** an Author Action needs OpenSpec explore/propose/apply/archive mechanics
- **THEN** canonical Author Guidance MAY direct use of the applicable OpenSpec mechanics while retaining Flowkit-specific scope, authority, handoff and STOP rules in the canonical Action entry

### Requirement: Author Guidance preserves bounded Action-specific execution discipline
Canonical Author Guidance SHALL preserve the already-decided Action boundary and SHALL NOT decide next Action, Role, Owner authority, Reviewer verdict, Verification truth or archive legality. `explore` SHALL be proof-first and Proposal-bounded; `propose` SHALL preserve approved Explore and create planning artifacts only; `apply` SHALL implement the exact approved Proposal with minimum mutation and relevant preflight; each `revise-*` SHALL converge exact Reviewer findings without unrelated redesign. When Flowkit supplies exact current Action `archive`, canonical `archive` Guidance SHALL execute only that already-authorized archive boundary, perform canonical OpenSpec convergence and required continuity/completion materialization, and STOP without hidden next-Action execution. Guidance SHALL NOT require a pre-existing `completed` Change state; `completed` is a post-archive materialization fact owned by the existing lifecycle/coordination contract.

#### Scenario: Propose does not enter implementation
- **WHEN** canonical `propose` completes the required Proposal artifacts from an approved Explore
- **THEN** it SHALL STOP at `review-propose` and SHALL NOT begin Apply in the same Action

#### Scenario: Revise remains findings-bounded
- **WHEN** canonical `revise-apply` receives exact Reviewer findings
- **THEN** it SHALL change only findings-relevant scope, preserve already-approved content, rerun only newly relevant proof/checks, and STOP at `review-apply`

#### Scenario: Archive executes only the already-authorized boundary and has no hidden continuation
- **WHEN** Flowkit supplies exact current Action `archive` for an active Change after the existing lifecycle/Policy has made that Action legal
- **THEN** canonical `archive` Guidance SHALL perform the authorized archive convergence and required completion/continuity materialization, SHALL NOT require the Change to already be `completed`, and SHALL STOP without activating or executing the next Change

### Requirement: Mechanical Preflight is internal to apply and revise-apply and reuses existing quality facts
Canonical `apply` and `revise-apply` SHALL include Mechanical Preflight as an internal Author HOW phase that reuses applicable D02 Lightweight Gate, Structural Dependency Health, Repository Entropy Hygiene and Applicable Check facts plus directly relevant artifact/spec/task/handoff/diff checks. Preflight SHALL NOT become a Standard Action, lifecycle stage, Reviewer, Verification authority or independent quality platform.

#### Scenario: Apply performs only relevant preflight
- **WHEN** an Apply candidate is ready for Reviewer handoff
- **THEN** Author Guidance SHALL obtain or reuse the minimum relevant mechanical facts needed for that exact candidate and SHALL NOT mechanically rerun unrelated Full Test scope

#### Scenario: Preflight cannot approve semantics
- **WHEN** all mechanical preflight checks pass
- **THEN** that PASS SHALL NOT substitute for Reviewer verdict, Verification truth or next-boundary authority

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

### Requirement: Archive Guidance consumes the persisted project ordinal and never allocates or recomputes it
When Flowkit supplies exact current Action `archive`, canonical Author `archive` SHALL require the exact current Change coordination entry to already contain a valid assigned `projectOrdinal`, and SHALL materialize `YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>`. Archive HOW SHALL NOT allocate a new ordinal or derive one from Delivery manifest array position, Run sequence, `changeStartSequence`, external Run-group prefix, completed-Change count, archive-directory count or any other archive-time count. Missing, malformed or inconsistent ordinal/handoff facts SHALL STOP archive before target materialization.

#### Scenario: Current Change archives with project ordinal 021
- **WHEN** exact current Change `converge-author-action-guidance` reaches authorized archive with persisted `projectOrdinal: 21`
- **THEN** archive target SHALL be `YYYY-MM-DD-021-converge-author-action-guidance` using the actual archive date

#### Scenario: Run numbering cannot replace project Change numbering
- **WHEN** the exact Change has `projectOrdinal: 21`, canonical `changeStartSequence: 14`, and the current archive Run has another Run sequence
- **THEN** archive naming SHALL use `021` and SHALL NOT substitute `014` or the current Run sequence

#### Scenario: Missing persisted ordinal stops archive
- **WHEN** exact current archive Action resolves a Change coordination entry without a valid assigned `projectOrdinal`
- **THEN** Author archive HOW SHALL STOP and SHALL NOT infer or allocate the missing number

### Requirement: Stable Core self-development keeps independent bootstrap ordinal parity without product self-hosting
During D03/D04 Stable Core development, flowkit-next self-development SHALL continue to use independent `.agents/skills/**` bootstrap HOW rather than candidate `skills/actions/**`. Existing `.agents/skills/explore-proof-based/SKILL.md` SHALL own first-actual-Explore projectOrdinal assignment/persistence for the bootstrap plane, and repository SHALL provide one minimal project-owned bootstrap archive wrapper/composition at `.agents/skills/archive/SKILL.md` that consumes the same persisted projectOrdinal and reuses existing OpenSpec archive mechanics. Neither bootstrap path SHALL consume or execute candidate `skills/actions/explore/SKILL.md` or `skills/actions/archive/SKILL.md`, and repository SHALL NOT create additional `.agents` wrappers solely for product symmetry.

#### Scenario: Bootstrap archive uses Flowkit ordinal without consuming product candidate
- **WHEN** flowkit-next archives a D03/D04 Change through the independent `.agents` development plane
- **THEN** `.agents/skills/archive/SKILL.md` SHALL consume the exact Change's persisted projectOrdinal and reuse subordinate OpenSpec archive mechanics without executing `skills/actions/archive/SKILL.md`

#### Scenario: Existing bootstrap Explore HOW is updated in place rather than wrapped again
- **WHEN** first-Explore projectOrdinal assignment requires D03/D04 bootstrap parity
- **THEN** Change 2 SHALL update existing `.agents/skills/explore-proof-based/SKILL.md` in place and SHALL NOT create another top-level Explore wrapper merely to mirror product Guidance

### Requirement: Author canonical artifacts converge to current material truth while Run provenance remains bounded and concise
Canonical Author Guidance SHALL treat OpenSpec Change artifacts as the current converged representation of material proof, decisions, trade-offs and rationale. During `revise-explore` and `revise-propose`, superseded claims SHALL be replaced or removed in place rather than retained merely to narrate prior Reviewer/Owner correction chronology. Evidence, failed proof or counterexamples that still materially explain the current invariant MAY remain, but SHALL be expressed as current rationale rather than as a revision diary. Execution/review chronology needed for durable Action continuation SHALL remain on the existing `.flowkit/runs` surface only at the bounded level required by the existing Run contract and Guidance: concise Action/finding/revision facts, bounded reasoning, and exact references when material. Canonical artifacts SHALL NOT duplicate that chronology. This requirement SHALL NOT require exhaustive Reviewer discussion, full proof transcripts, or revision diaries to be copied into Run prose. Git SHALL retain exact repository evolution. Canonical artifacts MAY use concise exact Run/finding references when deeper provenance is useful.

#### Scenario: Revise Explore replaces a superseded conclusion in place
- **WHEN** an exact Reviewer finding invalidates a current Explore claim and the revision chronology is already represented by the corresponding Runs
- **THEN** `revise-explore` SHALL replace or remove that superseded claim in the canonical Explore, preserve unaffected current proof, and SHALL NOT append a correction-history section merely because the revision occurred

#### Scenario: Material counterexample remains as current rationale
- **WHEN** a failed hypothesis or historical counterexample is still necessary to explain why the current invariant is required
- **THEN** the canonical artifact MAY retain that evidence as current proof/rationale without preserving the surrounding execution chronology that produced the correction

#### Scenario: Current design rationale remains understandable and provenance remains traceable
- **WHEN** a current design decision was materially shaped by a prior Reviewer finding
- **THEN** the canonical artifact SHALL retain enough current rationale to explain why the decision exists and MAY reference the exact finding/Run for deeper provenance, while the bounded Reviewer finding/revision facts and references remain on the existing Run surface

#### Scenario: Propose and Design do not become a second Explore transcript
- **WHEN** approved Explore proof is converged into Proposal/Design artifacts
- **THEN** those artifacts SHALL contain only the current scope, requirements, implementation-relevant decisions and trade-offs they own, and SHALL reference rather than duplicate Explore proof or revision chronology by default

#### Scenario: Artifact size is diagnostic rather than correctness authority
- **WHEN** an Explore, Proposal or Design artifact is unusually large
- **THEN** Author/Reviewer Guidance MAY use size or line count as a signal to inspect duplication or superseded chronology, but SHALL NOT treat a fixed byte/line threshold as a correctness Gate

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
