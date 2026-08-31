# 013 Revise Apply — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `revise-apply`
- Run: `20260830-013-revise-apply`
- Role: `author`
- Input Run: `20260830-012-review-apply`
- Finding: `RA-012-001`
- Checkpoint claim: `0e6f74617300f13fd8676d8bda8c7904909f7dc4`

## Skill used

```text
.agents/skills/revise-apply
```

Finding classification:

```text
evidence mismatch
```

The approved implementation contract is unchanged.

## Bounded revision

No production source, package truth, OpenSpec Proposal/spec/task, Policy implementation, or architecture contract was revised.

The revision corrects only the Apply verification/environment handoff.

### Corrected environment statement

The prior 011 wording:

```text
Direct runtime import("yaml") resolves to the prepared D02 dependency snapshot.
```

was too broad.

Correct statement:

```text
pre-existing prepared D02 dependency archive as-is
→ contains .pnpm/yaml@2.9.0 package bytes
→ does NOT contain top-level node_modules/yaml direct link
→ direct import("yaml") is NOT reproducible as-is

exact external post-package-mutation environment
→ restore that archive
→ add node_modules/yaml -> .pnpm/yaml@2.9.0/node_modules/yaml
   to reflect exact candidate package.json + pnpm-lock.yaml direct dependency layout
→ direct import("yaml") PASS
```

Detached environment/archive regeneration remains outside this Change lifecycle.

## Exact external verification environment

Machine-readable identity and preparation recipe:

```text
.flowkit/.../20260830-013-revise-apply/verification-environment.json
```

Key identity:

```text
base dependency archive SHA-256:
7e258d8781ce53ef768f01023f47ff4be6c94696167ac1fe1bd92114c98bd801

candidate package.json SHA-256:
ce6a10f122bcb0f592a666ece00acc56a54ae507e7ffdc792b699839964c35fc

candidate pnpm-lock.yaml SHA-256:
3b7b74ced93cce9e7b0e14cc51feeb2354e57b74ba1c611c0a4ffc6b6e8ce8d9

Node:
22.23.2

yaml:
2.9.0

external direct link:
node_modules/yaml
→ .pnpm/yaml@2.9.0/node_modules/yaml

FLOWKIT_HOME for detached acceptance:
/mnt/data/d02-runtime-011
```

## Why direct binaries were used

The prepared D02 dependency artifact is a `node_modules` snapshot, not a pnpm content-addressable store.

In a freshly restored environment, invoking pnpm dependency-status/install paths can attempt to recreate `node_modules` and access unavailable registry/store content. That would mutate/destroy the exact external environment being verified and would reintroduce the detached-environment packaging concern that Reviewer explicitly excluded from this Change.

Therefore verification used the exact package binaries with Node 22.23.2:

```text
node node_modules/prettier/bin/prettier.cjs --check ...
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.build.json
node --import tsx --test tests/unit/domain/*.test.ts
FLOWKIT_HOME=... node --import tsx --test tests/acceptance/*.test.ts
```

OpenSpec validation used the exact managed OpenSpec 1.10.0 runtime.

This changes only the execution wrapper, not the checks or candidate.

## Reproduced verification

In the exact external environment:

```text
direct import("yaml")             PASS
exact package/lock yaml truth     PASS
format check                      PASS
typecheck                         PASS
build                             PASS
domain tests                      124 / 124 PASS
acceptance tests                  4 / 4 PASS
OpenSpec current Change --strict  PASS
OpenSpec --all --strict           11 / 11 PASS
git diff --check                  PASS
Policy implementation diff        EMPTY
non-goal scan                     PASS
```

Candidate package/lock truth is exact:

```text
package.json:
yaml = ^2.9.0

pnpm-lock importer:
specifier = ^2.9.0
version = 2.9.0

packages:
yaml@2.9.0 present

snapshots:
yaml@2.9.0 present
```

No clean offline `node_modules` reconstruction is claimed.

## Production delta

```text
NONE
```

No implementation defect was discovered during reproduction.

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
