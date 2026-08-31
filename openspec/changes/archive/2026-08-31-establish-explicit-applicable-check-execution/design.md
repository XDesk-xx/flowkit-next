## Context

See `proposal.md` for motivation. The current Foundation has a prepared ActionPackage, exact Run/Result admission, durable Result facts, and repository-root execution, but no closed contract that binds an approved required-check set to the actual current worktree candidate and exact check identities. The reviewed Explore also proved that reusable identity cannot come from caller-provided digest-shaped strings and that candidate material must include Git-visible mode/kind as well as content.

The design must remain a thin mechanical execution capability. It must not infer which checks apply, become Formal Verification, or introduce a registry, planner, evidence/cache system, candidate snapshot store, or automatic Run-history lookup.

## Goals / Non-Goals

**Goals:**
- Accept one closed approved plan containing the exact required check declarations, but no caller-supplied reusable candidate/check/input identities.
- Derive the current candidate identity once at the trusted Action host boundary from actual Git-visible worktree material.
- Derive deterministic check identities from exact command/config/tool/environment declarations.
- Bind the exact ActionPackage, candidate, and complete required-check set into one immutable execution input identity shared by execution and admission.
- Execute non-reused checks with exact `program + argv`, `shell=false`, and capture compact real process outcomes.
- Admit only complete, identity-matching check facts after re-deriving current candidate identity.
- Allow only explicit prior successful facts with exact current candidate/check identity equality to be reused.

**Non-Goals:**
- Inferring applicability from OpenSpec Markdown, package scripts, changed files, or repository history.
- Check/Gate registries, Verification Planner, Evidence Platform/DAG, cache DB, candidate snapshot/history storage, changed-file planner, or background execution.
- Temporary Git index ownership or any expansion of Git mutation authority.
- Automatic Run-history search for reusable facts.
- Retry orchestration, stdout/stderr evidence blobs in the default Run surface, or lifecycle advancement.
- Formal Verification, Reviewer, Owner, or Policy authority.

## Decisions

### 1. Add one separate closed applicable-check execution contract

Use a dedicated closed domain seam conceptually shaped as:

```text
ApplicableCheckPlanInput
→ validate approved declarations
→ derive current candidateRef
→ derive each checkRef
→ bind exact current ActionPackage
→ ApplicableCheckExecutionInput
→ executionInputRef
```

The raw plan accepts only the required check declarations needed for this capability. The canonical repository root comes from the existing trusted Flowkit Action host execution context and is not a caller/formal-plan field. Candidate/check/execution identities are derived by Flowkit and are not caller-controlled fields.

The resolved execution input is immutable for one execution/admission attempt and carries:

```text
exact ActionPackage identity
candidateRef
complete resolved required-check set
executionInputRef
```

Execution and admission both consume that same resolved object/identity. No durable plan database is introduced.

**Alternative rejected:** add fields directly to the existing ActionPackage. The current ActionPackage is a closed lifecycle projection; widening it would mix lifecycle input with D02 mechanical-check binding and would make the capability harder to keep bounded.

### 2. Derive candidateRef from one canonical Git-visible worktree manifest

At execution-input formation and again at admission, Flowkit derives candidate identity from the host-owned canonical repository root.

Candidate enumeration uses the host-owned canonical repository root, includes tracked paths plus non-ignored untracked worktree material, and excludes only:

```text
.flowkit/runs/**
```

because persisting the current Run must not invalidate the candidate being checked.

Each canonical manifest record contains at least:

```text
path
canonical kind
canonical Git-visible mode
content/link-target identity or tracked-missing marker
```

The implementation must distinguish at least:

```text
100644 regular
100755 executable regular
120000 symlink
tracked deletion / missing tracked path
```

For tracked paths, index kind/mode is the starting identity, but current Git-visible worktree mode changes must override stale index mode when Git recognizes a mode change. Untracked regular files derive canonical executable/non-executable Git mode from the current filesystem; untracked symlinks use `120000`. Unsupported kinds, ambiguous reads, or path/material races fail closed rather than producing a reusable identity.

The manifest is path-sorted and encoded canonically before SHA-256 derivation. File bytes or symlink-target bytes are hashed rather than embedded.

No candidate snapshot is retained. This is a one-shot current-worktree digest.

**Alternative rejected:** caller-supplied candidateRef. Reviewer counterexamples proved stale digest-shaped values are not current-candidate proof.

**Alternative rejected:** caller-supplied/formal-plan `repositoryRoot`. The repository root is already owned by the trusted Action host; allowing plan-level root selection would let a structurally valid plan redirect candidate derivation/execution away from the current repository.

**Alternative rejected:** temporary Git index/snapshot DB. It adds authority and persistence complexity not required by the proven contract.

### 3. Derive checkRef from the complete material declaration

A required check declaration is closed and includes conceptually:

```text
checkId
program
args[]
configRefs[]
toolRefs[]
environmentRefs[]
```

Rules:
- `program` and `args[]` preserve exact ordered command identity.
- `configRefs`, `toolRefs`, and `environmentRefs` are explicit material identity sets, duplicate-free and canonically ordered for hashing.
- Duplicate `checkId`/resolved check identities or structurally incomplete declarations fail before execution.

`checkRef` is a deterministic SHA-256 reference over a canonical representation of the full declaration. Any materially relevant command, config, tool, or environment identity change produces a different checkRef.

Flowkit does not discover or manufacture the refs; the approved formal input must explicitly provide the material references that define the check. Flowkit only validates, canonicalizes, and binds them.

### 4. executionInputRef binds ActionPackage + candidate + complete check set

The resolved execution input is hashed from:

```text
exact ActionPackage/run/action identity
candidateRef
complete canonical resolved-check set
```

The check set is canonicalized deterministically after duplicate rejection so equivalent approved sets cannot derive different identities from incidental ordering.

Removing, adding, or changing a required check changes `executionInputRef`.

Admission never reconstructs a looser plan from Result facts; it receives the same resolved execution input and requires exact `executionInputRef` equality.

### 5. Execute exact checks without shell semantics

For a required check that is not eligible for reuse:

```text
spawn(program, argv, {
  cwd: repositoryRoot,
  shell: false,
  ...bounded environment inherited by the existing host contract
})
```

The runner records actual close/process outcome and maps it to a compact mechanical status such as:

```text
passed
failed
process-failed
```

Large stdout/stderr remains execution-local unless another existing contract explicitly requires it. This Change does not introduce evidence blobs.

A failing check is still a truthful current fact; this capability does not decide whether Policy may advance.

### 6. Store one compact reserved applicable-check fact set under Result.facts

Keep the existing RunResult top-level schema. Add a reserved typed/validated structure under `facts` containing:

```text
executionInputRef
candidateRef
check facts[]
```

Each fact contains at least:

```text
checkId
checkRef
status
```

and enough bounded process identity/outcome material to distinguish an executed fact from an explicit `reused-passed` fact without becoming a general evidence document.

Admission requires exactly one fact for every declared resolved check and rejects missing, duplicate, unexpected, or mismatched facts.

### 7. Re-derive candidateRef at admission and fail closed on drift

Before admitting the applicable-check facts, Flowkit re-derives the current candidateRef from the repository using the same candidate algorithm.

Admission requires:

```text
current candidateRef == executionInput.candidateRef
result candidateRef == executionInput.candidateRef
result executionInputRef == executionInput.executionInputRef
exact declared check set == exact fact set
```

Any mismatch fails admission. This prevents a check executed on candidate C1 from being admitted after the worktree changes to C2.

### 8. Reuse is explicit input, never automatic history lookup

The caller may explicitly provide prior mechanical check facts as reuse candidates, but cannot provide current candidate/check truth.

A prior fact is reusable only if:

```text
prior.status == passed or otherwise canonical successful executed status
prior.candidateRef == current Flowkit-derived candidateRef
prior.checkRef == current derived checkRef
```

Failed/process-failed facts are never reusable as success. Exact identity mismatch causes execution, not heuristic freshness evaluation.

When reuse is eligible, the current Result still contains a current compact `reused-passed` fact bound to the current executionInputRef/candidate/check identity.

No `.flowkit/runs` scan or cache index is introduced.

### 9. Mechanical check facts remain below authority boundaries

Applicable-check facts answer only:

```text
Did this exact declared mechanical check execute/pass/fail,
or is there an explicitly supplied exact-identity prior success eligible for reuse?
```

They do not answer:

```text
Is the Change correct?
May Policy advance?
Did Reviewer approve?
Did Owner authorize?
Did Formal Verification pass?
```

Existing authority and lifecycle contracts remain unchanged.

## Risks / Trade-offs

- **[Candidate hashing reads the worktree twice: before execution and admission]** → Keep the algorithm one-shot and bounded; this is intentional protection against candidate drift and requires no persisted snapshot.
- **[Git-visible mode semantics differ by platform/config]** → Bind only canonical Git-visible mode/kind material and fail closed on unsupported/ambiguous cases; do not hash arbitrary permission bits.
- **[`.flowkit/runs/**` exclusion could be overgeneralized later]** → Freeze it as the single self-invalidation exclusion for this capability; do not create a configurable exclusion/planner system.
- **[Explicit material refs can be incomplete semantically]** → The approved formal-input boundary owns WHAT identity refs are material; Flowkit proves exact execution only against the closed input and must not recreate a planner.
- **[Result facts could grow into evidence payloads]** → Keep facts compact and typed; stdout/stderr and rich evidence remain outside the default durable Run surface.
- **[Reuse can become a hidden cache]** → Require explicit prior fact supply and exact equality only; no automatic search, TTL, freshness, or best-match logic.

## Migration Plan

1. Add the bounded applicable-check domain contracts/validators and candidate/check/input identity helpers without changing existing lifecycle authority.
2. Add exact runner and compact fact construction/admission behavior with focused disposable counterexamples.
3. Integrate the reserved applicable-check fact structure under existing Result facts and verify existing Result/ActionPackage behavior remains compatible.
4. Keep existing workflows unchanged when no applicable-check plan is supplied; this Change does not infer or auto-create a plan.
5. Roll back by removing the new bounded capability surface; no external dependency or persistent database migration is required.
