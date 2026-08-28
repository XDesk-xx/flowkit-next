# Explore — establish-foundation-cli-surface

## 1. Explore outcome

**PASS**

This Change has a bounded Proposal-ready problem:

> Add the first real `flowkit` executable as a thin, machine-first surface over already-completed Foundation Core/integration seams. The CLI MUST expose existing facts and legality decisions without becoming a second lifecycle implementation, without executing Agent Skills, without taking over Delivery 01, and without absorbing Delivery-level Archify projection or Git commit orchestration.

The minimum CLI surface is the already-reserved command family:

```text
flowkit status
flowkit next
flowkit doctor
```

The CLI is a **surface over existing Core**, not a new manager/state machine.

---

## 2. Owner-stated boundary

Current development remains bootstrap-driven:

```text
.agents/skills
→ current development-time Author / Reviewer / OpenSpec instructions
→ continue to drive Explore / Propose / Apply / Archive for Delivery 01

Flowkit candidate
→ product being completed
→ MUST NOT read/execute .agents Skills
→ MUST NOT start self-hosting during this Change
```

The Owner also clarified Archify's role before activation:

```text
Archify
→ derived visualization / architecture projection only
→ Delivery-level current / planned / actual + comparisons
→ optional long-term stable reference view
→ NOT repository / OpenSpec / lifecycle truth
```

At Delivery Final, after Full Test succeeds, Archify may re-materialize layout plus `actual` and `current→actual` / `planned→actual` comparisons. That is a **Delivery Final concern**, not a CLI lifecycle command in this Change.

---

## 3. Existing durable facts

### 3.1 CLI is already a planned Foundation output

`FOUNDATION-INIT.md` freezes the public CLI name as `flowkit`.

`AGENTS.md` reserves the stable lifecycle commands:

```text
flowkit status
flowkit next
flowkit doctor
```

and explicitly says they are not usable until a real stable CLI exists.

The Delivery plan defines this Change as:

```text
existing Core contracts
+
terminal Git checkpoint authorization seam
→ minimal CLI / host surface
```

and explicitly forbids the CLI from becoming a second lifecycle implementation.

### 3.2 All required Core legality seams already exist

Current canonical modules already provide:

```text
Run / Result persistence
→ writeDurableRun / readDurableRun / listChangeRunHistory

Policy
→ evaluatePolicyAndNextBoundary

Single Action execution
→ invokeSingleAction

Managed tools
→ resolveManagedTool(openSpec | archify)

OpenSpec observation
→ observeOpenSpecActiveChanges
→ observeOpenSpecChangeStatus

Memo sidecar
→ read/list/create/promote/dismiss memo helpers
```

This Change does not need to rebuild these capabilities.

### 3.3 Policy remains the only lifecycle legality calculator

Canonical Policy returns only:

```text
ready-action(actionId)
ready-checkpoint-evaluation
blocked(reason)
```

Policy explicitly does NOT:

- execute an Action;
- read OpenSpec;
- execute Git;
- create Owner authority;
- auto-run the next boundary.

The CLI therefore must call Policy rather than reproduce its transition table.

### 3.4 OpenSpec machine observation is already available

The completed OpenSpec thin integration already gives the CLI a closed read-only seam for:

```text
active Change observation
exact Change planning/artifact status observation
```

The CLI MUST consume this seam rather than spawn arbitrary OpenSpec commands or scan Markdown.

### 3.5 Managed Archify identity is available, but no Archify runtime integration is required here

`resolveManagedTool({ toolId: "archify" })` already proves the exact Archify 2.15.0 runtime identity under `FLOWKIT_HOME`.

Focused real-runtime proof in this Explore resolved both exact managed tools successfully:

```text
OpenSpec 1.10.0  PASS
Archify 2.15.0   PASS
```

That is enough for a `doctor` environment diagnostic. Invoking Archify to generate Delivery architecture is outside this Change.

---

## 4. Decisive proof — a real CLI needs an emit/build contract

The repository currently has:

```text
tsconfig.json
→ noEmit: true

package.json
→ no bin
→ no build script

src/domain/**/*.ts
→ source only
```

Real Node 22.23.2 proof:

```text
node src/domain/index.ts
→ FAIL
→ imports refer to emitted .js siblings that do not exist
```

An execution-local build config overriding only `noEmit/outDir/rootDir` successfully emitted the current `src/**` graph to JavaScript, and Node 22.23.2 successfully imported the emitted Core APIs.

Therefore a stable `flowkit` executable cannot be honest unless this Change adds a minimal build/package surface, conceptually:

```text
tsconfig.build.json
pnpm build
package.json#bin.flowkit → emitted CLI entrypoint
```

This is not a generic packaging framework; it is the minimum real prerequisite for the next Windows/Linux whole-manager acceptance Change.

---

## 5. Decisive proof — exact caller-selected Run reference is required; ordering is not authority

Reviewer 101 invalidated one assumption in the original Explore: selecting the latest/highest-sequence durable Run is **not** a canonical way to discover the current Action.

The failed historical proof is retained because it identifies the exact unsafe rule:

```text
listChangeRunHistory(...)
→ max(sequence)
→ treat that Run as current Action
```

Current persistence guarantees unique sequence and stable ordering, but it does **not** establish one continuous `previousRunId` lineage or grant authority to the numerically greatest occurrence. Reviewer reproduced a disconnected higher-sequence Run that was structurally valid and could drive Policy to `ready-checkpoint-evaluation` if ordering were treated as authority.

The approved CLI boundary is therefore narrower and stays within existing canonical APIs:

```text
caller / host supplies exact current Run reference
  (canonical runId or equivalent exact Run occurrence)
→ parse/validate exact occurrence
→ readDurableRun(...) for that exact controlled address
→ reconstruct CurrentAction only from that selected Run context
→ if selected context is terminal:
     pair that exact linked context + result and call Policy
→ if selected context is prepared:
     currentAction = selected prepared Action
     terminalRunContext = null
     terminalResult = null
→ STOP
```

Focused revise proof intentionally recreated the reviewer counterexample:

```text
sequence 101 review-apply, previousRunId = null
sequence 999 archive,      previousRunId = null

listChangeRunHistory(...)
→ [101, 999]

max(sequence) heuristic
→ 999 archive
→ with completed Change facts, Policy = ready-checkpoint-evaluation

explicit caller Run id = 20260828-101-review-apply
→ readDurableRun(exact occurrence 101)
→ exact linked review-apply context/result
→ with active Change facts, Policy = ready-action(archive)
```

Proof result: **PASS**. The disconnected sequence-999 Run remains physically present and ordered after 101, but it cannot influence the Policy input unless the caller explicitly selects it.

This means the approved CLI scope still does **not** need `.flowkit/current-action.json`, a lineage database, or automatic Run-chain selection. It needs an exact already-authoritative current Run reference supplied by the caller/host.

Explicit prohibition for Proposal:

```text
max(sequence)       ❌
newest mtime        ❌
directory order     ❌
Git order/history   ❌
implicit latest Run ❌
```

A later self-hosting capability may establish a separately authorized lineage/current-selection contract if real product needs justify it. This Change does not.

## 6. Decisive proof — checkpoint authorization can remain a thin host gate

The cancelled mutation/checkpoint Change left one valid requirement behind:

```text
Policy ready-checkpoint-evaluation
+
explicit exact Owner authorize-checkpoint fact
→ checkpoint authorization surface
```

Existing `OwnerAuthorityFact` is structurally sufficient. Focused proof demonstrated:

```text
Policy = ready-checkpoint-evaluation
+
OwnerAuthorityFact:
  decision = authorize-checkpoint
  exact deliveryId
  exact changeId
  scope = [checkpoint]
→ authorized

wrong changeId
→ rejected
```

The Proposal should add only a small deterministic checkpoint-authorization evaluator outside Policy.

It MUST NOT:

```text
git add
git commit
git push
git merge
git tag
infer Owner authority from Review/Verification
reintroduce MutationDeclaration / per-file authorization
```

Actual Git execution remains an explicit external host operation after the authorization fact is established.

---

## 7. Minimum CLI command boundary

Exact flags/JSON field names remain Proposal/design work, but the command responsibilities are now bounded.

### 7.1 `flowkit status`

Purpose: report current formal facts without deciding or executing the next lifecycle step.

CLI inputs remain explicit and MUST include the exact current Run reference needed to address the already-authoritative Run occurrence. The CLI reads that exact Run through the existing controlled persistence API; it does not discover the current Run from history ordering.

It MAY compose existing read-only seams such as:

```text
exact caller-selected durable Run
OpenSpec active/exact Change observation
explicit Delivery / Change structural state supplied by the caller/host
```

Change history may be displayed as history, but sequence ordering MUST NOT create current-Action authority.

It MUST NOT mutate lifecycle, OpenSpec, Git, Memo, or Archify.

### 7.2 `flowkit next`

Purpose: use an explicitly selected exact current Run plus caller-supplied structural facts to construct the exact current Policy facts, call `evaluatePolicyAndNextBoundary`, and return the deterministic decision.

For a terminal selected Run, the CLI passes the exact linked selected context/result. For a prepared selected Run, it MUST NOT manufacture terminal facts.

If Policy returns `ready-checkpoint-evaluation`, the host surface MAY additionally evaluate a separately supplied exact Owner checkpoint authority fact and report authorization status as a separate fact.

It MUST NOT infer the current Run from max sequence, newest mtime, directory order or Git history, and MUST NOT execute the returned Action or Git operation.

### 7.3 `flowkit doctor`

Purpose: fail-closed environment/runtime diagnostics needed before using the manager.

Minimum real consumers justify checking:

```text
managed OpenSpec exact resolution
managed Archify exact resolution
OpenSpec repository-root observation
```

Archify may be **resolved** here, but MUST NOT be invoked to generate/validate Delivery architecture in this Change.

Node remains host compatibility from `package.json#engines.node`; this Change MUST NOT pin Node 22.23.2 as managed-tool authority.

---

## 8. CLI input ownership — explicit facts and exact Run selection; no discovery subsystem

The current Foundation has no approved product contract for automatically discovering/owning either the active Delivery **or the authoritative current Run**.

Adding any of the following would enlarge this Change into orchestration/self-hosting:

```text
Delivery-group YAML parser
.flowkit/current-delivery.json
.flowkit/current-action.json
Run-lineage/current-selection database
Git-branch inference
max-sequence / newest-mtime current Run heuristic
automatic Delivery or Run selection
```

The approved CLI scope therefore keeps input ownership explicit and closed:

```text
caller provides:
  exact repository root
  exact Delivery id
  exact Change id + structural Change state
  exact Change start sequence / Run address context
  exact authoritative current runId (or equivalent occurrence)

CLI:
  validates/parses that exact Run reference
  reads only that exact durable Run through readDurableRun(...)
  composes existing Core / OpenSpec observations
  calls Policy when requested
  returns machine-readable result
  STOP
```

`listChangeRunHistory(...)` remains useful for history/reporting, but not for selecting lifecycle authority.

A later self-hosting/Delivery-management capability can own automatic Delivery and Run-currentness discovery if and when the first complete version is already stable.

## 9. Archify boundary after Owner clarification

This Change does not need an `ArchifyThinIntegration` merely because Archify is important.

Current product responsibilities are different:

```text
OpenSpec thin integration
→ runtime needs formal Change observation now

Archify
→ Delivery-level architecture projection / visualization
→ used at Delivery Start and Delivery Final
→ may also maintain a long-term stable reference projection
```

For this Change:

```text
flowkit doctor
→ may resolve exact Archify identity

flowkit status / next
→ MUST NOT read Archify output as truth
→ MUST NOT trigger architecture materialization
```

After the last cross-platform Change and authorized Full Test PASS, Delivery Final can externally invoke the existing Archify workflow to materialize `actual` and comparisons. HTML remains disposable rendering and need not enter Git.

---

## 10. Full Test / final acceptance boundary

The Delivery currently defers the exact whole-manager Full Test command contract because no real CLI exists.

This Change should make the CLI **buildable and executable**, but it should not itself perform the final Windows/Linux acceptance or Delivery Final promotion.

Expected handoff:

```text
CLI Change archive
→ real build/bin/commands exist
→ validate-foundation-manager-cross-platform
→ freeze/execute exact whole-manager acceptance commands
→ Full Test / Delivery Final
→ Archify actual + comparisons
→ Owner promotion
```

No duplicated cross-platform subsystem is required here.

---

## 11. Minimum Proposal direction

Proposal should remain limited to four small concerns:

1. **Executable package/build surface**
   - emit production source to runnable JS;
   - expose one `flowkit` bin entrypoint;
   - no new runtime framework.

2. **Closed CLI commands**
   - `status`;
   - `next`;
   - `doctor`;
   - deterministic machine-readable output and non-zero exit on fail-closed input/integration failure.

3. **Thin host composition**
   - consume existing Run persistence, Policy, managed-tool and OpenSpec observation seams;
   - keep Delivery/Change context explicit;
   - do not infer or own the Delivery lifecycle.

4. **Terminal checkpoint authorization evaluator**
   - exact Policy checkpoint boundary + exact Owner authority matching;
   - authorization/reporting only;
   - no Git mutation.

---

## 12. Explicit non-goals

```text
Delivery 01 self-management
Flowkit self-hosting
reading/executing .agents Skills
Agent/provider execution transport
automatic Author/Reviewer loop
automatic next Action
scheduler / daemon / background process
new durable CurrentAction mirror
new current Delivery registry
YAML Delivery-group parser / automatic Delivery discovery
OpenSpec mutation commands
generic OpenSpec executor
Policy rewrite
Memo workflow expansion
Archify rendering/materialization from CLI
Archify as truth
Delivery actual/reference generation
Git add/commit/push/merge/tag
MutationDeclaration / per-file mutation authority
branch/history management
Windows/Linux final acceptance
Delivery Full Test execution
Delivery Final / Owner promotion
```

---

## 13. Risks and bounded mitigations

### R1 — CLI becomes a second lifecycle engine

**Mitigation:** `next` delegates exclusively to canonical Policy; no transition table in CLI.

### R2 — CLI grows into self-hosting before first version is complete

**Mitigation:** explicit caller-owned Delivery/Change inputs; no Skill execution, provider transport, automatic Delivery discovery or auto-next.

### R2a — Run ordering silently becomes current-Action authority

**Mitigation:** caller/host supplies the exact authoritative current Run reference; CLI reads that exact occurrence only. History ordering is reporting data, never authority. No max-sequence, mtime, directory-order or Git-order inference.

### R3 — checkpoint surface silently becomes a Git wrapper

**Mitigation:** evaluator returns authorization fact only; Git mutation is explicitly excluded.

### R4 — Archify is pulled into lifecycle because it is managed

**Mitigation:** `doctor` may resolve identity only; architecture projection stays Delivery-level and non-authoritative.

### R5 — CLI exists in source but is not runnable

**Mitigation:** require real build/bin proof in this Change; cross-platform execution remains the next Change.

### R6 — one CLI module exceeds code gate

**Mitigation:** keep parsing/command dispatch/host checkpoint evaluation in focused modules; every new/modified TypeScript file remains below the existing 500-line gate. Do not modify the historical >500-line Run persistence file merely to add CLI convenience.

---

## 14. Proof summary

```text
base typecheck                                      PASS
base domain tests                                   107/107 PASS
base format                                         PASS
OpenSpec 1.10.0 scaffold                            PASS
real emitted JS build prototype                     PASS
emitted Core import under Node 22.23.2              PASS
reviewer max-sequence counterexample                CONFIRMED
exact caller-selected Run read                      PASS
disconnected higher-sequence Run ignored            PASS
exact selected Run → Policy                         PASS
checkpoint Owner authority proof                    PASS
wrong checkpoint authority rejection                PASS
managed OpenSpec resolution                         PASS
managed Archify resolution                          PASS
production source/test mutation                     NONE
```

Revised exact-Run proof SHA-256:

```text
de3fa04eda97ca06486f64752c25735816d5f46f9281a80722adf6a67221771b
```

Revised proof output SHA-256:

```text
e7cc5ec3e86b15e792778cbf2fa61e52452bface0ed6041c206a181b797316c9
```

The original 100 proof remains historical evidence for the unsafe max-sequence assumption and is not erased.

## 15. Stop condition

Explore can stop successfully because:

```text
CLI public name already frozen                       YES
minimum command family already reserved              YES
Core consumers exist                                 YES
real runnable build path proven                      YES
exact current-Run selection bounded                    YES
Policy composition from exact selected Run proven      YES
checkpoint authority boundary proven                   YES
Archify responsibility separated                     YES
self-hosting / Skill boundary explicit                YES
cross-platform acceptance remains independently scoped YES
new generic subsystem required                       NO
```

Result:

```text
PASS
→ review-explore
```
