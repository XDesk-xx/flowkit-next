# Temporary Run Surface Guidance

> Status: **TEMPORARY OPERATIONAL GUIDANCE**
>
> Effective: immediately after repository application
>
> Scope: Flowkit Author / Reviewer durable Run authoring before D03 formal convergence
>
> Supersession: this document MUST be removed or explicitly superseded when D03
> `Action Guidance & Bounded Agent Execution` establishes the formal contract.
>
> This document is guidance only. It does **not** override OpenSpec, Git, Runtime,
> Policy, Owner authority, Reviewer verdict, Verification, or existing canonical
> Flowkit contracts.

---

## 1. Why this temporary guidance exists

D02 exposed two related execution-history problems:

```text
1. action.md / duplicated evidence / narrative became too large
   → durable repository Run history grew unnecessarily

2. 013-revise-apply added verification-environment.json inside the Run directory
   → an ad-hoc evidence need started to expand the stable Run surface
```

The committed `013-revise-apply/verification-environment.json` is retained as historical
create-once execution history.

It is **not** a fourth standard Run artifact and MUST NOT be copied as a default pattern.

This temporary guidance constrains new Run authoring until D03 formally resolves the
guidance/contract boundary.

---

## 2. Authority boundary

The existing durable Run model remains:

```text
real Action execution
↓
.flowkit/runs/<delivery>/<change-slot>/<run>/
├─ action.md
├─ context.json
└─ result.json
```

Default stable Run surface:

```text
EXACTLY these three files
```

unless an already-approved canonical contract explicitly requires another durable artifact.

This document does not change:

```text
Run create-once history
Run / Result persistence
Policy
Action lifecycle
Owner authority
Reviewer authority
Git checkpoint model
OpenSpec truth
```

---

## 3. Mandatory temporary rule: keep the Run directory three-file

For every new Author or Reviewer Run before D03 formalization:

```text
action.md
context.json
result.json
```

are the normal durable Run artifacts.

Do NOT add ad-hoc files such as:

```text
verification-environment.json
proof.json
evidence.json
test-report.json
debug.json
review-notes.md
logs.txt
command-output.txt
```

inside `.flowkit/runs/**` merely because they were useful during one execution.

If execution evidence is temporary:

```text
keep it execution-local
→ do not persist it in the repository Run directory
```

If durable evidence identity is materially required:

```text
context.json / result.json
→ record concise identity, hash, path/ref, and conclusion
```

If a large evidence artifact truly must survive:

```text
store/reference it outside the default Run surface
+
record evidenceRef/hash in context.json or result.json
```

Do not create a new standard Run artifact type without a formal reviewed contract.

---

## 4. `action.md` must remain concise

`action.md` is a human/AI-readable Action descriptor, not a complete duplicate of:

```text
explore.md
proposal.md
design.md
spec.md
tasks.md
Reviewer reasoning
full verification transcript
terminal output
environment dump
```

Prefer content in this shape:

```text
Action identity
Objective
Bounded work performed
Important finding(s)
Important evidence reference(s)
Conclusion
Next boundary / STOP
```

Temporary size guidance:

```text
normal target: ~20–60 lines
>80 lines: treat as an exception and justify why the information cannot live
           in canonical OpenSpec artifacts, context.json, result.json, or an external ref
```

This is guidance, not a new machine validation threshold.

---

## 5. `context.json` responsibility

Use `context.json` for machine-readable execution context, such as:

```text
deliveryId
changeId
actionId / run identity
base revision
role
input Run / Result identity
authority fact identity
tool/runtime identity when materially relevant
artifact hashes / evidence refs when materially relevant
```

Do not copy large prose or full tool output into `context.json`.

Environment reproducibility facts should normally be represented as concise structured fields,
not as a new sibling verification file.

---

## 6. `result.json` responsibility

Use `result.json` for machine-readable terminal outcome and continuation truth, such as:

```text
PASS / FAIL / blocked
Reviewer verdict
finding ids
verification conclusion
material artifact refs/hashes
nextBoundary
STOP condition
```

Do not duplicate the entire `action.md`, Reviewer report, OpenSpec artifact, or test transcript.

---

## 7. Proof / verification handling

Proof is used to establish a fact or reject a hypothesis.

It is not a separate lifecycle state and does not automatically deserve a durable file.

Default handling:

```text
temporary proof commands / scratch output
→ execution-local

durable proof conclusion
→ canonical OpenSpec artifact and/or action.md/result.json

material external evidence
→ evidenceRef/hash
```

Never turn each proof step into another permanent file under `.flowkit/runs`.

---

## 8. Reviewer-specific constraint

Reviewer Runs must remain independent but concise.

Reviewer should persist:

```text
what was reviewed
verdict
blocking finding ids
bounded reasoning needed to understand the verdict
next boundary
```

Reviewer should not persist:

```text
a second copy of Author artifacts
a full command transcript
repeated canonical spec text
large environment dumps
```

If detailed review text is needed for Author revision, keep the Reviewer `action.md` bounded and
use exact finding ids / file-line references / canonical artifact references.

---

## 9. Author revise constraint

For `revise-explore`, `revise-propose`, and `revise-apply`:

```text
revise only the Reviewer finding
do not reopen already-accepted proof/contract areas
do not create extra durable evidence files by default
```

The Run should state:

```text
finding addressed
bounded mutation
verification conclusion
next boundary
```

not reproduce the full prior history.

---

## 10. Payload constraint

Run surface and transport payload are different concepts.

A Reviewer/Author payload may include changed OpenSpec/source files required for handoff.

But the payload MUST NOT be used as justification to permanently add temporary verification
artifacts to `.flowkit/runs`.

Default Run contribution inside a payload remains:

```text
action.md
context.json
result.json
```

plus the actual repository artifacts changed by that Action.

---

## 11. Historical 013 treatment

Existing committed file:

```text
.flowkit/runs/.../20260830-013-revise-apply/verification-environment.json
```

is treated as:

```text
historical ad-hoc evidence artifact
```

Rules:

```text
KEEP
→ do not rewrite committed Run history

DO NOT COPY
→ not a standard Run template

DO NOT GENERALIZE
→ does not establish a four-file Run contract
```

---

## 12. Temporary enforcement checklist

Before producing any new Run, Author/Reviewer must check:

```text
[ ] Run directory uses only action.md + context.json + result.json
    unless an existing formal contract explicitly requires more

[ ] action.md is concise and does not duplicate canonical artifacts

[ ] context.json contains only structured context / refs / hashes

[ ] result.json contains terminal outcome / findings / continuation truth

[ ] temporary proof/log/environment output stays execution-local

[ ] large durable evidence, if truly necessary, is externalized and referenced

[ ] no new Run artifact type is introduced by convention

[ ] no committed historical Run is rewritten
```

If a task appears to require breaking these rules:

```text
STOP
→ identify the missing formal contract
→ do not invent a new Run surface ad hoc
```

---

## 13. D03 handoff target

D03 should formally evaluate and replace this temporary guidance with a stable reviewed contract
covering at least:

```text
Run surface minimality
action.md concision
context/result responsibility
execution-local vs durable evidence
external evidence reference rules
Reviewer/Author guidance convergence
repository Run-history growth control
```

When the D03 contract is accepted:

```text
formal D03 truth
→ supersedes this temporary document
→ remove this temporary document / temporary AGENTS reference
```

Do not keep parallel temporary and formal guidance after D03 convergence.
