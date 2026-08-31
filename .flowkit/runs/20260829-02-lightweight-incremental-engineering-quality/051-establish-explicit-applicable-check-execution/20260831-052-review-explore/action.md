# 052 Review Explore — establish-explicit-applicable-check-execution

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-explicit-applicable-check-execution`
- Action: `review-explore`
- Run: `20260831-052-review-explore`
- Role: `reviewer`
- Input Run: `20260831-051-explore`
- Review chain start: `20260831-051-explore`

## Review result

Reviewer independently reviewed 051 against the frozen D02 Applicable Check design and current Foundation ActionPackage / Result-admission contracts.

The Explore is directionally correct and remains appropriately small:

```text
formal input owns WHAT checks are required
mechanical runner executes exact program + argv
Result carries compact real execution facts
no Verification verdict
no Check Registry / Planner / Evidence Platform
no automatic history scan
no smart test selection
```

The exact-argv runner and compact Result-fact direction are accepted.

However three binding properties required by D02 are not yet proven strongly enough for Proposal.

---

## RE-052-001 — caller-supplied candidateRef is not yet proven to be actual candidate identity

The Explore currently proposes:

```text
candidateRef
→ explicit caller/host input
→ cryptographic-ref grammar
```

and same-candidate reuse checks only:

```text
prior.candidateRef === current.candidateRef
+
prior.checkRef === current.checkRef
```

The reuse prototype proves:

```text
candidate changes
AND caller changes candidateRef
→ rerun
```

but it does not prove:

```text
candidate changes
AND stale/wrong candidateRef is supplied
→ rerun
```

A syntactically valid SHA-256-looking string is not evidence that it was derived from the material candidate.

Decisive counterexample:

```text
candidate C1
candidateRef = R
checkRef = K
successful fact F(C1,R,K)

repository candidate mutates to C2

caller supplies the same R
current checkRef remains K

equality-only reuse
→ F is accepted
→ executor calls = 0
```

This violates the frozen D02 requirement:

```text
candidate changed
→ old fact must not be reusable
```

and repeats the same class of trust mistake previously corrected for caller-supplied Change state:

```text
caller-provided structural value
≠ trusted canonical fact
```

### Required revise-explore

Prove one minimal trusted candidate-identity boundary.

Acceptable direction:

```text
trusted execution host / existing canonical seam
→ owns exact candidateRef derivation or attestation
→ binds it to the material candidate before check execution

Applicable Check capability
→ consumes the trusted resolved candidate identity
→ does not accept arbitrary caller text as reusable-candidate truth
```

If Flowkit itself must derive the identity, keep derivation bounded and prove it without building a candidate snapshot database, temp Git authority subsystem, Evidence DAG, or history heuristic.

If the host owns derivation, the revised Explore must freeze:
- who the trusted producer is;
- what exact material identity the ref represents;
- why arbitrary caller substitution cannot become reuse authority;
- the counterexample where candidate bytes change while a stale ref is presented.

Do not solve this with grammar validation alone.

---

## RE-052-002 — materially relevant environment identity is omitted from checkRef/reuse invalidation

The frozen D02 reuse rule includes:

```text
same exact candidate
+
same exact check/config identity
+
same materially relevant tool/environment identity
```

051's checkRef prototype currently hashes:

```text
checkId
program
args
configRefs[]
toolRefs[]
```

but not:

```text
environmentRefs[]
```

The text says materially relevant environment identity remains explicit input, yet the reuse rule later checks only:

```text
candidateRef + checkRef
```

Therefore:

```text
same candidate
same command/config/tool
different materially relevant environment
→ same checkRef
→ prior success can be reused
```

No counterexample invalidates this stale reuse path.

### Required revise-explore

Choose one exact bounded rule:

```text
A. include explicit material environmentRefs in the canonical check declaration
   and therefore in checkRef

or

B. keep environment identity separate but require exact environmentRef equality
   as an additional reuse condition
```

Then prove:

```text
environment identity changes
→ prior successful fact is NOT reusable
→ executor runs again
```

Do not auto-discover environment materiality. Formal input still owns which environment refs matter.

---

## RE-052-003 — authoritative required-check execution input / admission seam remains unresolved

The current Foundation ActionPackage is a closed projection of exact RunContext.

051 correctly proves an invented `requiredChecks` field is rejected.

But the revised direction remains undecided:

```text
MAY extend ActionPackage
OR
MAY use a wrapper/input object
```

and the Explore asks Proposal/Reviewer to choose later.

This is not only a TypeScript naming choice.

The capability must eventually prove:

```text
the exact required-check declarations used for execution
=
the exact declarations against which Result admission checks completeness
```

Otherwise a caller can:
- omit a required declaration;
- change the declaration set between execution and admission;
- provide a different candidateRef/check plan to admission;
- create compact facts that are structurally valid but not complete for the exact execution boundary.

The phrase:

```text
approved formal execution input
```

does not yet identify a closed machine contract or its binding to exact Run/ActionPackage identity.

### Required revise-explore

Freeze one minimum closed integration seam before Proposal.

It may be:

```text
extended ActionPackage
```

or a small separate:

```text
ApplicableCheckExecutionInput
```

provided the latter is explicitly bound to the exact ActionPackage/run/action identity.

The revised Explore must prove the selected seam can:
- carry the exact declared required checks;
- carry/consume the trusted candidate identity;
- be validated as closed data;
- remain identical for execution and admission;
- reject missing/duplicate/mismatched check declarations;
- let Result admission prove every declared required check has one real or explicitly reusable successful/failed execution fact as applicable;
- avoid mutating RunContext merely to persist the plan.

Do not create a Registry, Planner, durable plan database, or fourth Run artifact.

---

## Accepted findings — do not reopen

Reviewer accepts and does not require revision of:

```text
no machine required-check source currently exists
package scripts do not own applicability
OpenSpec Markdown/task prose must not be parsed for applicability
exact shell=false program+argv execution is sufficient
compact typed reserved Result.facts structure is appropriate
formal Verification verdict remains unavailable to Standard Actions
reuse must consume only an explicitly supplied prior successful fact
no automatic .flowkit/runs history search
no Check Registry / Gate Registry / Verification Planner / Evidence Platform
no retry/background execution
large stdout/stderr blobs remain outside default durable Run surface
```

The current focused Foundation baseline and current-Change strict claims show no contrary evidence.

---

## Required revise-explore scope

Revise only these three binding proofs:

```text
1. trusted actual candidate identity
2. environment identity invalidation
3. one closed required-check execution/admission input seam
```

Do not broaden the Change.

A successful revision should be able to demonstrate:

```text
candidate bytes change + stale candidateRef presented
→ stale fact cannot be reused

material environment identity changes
→ stale fact cannot be reused

declared-check set differs between execution/admission
→ fail closed

exact same trusted candidate + exact same check/config/tool/environment identity
+ explicit prior success
→ reuse allowed without history scan
```

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-explore
```

Reviewer did not mutate Author Explore, create Proposal artifacts, Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
