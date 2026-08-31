# 046 Apply — correct-openspec-observation-process-failure-portability

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `correct-openspec-observation-process-failure-portability`
- Action: `apply`
- Run: `20260831-046-apply`
- Role: `author`
- Input: `20260831-045-review-propose` (`approved → apply`)
- Git checkpoint claim: `32345c2ec951baffde7f56ba7519a1c4c1e77566`

## Skills used

- `openspec-apply-change`
- `implementation-convergence`

## Bounded implementation

Implemented exactly the approved portability correction:

- extracted the already-existing `code === null || signal !== null` close decision into `src/internal/openspec-process-outcome.ts`;
- kept the seam outside `src/domain/index.ts` and added an explicit focused assertion that it is absent from the public domain surface;
- changed `src/domain/openspec-observation.ts` only to call the pure close classifier; externally observable precedence remains unchanged;
- removed the universal self-`SIGKILL` repository contract assertion;
- added deterministic tuple coverage for:
  - `code=null` → `openspec-process-failed`;
  - `signal!=null` → `openspec-process-failed`;
  - numeric close → numeric outcome;
- added a real numeric `process.exit(1)` + empty stdout fixture and proved it remains `malformed-machine-output`;
- retained valid machine JSON + numeric non-zero fixtures and proved they remain `openspec-formal-outcome`;
- completed all 7 approved Apply tasks.

No `process.platform` branch, Windows special case, exit-code heuristic, stdout/stderr heuristic, hidden OS-cause inference, process supervisor/runtime abstraction, dependency, package/lock mutation, Applicable Checks merge, or public API expansion was introduced.

## Behavioral proof

```text
focused openspec-observation-boundary
→ 14 / 14 PASS

code=null / signal=null
→ openspec-process-failed

code=0 / signal=SIGTERM
→ openspec-process-failed

code=1 / signal=null
→ numeric outcome

real child process.exit(1) + empty stdout
→ malformed-machine-output

valid OpenSpec machine JSON + numeric non-zero
→ openspec-formal-outcome

internal classifier public-domain exposure
→ false
```

The current Apply environment is Linux. Reviewer explicitly made Windows host replay optional for Apply acceptance once deterministic portable tuple coverage exists, so no platform-specific skip or synthetic Windows result was created.

## Integration verification

The exact Node runtime was `22.23.2`.

```text
focused boundary tests
→ PASS 14/14

complete domain suite
→ PASS 128/128

typecheck
→ PASS

quality:gate underlying exact checks
  git diff --check HEAD
  prettier --check
  eslint src tests
  forbidden tracked artifact check
→ PASS

quality:dependency-health
→ PASS, 0 violations, 47 modules / 162 dependencies

quality:entropy
→ PASS, 19/19 production modules reachable

build
→ PASS

OpenSpec current Change --strict
→ PASS

OpenSpec --all --strict
→ 14/14 PASS
```

`pnpm` itself initially attempted dependency self-healing/network access because the detached execution snapshot metadata is not exact. That attempt was stopped without repository package mutation. The existing detached execution snapshot was then restored and the exact underlying repository checks were run directly. `package.json` and `pnpm-lock.yaml` remained byte-identical to checkpoint truth.

## Conclusion

```text
PASS
→ review-apply
→ STOP
```

No archive, next-Change activation, Delivery Formal Full Test, Git checkpoint, commit, push or merge was performed.
