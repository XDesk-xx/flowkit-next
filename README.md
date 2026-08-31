# flowkit-next

`flowkit-next` has completed Delivery `20260829-02-lightweight-incremental-engineering-quality` Delivery Final materialization on top of the Foundation Lifecycle Kernel.

The D02 implementation candidate passed the authorized Formal Full Test on exact Git candidate:

```text
d78acb135d5317145f52c7559393a3d1c0ff42eb
```

After that PASS, Delivery Final materialized repository guidance and derived Archify assets only. It did **not** modify verified production implementation, tests, canonical OpenSpec specifications, or package/lock truth.

## Current Stable Core capabilities

The repository now contains the D01 Foundation plus the D02 lightweight engineering-quality slice:

- Owner / Author / Reviewer / Verification authority separation;
- Delivery / Change / Action identity and minimal trusted coordination-state binding;
- prepared / terminal Action lifecycle with a single current Action;
- durable Run / Result persistence and exact ActionPackage / Result admission;
- deterministic Policy legal-boundary calculation without automatic next execution;
- cross-Delivery Memo persistence;
- exact managed OpenSpec `1.10.0` / Archify `2.15.0` runtime resolution;
- thin, portable OpenSpec observation;
- minimal `flowkit` CLI surface: `status`, `next`, `doctor`;
- lightweight incremental engineering gate;
- structural dependency-health checks for selected high-confidence bad edges;
- production-root reachability entropy hygiene;
- exact execution of already-required applicable checks with candidate/check-bound Result facts and bounded exact PASS reuse.

D02 intentionally does **not** introduce Gate/Check Registries, a Verification Planner, Evidence Platform, Quality Dashboard, candidate snapshot database, smart test selection, or automatic Author/Reviewer workflow.

## Verification and detached environment

Formal Full Test keeps the frozen six-gate Delivery-level contract:

```text
pnpm typecheck
pnpm format:check
pnpm build
pnpm test:domain
exact managed OpenSpec 1.10.0 validate --all --strict
pnpm test:acceptance
```

The final detached Linux dependency artifact is external to Git and is validated for Node `22.23.2` / pnpm `11.22.0`. It restores `yaml@2.9.0` correctly, does not contain the rejected Knip experiment, and requires no manual `node_modules` repair before the repository checks run.

## Stable manager boundary

A repository build is not automatically the lifecycle authority for its own active Delivery.

Formal future Delivery execution uses the **previous Delivery Owner-authorized exact Delivery Final Git checkpoint** as the Stable manager. Delivery Final itself does not execute commit, push, merge, or tag and does not create Git checkpoint authority.

This detached D02 closure is commit-ready. The exact Delivery Git checkpoint is formed later in the local repository only after explicit Owner authorization.

## Repository truth boundaries

```text
OpenSpec      → Change/specification authority
Git           → repository bytes/history
Runtime       → Run/Result/current Action facts
Policy        → legal boundary calculation
Reviewer      → independent review verdict
Verification  → test/check evidence
Owner         → explicit authorization and checkpoint decisions
Archify       → derived architecture projection only
Memo          → future cross-Delivery reconsideration only
```

## Managed environment

Exact managed tool identities are defined in:

```text
config/tools/toolchain.lock.json
```

Current identities:

```text
OpenSpec 1.10.0
Archify  2.15.0
```

Executable managed runtimes live under external `FLOWKIT_HOME`, not in Git. Repository Node compatibility is `>=22.20.0`; deterministic fixture is Node `22.23.2`; package manager identity is `pnpm@11.22.0`.

## Durable architecture descriptions

Delivery architecture assets live under `architecture/<delivery-id>/json/` and contain `current`, `planned`, `actual` plus three thin compare descriptors. Generated HTML remains disposable and excluded from Git.

Accepted `actual` is a derived continuity input for the next Delivery; OpenSpec and Git remain the truth sources.

## Historical initialization snapshot

`FOUNDATION-INIT.md` is retained only as the historical bootstrap snapshot that preceded the Foundation lifecycle implementation. It is not a statement of current repository capability.
