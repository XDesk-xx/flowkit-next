# 043 Review Explore — correct-openspec-observation-process-failure-portability

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `correct-openspec-observation-process-failure-portability`
- Action: `review-explore`
- Run: `20260831-043-review-explore`
- Role: `reviewer`
- Input Run: `20260831-042-revise-explore`
- Review chain start: `20260831-040-explore`

## Full review-chain result

Reviewer re-reviewed:

```text
040 Explore
→ defect confirmed
→ Windows raw tuple missing
→ Proposal blocked

041 Review Explore
→ CHANGES REQUESTED
→ RE-041-001

042 Revise Explore
→ exact Windows observable tuple established
→ Branch B selected
→ minimal spec clarification selected
```

No already-accepted D02 scope finding was reopened.

## RE-041-001 — RESOLVED

The revised Explore now establishes the exact Windows outcome for the existing self-termination fixture:

```text
Node 22.23.2
Windows x64

fixture:
process.kill(process.pid, "SIGKILL")

parent observable outcome:
code   = 1
signal = null
stdout = ""
```

The proof is not based only on the prior Flowkit diagnostic.

It combines:

```text
1. reproduced Windows Flowkit result
   → malformed-machine-output
   → proves numeric code + null signal + invalid stdout reached classification

2. fixture source
   → writes no stdout

3. exact Node 22.23.2 Windows libuv implementation
   → child process.kill(pid, SIGKILL)
   → uv_kill
   → uv__kill
   → TerminateProcess(process_handle, 1)

4. parent uv_process_t exit_signal
   → initialized to 0

5. only parent-side uv_process_kill(...)
   → sets process->exit_signal = signum

6. child self-kill uses uv_kill(...)
   → cannot update the parent's uv_process_t exit_signal
```

Therefore the exact parent-observable tuple is sufficiently proven for Proposal selection.

Reviewer independently verified the relevant exact Node v22.23.2 source semantics.

Linux remains comparison evidence:

```text
code=null
signal=SIGKILL
stdout=""
```

and does not substitute for the Windows proof.

## Correction branch — ACCEPTED

The revised Explore selects:

```text
Branch B — observable invocation/classification contract ambiguity
```

Reviewer agrees with the resulting semantic conclusion.

The hidden OS cause:

```text
Windows forceful TerminateProcess
```

is not recoverable from the current Flowkit child-process observation seam when Node reports:

```text
numeric code + null signal + empty stdout
```

That tuple is observationally indistinguishable from an ordinary numeric process exit that failed to emit required machine JSON.

Therefore the correction MUST NOT invent heuristics such as:

```text
win32 + code=1
→ process failure

non-zero + empty stdout
→ process failure

stderr text
→ infer process death
```

## Observable precedence — ACCEPTED

The smallest portable classification contract is:

```text
spawn/error
or host-reported abnormal close:
  code=null OR signal!=null
→ openspec-process-failed

otherwise numeric close exists
→ required stdout must first be valid machine JSON

numeric close + invalid required JSON
→ malformed-machine-output

numeric non-zero + valid formal JSON
→ openspec-formal-outcome

numeric zero + valid expected JSON
→ normal observation validation
```

This is the observable behavior the current production implementation already follows.

Reviewer therefore accepts:

```text
production classification broadening
→ NOT proven / NOT required

current production classification behavior
→ should remain unchanged by default
```

## Spec-delta decision — ACCEPTED

The 040 default:

```text
specDelta = none
```

is correctly superseded.

The revised Explore proves:

```text
specDelta
→ minimal openspec-thin-integration clarification required
```

The clarification must resolve the previous abstract overlap between:

```text
process cannot start or complete
```

and:

```text
required stdout is not valid JSON
```

by defining process-failure through the host-observable invocation outcome rather than through an unobservable hidden OS cause.

No new diagnostic kind or lifecycle taxonomy is justified.

## Portable-test consequence — ACCEPTED

The prior universal test assumption:

```text
child self process.kill(SIGKILL)
→ always openspec-process-failed
```

is disproven on Windows and must not remain the cross-platform contract test.

Proposal must preserve both categories through deterministic portable boundary coverage:

```text
host-observable process failure
→ openspec-process-failed

numeric close + malformed/empty required machine output
→ malformed-machine-output
```

For abnormal-close coverage, Proposal should prefer a deterministic observable process-outcome seam rather than another OS-specific kill assumption.

A tiny internal testability seam is acceptable only if needed to test the existing boundary; it must not become a process supervisor or new runtime abstraction.

## Scope / non-goal audit

Confirmed preserved:

```text
no Windows skip
no special-case exit code 1
no "malformed == process failure"
no non-zero-empty-output heuristic
no stderr-text inference
no generic process supervisor
no dependency addition
no package/lock mutation expected
no merge into Applicable Checks
no architecture expansion
```

## Artifact integrity

Reviewer verified:

```text
042 revised explore actual SHA-256
= 650958ed268806c2b3b9c3792538adc8512df0dc28742d0061a4108a4cba1cf8

042 context.revisedExploreSha256
= same
```

The revised Explore is durably present in the supplied payload and is no longer the blocked 040 artifact.

## Proposal constraints

Proposal must:

1. Add the smallest `openspec-thin-integration` spec clarification for observable process-failure precedence.
2. Preserve the existing diagnostic taxonomy.
3. Preserve current production classification behavior unless a smaller already-existing observable fact is independently proven.
4. Replace the non-portable self-SIGKILL universal assertion with deterministic portable boundary coverage.
5. Keep explicit coverage for both:
   - host-observable abnormal process outcome → `openspec-process-failed`;
   - numeric close + malformed required machine output → `malformed-machine-output`.
6. Preserve valid JSON + non-zero → `openspec-formal-outcome`.
7. Do not special-case Windows, exit code 1, empty stdout, or stderr.
8. Do not add dependencies, supervisor/runtime machinery, or merge scope into Applicable Checks.
9. Keep architectureImpact=false unless Proposal introduces an unexpected architectural seam.

## Verdict

```text
approved
```

`RE-041-001` is resolved.

The revised Explore is Proposal-ready.

## Next boundary

```text
propose
```

Reviewer did not create Proposal artifacts, Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
