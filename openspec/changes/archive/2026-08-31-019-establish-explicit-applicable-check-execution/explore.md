# Explore — establish-explicit-applicable-check-execution

## Status

```text
PASS / Proposal-ready for independent review
```

This revised Explore closes the remaining exact-candidate-material gap identified by Reviewer Run
`20260831-054-review-explore`, while preserving the three 052 corrections already accepted by Reviewer 054 and the bounded D02 boundary:

```text
formal input owns WHAT checks are required
Flowkit owns trusted binding of actual candidate/check/input identity
mechanical runner executes exact program + argv
Result carries compact real execution facts
no Verification verdict
no Check Registry / Planner / Evidence Platform
no automatic history scan
no smart test selection
```

No Proposal, spec delta, design, tasks, or production implementation is created
by this Explore.

---

## 1. Owner goal

Complete the final D02 quality capability:

```text
formal input already says check X is required
↓
bind that exact requirement to the actual repository candidate
↓
execute that exact declared check
↓
record a real, compact Result fact bound to exact candidate/check/input identity
↓
allow explicit same-candidate fact consumption only when every material identity matches
```

The capability must not decide which checks apply.

---

## 2. Current repository facts

The current Foundation already provides:

```text
single current Action
prepared ActionPackage
exact Run/Action Result admission
Run/Result durability
opaque bounded Result.facts JSON
single-Action terminal/STOP
Git as repository truth/history
```

But it does not currently provide:

```text
machine-readable required check declarations
trusted actual worktree candidate identity
exact check identity including material environment refs
mechanical check execution fact
same-candidate check-fact reuse validation
one closed execution/admission check-input seam
```

Static search confirms there is no `requiredChecks`, `candidateRef`, or
check-execution identity in current ActionPackage / RunContext / RunResult
contracts.

---

## 3. Proof A — required-check authority does not exist in current machine facts

Existing Change tasks often state verification requirements in prose.

However exact OpenSpec 1.10.0 machine status exposes:

```text
artifact paths/readiness
planning context
allowed edit roots
```

and does not expose a canonical machine `requiredChecks` field.

`package.json#scripts` lists executable commands, but cannot answer:

```text
which checks are required for this exact Action/Change?
```

Decision:

> **WHAT checks are required remains explicit approved formal execution input.**

This Change SHALL NOT:

```text
parse OpenSpec Markdown/task prose
scan package scripts to infer applicability
infer checks from changed files
create a Check Registry
create a Verification Planner
```

This authority boundary is unchanged from 051 and was accepted by Reviewer 052.

---

## 4. Proof B — current ActionPackage is closed; Result facts can carry compact outcomes

The current ActionPackage is a closed prepared RunContext projection.

Controlled validator proof from 051:

```text
current valid ActionPackage
→ accepted

same package + invented requiredChecks field
→ rejected
```

The current RunResult contract provides bounded:

```text
facts: JsonObject
```

and a compact typed applicable-check fact structure fits inside that existing
surface.

Decision retained:

```text
RunResult top-level schema
→ SHOULD remain unchanged

compact applicable-check execution facts
→ one reserved typed/validated structure under Result.facts

no fourth Run artifact
no evidence blob by default
```

Large stdout/stderr remains execution-local unless some other existing contract
materially requires it.

---

## 5. Proof C — exact shell-free execution is sufficient

A disposable non-production prototype used Node `child_process.spawn` with:

```text
shell = false
exact program
exact argv array
```

Observed:

```text
PASS fixture
→ code=0
→ signal=null

FAIL fixture
→ code=7
→ signal=null
```

No shell interpretation, retry, background worker, test selection, or lifecycle
logic is required.

Decision retained:

```text
exact declared program + argv
→ repository-root execution boundary
→ actual process code/signal
→ compact check fact
```

---

# Reviewer 052 binding revisions

## 6. RE-052-001 — trusted actual candidate identity

### 6.1 051 defect

051 proposed:

```text
caller supplies candidateRef
Flowkit validates only cryptographic-ref grammar
```

Reviewer correctly proved this is insufficient:

```text
candidate C1
candidateRef R
successful fact F(C1,R,K)

candidate mutates to C2
caller supplies stale R

equality-only reuse
→ stale fact can be accepted
```

A SHA-looking string is not proof that it represents current candidate bytes.

### 6.2 Selected trusted producer

Revised boundary:

> **Flowkit's Action execution host derives the current candidateRef from the
> actual Git-visible worktree at execution time. The formal check input does
> not contain a caller-supplied candidateRef field.**

The producer is therefore:

```text
Flowkit Action execution host
+
canonical repositoryRoot already owned by the host
+
one-shot candidate digest function
```

not arbitrary caller text.

### 6.3 Exact material candidate represented

For this D02 capability, `candidateRef` represents:

> **the exact content of all Git-visible, non-ignored worktree paths at the
> repository root, excluding only `.flowkit/runs/**`, which is execution
> history/evidence and must not make a check invalidate itself when its own Run
> is persisted.**

Bounded derivation candidate:

```text
git ls-files --cached --others --exclude-standard
↓
exclude .flowkit/runs/**
↓
canonical path sort
↓
for each path, preserve canonical Git-visible kind/mode material:
  tracked regular/symlink
    → staged Git mode + any Git-visible worktree mode override
    → effective canonical mode/kind
  untracked regular
    → canonical 100755 when executable, otherwise 100644
  untracked symlink
    → canonical 120000
  tracked deletion
    → prior tracked mode + missing marker
  unsupported mode/kind/read failure
    → fail closed
↓
canonical manifest record:
  path + kind + canonical Git mode + SHA-256(actual bytes or link target)
↓
SHA-256(canonical manifest)
→ candidateRef
```

Properties:

```text
ignored node_modules/build/runtime material
→ not candidate bytes
→ relevant identity belongs in explicit tool/environment refs

.flowkit/runs/**
→ excluded because it is execution history

all other Git-visible current repository content
→ included conservatively
```

There is:

```text
no temp Git index
no candidate snapshot database
no candidate history table
no mtime heuristic
no latest-Run inference
no changed-file planner
```

### 6.4 Current repository cost proof

A disposable implementation over the current working repository derived the
candidate identity from the Git-visible non-Run material set in approximately:

```text
~0.02s on this detached host
```

This timing is evidence only, not a cross-machine SLA.

### 6.5 Decisive stale-ref counterexample

A disposable Git repository proof produced:

```text
C1:
src/a.ts bytes = "a1"
→ candidateRef R1

write only .flowkit/runs/r2
→ candidateRef still R1

change src/a.ts bytes to "a2"
→ candidateRef R2
→ R2 != R1
```

Reuse proof:

```text
prior successful fact:
candidateRef = R1
checkRef = K

current host-derived candidateRef = R2

R1 != R2
→ prior fact NOT reusable
→ executor must run
```

Closed raw-plan proof:

```text
formal plan fields:
repositoryRoot
checks

same plan + caller candidateRef=R1
→ rejected as unknown field
```

Therefore:

```text
candidate bytes change + stale candidateRef presented
→ stale current-candidate override is rejected
→ current candidate is re-derived as R2
→ stale success cannot be reused
```

This closes the caller-trust portion of RE-052-001 without creating a candidate identity platform.

### 6.6 RE-054-001 — Git-visible executable mode is candidate material

Reviewer 054 correctly proved that bytes alone are insufficient candidate
material for a generic exact-check capability:

```text
tracked check.sh
mode 100755
bytes B
→ prior check may execute/pass

same path
same bytes B
mode 100644
→ POSIX execution semantics can materially change
```

Therefore the candidate manifest SHALL include the canonical Git-visible
file mode/kind identity required to distinguish at least:

```text
100644
100755
120000
missing tracked path
```

The selected bounded implementation does not hash arbitrary POSIX permission
bits and does not become Git authority. It records only the canonical
Git-visible mode/kind material that is part of the current worktree candidate.
For tracked files the derivation must preserve Git-visible worktree mode
changes rather than reading the index mode alone.

Disposable Git proof with `core.filemode=true`:

```text
check.sh bytes unchanged
100755 → 100644

git diff --summary
→ mode change 100755 => 100644 check.sh

candidateRef before = R1
candidateRef after  = R2
R1 != R2
```

Reuse counterexample:

```text
prior fact:
  candidateRef = R1
  checkRef = K
  status = passed

current Flowkit-derived candidateRef = R2
current checkRef = K

R1 != R2
→ prior PASS NOT reusable
→ current check must execute
```

This closes RE-054-001 while preserving the existing one-shot worktree digest.
It adds no:

```text
temp Git index
candidate snapshot DB
candidate history store
candidate registry
Git authority expansion
```

---

## 7. RE-052-002 — material environment identity invalidates reuse

051 derived `checkRef` from:

```text
checkId
program
args
configRefs[]
toolRefs[]
```

but omitted environment refs.

Revised canonical declaration candidate:

```text
checkId
program
args
configRefs[]
toolRefs[]
environmentRefs[]
```

Identity rules:

```text
args
→ ordered exact argv identity

configRefs/toolRefs/environmentRefs
→ explicit material identity sets
→ closed, duplicate-free, canonically ordered for digest

Flowkit
→ does NOT discover which environment facts matter

formal input
→ owns the explicit materially relevant refs
```

Derived:

```text
checkRef = SHA-256(canonical exact check declaration)
```

### Decisive environment counterexample

Controlled proof with the same candidate and same command/config/tool:

```text
environmentRefs = ["platform:linux-x64"]
→ checkRef = K1

environmentRefs = ["platform:windows-x64"]
→ checkRef = K2

K1 != K2
```

Prior success:

```text
candidateRef = R
checkRef = K1
status = passed
```

Current:

```text
candidateRef = R
checkRef = K2
```

Result:

```text
old Linux fact reusable in changed environment?
→ NO
→ executor runs
```

This closes RE-052-002.

---

## 8. RE-052-003 — selected closed execution/admission seam

### 8.1 Selected seam

The revised Explore selects one explicit integration model:

> **A separate closed `ApplicableCheckExecutionInput`, bound to the exact
> prepared ActionPackage, is the execution/admission seam.**

Do not extend RunContext merely to persist a plan.

Conceptual raw formal input:

```text
ApplicableCheckPlanInput
  repositoryRoot
  checks[]
```

Important:

```text
NO caller candidateRef
NO caller checkRef
NO caller executionInputRef
```

Each raw check declaration is closed:

```text
checkId
program
args[]
configRefs[]
toolRefs[]
environmentRefs[]
```

The raw plan is supplied by the trusted Action host from the approved formal
execution input. Flowkit still does not decide WHAT checks apply.

### 8.2 Resolved execution input

Before execution, Flowkit forms:

```text
ApplicableCheckExecutionInput
  actionPackageRef
  candidateRef
  checks[]
    checkId
    exact program + argv
    configRefs
    toolRefs
    environmentRefs
    derived checkRef
  executionInputRef
```

where:

```text
actionPackageRef
= SHA-256(canonical exact prepared ActionPackage)

candidateRef
= Flowkit-derived actual worktree identity from Section 6

checkRef
= SHA-256(canonical exact declaration including environmentRefs)

executionInputRef
= SHA-256(
    actionPackageRef
    + candidateRef
    + exact resolved declared-check set
  )
```

The resolved input is closed and immutable for one invocation.

### 8.3 Execution and admission use the same identity

Execution receives:

```text
exact ActionPackage
+
exact resolved ApplicableCheckExecutionInput
```

Result facts must carry:

```text
executionInputRef
candidateRef
one compact fact per declared checkId/checkRef
```

Admission receives the same resolved execution input and SHALL:

1. bind it back to the exact current ActionPackage/run/action;
2. re-derive the current candidateRef before admission and require equality with
   the execution input candidateRef;
3. require Result `executionInputRef` exact equality;
4. require Result `candidateRef` exact equality;
5. require exactly one fact for every declared required check;
6. reject missing facts;
7. reject duplicate facts;
8. reject unexpected/mismatched checkId/checkRef facts;
9. allow an explicit reused-success fact only when the prior fact is a valid
   success and current candidateRef + checkRef match exactly.

This provides one closed execution/admission contract without a durable plan DB.

### 8.4 Decisive plan mismatch proofs

Disposable closed-input/admission prototype:

```text
exact input checks = [A, B]
exact result facts = [A, B]
same executionInputRef
→ admission PASS
```

Mismatch:

```text
execution used [A, B]
admission input changed to [A]
→ different executionInputRef / incomplete fact set
→ admission FAIL
```

Duplicate declaration:

```text
checks = [A, A]
→ raw closed-plan validation FAIL
```

Missing result fact:

```text
declared = [A, B]
facts = [A]
→ admission FAIL
```

Caller tries to supply candidateRef in raw plan:

```text
unknown field
→ closed-plan validation FAIL
```

This closes RE-052-003.

### 8.5 Semantic omission boundary

Flowkit can prove completeness only against the exact approved formal input
presented at this boundary.

It does not independently infer:

```text
"the human/spec prose really intended another hidden check C"
```

because doing so would recreate a Planner.

The authority split is therefore explicit:

```text
approved formal execution input / trusted Action host
→ WHAT declarations enter the closed plan

Flowkit
→ validates the closed plan
→ derives actual candidate/check/input identities
→ executes exactly
→ proves Result completeness against that exact plan
```

---

## 9. Same-candidate reuse rule

Reuse consumes only an explicitly supplied prior successful fact.

Reusable iff:

```text
prior.status = passed
AND
prior.candidateRef = current Flowkit-derived candidateRef
AND
prior.checkRef = current derived checkRef
```

Because `checkRef` includes:

```text
command
config refs
tool refs
material environment refs
```

the complete D02 reuse rule becomes:

```text
same actual candidate
+
same exact command/config/tool/environment identity
+
explicit prior successful fact
→ reuse allowed

otherwise
→ rerun
```

There is:

```text
no automatic .flowkit/runs history search
no cache DB
no timestamp freshness
no evidence graph
```

A reused check still yields one compact current Result fact explicitly stating
that the current requirement was satisfied by an eligible prior success.

---

## 10. Mechanical execution fact boundary

Each declared required check must yield exactly one current fact:

```text
executed:
  passed
  failed
  process-failed

or

explicitly reused:
  reused-passed
```

Failed/process-failed prior facts are never reusable as success.

A failed current check is still recorded truthfully as a real execution fact.
This capability does not decide whether Policy may advance afterward.

---

## 11. Verification / Reviewer / Owner authority separation

Existing Foundation rejects formal `verificationVerdict` from Standard Actions.

Applicable-check facts remain:

```text
mechanical execution facts
```

not:

```text
Formal Verification verdict
Reviewer verdict
Owner authority
Policy decision
next Action authority
```

No change to this accepted 051 boundary.

---

## 12. Minimum Proposal contract

Proposal should remain one bounded capability:

```text
Approved formal check plan
  repositoryRoot
  exact closed required-check declarations

Flowkit candidate binding
  derive actual Git-visible worktree candidateRef
  exclude only .flowkit/runs/**
  no caller candidateRef

Flowkit check binding
  exact program + argv
  configRefs
  toolRefs
  environmentRefs
  derived checkRef

Closed execution input
  exact ActionPackage binding
  candidateRef
  resolved required checks
  executionInputRef

Mechanical runner
  shell=false
  exact program + argv
  actual process outcome

Compact Result facts
  executionInputRef
  candidateRef
  exactly one fact per declared check

Admission
  same exact execution input
  current candidate re-check
  complete exact fact set
  fail closed on mismatch

Reuse
  explicit prior successful fact only
  exact candidateRef + checkRef equality
```

Exact TypeScript naming remains Proposal/design detail, but the integration seam
and trust ownership above are now frozen.

---

## 13. Explicit non-goals

```text
no Check Registry
no Gate Registry
no Verification Planner
no Evidence Platform / DAG / cache DB
no smart test selection
no changed-file planner
no package.json script scanning for applicability
no OpenSpec Markdown parsing
no automatic next Action
no formal Verification verdict
no candidate snapshot database
no temp Git index / Git authority subsystem
no candidate history store
no background execution
no automatic retry
no stdout/stderr evidence blobs in default Run surface
```

---

## 14. Reviewer closure matrix

| Finding | Decisive proof | Result |
|---|---|---|
| RE-052-001 trusted actual candidate identity | Flowkit derives candidateRef from actual Git-visible worktree; Run-only mutation stable; source-byte mutation changes ref; raw caller candidateRef rejected | CLOSED |
| RE-052-002 environment invalidation | environmentRefs included in checkRef; Linux→Windows ref change forces rerun with same candidate | CLOSED |
| RE-052-003 closed execution/admission seam | selected `ApplicableCheckExecutionInput`; executionInputRef binds exact ActionPackage + candidate + declared set; missing/duplicate/mismatched plan/facts fail closed | CLOSED |
| RE-054-001 executable/file mode material | same bytes with Git-visible `100755→100644` changes candidateRef and makes prior success ineligible for reuse | CLOSED |

---

## 15. Proof matrix

| Question | Proof | Result |
|---|---|---|
| Is there already a machine required-check source? | OpenSpec 1.10.0 status + code search | NO |
| Can package scripts decide applicability? | semantic inspection | NO |
| Can current ActionPackage silently carry plan? | closed validator counterexample | NO |
| Can Result facts carry compact check facts? | current generic RunResult proof | YES |
| Can exact program+argv capture real exit? | shell=false runner prototype | YES |
| Who owns current candidate identity? | revised trust proof | Flowkit Action host derives it |
| Can stale caller candidateRef override current candidate? | raw plan closed-field counterexample | NO |
| Does source-byte mutation change candidate identity? | disposable Git worktree proof | YES |
| Does Git-visible executable mode change candidate identity with same bytes? | disposable `100755→100644` Git proof | YES |
| Do Run-history bytes self-invalidate candidate? | `.flowkit/runs/**` exclusion proof | NO |
| Do material environment changes invalidate check identity? | environmentRefs digest counterexample | YES |
| Is one execution/admission seam selected? | closed input prototype | YES |
| Does changed declaration set fail admission? | executionInputRef/completeness counterexample | YES |
| Do duplicate declarations fail? | closed input validation counterexample | YES |
| Do missing facts fail? | admission counterexample | YES |
| Can exact same candidate/check prior success avoid rerun? | explicit reuse predicate | YES |
| Does candidate identity require snapshot DB/temp index/history scan? | selected one-shot worktree digest | NO |
| May facts become Verification verdict? | existing Foundation authority contract | NO |

---

## 16. Proposal-ready decisions

```text
PASS
```

Proposal MUST preserve:

1. WHAT required checks apply remains approved formal execution input; Flowkit
   does not infer applicability.
2. Caller does not supply reusable candidate truth; Flowkit derives candidateRef
   from the actual Git-visible worktree at the trusted Action host boundary.
3. `.flowkit/runs/**` is excluded from candidate material so Run persistence does
   not self-invalidate the candidate; no other arbitrary planner/exclusion
   system is introduced.
4. Exact check identity includes command + explicit material
   config/tool/environment refs.
5. One separate closed `ApplicableCheckExecutionInput` is bound to the exact
   ActionPackage/run/action and is used unchanged by execution and admission.
6. Admission rechecks current candidate identity and fails closed on
   declaration/fact mismatch, omission, duplication, or candidate drift.
7. Compact check facts live under Result facts and remain separate from
   Verification/Reviewer/Owner/Policy authority.
8. Reuse consumes only an explicitly supplied prior successful fact and
   requires exact Flowkit-derived candidateRef + derived checkRef equality.
9. Candidate material includes canonical Git-visible mode/kind identity, including at least `100644`, `100755`, `120000`, and tracked deletion; same bytes with a Git-visible executable-bit change must produce a different candidateRef.
10. No Registry/Planner/Evidence Platform/cache/history scan/candidate snapshot
   subsystem is introduced.

The three Reviewer 052 blockers and the remaining Reviewer 054 material-identity blocker are resolved enough for Proposal.
