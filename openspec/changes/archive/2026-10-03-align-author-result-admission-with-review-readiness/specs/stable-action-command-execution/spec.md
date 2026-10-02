## ADDED Requirements

### Requirement: Successful Propose and Apply Results satisfy candidate readiness before terminal write

For a new terminal Author `PASS` Result of `propose` or `revise-propose`, `action finish` SHALL require the exact current Change's managed OpenSpec planning status to be complete. `facts.artifactHashes` SHALL contain the project-root-relative paths for that Change's `proposal.md`, `design.md`, and `tasks.md`; each SHALL identify an existing regular, readable, non-linked file with matching SHA-256. Every other declared planning hash SHALL remain subject to the existing current-Change path allowlist and byte check. Missing or invalid required identity, incomplete planning, or drift SHALL be rejected before the first terminal `context.json` or `result.json` write, preserving the prepared Run and artifacts.

For a new terminal Author `PASS` Result of `apply` or `revise-apply`, `action finish` SHALL require a nonempty `facts.artifactHashes` map and SHALL apply the same project-root-relative candidate-file path, regular-file, no-link, readability, SHA-256, and byte-match rules used by `review-apply`. Missing, malformed, inaccessible, linked, or drifted candidate identity SHALL be rejected before the first terminal machine-file write. The new checks SHALL NOT turn a genuine Author `FAIL` or nonterminal outcome into a successful candidate or impose a fabricated candidate artifact on it.

`review-propose` and `review-apply` SHALL continue to recheck the current files and their other existing readiness conditions independently. Previously confirmed Results SHALL retain their original bytes and current Review read rules; this requirement SHALL NOT retroactively demand new Propose hash coverage from them. A file changed after finish MAY still block Reviewer start.

#### Scenario: Incomplete planning cannot produce a successful Propose Result

- **WHEN** a new terminal Author `PASS` `propose` or `revise-propose` Result supplies valid hashes but managed OpenSpec reports planning incomplete
- **THEN** finish SHALL reject before terminal machine-file creation and preserve the prepared Run

#### Scenario: Required Propose identity is missing or invalid

- **WHEN** a new terminal Author `PASS` Propose Result omits any of the exact `proposal.md`, `design.md`, or `tasks.md` hash keys, or a required or other declared planning file fails the existing path and byte checks
- **THEN** finish SHALL reject before terminal machine-file creation even if the remaining declared entries are valid

#### Scenario: Complete Propose candidate is admitted

- **WHEN** managed planning is complete, all three required current-Change planning paths and every additional declared planning path pass their checks, and all other finish conditions hold
- **THEN** finish MAY confirm the Propose Run under its existing create-once and Policy rules; Review SHALL still recheck its current inputs

#### Scenario: Apply candidate hash is missing or invalid

- **WHEN** a new terminal Author `PASS` `apply` or `revise-apply` Result has no candidate hash map or one of its declared entries is malformed, linked, missing, unreadable, or changed
- **THEN** finish SHALL reject before terminal machine-file creation and preserve the prepared Run and existing candidate bytes

#### Scenario: Valid Apply candidate is admitted and later rechecked

- **WHEN** the new terminal Author `PASS` Apply Result declares a nonempty valid candidate hash map and satisfies all other finish conditions
- **THEN** finish MAY confirm the Run, while `review-apply` SHALL independently recheck the saved identities against current files

#### Scenario: Historical and unsuccessful outcomes keep their boundaries

- **WHEN** an existing confirmed Result is read, or an Author submits a genuine `FAIL` or nonterminal outcome
- **THEN** this new-write rule SHALL NOT rewrite the existing Result, impose retroactive Propose hash coverage, create a successful Review edge, or require a fabricated successful candidate identity
