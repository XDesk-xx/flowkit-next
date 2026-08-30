# 033 Revise Explore — establish-high-confidence-repository-entropy-hygiene

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-high-confidence-repository-entropy-hygiene`
- Action: `revise-explore`
- Run: `20260830-033-revise-explore`
- Role: `author`
- Input Run: `20260830-032-revise-explore`
- Review chain start: `20260830-030-explore`
- Base: `45bf8355448ef8a279cc68405cf1d9b89ab2c5c7`
- Trigger: explicit Owner scope correction after 032

## Owner-authorized correction

Owner required the current Explore to converge from:

```text
Knip dependency-only
→ possible Proposal adoption
```

to:

```text
Knip 6.32.2
→ evaluated during Explore
→ rejected for current Stable Core scope

Repository dependency truth
→ MUST NOT add Knip
```

The bounded reason is cost/value, not denial of historical proof:

```text
broad file/export/type findings
→ insufficiently reliable

unused direct dependency
→ only selected high-confidence Knip signal

one signal does not justify:
→ new devDependency
→ lockfile mutation
→ detached environment snapshot refresh
→ cross-platform raw-transfer handling
→ additional maintenance
```

## Revised selected capability

The Change is now narrowed to one blocker:

```text
production source unreachable from explicit production roots
```

Selected implementation candidate:

```text
existing dependency-cruiser 18.2.0
+
bounded production-root reachability checker
+
focused counterexample tests
+
independent quality:entropy command
```

Explicitly deferred/excluded:

```text
Knip integration
unused dependencies
unused exports
unused types
baseline / waiver / cache
changed-file planner
unlisted/unresolved checks already owned by Structural Dependency Health
```

Do not replace Knip with a home-grown unused-dependency scanner.

## Preserved Reviewer correction

`RE-031-001` remains resolved:

```text
dependency-cruiser orphan=true
≠
production-root unreachability
```

The selected mechanism remains:

```text
dependency-cruiser src graph
→ bounded reachability from:
   src/cli/entrypoint.ts
   src/domain/index.ts
```

The decisive connected dead-subgraph fixture from 032 remains the proof boundary.

## Focused re-proof

Current accepted repository:

```json
{"productionModules":18,"reachable":18,"roots":["src/cli/entrypoint.ts","src/domain/index.ts"],"unreachable":[]}
```

Repository dependency truth:

```text
package.json Knip dependency
→ false

pnpm-lock.yaml Knip entry
→ absent
```

No Proposal artifacts exist; the Change directory still contains only:

```text
.openspec.yaml
explore.md
```

## Result

```text
PASS — Owner scope correction incorporated
```

The full revised proof and Proposal constraints are in:

```text
openspec/changes/establish-high-confidence-repository-entropy-hygiene/explore.md
```

## STOP

Return to independent `review-explore`.

Do not Propose or Apply.
