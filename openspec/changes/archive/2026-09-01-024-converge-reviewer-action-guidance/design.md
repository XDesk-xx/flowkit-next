## Context

See `proposal.md` for motivation. The exact `10ae02c` base already supports Reviewer StandardActionIds, reviewer execution-role mapping, canonical `skills/actions/<actionId>/SKILL.md` resolution, content-bound `ActionGuidanceRef`, ActionPackage propagation, Policy boundaries and durable Run persistence. The only product gap is the absence of the three canonical Reviewer Guidance files. D03/D04 self-development must continue to use independent `.agents/skills/**` bootstrap HOW and must not consume candidate product Guidance.

## Goals / Non-Goals

**Goals:**

- Add exactly three self-contained canonical product Reviewer Guidance entries.
- Preserve action-specific Reviewer focus while converging common independence, review-chain, minimality, scope-drift, literal/invariant, concise handoff and STOP discipline.
- Keep the three existing `.agents/skills/review-*` entries independently executable while bringing their stable discipline into parity.
- Remove the live temporary Run-surface bridge only after formal/bootstrap Reviewer coverage is proven by focused tests.

**Non-Goals:**

- No `src/**`, resolver, ActionPackage, Policy, lifecycle, Result-admission or Run-persistence redesign.
- No self-hosting migration from `.agents/skills/**` to `skills/actions/**` during D03/D04.
- No Reviewer Registry, Router, Planner, Evidence DAG, shared execution-critical Guidance graph or transitive Guidance hash model.
- No Memo state mutation, per-Change architecture refresh or dependency/lockfile changes.
- No rewriting of historical `.flowkit/runs/**` or archived OpenSpec provenance that mentions the temporary bridge.

## Decisions

### 1. Keep one self-contained canonical entry per Reviewer Standard Action

Create:

```text
skills/actions/review-explore/SKILL.md
skills/actions/review-propose/SKILL.md
skills/actions/review-apply/SKILL.md
```

Each entry contains the execution-critical Flowkit Reviewer HOW needed for its Action, including common Reviewer boundaries in its own bytes.

**Why:** The accepted `ActionGuidanceRef` identity binds the canonical entry path plus exact entry SHA-256. Moving normative Reviewer semantics into a new shared dependency would allow execution-relevant behavior to change without changing the canonical entry identity unless the identity contract were expanded.

**Rejected alternative:** Introduce a shared Reviewer Skill and transitive Guidance identity. This would reopen Change-1 identity scope without a proven need.

### 2. Converge bootstrap Reviewer Skills independently, not by delegation

Update the existing:

```text
.agents/skills/review-explore/SKILL.md
.agents/skills/review-propose/SKILL.md
.agents/skills/review-apply/SKILL.md
```

so they independently carry the same stable Reviewer disciplines required during D03/D04 self-development. They must not read or invoke candidate `skills/actions/review-*` files.

**Why:** This preserves the accepted Stable Core anti-self-hosting boundary while preventing the bootstrap Reviewer HOW from missing the newly frozen review disciplines.

**Rejected alternative:** Thin `.agents` pointers to product Guidance. That would make the candidate product HOW participate in proving itself before Stable Core closure.

### 3. Keep shared Reviewer disciplines inside the three action entries

Common Reviewer rules remain internal content within each Action entry:

```text
independent mutation-free review
approved-chain tracing when material
fact reproduction when material
bounded findings + clear verdict
complexity/minimality assessment
new-content/scope-drift assessment
semantic invariant vs incidental literal challenge
concise Run/handoff
terminal STOP
```

Action-specific sections retain the different acceptance focus for Explore, Propose and Apply.

**Why:** Three entries are small enough that limited duplication is cheaper and safer than a new execution-critical sharing mechanism.

### 4. Retire the temporary Run bridge only after coverage is visible in canonical/bootstrap Reviewer Guidance

After adding and testing the six Reviewer Guidance files, remove:

```text
TEMPORARY-RUN-SURFACE-GUIDANCE.md
```

and the active bridge reference in `AGENTS.md`, then update focused tests that currently require the temporary document.

Historical Runs/OpenSpec artifacts remain untouched.

**Why:** The temporary document is parallel operational HOW, not canonical history. Once its remaining Reviewer concision responsibilities have permanent owners, keeping it active would create duplicate Guidance authority.

### 5. Verify Guidance convergence at the repository boundary without changing Core

Focused tests should prove at minimum:

- exactly three canonical Reviewer product entries exist and resolve through the existing resolver;
- each entry is Action-aligned and contains the required stable Reviewer boundaries;
- bootstrap Reviewer entries remain present and explicitly independent from candidate product Guidance;
- the temporary live bridge/reference is absent after takeover while historical provenance is not rewritten;
- existing Action Guidance/Core tests remain green.

Broader domain checks verify no regression in the existing Core contract.

## Risks / Trade-offs

- **[Limited duplicated common Reviewer text across three canonical entries]** → Accept deliberately because it preserves current single-file identity semantics and only three stable Reviewer Actions exist.
- **[Bootstrap and product Reviewer HOW can drift after D04]** → During Stable Core, focused parity tests cover required stable disciplines; post-Stable-Core self-hosting convergence remains separate proof/Owner-authorized future work.
- **[Temporary bridge cleanup could erase provenance if performed broadly]** → Delete only the live root document/reference/test expectation; never rewrite historical Run/OpenSpec artifacts merely to remove old mentions.
- **[Reviewer prose could grow into duplicated evidence]** → Canonical and bootstrap Guidance explicitly require bounded findings and exact references instead of copying full Author artifacts or proof transcripts.
