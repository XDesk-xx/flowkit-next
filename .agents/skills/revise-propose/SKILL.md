---
name: revise-propose
description: Revise a Proposal after review findings using the smallest contract correction that preserves the approved Explore boundary.
metadata:
  author: flowkit
---

# Revise Propose Skill

## Purpose

Repair Proposal after review-propose findings while keeping the approved Explore boundary and Proposal convergence intact.

## Process

### 1. Classify the finding

- missing requirement
- unclear acceptance
- contract inconsistency
- scope regression
- design ambiguity
- verification gap
- task/spec mismatch

### 2. Trace the finding to the approved model

Confirm the finding closes a real hole in:

- Owner requirement
- approved Explore
- existing canonical contract
- an accepted reviewer concern

If the requested fix would introduce a new product scope, STOP and require Owner/Explore decision instead of silently accepting it.

### 3. Apply the minimum contract correction

Prefer the smallest normative rule that closes the hole.

Examples:

```text
overwrite risk
→ create-once + fail closed

sequence ambiguity
→ sequence uniqueness
```

Do not jump directly to generic infrastructure unless required by the approved model.

### 4. Keep artifacts aligned

Update only affected planning artifacts:

```text
proposal.md
specs/**/spec.md
design.md
tasks.md
```

Ensure requirements, design, tasks, and acceptance remain consistent.

### 5. Re-run Proposal checks

Confirm:

- traceability
- minimality
- non-goals
- strict specification validation
- no production implementation mutation

## Forbidden

Do not:

- reopen broad Explore inside revise-propose;
- add a new subsystem to avoid a narrow blocker;
- implement production code;
- bypass reviewer blocker;
- alter Owner scope implicitly.

## Output

Updated Proposal artifacts ready for independent re-review.
