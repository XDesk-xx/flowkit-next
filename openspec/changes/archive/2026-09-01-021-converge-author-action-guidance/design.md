## Context

See `proposal.md` for motivation. Change 1 already resolves product Guidance exclusively from `skills/actions/<StandardActionId>/SKILL.md` and binds exact file bytes into `ActionGuidanceRef`. Current Author HOW exists only as independent bootstrap material under `.agents/skills/**`; D03/D04 must keep using that independent plane until Stable Core closure. The repository also has a proven archive naming regression: project Change numbering must remain monotonic across Deliveries, while current OpenSpec archive bootstrap mechanics use date-only archive names.

## Goals / Non-Goals

**Goals:**

- materialize exactly seven Author canonical product Guidance bodies aligned to existing Author Standard Actions;
- keep each canonical `SKILL.md` identity-complete under the existing single-file Guidance hash contract;
- synthesize existing proof/convergence/revise/preflight/handoff/STOP experience without adding new top-level Action identities;
- preserve one project-wide `projectOrdinal` assigned/frozen only when a Change first actually enters Explore, and make later archive consume that persisted fact without recomputation;
- repair only the proven D03/D04 bootstrap ordinal parity gaps at first-Explore assignment and archive consumption while preserving independent `.agents` execution;
- provide focused tests/checks proving coverage, identity resolution, archive ordinal semantics and no product fallback/self-hosting.

**Non-Goals:**

- production Core, ActionPackage, Policy, Run/Result or lifecycle redesign;
- shared normative Guidance dependency graph or transitive content hashing;
- Skill/Guidance Registry, Router, Planner, Runtime or discovery/ranking;
- seven duplicate `.agents` wrappers;
- modifying OpenSpec vendor semantics to own Flowkit Delivery ordinals;
- deleting `.agents/skills/**`, switching D03/D04 self-development to product Guidance, or performing self-hosting convergence;
- deleting the temporary Run bridge in Change 2;
- mass-renaming completed historical archive directories.

## Decisions

### 1. Create exactly seven product canonical Author entries

Create:

```text
skills/actions/explore/SKILL.md
skills/actions/revise-explore/SKILL.md
skills/actions/propose/SKILL.md
skills/actions/revise-propose/SKILL.md
skills/actions/apply/SKILL.md
skills/actions/revise-apply/SKILL.md
skills/actions/archive/SKILL.md
```

Each entry is named by existing `StandardActionId`. Internal methods such as proof-based Explore, proposal convergence, implementation convergence and Mechanical Preflight are sections/phases inside the relevant Action file.

**Why:** Change 1 already makes `StandardActionId` the canonical product identity. Additional top-level method Skills would recreate selection ambiguity and pressure for a Registry/Router.

**Alternative rejected:** method-named top-level product Skills. They do not represent lifecycle Actions and would create parallel identities.

### 2. Keep Flowkit-specific normative HOW inside each canonical file

At the current contract boundary, each canonical `SKILL.md` contains all Flowkit-specific normative rules that materially govern execution of that Action. Cross-references may point to OpenSpec/tool mechanics or repository facts, but no project-owned external file may silently hold normative Action behavior whose change would not change the canonical file's Guidance hash.

**Why:** Change 1 hashes only canonical `SKILL.md` bytes. This preserves identity completeness without introducing a transitive Guidance graph.

**Alternative rejected:** extract shared normative project HOW immediately. That would require either incomplete identity or a new hash-closure design, neither of which is proven necessary.

### 3. Treat OpenSpec-prefixed Skills as subordinate mechanics

Canonical product Guidance explains Flowkit-specific scope, authority, convergence, handoff and STOP rules, and directs execution to the applicable OpenSpec mechanics where useful. It does not duplicate the whole OpenSpec manual.

**Why:** OpenSpec already owns proposal/apply/archive mechanics; Flowkit Guidance owns HOW around the already-decided Action boundary.

### 4. Mechanical Preflight is an internal apply/revise-apply phase

`apply` and `revise-apply` consume/reuse the minimum relevant D02 facts and directly applicable artifact/spec/task/handoff/diff checks before Reviewer handoff. They do not introduce a new Action or quality platform.

**Why:** the needed mechanical inputs already exist and the accepted D03 reference explicitly composes Preflight inside Author Guidance.

### 5. Project ordinal is assigned once at first actual Explore and Archive only consumes it

`semantic ChangeId` remains the canonical Change identity. `projectOrdinal` is only a durable project-wide monotonic sequence / archive-naming fact. It must never become Policy, Owner, Action, Run or ActionPackage identity.

The lifecycle boundary is:

```text
planned-only Change
→ projectOrdinal absent

first actual Explore
→ exact current Explore Action is already authorized by Flowkit/Owner boundary
→ canonical product `skills/actions/explore/SKILL.md` assigns the next project-wide ordinal and persists it exactly once
→ D03/D04 independent bootstrap uses existing `.agents/skills/explore-proof-based/SKILL.md` for the same assignment/persistence HOW without consuming product candidate Guidance

later review/propose/apply/archive
→ reuse the same persisted projectOrdinal

explored then cancelled
→ projectOrdinal remains consumed

archive
→ requires existing valid projectOrdinal
→ never allocates or recomputes it
```

For the current Change, the already-entered Explore history fixes:

```text
semantic ChangeId
→ converge-author-action-guidance

projectOrdinal
→ 021

canonical changeStartSequence
→ 014
```

The current Run sequence is a separate occurrence number and can continue `025`, `026`, `027`, ... without affecting `projectOrdinal`. The external physical group prefix `002-...` is also not a project Change ordinal.

When Flowkit/Policy has already supplied exact current Action `archive`, canonical `archive` does not decide archive legality and does not require a pre-existing `completed` Change state. It reads the exact current Change coordination entry, requires its already-persisted `projectOrdinal`, validates that the fact belongs to the exact semantic Change, and materializes:

```text
YYYY-MM-DD-<projectOrdinal:03d>-<semantic ChangeId>
```

It MUST STOP if the exact Change is missing, the ordinal is absent/malformed, or the handoff facts are inconsistent. It must not derive the number from Delivery manifest array position, current Run sequence, `changeStartSequence`, completed/archive count, directory count, or external grouping prefix.

For the current Change the correct target is:

```text
2026-09-01-021-converge-author-action-guidance
```

The current planned `converge-reviewer-action-guidance` Change has no `projectOrdinal`; `022` remains only the next candidate until some Change actually enters Explore.


Execution ownership is deliberately split by consumption plane:

```text
product managed Explore
→ skills/actions/explore/SKILL.md
→ assign/persist projectOrdinal only after exact Explore is already legal/current

D03/D04 self-development Explore
→ .agents/skills/explore-proof-based/SKILL.md
→ independently assign/persist the same durable fact
→ MUST NOT consume skills/actions/explore/SKILL.md

OpenSpec Explore mechanics
→ subordinate mechanics only
```

Neither Explore Guidance decides activation or legality. Both only materialize the durable sequence fact for the already-authorized exact Explore Action. The next value may be derived from the highest already-persisted `projectOrdinal` and then written exactly once; no planned-only reservation, Counter Service, Registry or allocator subsystem is introduced.

**Why:** this preserves project-wide monotonic numbering and cancelled gaps while keeping Archive thin. The existing Change coordination entry is reused for one durable fact rather than adding a Counter Service, ordinal Registry, allocator subsystem or new lifecycle state.

**Alternatives rejected:** Delivery-local manifest position, planned-slot reservation, Run number, `changeStartSequence`, completed/archive counts, archive-time allocation, global counter service, or a new identity subsystem.

### 6. Add one independent `.agents/skills/archive/SKILL.md` bootstrap wrapper

The bootstrap wrapper owns only current flowkit-next self-development archive composition:

```text
persisted Flowkit projectOrdinal + bootstrap handoff/STOP
↓
existing .agents/skills/openspec-archive-change mechanics
```

It must not execute/read candidate `skills/actions/archive/SKILL.md`. Other existing `.agents` Author paths remain unchanged unless separate proof shows a defect.

**Why:** product archive Guidance cannot drive D03/D04 self-development, but the current bootstrap archive path has a proven ordinal defect. A single wrapper fixes that gap while preserving independent proof.

**Alternatives rejected:** patching vendor OpenSpec skill, creating seven `.agents` mirrors, dynamic projection, or switching self-development to product Guidance.

### 7. Preserve temporary Run bridge and historical archive paths

`TEMPORARY-RUN-SURFACE-GUIDANCE.md` remains during Change 2 because Reviewer formal/bootstrap convergence is still pending. Existing unnumbered D02/D03 archive directories remain unchanged.

**Why:** deleting the bridge now would remove still-used independent bootstrap coverage; historical normalization would broaden this Change into reference migration rather than Guidance convergence.

## Risks / Trade-offs

- **[Risk] Some normative HOW is duplicated across the seven canonical files.** → Accept limited duplication while the Guidance identity is single-file; prefer concise repeated invariants over an unproven shared normative dependency graph.
- **[Risk] Product and bootstrap archive files temporarily encode the same persisted projectOrdinal archive invariant.** → This is intentional because their consumption domains are independent; keep the bootstrap copy minimal and do not make either file consume the other during Stable Core development.
- **[Risk] OpenSpec vendor mechanics may evolve.** → Keep vendor mechanics subordinate and reference the currently available bootstrap/vendor tool workflow rather than copying implementation detail into Flowkit Core.
- **[Risk] Archive coordination resolution could accidentally consume the wrong Change ordinal fact.** → Require exact current Delivery + semantic ChangeId context and one existing persisted projectOrdinal; fail closed on missing/malformed/inconsistent facts.

## Migration Plan

1. Add seven canonical product Author `SKILL.md` entries without changing production Core.
2. Revise canonical `skills/actions/explore/SKILL.md` and existing `.agents/skills/explore-proof-based/SKILL.md` so first actual Explore owns projectOrdinal assignment/persistence in product and independent bootstrap planes respectively, without deciding legality or consuming candidate product Guidance from bootstrap.
3. Add the single independent `.agents/skills/archive/SKILL.md` wrapper and keep existing OpenSpec archive bootstrap mechanics intact.
4. Add/extend focused repository tests/checks for seven-entry coverage, Action-aligned resolution, no `.agents` product fallback, first-Explore assignment/persistence, persisted projectOrdinal archive consumption/fail-closed behavior, namespace separation, bootstrap non-consumption of product candidate, and bridge retention.
5. Run minimum relevant repository/OpenSpec validation and Reviewer handoff.
6. Keep historical archives and temporary Run bridge unchanged in this Change.

Rollback is file-level: remove the seven candidate product Guidance entries, the bootstrap archive wrapper and their focused tests before acceptance; no data/schema migration or production state rollback is required.
