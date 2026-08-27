# Explore — establish-openspec-thin-integration

## 1. Explore outcome

**PASS**

This Change has a bounded Proposal-ready problem:

> Add a read-only, fail-closed Flowkit integration seam that consumes the already validated managed OpenSpec 1.10.0 entrypoint and observes OpenSpec's own machine-readable Change facts without scanning OpenSpec files, copying its lifecycle/state machine, driving OpenSpec mutations, or depending on repository-local Agent Skills.

The current minimum product need is **formal observation**, not OpenSpec workflow ownership.

---

## 2. Owner-stated boundary

Current development remains in the bootstrap phase:

```text
.agents/skills
→ development-time instructions for Author / Reviewer AI
→ continue to drive the current OpenSpec explore/propose/apply/archive workflow

Flowkit runtime
→ product being developed
→ MUST NOT read or execute .agents Skills
→ MUST NOT start self-hosting before the first complete version exists
```

Therefore this Change does **not** migrate OpenSpec Skills into Flowkit and does **not** make Flowkit manage its own current Delivery.

---

## 3. Existing durable facts

### 3.1 OpenSpec remains formal Change authority

`openspec/config.yaml` states that OpenSpec is the formal authority for Change proposal / design / specs / tasks / archive, while Delivery 01 remains externally governed.

`AGENTS.md` separately requires thin integration and forbids rebuilding the OpenSpec proposal/design/tasks/archive state machine.

### 3.2 Managed OpenSpec resolution already exists

Canonical `managed-toolchain-resolution` now guarantees:

```text
resolveManagedTool({ toolId: "openspec" })
→ exact @fission-ai/openspec@1.10.0
→ exact runtime root below FLOWKIT_HOME
→ validated bin/openspec.js entrypoint
→ no PATH/global fallback
→ no tool invocation performed by the resolver itself
```

This Change MUST consume that seam rather than rediscover OpenSpec or use PATH.

### 3.3 Policy deliberately does not read OpenSpec

Canonical `policy-and-next-boundary` requires Policy to remain a pure legality seam and explicitly forbids Policy from reading OpenSpec filesystem/CLI.

Its archived Explore deferred OpenSpec artifact readiness to this thin integration.

Therefore the adapter MUST remain outside Policy. Policy does not become an integration host.

### 3.4 Cross-Delivery Memo already deferred target existence discovery

The completed Memo contract accepts a caller-supplied concrete promotion target and deliberately does not scan OpenSpec/filesystem to infer target existence. Its design defers that existence discovery to a future Delivery/OpenSpec integration boundary.

This is a real consumer for exact OpenSpec Change observation, but this Change does not modify Memo semantics or auto-promote anything.

### 3.5 Foundation CLI depends on this Change

`establish-foundation-cli-surface` is planned after this Change and explicitly depends on it. The CLI is expected to be a thin surface over already existing Core/integration capabilities, not another OpenSpec implementation.

---

## 4. Actual OpenSpec 1.10.0 machine surface proof

Explore restored the exact managed OpenSpec runtime and used Node 22.23.2 only as the detached host fixture. Product Node authority remains `package.json#engines.node >=22.20.0`.

### 4.1 `list --json`

With this Change active, real OpenSpec 1.10.0 returns a machine document containing:

```text
changes[]
  name
  completedTasks
  totalTasks
  lastModified
  status
root.path
root.source
```

This is sufficient to observe the active Change set without scanning `openspec/changes/**` in Flowkit.

### 4.2 `status --change <id> --json`

For the active Change, real OpenSpec returns:

```text
changeName
schemaName
planningHome
changeRoot
artifactPaths
isPlanningComplete
isComplete
applyRequires
nextSteps
actionContext
artifacts[]
root
```

Each artifact observation includes OpenSpec-owned readiness/dependency facts such as:

```text
id
outputPath
status
requires
missingDeps
```

This directly satisfies the current `formal artifact observation` output expected by the Delivery plan.

### 4.3 OpenSpec formal failure is not the same as process failure

Real proof:

```text
openspec status --change no-such-change --json
→ exit 1
→ valid JSON status document on stdout
```

Real strict validation of this intentionally incomplete Explore scaffold similarly returns:

```text
exit 1
+ valid JSON validation document
```

Therefore an adapter that treats every non-zero process exit as transport failure would destroy OpenSpec's own formal machine result.

The invocation layer MUST distinguish:

```text
valid OpenSpec JSON + non-zero exit
→ OpenSpec formal command outcome

spawn/process failure
→ integration failure

malformed/non-JSON stdout where JSON was required
→ integration failure
```

### 4.4 Focused invocation prototype

An exploration-only TypeScript prototype consumed the existing production `resolveManagedTool()` seam and invoked the resolved entrypoint with:

```text
process.execPath
+ resolved OpenSpec entrypoint
+ explicit JSON command arguments
+ cwd = requested repository root
```

Proof result:

```text
real status JSON / exit 0                         PASS
missing Change JSON / exit 1 preserved            PASS
fake managed OpenSpec valid JSON / exit 1 preserved PASS
fake managed OpenSpec malformed stdout rejected   PASS
```

The proof script was execution-local and did not modify production source/tests.

### 4.5 Nearest-root behavior requires exact root binding

Running real OpenSpec from `repository/src` still resolves the nearest parent OpenSpec root and reports the repository root.

That is useful CLI behavior, but it creates a risk for a programmatic adapter: if a caller accidentally supplies a nested or wrong repository root, OpenSpec can silently bind to a parent OpenSpec project.

Therefore successful observations MUST verify that OpenSpec's reported `root.path` resolves to the exact requested repository root. A mismatch MUST fail closed rather than silently accepting another OpenSpec root.

---

## 5. CLI JSON vs direct package API

OpenSpec 1.10.0's package exports JavaScript modules, but the existing Flowkit managed-tool contract deliberately returns validated **runtime root + entrypoint**, not a stable library-service API.

Directly importing OpenSpec internals would:

- couple Flowkit to package module structure beyond the managed contract;
- bypass the exact entrypoint seam already proven in the prior Change;
- create more upgrade coupling than the documented machine-readable CLI surface.

For the current pinned OpenSpec 1.10.0 integration, the minimum stable direction is:

```text
resolveManagedTool("openspec")
→ validated entrypoint
→ child process via current host Node (`process.execPath`)
→ OpenSpec `--json`
→ validate only the machine fields Flowkit consumes
```

No shell lookup and no PATH fallback are required.

---

## 6. Minimum Proposal boundary

### 6.1 Product capability: read-only OpenSpec observation seam

The Proposal should introduce one small integration module that owns:

1. managed OpenSpec process invocation for **closed read-only observation commands**;
2. exact repository-root binding;
3. JSON parsing and minimal shape validation;
4. machine-distinguishable integration diagnostics;
5. transient typed observation results.

### 6.2 Minimum exported observations

The current durable consumers justify only two observation capabilities:

#### A. Active Change observation

Conceptually:

```text
listOpenSpecChanges(repositoryRoot, flowkitHome)
```

Purpose:

- observe OpenSpec's formal active Change set;
- provide exact Change existence evidence for callers such as future Memo/CLI integration;
- do not infer Delivery eligibility or Policy legality.

#### B. Exact Change artifact status observation

Conceptually:

```text
observeOpenSpecChangeStatus(repositoryRoot, flowkitHome, changeId)
```

Purpose:

- observe exact `changeName/schemaName/changeRoot`;
- observe OpenSpec artifact readiness/dependency state;
- preserve OpenSpec planning completeness facts;
- do not scan Markdown or compute readiness independently.

Exact public names remain Proposal/design decisions; these are capability shapes, not implementation commitments.

### 6.3 Do not wrap commands without a current consumer

The following real OpenSpec JSON commands were inspected but SHOULD NOT automatically become product APIs in this Change:

```text
context --json
instructions ... --json
validate ... --json
show ... --json
```

They remain available to the existing bootstrap OpenSpec Skills and direct verification commands.

If a later real Flowkit consumer requires one of them, that requirement can be added deliberately. The existence of a CLI command is not by itself product scope.

---

## 7. Formal-result vs integration-failure boundary

The Proposal should preserve this distinction.

### OpenSpec formal outcome

A command may return non-zero with valid machine JSON. That payload belongs to OpenSpec and MUST NOT be reinterpreted as Reviewer, Verification, Owner or Policy authority.

### Flowkit integration failure

A small deterministic integration diagnostic catalog is justified for failures such as:

```text
invalid Change id input
managed OpenSpec resolution failure (existing resolver error)
OpenSpec process could not be started/completed
required JSON output malformed
successful observation payload shape invalid
reported OpenSpec root mismatches requested repository root
```

Do not parse free-text OpenSpec messages to recreate its state machine.

For example, Change existence should be observed from OpenSpec's formal active Change set rather than inferred from an English `not found` message.

---

## 8. Authority and persistence boundary

OpenSpec observations are **transient integration facts**.

This Change MUST NOT create:

```text
.flowkit/openspec-state.json
.flowkit artifact readiness mirror
Flowkit proposal/design/tasks/archive state machine
OpenSpec lifecycle cache used as authority
```

Flowkit may return an observation to its caller. OpenSpec remains the formal source of those facts.

Likewise:

```text
OpenSpec artifact ready
≠ Flowkit READY_ACTION

OpenSpec tasks complete
≠ Reviewer approved

OpenSpec validation PASS
≠ Verification PASS

OpenSpec archive readiness
≠ Owner/Git checkpoint authority
```

Existing Policy/authority contracts remain unchanged.

---

## 9. Bootstrap Skill boundary

Current `.agents/skills/openspec-*` files continue to be used by Author/Reviewer AI during development.

This Change MUST NOT:

- read `.agents/skills/**` from production code;
- invoke a Skill from Flowkit runtime;
- move Skills into Flowkit runtime;
- replace current Skill-driven explore/propose/apply/archive execution;
- introduce self-hosting behavior;
- design the future Skill migration/productization mechanism.

Those questions are outside the current first complete Foundation version.

---

## 10. Explicit non-goals

Do not pull the following into Proposal:

```text
OpenSpec workflow/state-machine reimplementation
automatic explore/propose/apply/archive
OpenSpec mutation commands (`new change`, `archive`, etc.)
Skill execution or Skill migration
self-hosting / Flowkit-manages-Flowkit
Policy reading OpenSpec
Markdown/filesystem scanning to infer OpenSpec status
persistent OpenSpec-state mirror/cache
OpenSpec package-internal service framework
generic external-tool invocation registry
plugin/provider abstraction
installer/downloader/updater
Archify integration
Foundation CLI implementation
Git checkpoint implementation
cross-platform whole-manager acceptance
```

---

## 11. Risks resolved

### R1 — Thin integration becomes a second OpenSpec state machine

Resolved by making V1 observation-only and using OpenSpec JSON facts directly.

### R2 — Adapter accidentally uses wrong OpenSpec runtime

Resolved by mandatory consumption of existing `resolveManagedTool("openspec")`.

### R3 — Adapter silently binds to another OpenSpec root

Resolved by explicit exact root-path binding on successful observations.

### R4 — Non-zero OpenSpec result is mistaken for transport failure

Resolved by parsing required JSON independently from process exit status and preserving formal OpenSpec outcomes.

### R5 — Current bootstrap Skills become runtime dependency

Resolved by explicit non-goal: production integration does not know `.agents` exists.

### R6 — Wrapper grows around every OpenSpec CLI command

Resolved by requiring a current consumer before adding an observation surface. Current Proposal needs only active Change set + exact Change artifact status.

---

## 12. Remaining limitations / deferred concerns

1. Mutating OpenSpec operations remain driven by existing bootstrap Skills in the current development phase.
2. `instructions`/`validate` product wrappers are deferred until a concrete Flowkit runtime consumer proves they are needed.
3. No standalone OpenSpec `--store` support is needed for the current repo-local Foundation project; repo-local exact-root binding is the authorized domain.
4. Foundation CLI command shape is intentionally deferred to the next Change.
5. Cross-platform process behavior is implemented/tested locally as needed by this Change, but whole-manager Windows/Linux acceptance remains the final acceptance Change.
6. Future self-hosting/Skill retirement is explicitly outside this Delivery's current execution model.

---

## 13. Proposal-ready invariants

A safe Proposal can now be written around these invariants:

```text
OpenSpec is the only formal Change artifact authority.
Flowkit observes; it does not mirror OpenSpec lifecycle state.

Managed resolver selects exact OpenSpec 1.10.0.
The adapter never selects OpenSpec from PATH.

Observation commands are read-only and closed to current needs.
No generic arbitrary OpenSpec command executor is exposed.

Successful machine observations bind to the exact requested repository root.
Malformed output/root mismatch fails closed.

Valid OpenSpec JSON on a non-zero exit remains an OpenSpec formal outcome,
not automatically an integration transport failure.

No .agents dependency exists in production runtime.
No self-hosting behavior is introduced.
```

## 14. Explore conclusion

**PASS**

The Change is necessary and sufficiently bounded for Proposal. The smallest useful V1 is a read-only machine-observation seam over managed OpenSpec 1.10.0, with exact root binding and fail-closed JSON validation. It should not implement OpenSpec mutations, Skill execution, self-hosting, Policy integration or a generic OpenSpec service layer.
