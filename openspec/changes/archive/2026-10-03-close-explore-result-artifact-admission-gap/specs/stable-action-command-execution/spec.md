## ADDED Requirements

### Requirement: Successful Explore artifacts are admitted before finish and legacy identities are verified before Review

`action finish` SHALL require a terminal successful `explore` or `revise-explore` Result to contain both `facts.exploreArtifact` and `facts.exploreSha256`. The path SHALL be exactly `openspec/changes/<current semantic changeId>/explore.md` relative to the target repository root, and the SHA-256 SHALL match that target's existing regular, readable, non-linked file. Missing, partial, wrong-path, malformed or drifted identity SHALL be rejected before the first `context.json` or `result.json` write; `artifactHashes` SHALL NOT substitute for either dedicated field on this new write path. Existing Author `FAIL` and nonterminal outcome rules SHALL remain unchanged.

For a previously confirmed terminal successful `explore` or `revise-explore` Result only, `review-explore` SHALL accept a compatibility identity when **both** dedicated fields are absent and `artifactHashes` contains exactly one path ending in `/explore.md`, exactly equal to the path for that Result's semantic `changeId`. Its declared SHA-256 and the current file SHALL pass the same exact artifact checks before Review starts. A partial dedicated pair, conflicting identity, ambiguous Explore path, wrong Change, malformed hash, missing file or hash drift SHALL be rejected. Compatibility SHALL read the saved Result without rewriting it, and SHALL preserve all other Review readiness, declared-proof, Role and Policy checks.

#### Scenario: Future successful Explore omits dedicated identity

- **WHEN** a new terminal successful `explore` or `revise-explore` Result has a matching `artifactHashes` entry but lacks either `exploreArtifact` or `exploreSha256`
- **THEN** `action finish` SHALL reject it before creating either terminal machine file and preserve the prepared Run and existing artifact bytes

#### Scenario: Future successful Explore supplies exact identity

- **WHEN** both dedicated fields name the exact current Change Explore file and its matching SHA-256, with all other finish conditions satisfied
- **THEN** `action finish` MAY confirm the Run under its existing create-once and Policy rules

#### Scenario: Existing MenDi-shaped Result is reviewed without mutation

- **WHEN** a confirmed terminal successful Explore Result lacks both dedicated fields, has one exact current-Change `explore.md` entry in `artifactHashes`, and that entry matches the current file bytes
- **THEN** `review-explore` SHALL use that verified identity for readiness without changing the existing Result, and an independent Reviewer MAY start the already-legal Action

#### Scenario: Legacy ambiguity or drift fails closed

- **WHEN** a confirmed Result has one dedicated field only, conflicting dedicated and hash identities, multiple `explore.md` entries, a path for another Change, an invalid SHA-256, a linked or missing file, or changed bytes
- **THEN** `review-explore` SHALL reject before creating its start record and SHALL NOT repair, rewrite or synthesize the Author Result

#### Scenario: Non-success outcome retains its boundary

- **WHEN** an Author submits a genuine unsuccessful or nonterminal Explore outcome
- **THEN** this new successful-artifact rule SHALL NOT reclassify that outcome as PASS, create a Review edge, or impose a fabricated Explore artifact identity
