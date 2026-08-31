# 044 Propose — correct-openspec-observation-process-failure-portability

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `correct-openspec-observation-process-failure-portability`
- Action: `propose`
- Run: `20260831-044-propose`
- Role: `author`
- Input: `20260831-043-review-explore` (`approved → propose`)
- Git checkpoint claim: `32345c2ec951baffde7f56ba7519a1c4c1e77566`

## Objective

Converge the Reviewer-approved portability proof into the smallest formal correction for `openspec-thin-integration` without broadening production process classification.

## Proposal convergence

Created the complete spec-driven planning set:

- `proposal.md`
- `design.md`
- `specs/openspec-thin-integration/spec.md`
- `tasks.md`

The Proposal freezes the exact portable precedence already accepted by Reviewer:

```text
spawn/error
or host-observable abnormal close:
  code=null OR signal!=null
→ openspec-process-failed

otherwise numeric close exists
→ parse required machine JSON first

numeric close + invalid required JSON
→ malformed-machine-output

numeric non-zero + valid formal JSON
→ openspec-formal-outcome
```

The spec delta is a minimal clarification of the existing `OpenSpec formal non-zero outcomes remain distinct from integration failures` requirement. It does not add a new diagnostic kind or lifecycle taxonomy.

## Implementation boundary

Default production behavior remains unchanged.

If deterministic proof requires it, Apply may only extract the existing inline `{code, signal}` close decision into a tiny internal pure testability seam that:

```text
does not enter src/domain/index.ts
does not change public API
does not add runtime state
does not become a process supervisor
```

The previous universal fixture:

```text
child self process.kill(SIGKILL)
→ always openspec-process-failed
```

is rejected as cross-platform contract proof.

Portable verification must instead preserve explicit coverage for:

```text
host-observable abnormal outcome
→ openspec-process-failed

numeric close + malformed/empty required machine output
→ malformed-machine-output

numeric non-zero + valid formal JSON
→ openspec-formal-outcome
```

## Explicit non-goals preserved

```text
no Windows skip
no win32 + code=1 special case
no non-zero + empty stdout heuristic
no stderr inference
no hidden OS-cause reconstruction
no diagnostic taxonomy expansion
no package/lock mutation
no dependency addition
no generic process supervisor/runtime abstraction
no merge into establish-explicit-applicable-check-execution
```

## Validation

```text
OpenSpec planning set → 4/4 DONE
OpenSpec current Change strict → PASS
OpenSpec --all --strict → 14/14 PASS
git diff --check HEAD → PASS
production mutation → NONE
package.json / pnpm-lock.yaml mutation → NONE
Apply → NOT STARTED
```

## Conclusion

```text
PASS
→ review-propose
```

No Apply, production/package mutation, archive, next-Change activation, Git checkpoint, commit, push or merge was performed.
