# flowkit-next

`flowkit-next` now contains the **Foundation Lifecycle Kernel** produced by Delivery `20260824-01-foundation-lifecycle-kernel`.

The Foundation candidate passed the authorized Formal Full Test on exact checkpoint candidate:

```text
aa6735f247ed89777dc2eae20d3011cbdb25faa7
```

Delivery Final then materialized repository guidance and derived Archify assets without changing the verified production source, tests, canonical OpenSpec specs, package/build configuration, or Memo semantics.

## Foundation capabilities

The repository currently contains:

- Owner / Author / Reviewer / Verification authority separation;
- Delivery / Change / Action identity contracts;
- `prepared / terminal` Action lifecycle with a single current Action;
- durable Run / Result persistence and integrity validation;
- exact ActionPackage formation and Result admission;
- exactly-one Standard Action execution followed by terminal reporting and STOP;
- deterministic Policy legal-boundary calculation without automatic next execution;
- cross-Delivery Memo persistence;
- exact managed OpenSpec `1.10.0` / Archify `2.15.0` runtime resolution;
- thin OpenSpec observation;
- minimal `flowkit` CLI surface: `status`, `next`, `doctor`;
- pure checkpoint authorization evaluation without Git execution;
- detached Linux x64 whole-manager acceptance plus bounded Windows compatibility simulation.

## Stable manager boundary

A repository build is not automatically the lifecycle authority for its own active Delivery.

Formal future Delivery execution must use an **exact Stable manager from the previous Delivery Owner-authorized exact Delivery Final Git checkpoint**. The target repository's built CLI remains the candidate under development during its active Delivery and does not become its own lifecycle authority mid-Delivery.

Delivery Final does not itself execute commit, push, merge, or tag and does not create Git checkpoint authority. After the Owner explicitly authorizes and forms the exact Delivery Final Git checkpoint, that exact checkpoint is directly eligible as the next Delivery stable base. No additional post-Final lifecycle gate exists between that checkpoint and its use as the next Delivery stable base.

## Repository truth boundaries

```text
OpenSpec      → Change/specification authority
Git           → repository bytes/history
Runtime       → Run/Result/current Action facts
Policy        → legal boundary calculation
Reviewer      → independent review verdict
Verification  → correctness evidence
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

Executable managed runtimes live under external `FLOWKIT_HOME`, not in Git.

Repository Node compatibility is `>=22.20.0`; deterministic fixture is Node `22.23.2`; package manager identity is `pnpm@11.22.0`.

## Durable architecture descriptions

Delivery 01 architecture assets live under:

```text
architecture/20260824-01-foundation-lifecycle-kernel/json/
```

They include `current`, `planned`, `actual` and three thin ref-based compare JSON files. Generated HTML is disposable and intentionally excluded from Git.

## Historical initialization snapshot

`FOUNDATION-INIT.md` is retained only as the historical bootstrap snapshot that preceded the Foundation lifecycle implementation. It is no longer a statement of current repository capability.
