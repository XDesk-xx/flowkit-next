## Context

See `proposal.md` and `explore.md`. Current `status` / `next` both receive `CommonRunRequest.changeState`; `status` reports it and `next` passes it directly to pure Policy. The repository already persists D02 coordination truth and Owner activation decisions in `openspec/delivery-groups/<delivery-id>.yaml`, but no production code reads that durable source. The accepted Policy is already pure and must remain repository-IO free.

The correction spans request parsing, CLI composition, durable Delivery-manifest reading, authority provenance recognition, direct dependency validation, tests, and package truth. The repository currently has no directly declared production YAML parser dependency.

## Goals / Non-Goals

**Goals:**

- Derive canonical `ChangeState` from the exact repository-owned Delivery manifest before `status` reporting or `next` Policy composition.
- Bind durable `active` to exact Owner `activate-change` provenance (`scope=["explore"]`) and completed direct hard dependencies.
- Remove caller authority over `changeState` rather than maintain a second expected/current state source.
- Share one trusted resolution seam between `status` and `next`.
- Preserve Policy purity and existing Policy-owned `revise-action` correction eligibility.
- Reuse existing Delivery coordination truth and Owner decision facts with a small fail-closed implementation.

**Non-Goals:**

- No new coordination store, registry, background reconciliation, activation service, state machine, or generic Owner-authority engine.
- No changes to the four Change-state literals or normal Policy transition matrix.
- No redesign of checkpoint authorization, current-Run authority, OpenSpec observation, `doctor`, Git authority, or D02 engineering-quality capabilities.
- No compatibility V2 request family or long-lived caller `changeState` assertion mode.

## Decisions

### 1. Use the existing Delivery manifest as the canonical current coordination source

The resolver will read the exact Delivery manifest under the requested repository root for the exact Delivery ID and validate the subset required for coordination legality:

```text
delivery id
changes[].id
changes[].state
changes[].dependsOn
ownerDecisions[] activation provenance
```

The resolver will not introduce another state file. Extra manifest fields owned by Delivery planning/finalization remain outside this parser's semantic responsibility.

**Why:** D01/D02 already materialize Change state, dependencies, and Owner decisions durably in this file. Reusing it closes the binding gap without a new control plane.

**Alternative rejected:** derive state from OpenSpec active changes. OpenSpec owns Change planning/artifact truth, not Delivery coordination state or Owner activation authority.

**Alternative rejected:** create a JSON mirror solely for runtime consumption. That would create a second current-state truth and reconciliation problem.

### 2. Add one read-only trusted coordination resolver before Policy

Introduce a small resolver seam, expected to live with the existing Foundation/domain integration utilities and expose a function conceptually equivalent to:

```ts
resolveTrustedChangeCoordination({
  repositoryRoot,
  deliveryId,
  changeId,
}): Promise<ChangeState>
```

The exact exported type/function name may follow repository naming conventions during Apply, but its responsibility is fixed:

1. canonicalize/validate repository root and exact Delivery/Change identity;
2. read the exact Delivery manifest;
3. find exactly one Change entry;
4. validate its closed `ChangeState`;
5. validate every direct dependency reference and require each target `completed` before an `active` Change can be lifecycle-enterable;
6. if current state is `active`, require matching activation provenance;
7. return the trusted canonical state without mutation.

The resolver performs no next-Action calculation.

**Why:** this is the narrowest seam that can transform repository coordination truth into canonical Policy facts while keeping Policy pure.

### 3. Activation provenance is boundary-specific and exact

For durable `active`, activation provenance is eligible only when at least one durable Owner decision is a structural-valid `OwnerAuthorityFact` with:

```text
decision = activate-change
deliveryId = exact requested Delivery
changeId = exact requested Change
scope = ["explore"] exactly
```

Other structural-valid scopes are not activation-eligible. Historical activation facts never upgrade `planned`, `completed`, or `cancelled` to `active`.

The resolver recognizes only this activation boundary. It does not recognize `revise-action`, checkpoint authorization, or other Owner decisions.

**Why:** Explore/Reviewer proof established that structural wire validity is separate from boundary eligibility and that current normal activation converged on exact `scope=["explore"]`.

### 4. Direct hard dependencies are validated only for lifecycle-enterable active

For an `active` Change, each direct `dependsOn` ID must resolve to exactly one Change entry in the same Delivery and its current state must be `completed`. Missing, duplicated, malformed, or non-completed direct dependency fails closed.

The resolver does not recursively build a dependency graph, calculate order, or add soft/optional semantics.

**Why:** D02 proof established a real activation dependency and the existing roadmap already defines direct `dependsOn` semantics. A general graph engine would exceed the proven need.

### 5. Remove `changeState` from caller request contracts

`CommonRunRequest.changeState` will be removed. `status` and `next` callers continue to provide exact repository / Delivery / Change / Change-start / Run context, but not authoritative Change state.

`status` resolves and reports the canonical state. `next` resolves the same state and passes it to Policy.

**Why:** the repository is private and proof found no independently versioned external consumer requiring compatibility. Removing the field eliminates dual truth and makes caller self-upgrade impossible by construction.

**Alternative rejected:** retain `changeState` as an assertion. It is technically possible but adds a second request value with no current compatibility need and creates additional mismatch behavior to maintain.

### 6. Policy remains unchanged in architecture and only receives clarified canonical input

`evaluatePolicyAndNextBoundary(...)` remains synchronous, pure, deterministic, and IO-free. No manifest/provenance/dependency parsing moves into Policy. Existing Policy-specific `revise-action` authority eligibility remains exactly where it is.

Implementation changes to Policy should be limited to types/comments/tests only if needed to make the clarified contract explicit; the normal legality matrix should not be rewritten.

**Why:** Policy already correctly calculates legal boundaries from canonical facts. The defect is provenance before Policy, not Policy logic.

### 7. Use a directly declared `yaml` runtime dependency

Add `yaml` as a normal production dependency, targeting the already-prepared compatible `2.9.x` line (expected declaration `^2.9.0`). Parse the manifest with the library's document API and reject parser/document errors before semantic validation.

Do not import a transitive copy, reach into managed OpenSpec runtime dependencies, or hand-roll a general YAML parser.

**Why:** the durable source is YAML; production currently lacks a declared parser. A direct dependency is smaller and more truthful than creating a mirror store or parser subset.

This package/lock change does not make detached Linux `node_modules` archive regeneration part of this OpenSpec Change. After the accepted package/lock identity is finalized, external execution-environment preparation may regenerate the detached environment artifact before a later detached run relies on that dependency graph; that handoff is non-blocking for this Change lifecycle.

### 8. Keep manifest semantic validation focused and fail-closed

The resolver will validate the coordination subset it owns rather than attempt to become the full Delivery-manifest schema authority. It must reject ambiguity in owned facts, including:

```text
missing/unreadable manifest
YAML parse/document errors
top-level Delivery id mismatch
missing or duplicate exact Change
invalid Change state / dependsOn shape
duplicate Change ids that affect exact lookup
for durable `active` only: unknown/missing/duplicate direct dependency target
for durable `active` only: direct dependency not completed
active without eligible exact Owner activation provenance
```

Owner decision entries unrelated to activation are not reinterpreted. Matching activation candidates must pass the existing structural `OwnerAuthorityFact` validator before eligibility checks.

### 9. Use a small closed resolver diagnostic family mapped to CLI failure

The resolver should throw one typed error family with a compact closed reason catalog sufficient to distinguish invalid input/root, manifest read/parse/shape, exact identity lookup, dependency, and activation-provenance failures. `status` / `next` map this to a machine-distinguishable non-zero CLI failure.

Do not turn resolver failures into Policy `BLOCKED` results because Policy was never given canonical facts.

**Why:** malformed/untrusted coordination input is an integration/composition failure, not a legal decision over valid canonical facts.

## Risks / Trade-offs

- **[Risk] Existing historical Delivery manifests contain bootstrap-era Owner decision shapes that are not full `OwnerAuthorityFact`.** → Only the matching `activate-change` provenance needed for an `active` exact Change is structurally validated/eligible; unrelated historical entries are not promoted to authority.
- **[Risk] A YAML parser can accept ambiguous constructs or duplicate keys differently across versions.** → Use the document API, reject parser/document errors, and add fixture tests for malformed/duplicate owned coordination facts; pin the dependency through `pnpm-lock.yaml`.
- **[Risk] Removing `changeState` is a request-shape breaking change for current tests/tools.** → Update all in-repository callers atomically; no external compatibility adapter is created because no external contract was proven.
- **[Risk] Dependency validation could accidentally grow into a graph subsystem.** → Validate only direct `dependsOn` targets of the exact requested Change and only the completed-state prerequisite needed for active legality.
- **[Risk] Resolver logic could become a generic Owner-authority evaluator.** → Recognize only exact `activate-change` provenance for coordination-state derivation; preserve `revise-action` in Policy and checkpoint authorization in its existing evaluator.

## Migration Plan

1. Add the direct YAML runtime dependency and lockfile truth.
2. Add the focused trusted coordination resolver plus unit fixtures/tests.
3. Remove `changeState` from `status` / `next` request types/parsing and update in-repository request fixtures.
4. Wire both `status` and `next` through the resolver; keep current-Run and OpenSpec observation behavior otherwise unchanged.
5. Add/adjust Policy tests only to prove purity/canonical-input ownership, without changing the normal transition matrix.
6. Run typecheck, formatting, domain/acceptance tests, build, and OpenSpec strict validation.
Rollback is the normal Git/OpenSpec rollback before archive; there is no data migration or background state to unwind.
