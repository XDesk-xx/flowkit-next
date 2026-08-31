# Explore — correct-openspec-observation-process-failure-portability

## Status

```text
PASS / Proposal-ready for independent re-review
```

This revised Explore confirms the Windows portability defect, captures the exact
observable Windows child-process outcome for the current fixture from the exact
Node 22.23.2 runtime implementation plus the already-reproduced Windows result,
and selects the bounded correction branch required by Reviewer `RE-041-001`.

No Proposal or implementation artifact is created here.

## 1. Owner goal

Verify the local Windows `test:domain` failure before introducing a corrective
Change. If real, keep one bounded corrective Change separate from
`establish-explicit-applicable-check-execution` and correct only the existing
OpenSpec thin-observation process/result boundary.

## 2. Current canonical contract

The accepted `openspec-thin-integration` contract currently distinguishes:

```text
valid machine JSON + non-zero exit
→ openspec-formal-outcome

spawn/process cannot start or complete
→ openspec-process-failed

required stdout is not valid JSON
→ malformed-machine-output
```

It also currently says required JSON is parsed before a numeric non-zero exit is
interpreted as a formal OpenSpec outcome.

That contract is sufficient on hosts whose process API exposes abnormal
termination as a signal/no-code outcome, but the Windows proof below shows an
observable overlap between the abstract "abnormal completion" scenario and the
"numeric exit + invalid stdout" scenario.

## 3. Repository provenance proof

The failing boundary test and production observation implementation predate the
current Repository Entropy Hygiene Change.

```text
tests/unit/domain/openspec-observation-boundary.test.ts
→ introduced by 698538c0588dab9737e91bff77595d591258880d
  establish-openspec-thin-integration

32345c2 diff from 45bf835
→ does not modify src/domain/openspec-observation.ts
→ does not modify openspec-observation boundary tests
```

Therefore the Windows failure is not a regression introduced by 039 Entropy
Hygiene.

## 4. Existing Flowkit implementation

The current invocation seam uses Node `spawn()` and classifies the child `close`
outcome as:

```text
code === null OR signal !== null
→ openspec-process-failed

otherwise
→ parse required stdout JSON
→ then classify a valid non-zero machine outcome
```

So for a completed child with:

```text
code = numeric
signal = null
stdout = invalid/empty
```

current behavior is intentionally:

```text
malformed-machine-output
```

before non-zero formal-outcome handling.

## 5. Linux exact comparison proof

Exact comparison environment:

```text
Linux x64
Node 22.23.2
```

The focused boundary suite passes:

```text
openspec-observation-boundary.test.ts
→ 10/10 PASS
```

For the current fixture body:

```js
process.kill(process.pid, "SIGKILL");
```

Linux exposes:

```json
{
  "code": null,
  "signal": "SIGKILL",
  "stdout": ""
}
```

so the current implementation correctly returns:

```text
openspec-process-failed
```

Linux is comparison evidence only; it is not used as a substitute for the
Windows proof.

## 6. Windows real execution proof

The local Windows checkpoint verification on exact repository base `32345c2`
and Node `22.23.2` reproducibly reports:

```text
test:domain
→ 123/124

isolated failing test:
abnormal child termination is a process failure

expected:
openspec-process-failed

actual:
malformed-machine-output
```

The isolated boundary test reproduces independently, ruling out whole-suite
concurrency, shared FLOWKIT_HOME mutation, stale node_modules, and 039
Repository Entropy Hygiene mutation as explanations.

The actual `malformed-machine-output` result also proves that for this execution:

```text
child `error` did not become the winning observation
child `close` did fire
close was not observed as code=null or signal!=null
stdout was not valid JSON
```

## 7. Exact Windows raw outcome proof — Node 22.23.2

Reviewer `RE-041-001` requested the exact Windows `{code, signal, stdout}` for
the current fixture. The exact Node 22.23.2 runtime source resolves that tuple.

### 7.1 Fixture source identity

Repository test:

```text
tests/unit/domain/openspec-observation-boundary.test.ts
```

Exact fixture body:

```js
process.kill(process.pid, "SIGKILL");
```

The fixture writes nothing to stdout before terminating.

### 7.2 Exact Windows kill path

Node 22.23.2 bundles the Windows libuv process implementation in:

```text
deps/uv/src/win/process.c
```

The exact runtime implementation proves:

```text
process.kill(process.pid, SIGKILL)
↓
uv_kill(pid, SIGKILL)
↓
uv__kill(process_handle, SIGKILL)
↓
TerminateProcess(process_handle, 1)
```

The exact source states that killed Windows processes normally return exit code
`1`.

### 7.3 Why signal is null for this self-kill fixture

The parent-side libuv process handle initializes:

```text
exit_signal = 0
```

and the Windows process exit callback reports:

```text
GetExitCodeProcess(...)
+
handle->exit_signal
```

Only parent-side:

```text
uv_process_kill(uv_process_t*, signum)
```

sets:

```text
process->exit_signal = signum
```

But the current fixture does **not** call the parent `ChildProcess.kill()` /
`uv_process_kill()` path. The child calls `process.kill(process.pid, ...)`, which
uses `uv_kill(pid, signum)` inside the child process. That forcefully terminates
the child but cannot mutate the parent's tracked child handle `exit_signal`.

Therefore the exact parent-observable Windows outcome for this fixture is:

```json
{
  "code": 1,
  "signal": null,
  "stdout": ""
}
```

This is also exactly the tuple shape required for the already-observed
`malformed-machine-output` result under current Flowkit code.

### 7.4 Event facts

For the existing Flowkit observation seam:

```text
error event
→ did not win / otherwise Flowkit would already return openspec-process-failed

close event
→ fired with code=1, signal=null

stdout
→ empty

exit event
→ not instrumented by Flowkit and not required to select the correction branch
```

No new process-observation platform is needed.

## 8. Branch selection

```text
Branch B — observable invocation/classification contract ambiguity
```

is selected.

Reason:

The Windows fixture is a genuine forceful process termination: Node/libuv calls
Windows `TerminateProcess`. It is therefore not truthful to dismiss it as merely
"not abnormal".

However Windows exposes that genuine abrupt termination to the parent as:

```text
code=1
signal=null
stdout=""
```

which is observationally identical, at the current Flowkit seam, to an ordinary
numeric non-zero child exit that failed to provide required JSON.

Therefore Flowkit cannot portably infer the hidden OS-level cause from this tuple
without adding an unproven heuristic such as:

```text
win32 + code=1 + empty stdout
→ process failure
```

That heuristic would collapse legitimate malformed/non-machine outcomes and is
rejected.

## 9. Smallest portable classification seam

The only reliable portable facts available at the current Node child-process
boundary are:

```text
spawn/error outcome
close code
close signal
stdout bytes
```

The smallest deterministic ordering is therefore expressed in terms of those
**observable facts**, not an unknowable hidden cause:

```text
1. spawn/error or host-reported abnormal close
   (code=null OR signal!=null)
   → openspec-process-failed

2. otherwise, numeric close code exists
   → required stdout must first be valid machine JSON

3. numeric close + invalid required JSON
   → malformed-machine-output

4. numeric non-zero close + valid formal machine JSON
   → openspec-formal-outcome

5. numeric zero close + valid expected machine JSON
   → normal observation validation continues
```

Current production code already implements this observable precedence.

The Windows self-SIGKILL fixture is the evidence that the prior abstract wording
"process cannot ... complete" can describe an OS-level event whose hidden cause
is not observable as a process-failure tuple on Windows.

## 10. Spec-delta decision

```text
specDelta = minimal clarification required
```

The canonical taxonomy itself remains unchanged:

```text
openspec-process-failed
malformed-machine-output
invalid-machine-shape
openspec-formal-outcome
root mismatch
```

No new diagnostic kind is required.

The required clarification is only precedence/observability:

> `process-failure` is selected when the managed invocation reports spawn/error
> or an abnormal close through the host child-process outcome (`code=null` or a
> non-null `signal`). When the host reports a numeric exit code, required machine
> stdout remains authoritative for distinguishing malformed output from a valid
> formal non-zero outcome. Flowkit MUST NOT infer an unobservable Windows
> termination cause solely from a numeric exit code.

This resolves the current overlap between:

```text
process cannot complete
```

and:

```text
stdout is not required valid JSON
```

without broadening the runtime or weakening fail-closed behavior.

## 11. Proposal correction direction

Proposal should remain bounded to the existing `openspec-thin-integration`
capability and should prefer:

```text
minimal canonical spec clarification
+
portable boundary-test correction
```

Production classification behavior SHOULD remain unchanged unless Proposal proof
finds a smaller observable fact already available in the existing Node API that
can distinguish the Windows tuple without heuristics.

The current proof does not identify such a fact.

The old test assertion:

```text
self process.kill(SIGKILL)
→ always openspec-process-failed on every host
```

MUST NOT remain as a universal portability assertion because exact Node 22.23.2
Windows semantics disprove it.

Proposal must still preserve real process-failure coverage through a deterministic
observable process-outcome test seam; it must not simply delete all
`openspec-process-failed` coverage.

## 12. Preserved non-goals

Do not:

```text
skip Windows
accept malformed-machine-output as equivalent to process-failure
classify every non-zero + empty/invalid stdout as process-failure
special-case Windows exit code 1
parse stderr/free text to infer process death
add a generic process supervisor
add dependencies
merge this Change into establish-explicit-applicable-check-execution
redesign OpenSpec lifecycle semantics
```

## 13. Scope boundary

Selected Change remains:

```text
correct-openspec-observation-process-failure-portability
```

Expected impact remains bounded:

```text
openspec-thin-integration spec clarification
focused observation boundary tests
possibly a tiny internal testability seam only if required
architectureImpact = false
```

No package/lockfile change is expected.

## 14. Proposal readiness

```text
Defect existence: PASS
Repository provenance: PASS
Windows exact observable tuple: PASS
Linux comparison: PASS
Branch selection: Branch B
Portable observable precedence: PASS
Spec-delta decision: minimal clarification required
Scope/non-goals: PASS
Proposal readiness: READY FOR REVIEWER RE-REVIEW
```

No Proposal or Apply mutation has been performed.
