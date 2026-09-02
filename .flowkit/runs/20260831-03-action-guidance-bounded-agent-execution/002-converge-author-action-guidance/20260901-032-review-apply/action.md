# Action — Review Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: converge-author-action-guidance
role: reviewer
action: review-apply
input: 20260901-031-revise-apply
approved-explore: 20260901-026-review-explore
approved-proposal: 20260901-030-review-propose
prior-apply: 20260901-020-apply
invalidated-archive: 20260901-022-archive
base: 3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

## Verdict

```text
APPROVED
```

031 faithfully converges the previously implemented Change 2 candidate to the
approved projectOrdinal semantics.

No blocking finding remains.

The Change may return to:

```text
archive
```

---

# Review-chain trace

```text
014 Explore
↓
015 Review Explore
→ APPROVED

016 Propose
↓
017 Review Propose
→ CHANGES REQUESTED

018 Revise Propose
↓
019 Review Propose
→ APPROVED

020 Apply
↓
021 Review Apply
→ APPROVED

022 Archive
→ later invalidated by explicit Owner correction

023 Revise Explore
↓
024 Review Explore
→ CHANGES REQUESTED

025 Revise Explore
↓
026 Review Explore
→ APPROVED

027 Revise Propose
↓
028 Review Propose
→ CHANGES REQUESTED

029 Revise Propose
↓
030 Review Propose
→ APPROVED

031 Revise Apply
↓
032 Review Apply
→ APPROVED
```

031 declares the exact 030 Reviewer package SHA-256:

```text
a58a45680591fbed78b6f6f830729fca415e6c5d04ccf20988536a32ab126555
```

which matches the actual approved Reviewer payload.

All declared planning / Guidance / focused-test artifact hashes in 031 match exact
package bytes.

---

# First-Explore ordinal assignment — PASS

The approved invariant is now implemented on both required HOW planes.

Product-managed execution:

```text
skills/actions/explore/SKILL.md
```

Independent D03/D04 Stable Core self-development:

```text
.agents/skills/explore-proof-based/SKILL.md
```

Both require:

```text
exact Explore already current/legal
↓
if exact Change already has projectOrdinal
→ reuse unchanged

if absent
→ inspect durable already-assigned projectOrdinal facts
→ validate positive integer / uniqueness / consistency
→ derive max(existing assigned projectOrdinal) + 1
→ persist exactly once
```

Both fail closed when the durable baseline is absent or inconsistent.

Neither Guidance surface owns activation or legality.

The bootstrap Explore HOW explicitly does not read or execute candidate:

```text
skills/actions/explore/SKILL.md
```

so the Stable Core no-self-hosting boundary remains intact.

---

# Durable migration baseline — PASS

The current exact Change coordination entry records:

```text
converge-author-action-guidance
→ projectOrdinal: 21
```

while:

```text
converge-reviewer-action-guidance
→ planned
→ projectOrdinal absent
```

Therefore:

```text
022
→ next unassigned candidate ordinal
```

The current `021` fact is an explicit Owner-corrected durable migration/high-watermark
baseline for this mechanism.

It is sufficient for future first-Explore allocation:

```text
max(existing durable projectOrdinal) + 1
```

to continue project-wide monotonic numbering.

No historical mass backfill is required.

Historical project numbers before this durable field continue to be preserved by:

```text
existing archive names
OpenSpec history
Git history
```

Do NOT add `projectOrdinal` retroactively to all historical 001–020 coordination entries
merely for representational completeness.

Such a migration is not required by Change 2.

---

# Semantic identity boundary — PASS

The implementation preserves:

```text
semantic ChangeId
→ canonical Change identity

projectOrdinal
→ durable project-wide sequence /
  archive-naming fact only
```

Reviewer independently verified:

```text
src/**
→ no projectOrdinal consumption
```

The field is not used by:

```text
Policy
ActionPackage identity
Run identity
StandardActionId
Owner authority
Reviewer authority
```

The existing trusted coordination resolver still resolves the current Change as:

```text
active
```

with the additional metadata present.

No Core identity surface changed.

---

# Archive consumer-only behavior — PASS

Both:

```text
skills/actions/archive/SKILL.md
.agents/skills/archive/SKILL.md
```

now require an already-persisted valid `projectOrdinal`.

Archive:

```text
reads persisted projectOrdinal
↓
validates exact Change / ordinal consistency
↓
materializes:
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
↓
performs accepted archive/completion/continuity HOW
↓
STOP
```

Archive explicitly MUST NOT:

```text
allocate
increment
compact
repair
recompute
```

the project ordinal.

It does not fall back to:

```text
Delivery manifest position
Run sequence
changeStartSequence
completed count
archive count
physical Run-group prefix
```

Missing/malformed/duplicate/inconsistent ordinal facts fail closed before target materialization.

---

# Current Change archive value — PASS

For the current Change:

```text
semantic ChangeId
→ converge-author-action-guidance

projectOrdinal
→ 21
```

therefore the future real archive target is:

```text
YYYY-MM-DD-021-converge-author-action-guidance
```

using the actual archive date.

The invalidated 022 archive materialization is not reused as authority.

---

# 020 → 031 revise precision — PASS

Reviewer compared the earlier Apply candidate with 031.

Ordinal-related implementation changed only where required:

```text
skills/actions/explore/SKILL.md
skills/actions/archive/SKILL.md
.agents/skills/explore-proof-based/SKILL.md
.agents/skills/archive/SKILL.md
tests/unit/domain/author-action-guidance.test.ts
Delivery manifest projectOrdinal/provenance
approved OpenSpec planning artifacts
```

The other five Author product Guidance entries are not opportunistically redesigned.

No mutation to:

```text
src/**
package.json
pnpm-lock.yaml
Flowkit Policy
ActionPackage / Run / Result contracts
Change 1 resolver
OpenSpec vendor archive mechanics
```

was introduced.

---

# Focused ordinal proof — PASS

Focused tests now prove:

```text
planned-only
→ no ordinal reservation

first actual Explore
→ next durable ordinal

current explored Change
→ 021 persisted

planned Reviewer Change
→ unassigned

duplicate assigned ordinal
→ fail closed

malformed ordinal
→ fail closed

explored then cancelled
→ gap remains consumed

Archive
→ persisted ordinal only

bootstrap Explore/archive
→ independent from product candidate

projectOrdinal
→ distinct from Run sequence /
  changeStartSequence /
  physical group prefix

production Core
→ does not consume projectOrdinal
```

This closes the implementation-coverage gap found in 028.

---

# Independent verification

Reviewer restored exact checkpoint:

```text
3af174bdfa2e8ebcf280e87a13565d03dec0b647
```

overlaid the exact 031 package, restored the supplied detached dependency/runtime
environment, and used exact:

```text
Node 22.23.2
OpenSpec 1.10.0
Archify 2.15.0
```

Independent results:

```text
Guidance/resolver focused
→ 17 / 17 PASS
→ 0 FAIL
→ 0 SKIP

full domain
→ 165 / 165 PASS
→ 0 FAIL
→ 0 SKIP

detached acceptance
→ 4 / 4 PASS
→ 0 FAIL
→ 0 SKIP

git diff --check
→ PASS

TypeScript typecheck
→ PASS

Build
→ PASS

Prettier
→ PASS

ESLint
→ PASS

forbidden tracked artifacts
→ PASS

dependency health
→ 58 modules / 213 dependencies / 0 violations

repository entropy
→ 25 / 25 production modules reachable

OpenSpec Change strict
→ PASS

OpenSpec --all --strict
→ 16 / 16 PASS
```

The first acceptance invocation without `FLOWKIT_HOME` correctly failed closed on
missing detached prerequisites; after supplying the exact managed tool home,
the authoritative detached acceptance result was 4/4 PASS.

No candidate defect was associated with that environment-only first invocation.

---

# Complexity assessment

031 adds no new Core subsystem.

The durable mechanism is:

```text
one optional projectOrdinal fact
on the existing Delivery Change coordination entry
+
existing Explore HOW
+
existing Archive HOW
```

This is the minimum structure required by the accepted invariant:

```text
once a Change enters Explore
→ it already has one stable current project number
```

No:

```text
counter service
allocator service
ordinal Registry
new lifecycle state
new identity subsystem
Router
Planner
Runtime
background sequencer
```

is introduced.

Therefore:

```text
complexity
→ MINIMAL / REQUIRED
```

---

# New-content / scope-drift assessment

031 adds implementation content only for the already-approved ordinal correction:

```text
first-Explore assign/persist HOW
archive consume-only HOW
focused ordinal proof
projectOrdinal: 21 durable baseline
```

It does NOT introduce:

```text
new user-facing product capability
new authority
new lifecycle state
new Standard Action
new Core identity
Reviewer Guidance
self-hosting takeover
historical mass migration
dependency/tooling expansion
```

Therefore:

```text
new content
→ YES, findings-required implementation content

scope drift
→ NONE
```

---

# Current-step explanation

This Review Apply verifies that the corrected numbering model is not merely specified
but actually executable across product and independent bootstrap HOW, while preserving
all prior Change 2 boundaries and real mechanical evidence.

Result:

```text
first-Explore assignment
→ PASS

durable 021 baseline
→ PASS

planned Change 3 unassigned
→ PASS

Archive consumer-only
→ PASS

semantic ChangeId identity
→ PASS

self-hosting boundary
→ PASS

verification
→ PASS

complexity
→ minimal/required

scope drift
→ NONE
```

The Change may now proceed to:

```text
archive
```

using the already-persisted projectOrdinal `021`.

STOP after this Reviewer verdict.
