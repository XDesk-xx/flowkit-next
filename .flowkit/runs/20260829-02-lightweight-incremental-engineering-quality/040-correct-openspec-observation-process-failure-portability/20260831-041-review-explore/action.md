# 041 Review Explore — correct-openspec-observation-process-failure-portability

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `correct-openspec-observation-process-failure-portability`
- Action: `review-explore`
- Run: `20260831-041-review-explore`
- Role: `reviewer`
- Input Run: `20260831-040-explore`
- Review chain start: `20260831-040-explore`

## Independent review result

Reviewer reviewed the Explore against the existing accepted `openspec-thin-integration` contract and the supplied D02 coordination facts.

### Defect existence — CONFIRMED

The current canonical contract distinguishes:

```text
valid machine JSON + non-zero exit
→ formal OpenSpec outcome

spawn/process cannot start or complete
→ openspec-process-failed

required machine JSON malformed
→ malformed-machine-output
```

The existing implementation currently classifies the child `close` event as:

```text
code === null OR signal !== null
→ process failure

otherwise
→ parse stdout
```

The accepted boundary test uses:

```text
process.kill(process.pid, "SIGKILL")
```

and expects:

```text
openspec-process-failed
```

The supplied Windows proof shows:

```text
Node 22.23.2
focused boundary test
→ reproducible failure

expected:
openspec-process-failed

actual:
malformed-machine-output
```

while the Linux exact test passes and Linux raw probe yields:

```text
code=null
signal=SIGKILL
stdout=""
```

This is sufficient to confirm a real supported-platform mismatch at the existing observation boundary.

The Explore also correctly proves this is not introduced by Repository Entropy Hygiene and keeps the correction separate from `establish-explicit-applicable-check-execution`.

### External runtime documentation check

Reviewer independently checked Node 22.23.2 child-process documentation.

The documented `close(code, signal)` contract remains:

```text
normal exit
→ code non-null, signal null

signal termination
→ code null, signal non-null
```

and Windows forceful termination via supported signal names is documented.

That documentation supports the expectation behind the existing test, but it does not replace the missing exact raw Windows outcome for this particular self-termination fixture.

## Blocking finding

### RE-041-001 — decisive Windows raw process outcome is still missing

The Explore itself records:

```text
windowsRawCloseTuplePersisted = false
proposalFixBranch = UNKNOWN
proposalAllowed = false
```

Reviewer agrees this is a real Proposal blocker.

Before Proposal, Author must capture the exact Windows outcome for the exact currently failing fixture:

```text
code
signal
stdout
```

Prefer also recording:

```text
platform
Node exact version
fixture source identity/hash
whether child `error`, `exit`, and `close` events fired
```

only as proof facts; do not create a new process-observation platform.

The proof must then select exactly one bounded correction branch.

### Branch A — test fixture portability correction

Select this only if the raw Windows evidence shows that the current self-`process.kill()` fixture does not reliably represent the managed-process abnormal-termination condition that the existing contract intends to test.

Then:

```text
production classification semantics
→ unchanged

canonical spec
→ unchanged

test fixture
→ replaced by a cross-platform abnormal-process fixture
```

The corrected fixture must still prove on both Windows and Linux:

```text
abnormal managed child termination
→ openspec-process-failed
```

No Windows skip is allowed.

### Branch B — invocation/classification correction

Select this only if the raw Windows evidence demonstrates that a genuine abnormal child-process termination reaches the current seam as an outcome the implementation currently routes to malformed-machine-output.

Then the revised Explore must prove the smallest portable classification seam.

It MUST preserve:

```text
valid JSON + non-zero
→ openspec-formal-outcome

genuinely malformed required JSON
→ malformed-machine-output

spawn/start/abnormal-completion failure
→ openspec-process-failed
```

and MUST NOT collapse all:

```text
non-zero + empty/invalid stdout
```

into process failure without proof.

## Canonical-spec boundary that must be resolved with the same proof

The current spec contains both:

```text
process cannot start or complete
→ process-failure
```

and:

```text
required stdout is not valid JSON
→ malformed-machine-output
```

If the Windows raw tuple is an ordinary-looking non-zero exit:

```text
code != null
signal = null
stdout invalid/empty
```

then the revised Explore must explicitly answer whether this is:

```text
A. a non-portable fixture that should not represent abnormal process failure

or

B. a real production outcome for abnormal completion that exposes an
   ambiguous/underspecified precedence in the canonical contract
```

Do not assume `specDelta = none` merely because Linux previously exposed a signal.

If Branch A is proven, no spec delta is expected.

If Branch B reveals that supported-platform abnormal termination cannot be distinguished under the current normative wording without defining precedence or additional observable facts, Proposal must include the smallest necessary `openspec-thin-integration` spec clarification.

This is not authorization to redesign the taxonomy; it is only a requirement not to hide a real contract ambiguity behind implementation code.

## Findings that are accepted and must not be reopened

Reviewer accepts:

```text
defect existence
→ proven

separation from Entropy Hygiene
→ proven

separation from Applicable Checks
→ correct

no Windows skip
→ correct

no "malformed == process failure" equivalence
→ correct

no generic process supervisor
→ correct

no new dependency
→ correct

architectureImpact=false
→ reasonable for the bounded correction
```

## Required revise-explore

Revise only the missing proof branch:

1. Capture exact Windows raw outcome for the current failing fixture.
2. Record enough event facts to identify how Node 22.23.2 reports that termination.
3. Re-run the same proof on Linux only as a comparison, not as substitute Windows evidence.
4. Select Branch A or Branch B.
5. Explicitly decide whether `specDelta` remains `none` or a minimal clarification is required.
6. Preserve all already accepted scope/non-goals.

Do not create Proposal or implementation artifacts in revise-explore.

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-explore
```

Reviewer did not mutate Author Explore, create Proposal artifacts, Apply, mutate production/package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
