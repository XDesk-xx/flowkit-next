# Explore — establish-high-confidence-repository-entropy-hygiene

## Status

```text
PASS — ready for independent re-review
```

This Explore remains proof-based and implementation-free.

The Change is now deliberately narrower than the original D02 roadmap candidate:

```text
selected capability
→ production source unreachable from explicit production roots

selected implementation candidate
→ existing dependency-cruiser 18.2.0
   + bounded repository-local root-reachability check
   + focused counterexample tests
   + independent entropy-hygiene command
```

Knip 6.32.2 was evaluated during Explore and is now **rejected for the current Stable Core scope**. It MUST NOT be added to repository dependency truth by the later Proposal/Apply for this Change.

---

# 1. Revision history and controlling correction

## 1.1 Original Explore

The original Explore investigated two candidate entropy surfaces:

```text
production dead source
unused direct package declarations
```

It evaluated:

```text
dependency-cruiser 18.2.0
Knip 6.32.2
```

and initially proposed Knip dependency-only analysis as a second blocker.

That historical proof is retained below because failed/rejected tool evaluation is still useful evidence.

## 1.2 Reviewer correction `RE-031-001`

Reviewer correctly disproved this original mechanical claim:

```text
dependency-cruiser orphan=true
≠
unreachable from explicit production roots
```

The accepted correction is preserved:

```text
dependency-cruiser
→ produce the production src dependency graph

bounded root-reachability walk
→ roots:
   src/cli/entrypoint.ts
   src/domain/index.ts

any production source module outside that reachable closure
→ FAIL
```

A decisive internally connected dead-subgraph counterexample proved this correction.

## 1.3 Owner scope correction after 032

Owner explicitly narrowed the Explore again after reviewing the real Knip proof and its integration cost.

Controlling scope correction:

```text
Knip 6.32.2
→ evaluated during Explore
→ rejected for current Stable Core scope

Repository dependency truth
→ MUST NOT add Knip
```

Reasons:

```text
broad Knip file/export/type findings
→ insufficiently reliable for hard-fail use

unused dependency
→ only selected high-confidence Knip signal

that one signal does not justify:
→ new devDependency
→ lockfile mutation
→ detached environment snapshot refresh
→ cross-platform raw-transfer invocation handling
→ additional long-term maintenance
```

Therefore the previous 032 statement:

```text
Knip dependency-only
→ Proposal candidate
```

is superseded.

This is an Owner-authorized scope correction, not an implementation change.

---

# 2. Authority and lifecycle proof

Owner originally activated:

```text
Delivery:
20260829-02-lightweight-incremental-engineering-quality

Change:
establish-high-confidence-repository-entropy-hygiene

base:
45bf8355448ef8a279cc68405cf1d9b89ab2c5c7

initial scope:
["explore"]
```

Durable Delivery coordination records:

```text
establish-trusted-change-coordination-state-binding
→ completed

establish-high-confidence-repository-entropy-hygiene
→ active
```

Activation provenance remains the existing exact Owner activation fact:

```text
decision=activate-change
exact Delivery + Change
scope=["explore"]
ref=owner:80a65e4f9741fab0908c353d88cc654711a235139af1df303b94ccefff360203
```

The original corrected Flowkit coordination/Policy proof returned:

```json
{"kind":"next","decision":{"kind":"ready-action","actionId":"explore"},"checkpoint":{"authorized":false,"reason":"policy-not-ready"}}
```

No Proposal/Spec/Design/Tasks artifact has been created.

No Apply or production implementation has occurred.

---

# 3. Real Change goal after scope correction

The bounded real goal is now:

> Detect production source that exists under `src/**` but is unreachable from the repository's explicit production roots, using already-adopted repository tooling and a small deterministic reachability check.

This protects against repository entropy such as:

```text
dead production files
dead production subgraphs
stale source islands
production source kept alive only by test imports
```

without building a general dead-code platform.

The D02 ratchet remains:

```text
unrelated historical debt
→ does not automatically block a bounded Change

new selected high-confidence entropy
→ must not silently remain
```

Current proof shows the selected baseline is already zero, so no legacy baseline machinery is required.

---

# 4. Existing ownership boundaries

## 4.1 Lightweight Gate owns

```text
format / whitespace hygiene
selected ESLint mechanical regressions
production max-lines ratchet
forbidden tracked generated/runtime artifacts
selected TypeScript suppression discipline
```

Entropy Hygiene does not join or enlarge `quality:gate`.

## 4.2 Structural Dependency Health owns bad edges

```text
unresolved imports
runtime dependency cycles
production → test/spec
production runtime → devDependency
undeclared external package use
```

The existing dependency-cruiser rule:

```text
no-undeclared-external-package
→ npm-no-pkg / npm-unknown
```

already owns unlisted/phantom external package use.

This Change SHALL NOT duplicate those checks.

## 4.3 Entropy Hygiene owns dead production nodes only in this Change

Selected ownership:

```text
production src module unreachable from explicit production roots
```

Explicitly not selected now:

```text
unused direct package declarations
unused exports
unused types
unused test files
generic dead-code findings
```

---

# 5. Repository dependency truth

Current repository truth includes:

```text
dependency-cruiser 18.2.0
→ repository devDependency
→ lockfile truth present
→ already adopted by Structural Dependency Health
```

Current repository truth does NOT include Knip:

```text
package.json
→ no knip

pnpm-lock.yaml
→ no knip
```

Focused re-check during this revise-explore confirmed:

```text
package.json Knip dependency
→ false

pnpm-lock.yaml Knip entry
→ absent
```

The detached D02 proof environment containing Knip is only execution preparation and SHALL NOT be treated as repository adoption.

Proposal constraint:

```text
MUST NOT add Knip to package.json
MUST NOT add Knip to pnpm-lock.yaml
MUST NOT require a new node_modules snapshot because of Knip
```

---

# 6. Historical Knip evaluation — useful proof, rejected adoption

Knip was evaluated because the D02 roadmap named high-confidence repository entropy including possible unused dependency declarations.

The evaluation produced both positive and negative evidence.

## 6.1 Detached execution problem

Exact proof environment:

```text
Linux x64
Node 22.23.2
Knip 6.32.2
container memory.max = 4 GiB
```

Default Knip invocation failed before useful analysis with:

```text
RangeError: Array buffer allocation failed
```

The installed OXC raw-transfer path attempts a very large virtual ArrayBuffer allocation.

Knip could be made operational with:

```text
KNIP_DISABLE_RAW_TRANSFER=1
```

and focused dependency-only runs were then interactive.

Historical significance:

```text
Knip can technically run
BUT
stable adoption would need extra environment/invocation handling
```

Because Knip is now rejected, no repository wrapper for this environment concern is justified.

## 6.2 File detection was not reliable enough for production dead-node ownership

Default Knip analysis reported legitimate repository material as unused, including:

```text
src/cli/entrypoint.ts
dependency-cruiser.config.mjs
```

The CLI source is a real production source entry even though `package.json#bin` references built output under `dist/`.

Additional disposable proof showed:

```text
Knip --production --include files
→ false negative for a disposable production orphan

regular Knip file analysis
→ test-only import can make a dead production file appear used
```

Decision:

```text
Knip file detection
→ rejected as production reachability blocker
```

## 6.3 Broad export/type findings were not high-confidence blockers

Default Knip analysis on already accepted Foundation code reported:

```text
unused exports = 13
unused types = 21
```

That is not a zero-noise signal appropriate for a new hard blocker without semantic review or a baseline/waiver system.

Decision:

```text
unused exports/types
→ excluded
```

## 6.4 Dependency-only detection worked technically

Focused historical proof:

```text
Knip --include dependencies
→ current baseline 0 issues
```

Disposable unused direct devDependency:

```text
kleur
→ correctly reported
→ non-zero exit
```

So the historical conclusion is not:

```text
Knip is technically incapable
```

It is:

```text
unused direct dependency is the only selected high-confidence Knip signal
+
that one signal is not valuable enough to justify adopting Knip now
```

This distinction matters.

Rejected tool adoption is based on cost/value proof, not on pretending the useful dependency-only signal did not exist.

---

# 7. Why unused dependency detection is deferred

Current Stable Core does not need to maximize the number of mechanical checks.

The selected D02 principle is:

```text
high signal
low friction
minimum maintenance
proof before platform/tool adoption
```

Knip adoption for only unused direct dependency declarations would introduce:

```text
new repository devDependency
new lock graph
new exact detached node_modules artifact requirement
cross-platform invocation wrapper/environment handling
future Knip/OXC compatibility maintenance
```

while providing only one new blocker class.

No current repository proof shows recurring unused direct dependency accumulation as a material engineering-health problem.

Therefore:

```text
unused dependency detection
→ deferred
→ no blocker in this Change
→ no replacement custom implementation now
```

Do NOT replace Knip with a home-grown package-usage scanner merely to preserve the old roadmap wording.

Future real evidence may reopen the question through normal planning/proof.

---

# 8. Correct production dead-node semantics

The selected blocker is not:

```text
isolated file
```

and not:

```text
dependency-cruiser orphan=true
```

It is:

```text
production src module unreachable from the explicit production roots
```

Explicit roots currently proven by repository structure:

```text
src/cli/entrypoint.ts
src/domain/index.ts
```

Dependency-cruiser is reused only to resolve the repository's TypeScript-aware `src` graph.

A small checker then performs a normal graph traversal.

Conceptual algorithm:

```text
allModules = every resolved module under src/
roots = [cli entrypoint, domain index]
reachable = graph walk from roots over local src edges
unreachable = allModules - reachable

if unreachable is empty
→ PASS
else
→ FAIL with exact module list
```

No persistent graph state is required.

---

# 9. Decisive proof for Reviewer finding `RE-031-001`

## 9.1 Accepted repository baseline

The corrected proof on the accepted repository produced:

```json
{"productionModules":18,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":[]}
```

Result:

```text
PASS
exit 0
```

Focused re-run during this Owner-authorized revise-explore again produced:

```json
{"productionModules":18,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":[]}
```

So the accepted baseline remains zero.

## 9.2 Internally connected dead-subgraph counterexample

Disposable production fixtures from the 032 proof:

```text
src/entropy-proof-dead-a.ts
→ imports src/entropy-proof-dead-b.ts

src/entropy-proof-dead-b.ts
```

Neither module was reachable from either production root.

Corrected reachability proof produced:

```json
{"productionModules":20,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":["src/entropy-proof-dead-a.ts","src/entropy-proof-dead-b.ts"]}
```

Result:

```text
FAIL as required
exit 1
```

This is the decisive proof that `RE-031-001` remains resolved after the new Owner scope correction.

## 9.3 Test-only usage remains dead for production reachability

Because the graph walk starts only from production roots and traverses the production `src` graph:

```text
a src file imported only by tests
→ does not become reachable from production roots
→ remains a production entropy finding
```

This is the desired semantics.

---

# 10. Why the implementation should stay very small

The selected capability does not require a new dependency-analysis subsystem.

Expected implementation shape:

```text
existing dependency-cruiser
→ output src graph as JSON

small repository-local Node/TypeScript checker
→ root reachability
→ deterministic module list
→ exit 0/1

focused fixtures/tests
→ healthy baseline
→ isolated unreachable module
→ internally connected unreachable subgraph
→ test-only-used production source

stable command
→ quality:entropy
```

The checker should remain normal code, not a registry/planner/runtime.

A future repository Change that intentionally adds another genuine production root may update the explicit small root configuration normally.

---

# 11. Performance and execution boundary

The 032 corrected reachability proof measured approximately:

```text
~1.03s
~165 MB max RSS
```

The focused re-run remains successful on the same detached repository state.

With Knip removed from the selected implementation, the expected stable entropy check becomes cheaper and simpler than the previous two-tool candidate.

No proof justifies:

```text
changed-file optimization
cache
baseline database
waiver system
smart affected planning
```

The command remains independent from:

```text
quality:gate
quality:dependency-health
Formal Full Test
```

---

# 12. Selected Proposal-ready capability boundary

## Rule — no production source unreachable from explicit production roots

```text
scan:
src/**

explicit production roots:
- src/cli/entrypoint.ts
- src/domain/index.ts

existing dependency-cruiser 18.2.0
→ resolved src graph

bounded reachability checker
→ traverse local src dependency closure from both roots

any src module outside reachable closure
→ mechanical failure
```

That is the only selected entropy blocker for this Change.

## Stable repository command

Proposal should establish one independent entropy-specific command, conceptually:

```text
quality:entropy
```

It should run the production-root reachability check and return a real process status.

It SHALL NOT become a generic check registry or runner platform.

---

# 13. Explicit exclusions / deferrals

The following are outside this Change after the Owner scope correction:

```text
Knip integration
unused direct dependency blocker
unused export hard failure
unused type hard failure
unused test-file detection
generic dead-code scan
unlisted/unresolved package checks already owned by Structural Dependency Health
cycle checks already owned by Structural Dependency Health
production → test/spec checks already owned by Structural Dependency Health
baseline database
waiver registry
cache contract
changed-file planner
finding registry
Quality Dashboard
Quality Registry
Gate Registry
Verification Planner
Evidence Platform
automatic cleanup/fix
automatic file deletion
automatic package removal
Full Test
new Flowkit lifecycle / authority state
```

Also explicitly forbidden:

```text
home-grown unused-package scanner
```

The rejection of Knip is not permission to rebuild its dependency-usage functionality locally.

---

# 14. Proposal constraints

A later Proposal, if Reviewer accepts this Explore, should freeze at least:

1. Repository Entropy Hygiene in this Change owns only production source unreachability from explicit production roots.
2. Use existing `dependency-cruiser 18.2.0` only as the `src` graph extractor.
3. Do not use `dependency-cruiser orphan=true` as a synonym for production-root reachability.
4. Perform a bounded graph walk from exact current roots `src/cli/entrypoint.ts` and `src/domain/index.ts`.
5. Any `src` module outside that reachable closure is a mechanical failure.
6. Include a decisive connected dead-subgraph fixture, not only an isolated orphan fixture.
7. Include a test-only-used production source counterexample or equivalent proof that test references do not define production liveness.
8. Keep the entropy command independent from `quality:dependency-health` and `quality:gate`.
9. Knip 6.32.2 is **rejected for current Stable Core scope** and MUST NOT be added to `package.json` or `pnpm-lock.yaml` by this Change.
10. Do not replace Knip with a custom unused-dependency scanner.
11. Unused dependencies/exports/types remain deferred/excluded.
12. No baseline/waiver/cache/changed-file planner is justified because selected baseline is zero and the whole selected check is interactive.
13. No automatic fixes or deletions; the checker reports deterministic facts and fails, while Author/Reviewer decide semantic correction.

---

# 15. Resolved unknowns

```text
Is a broad entropy platform needed?
→ NO

Should Knip be integrated?
→ NO for current Stable Core scope

Was Knip evaluated rather than rejected by assumption?
→ YES

Did Knip dependency-only produce a technically useful signal?
→ YES

Does that one signal justify adoption cost?
→ NO under current proof

Should unused dependency detection be reimplemented locally?
→ NO

Should unused dependencies remain a blocker in this Change?
→ NO; defer

Can dependency-cruiser orphan=true prove production-root unreachability?
→ NO

Can existing dependency-cruiser still support the selected capability?
→ YES; graph extraction only

Does the bounded root-reachability check catch an internally connected dead production subgraph?
→ YES

Current production reachability baseline?
→ 18/18 reachable; zero unreachable

Need baseline / waiver / cache / changed-file planner?
→ NO

Need a new repository dependency?
→ NO

Need package.json / lockfile mutation for tool adoption?
→ NO

Need a new detached node_modules archive because of this selected implementation?
→ NO

Need a new Flowkit subsystem?
→ NO
```

---

# 16. Final Explore verdict

```text
PASS — ready for independent re-review
```

Minimum Proposal direction after Owner scope correction:

```text
Repository Entropy Hygiene
└─ production dead source only
   └─ existing dependency-cruiser 18.2.0 src graph
      + bounded root-reachability checker
      + focused counterexample tests
      + independent quality:entropy command
```

Knip remains documented only as:

```text
evaluated during Explore
→ useful dependency-only signal proven
→ adoption rejected on bounded cost/value grounds
→ MUST NOT enter repository dependency truth for this Change
```

No production implementation was performed.

No Proposal artifacts were created.

Next legal boundary:

```text
review-explore
```

Do not Propose or Apply until Reviewer accepts this revised proof boundary.
