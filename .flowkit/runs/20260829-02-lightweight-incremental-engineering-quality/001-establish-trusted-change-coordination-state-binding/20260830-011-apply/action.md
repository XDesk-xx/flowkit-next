# 011 Apply — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `apply`
- Run: `20260830-011-apply`
- Role: `author`
- Input Run: `20260830-010-review-propose`
- Review chain start: `20260830-001-explore`
- Checkpoint claim: `0e6f74617300f13fd8676d8bda8c7904909f7dc4`

## Skills used

```text
.agents/skills/openspec-apply-change
.agents/skills/implementation-convergence
```

## Applied bounded correction

Implemented only the Reviewer-approved trusted coordination-state binding correction:

```text
exact repository root
+ exact Delivery ID
+ exact Change ID
↓
repository-owned Delivery manifest
+ exact activate-change Owner provenance
+ active-only direct dependsOn completion
↓
trusted read-only coordination resolver
↓
canonical ChangeState
↓
status + next
↓
pure Policy
```

### Package truth

- Added direct production dependency `yaml@^2.9.0`.
- Updated `pnpm-lock.yaml` with direct importer/package/snapshot truth.
- Frozen lock consistency verified with `pnpm install --frozen-lockfile --offline --lockfile-only --ignore-scripts --trust-lockfile`.
- Direct runtime `import("yaml")` resolves to the prepared D02 dependency snapshot and exposes `parse`.
- No managed OpenSpec copy or undeclared transitive YAML dependency is used.

Environment boundary:

```text
clean offline node_modules reconstruction
→ NOT claimed
→ provided D02 archive is a prepared node_modules snapshot, not a pnpm content-addressable store
→ detached environment/store packaging was explicitly removed from this Change completion by Reviewer
```

This environment limitation is not represented as candidate package/lock failure.

### Trusted coordination resolver

Added:

```text
src/cli/trusted-change-coordination.ts
```

The resolver:

- reads the exact repository-owned Delivery manifest;
- binds exact Delivery + Change identity;
- fails closed on missing/unreadable/invalid YAML and malformed owned coordination fields;
- treats non-active durable states as reportable durable facts without historical activation upgrading them;
- for durable `active`, requires exact `activate-change` provenance with exact Delivery/Change and exact `scope=["explore"]`;
- for durable `active`, requires each direct `dependsOn` target to exist exactly once and be `completed`;
- does not calculate next Action or perform Policy work.

### CLI convergence

- Removed authority-bearing caller `changeState` from shared request parsing/types.
- Legacy request payloads containing `changeState` fail closed as unsupported input.
- `status` resolves and reports only the trusted canonical state.
- `next` uses the same trusted resolver before Policy composition.
- Resolver failures return deterministic non-zero `coordination-resolution-failed` machine errors and are not converted into Policy `BLOCKED`.

### Policy preservation

```text
git diff -- src/domain/policy-and-next-boundary.ts
→ EMPTY
```

Policy remains pure, deterministic, repository-IO free, and provenance-resolution free.
Existing Policy-owned exact `revise-action` Owner correction eligibility and separate checkpoint authority remain unchanged.

### D02 dependency proof

Focused tests prove:

```text
corrective Change active
+ normal quality Change planned
→ planned remains reportable

normal quality Change active
+ corrective dependency not completed
→ fail closed

corrective dependency completed
+ normal quality Change active
+ missing/wrong own activation provenance
→ fail closed

corrective dependency completed
+ exact own activate-change scope=["explore"]
→ active becomes lifecycle-enterable
```

## Verification

```text
format check: PASS
typecheck: PASS
build: PASS
domain tests: 124 / 124 PASS
acceptance tests: 4 / 4 PASS
OpenSpec current Change --strict: PASS
OpenSpec --all --strict: 11 / 11 PASS
git diff --check: PASS
frozen lock consistency: PASS
direct yaml runtime resolution: PASS
Policy implementation diff: EMPTY
non-goal scan: PASS
OpenSpec Apply tasks: 14 / 14 complete; state=all_done
```

Formal Delivery Verification was not performed and no `verificationVerdict` is claimed.

## Non-goals confirmed absent

No:

```text
second coordination store
coordination registry
reconciliation engine
background sync
automatic Change activation
automatic Owner authorization
Policy filesystem IO
generic authority subsystem
internal V1/V2 contract family
```

## Result

```text
PASS
```

Next boundary:

```text
review-apply
```

## STOP

Do not archive or self-review in this action.
