# Explore — establish-lightweight-incremental-engineering-gate

## Status

```text
PASS — Proposal-ready
```

This Explore is proof-based and implementation-free. It establishes the minimum repository-local mechanical quality boundary for D02 without turning the Gate into Full Test, Verification, a quality platform, or another lifecycle/control plane.

## 1. Authority and real scope

Owner explicitly activated:

```text
Delivery:
20260829-02-lightweight-incremental-engineering-quality

Change:
establish-lightweight-incremental-engineering-gate

base:
e2c0e4ed21ac872993197aaf17c006c41cb448ba
```

Durable coordination now records:

```text
establish-trusted-change-coordination-state-binding
→ completed

establish-lightweight-incremental-engineering-gate
→ active
→ dependsOn correction completed

Owner activation provenance
→ decision=activate-change
→ exact Delivery + Change
→ scope=[explore]
```

A direct call through the corrected trusted coordination seam returns:

```text
READY_ACTION(explore)
```

So this Explore does not rely on caller-supplied Change state.

## 2. Change goal

Establish one cheap, high-signal, low-friction repository engineering Gate that catches selected obvious mechanical regressions during ordinary bounded development.

Shared D02 rule:

```text
unrelated historical debt
→ does not automatically block a bounded Change

new / changed code
→ must not introduce selected new mechanical debt
```

The Gate is repository-local tooling. Its process exit/result is not a formal Verification verdict, Owner authority, Reviewer verdict, Policy fact, Run registry, or Delivery Full Test result.

## 3. Explicit non-goals

This Change SHALL NOT introduce:

```text
Quality Dashboard
quality score/KPI platform
Gate Registry / Check Registry
Verification Planner / Evidence Platform
changed-file engine / merge-base planner
waiver registry / baseline database
coverage KPI
complexity platform
duplicate-code platform
dependency-cruiser / dependency graph law
Knip / repository entropy ownership
smart test selection
formal Full Test
automatic refactor
automatic dependency upgrade
new Flowkit lifecycle state
new authority surface
```

It SHALL NOT absorb typecheck/build/tests/OpenSpec/Archify simply because some are currently fast.

## 4. Current repository facts

Tooling already declared/prepared:

```text
ESLint             9.39.5
typescript-eslint  8.67.0
@eslint/js         9.39.5
Prettier           3.9.6
TypeScript         5.5.2
```

Current package scripts already provide:

```text
format
format:check
typecheck
build
test:domain
test:acceptance
```

Current repository has:

```text
eslint.config.*
→ none

lint script
→ none
```

Therefore the prior absence of lint execution is a real repository fact rather than a hidden failing check.

## 5. Proof A — whole bounded checks are already interactive

Measured on the current repository / disposable zero-baseline candidate:

```text
git diff --check HEAD              ~0.03s
Prettier bounded check             ~0.93s
ESLint selected whole-source check ~1.25s
forbidden tracked-artifact scan    ~0.00s
```

The selected mechanical surface therefore remains roughly a few seconds rather than becoming a mini Full Test.

Decision impact:

```text
"incremental" does NOT require a changed-file engine
```

Because selected checks can be made zero-baseline and whole bounded-source execution is already cheap, the Change should prefer whole bounded-source checks over diff planning, rename handling, merge-base calculation, or per-file debt baselines.

This proof does NOT authorize typecheck/tests/build to join this Gate; those are correctness checks owned by later D02 work.

## 6. Proof B — Prettier can be reused directly

Current bounded formatting check passes and costs ~0.93s.

No custom formatter or changed-file selector is justified.

The current format surface is narrower than the future Gate because it does not yet include the planned ESLint config / small Gate script surface.

Proposal direction:

```text
Prettier
→ continue whole bounded repository-source/config checking

include:
- src
- tests
- Gate-owned scripts/config
- tsconfig files
- package.json

exclude from this Gate formatting ownership:
- .flowkit durable history
- openspec formal artifacts
- architecture artifacts
- node_modules/dist/coverage/.tmp
```

Do not replace this with `prettier --check .`.

## 7. Proof C — standard ESLint recommended is too broad as-is

A temporary flat config using:

```text
@eslint/js recommended
+
typescript-eslint recommended
```

finds 14 current errors:

```text
5 production unused imports/types/declarations
1 intentional control-character regex
5 acceptance-test explicit-any uses
2 intentionally discarded underscore-prefixed destructured variables
1 unused test import
```

Exact observed total:

```text
14 errors
```

This proves that simply enabling all recommended rules as a hard repository Gate would convert pre-existing, partly intentional debt into an immediate unrelated blocker.

## 8. Proof D — a narrow rule surface leaves only six mechanical cleanup items

A proof-only selected rule surface was tested:

```text
base:
@eslint/js recommended
+ typescript-eslint recommended

production src/**/*.ts:
- retain no-explicit-any
- retain ban-ts-comment
- add max-lines max=650

exact intentional control-regex file:
src/domain/run-result-persistence.ts
- no-control-regex = off

all tests/**/*.ts:
- no-explicit-any = off
- no-unused-vars remains error
- intentionally discarded names matching ^_ are ignored
```

With this tuning, current repository debt reduces from 14 to exactly 6 errors, all `no-unused-vars`:

```text
src/domain/action-package-result-admission.ts
→ 3 unused imports/types

src/domain/openspec-observation.ts
→ 1 unused interface

src/domain/single-action-execution.ts
→ 1 unused type import

tests/unit/domain/foundation-cli-surface.test.ts
→ 1 unused import
```

The two underscore-discard test bindings are intentional and no longer false-positive.

The acceptance `any` uses remain outside the selected test Gate rule while production source remains protected by `no-explicit-any`.

The control-regex exception is exact-file scoped rather than globally disabling the rule.

## 9. Proof E — six selected historical lint items can be removed safely

In a disposable clone only, the six unused artifacts were removed and formatted.

Result:

```text
selected ESLint
→ PASS

typecheck
→ PASS

domain tests
→ 124 / 124 PASS
```

Diff footprint of the proof-only cleanup:

```text
4 files
1 insertion / 9 deletions
```

Decision impact:

```text
use one bounded mechanical cleanup
→ establish zero selected-lint baseline
```

Do NOT create:

```text
eslint baseline file
waiver registry
legacy-debt database
changed-line lint engine
```

The cleanup is allowed because proof shows it is tiny, mechanical, and behavior-preserving; it is not a broad historical-debt campaign.

## 10. Proof F — TS suppression protection is already available from ESLint

Current baseline:

```text
@ts-nocheck      0
@ts-ignore       0
@ts-expect-error 0
```

Temporary counterexample confirms `@typescript-eslint/ban-ts-comment` rejects:

```text
@ts-nocheck
@ts-ignore
@ts-expect-error without required description
```

Observed counterexample:

```text
3 directives
→ 3 lint errors
```

Decision impact:

```text
no custom TS-suppression scanner is needed
```

The selected lint configuration can maintain the zero baseline and permit only intentional described `@ts-expect-error` behavior defined by the upstream rule.

## 11. Proof G — source-size ratchet can reuse ESLint max-lines

Current production `src/**/*.ts` maximums:

```text
588 src/domain/run-result-persistence.ts
438 src/domain/policy-and-next-boundary.ts
430 src/domain/managed-tool-resolution.ts
401 src/domain/openspec-observation.ts
365 src/cli/foundation-cli.ts
```

Current counts:

```text
files >600 lines = 0
files >650 lines = 0
max headroom to 650 = 62 lines
```

A proof-only ESLint `max-lines` rule with:

```text
max = 650
skipBlankLines = false
skipComments = false
```

produced:

```text
650 physical/source lines
→ PASS

651 lines
→ FAIL
```

Decision impact:

```text
production source-size hard Gate
→ ESLint max-lines max=650 on src/**/*.ts

~600 lines
→ maintainability guidance target only

>650
→ hard Gate failure
```

No custom source-size scanner is justified.

## 12. Proof H — git diff --check HEAD covers staged tracked whitespace regression

In a disposable repository, a staged file containing trailing whitespace produced:

```text
git diff --check HEAD
→ non-zero
→ exact trailing-whitespace diagnostic
```

Using `HEAD` keeps staged and unstaged tracked modifications in the comparison against the current checkpoint.

Untracked source/config files remain covered by whole bounded Prettier/ESLint once they exist on disk; the Gate does not need a custom untracked-file diff engine.

Decision impact:

```text
reuse git diff --check HEAD
```

Do not write a custom whitespace/line-ending parser.

## 13. Proof I — forbidden tracked artifacts need one tiny repository-specific check

Current `.gitignore` protects ordinary additions of:

```text
node_modules/
dist/
coverage/
.tmp/
/tools/
/runtime/
*.node-modules.tar.gz
*.pnpm-store.tar.gz
```

Current tracked violations:

```text
0
```

But `.gitignore` can be bypassed by force-add.

Disposable proof:

```text
git add -f runtime/probe.txt
↓
tracked-artifact matcher detects runtime/probe.txt
```

The matcher must preserve legal tracked paths such as:

```text
config/tools/toolchain.lock.json
skills/tools/archify/SKILL.md
skills/tools/openspec/SKILL.md
```

Therefore the minimum matcher semantics are:

```text
forbid any path segment:
node_modules/
dist/
coverage/
.tmp/

forbid repository-root only:
tools/
runtime/

forbid matching archive suffix anywhere:
*.node-modules.tar.gz
*.pnpm-store.tar.gz
```

This is the only selected Gate concern that is not already naturally owned by Git/Prettier/ESLint.

Proposal may implement it as one very small repository-local script/check. It must not grow into a generic path mutation policy.

## 14. Proof J — correctness checks stay outside this Gate

Current typecheck is also fast, but cost alone does not determine ownership.

D02 already has a separate planned Change:

```text
establish-explicit-applicable-check-execution
```

for exact execution of formally required correctness checks.

Likewise:

```text
dependency-cruiser
→ establish-structural-dependency-health-fitness

Knip
→ establish-high-confidence-repository-entropy-hygiene
```

Therefore Lightweight Gate SHALL NOT include:

```text
typecheck
build
domain tests
acceptance tests
OpenSpec validate
Archify
dependency-cruiser
Knip
Formal Full Test
```

This preserves semantic ownership even when individual commands happen to be cheap today.

## 15. Minimum Proposal direction

Proposal should establish one repository-local capability, tentatively:

```text
lightweight-engineering-gate
```

Minimum implementation shape:

```text
1. eslint.config.mjs
   - @eslint/js recommended
   - typescript-eslint recommended
   - production max-lines 650
   - exact intentional control-regex exception
   - test no-explicit-any override
   - underscore intentional-discard handling
   - ban-ts-comment retained

2. one bounded cleanup
   - remove the six proven unused artifacts

3. one tiny forbidden-tracked-artifact check
   - exact path semantics from Proof I

4. one stable package entrypoint
   - Gate composes:
     git diff --check HEAD
     bounded Prettier
     selected ESLint
     forbidden tracked-artifact check
```

The exact script/entrypoint filename is a design detail, but there MUST be one obvious stable command for humans/agents to invoke.

The command SHALL:

```text
exit 0
→ selected mechanical Gate passes

non-zero
→ at least one selected mechanical rule fails
```

It SHALL NOT persist a formal Verification verdict or create a new evidence/control plane.

## 16. Architecture impact

D02 Planned Architecture already contains:

```text
Lightweight Engineering Gate
→ cheap / high-signal / interactive mechanical boundary
```

The proof does not discover a new architecture component or new dependency edge.

Therefore Explore requires no Planned Architecture expansion.

Actual architecture materialization remains a later Delivery/Change finalization concern after implementation truth exists.

## 17. OpenSpec impact

Expected formal contract surface:

```text
new capability:
lightweight-engineering-gate
```

No current proof requires modification of Foundation Policy, authority, Run persistence, Action lifecycle, OpenSpec integration, or Verification authority specs.

If Proposal finds itself changing those capabilities, it has exceeded the proven boundary and should stop/re-scope.

## 18. Remaining limitations / deferred concerns

Explicitly deferred:

```text
changed-file optimization
per-rule waiver system
per-file debt baseline
complexity metrics
coverage
security audit platform
dependency structure
repository dead-code/entropy
test planning
formal verification evidence persistence
```

These are not blockers for the real D02 Gate use case.

## 19. Explore verdict

```text
PASS
```

Proposal-ready invariants:

```text
- Gate remains a few-second interactive mechanical boundary.
- Whole bounded-source execution is acceptable; no changed-file engine required.
- Selected ESLint baseline can be made zero with six proven mechanical cleanup items.
- TS suppression protection reuses ban-ts-comment; no custom scanner.
- production source-size hard limit reuses ESLint max-lines=650; >600 remains guidance only.
- git diff --check HEAD owns tracked whitespace regression.
- forbidden tracked artifacts use one narrow repository-specific matcher, not a path-policy platform.
- typecheck/build/tests/OpenSpec/Archify/dependency-cruiser/Knip/Full Test remain outside this Change.
- no new lifecycle, authority, Verification, registry, evidence platform, or quality dashboard is introduced.
```
