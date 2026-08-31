# 024 Review Explore — establish-structural-dependency-health-fitness

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-structural-dependency-health-fitness`
- Action: `review-explore`
- Run: `20260830-024-review-explore`
- Role: `reviewer`
- Input Run: `20260830-023-explore`
- Review chain start: `20260830-023-explore`

## Review result

Reviewer independently reviewed the Author Explore against the approved D02 Structural Dependency Health boundary and the supplied Delivery coordination facts.

### Lifecycle / authority

Confirmed:

```text
establish-trusted-change-coordination-state-binding
→ completed

establish-lightweight-incremental-engineering-gate
→ completed

establish-structural-dependency-health-fitness
→ active

exact Owner activation provenance
→ exact Delivery + Change + scope=["explore"]
```

No caller-supplied Change-state authority is relied upon.

### Change boundary

The Explore correctly owns generic bad dependency edges only:

```text
unresolved imports
runtime cycles
production → test/spec
production runtime → dev-only package
undeclared external package use
```

It correctly excludes:

```text
orphan / unused files
unused exports
unused dependencies
Knip / entropy ownership
Clean Architecture / layer law
path mutation policy
changed-file / --affected planning
known-violation baseline state
waiver registry
Gate / Check Registry
Formal Verification / Full Test
new lifecycle / authority state
```

The existing Lightweight Gate remains unchanged.

### Tool adoption boundary

The Explore correctly distinguishes:

```text
prepared D02 environment contains dependency-cruiser
≠ repository adoption
```

If Proposal adopts dependency-cruiser, normal package.json / pnpm-lock.yaml mutation is required.

No environment artifact is promoted to repository truth.

### Independent dependency-cruiser semantics check

Reviewer independently inspected the installed dependency-cruiser 18.2.0 rule model.

Confirmed:

- `to.circular` identifies circular relationships;
- `to.viaOnly.dependencyTypesNot` can require that no cycle edge has a forbidden dependency type;
- dependency-cruiser's built-in dev-dependency guidance explicitly distinguishes production runtime dependencies from type-only dependencies;
- `npm-no-pkg` / `npm-unknown` are available to identify package use not represented in package truth.

This supports the Explore's bounded rule semantics.

Reviewer also reproduced a small mixed runtime/type-only fixture and confirmed that type-only dependency handling does not require treating the type-only edge as a runtime-cycle violation.

### Proof conclusions

The Explore is sufficiently bounded and internally consistent in concluding:

```text
TypeScript alone
→ does not own the selected dependency-graph semantics

selected dependency-cruiser surface
→ adds unique mechanical value

current selected baseline
→ reported zero

whole graph
→ reported interactive (~1.2s)

therefore
→ no changed-file planner
→ no known-violation baseline database
→ no waiver machinery
```

No evidence in the supplied Explore justifies expanding into broader recommended dependency-cruiser policy.

## Proposal constraints

Proposal must preserve the proofed surface exactly.

1. Freeze the exact dependency-cruiser configuration semantics needed for the five selected rules; do not leave critical rule/options behavior for Apply to infer.
2. Runtime-cycle rule must exclude cycles whose runtime path is broken by a type-only edge. Do not use blanket `circular:true`.
3. Production→devDependency must be runtime-only. Type-only production use and test/dev-tool use remain allowed.
4. Production→test/spec must remain one-way generic directionality; tests→production remains allowed.
5. Undeclared-package ownership is package declaration health only; unused dependency detection remains Entropy Hygiene.
6. Use explicit selected rules rather than dependency-cruiser's broader recommended bundle.
7. Keep whole-graph execution while it remains cheap; do not introduce changed-file planning, baseline/cache state, or waiver machinery.
8. Keep dependency-cruiser repository-local. If adopted, mutate package.json/pnpm-lock normally.
9. Do not add this check to `quality:gate`; give it its own stable repository-local command.
10. Do not absorb Knip, orphan detection, typecheck, build, tests, Formal Full Test, architecture layering, Registry, Planner, or new lifecycle state.

## Verdict

```text
approved
```

The Explore is Proposal-ready.

## Next boundary

```text
propose
```

Reviewer did not mutate Author Explore, create Proposal artifacts, Apply, mutate package truth, activate another Change, archive, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
