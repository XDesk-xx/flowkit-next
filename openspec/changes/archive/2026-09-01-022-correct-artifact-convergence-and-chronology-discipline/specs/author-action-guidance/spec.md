## ADDED Requirements

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
