# 028 Review Apply — establish-structural-dependency-health-fitness

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-structural-dependency-health-fitness`
- Action: `review-apply`
- Run: `20260830-028-review-apply`
- Role: `reviewer`
- Input Run: `20260830-027-apply`
- Review chain start: `20260830-023-explore`

## Review result

Reviewer independently reviewed the Apply delta against the approved 025 Proposal and 026 Review Propose.

### Proposal fidelity

The implementation matches the approved bounded capability:

```text
dependency-cruiser 18.2.0
→ repository devDependency

dependency-cruiser.config.mjs
→ exactly five explicit severity:error rules

quality:dependency-health
→ independent whole-graph src + tests command

quality:gate
→ unchanged
```

No production source mutation is present.

The exact five frozen rules are implemented:

```text
no-unresolved-imports

no-runtime-circular-dependencies
→ circular:true
→ viaOnly.dependencyTypesNot=["type-only"]

no-production-to-test-spec

no-production-runtime-to-dev-dependency
→ npm-dev
→ dependencyTypesNot=["type-only"]

no-undeclared-external-package
→ npm-no-pkg / npm-unknown
```

The required options are also exact:

```text
doNotFollow.path="node_modules"
tsConfig.fileName="tsconfig.json"
tsPreCompilationDeps="specify"
skipAnalysisNotInRules=true
```

No dependency-cruiser recommended bundle, Knip, orphan/unused ownership, architecture layering, changed-file planning, baseline/cache, waiver, Registry, Planner, Verification surface, or lifecycle state was introduced.

### Package truth

Reviewer independently verified the Author-declared artifact hashes.

The resulting repository package truth contains:

```text
package.json:
dependency-cruiser = ^18.2.0

pnpm-lock.yaml importer:
specifier = ^18.2.0
version = 18.2.0

locked package:
dependency-cruiser@18.2.0
with integrity and resolved dependency closure
```

No Knip package truth was introduced.

Reviewer also invoked exact pnpm 11.22.0 frozen-lockfile validation. pnpm reported:

```text
Lockfile is up to date, resolution step is skipped
```

The subsequent command could not finish only because the sandbox lacks offline supply-chain metadata for unrelated optional platform packages. This is environment metadata unavailability, not a package/lock inconsistency.

Therefore the constrained lock materialization used by Author does not create an Apply blocker.

### Independent implementation verification

Reviewer reconstructed the candidate from the accepted Foundation base plus the already-reviewed D02 correction / Lightweight Gate deltas and this Apply delta.

Execution identity:

```text
Node 22.23.2
pnpm 11.22.0
dependency-cruiser 18.2.0
OpenSpec 1.10.0
```

Because the reusable prepared D02 `node_modules` archive predates the final package mutation, its pnpm dependency-state metadata is not an exact post-mutation installation snapshot. Reviewer therefore treated it only as external execution preparation and did not treat that archive as repository truth.

With the prepared dependency bytes normalized for the already-established direct `yaml` dependency and without changing repository package truth, Reviewer independently reproduced:

```text
dependency-cruiser selected whole graph
→ PASS
→ 0 violations
→ 44 modules / 157 dependencies

quality:gate semantics
→ PASS

typecheck
→ PASS

build
→ PASS

domain tests
→ 124 / 124 PASS

git diff --check HEAD
→ PASS

OpenSpec current Change --strict
→ PASS
```

The stable `quality:dependency-health` script itself is exactly:

```text
depcruise --config dependency-cruiser.config.mjs --output-type err src tests
```

and executes successfully once pnpm's stale prepared-environment dependency preflight is not allowed to reinterpret the old reusable archive as an exact installation.

### Environment ownership note — non-blocking

Reviewer observed:

```text
old reusable prepared D02 node_modules archive
→ contains dependency-cruiser package bytes and direct link
→ but predates final package.json/pnpm-lock dependency-state identity

default pnpm script invocation against that old archive
→ may first attempt dependency-state repair/reinstall
→ sandbox network/offline metadata prevents that repair
```

This is not a repository implementation defect and does not justify moving node_modules archive generation into this Change.

Correct ownership remains:

```text
package.json + pnpm-lock.yaml
→ repository Change truth

exact reusable node_modules regeneration
→ external execution-environment preparation
→ outside this OpenSpec Change lifecycle
```

A later external environment refresh should materialize the final package/lock identity before relying on default pnpm dependency-preflight behavior in detached runs.

## Verdict

```text
approved
```

No blocking implementation, package-truth, contract, or scope defect was found.

## Next boundary

```text
archive
```

Per canonical Foundation Policy:

```text
review-apply approved
→ archive
```

No pseudo `owner-authorized-archive` boundary is introduced.

Reviewer did not archive, activate another Change, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
