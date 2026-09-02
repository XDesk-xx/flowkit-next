# Architecture

This directory stores **derived durable Architecture Description JSON** for Flowkit deliveries.

Completed Delivery assets currently include:

```text
architecture/20260824-01-foundation-lifecycle-kernel/json/
architecture/20260829-02-lightweight-incremental-engineering-quality/json/
architecture/20260831-03-action-guidance-bounded-agent-execution/json/
```

Each completed Delivery keeps:

```text
current.architecture.json
planned.architecture.json
actual.architecture.json
current-to-planned.compare.json
current-to-actual.compare.json
planned-to-actual.compare.json
```

`current / planned / actual` are derived descriptions. Compare JSON files are thin, ref-based descriptors; they do not copy either side.

Archify validates/renders these assets but is **not** an architecture truth source. OpenSpec/repository/Verification facts remain authoritative. Generated HTML is disposable and excluded from Git via `architecture/.gitignore`.

Accepted `actual` may be used as a continuity input when rematerializing the next Delivery's `current`, but it never becomes canonical truth by itself.

## Repository-scoped current system views

D03 finalization materializes only the long-term view whose represented accepted semantics changed:

```text
architecture/system/data-flow.json
```

The D03 accepted lifecycle and operating workflow do not add a new Action, lifecycle state, Policy transition, Role switch, or user-visible workflow branch. Because this repository did not yet contain canonical `workflow.json` / `lifecycle.json` files at the D03 boundary, D03 does not synthesize them merely for Delivery churn. D04 owns the reusable repository-scoped canonical diagram continuity contract.

`architecture/system/data-flow.json` is a derived current view only. It does not replace OpenSpec, Git, Flowkit lifecycle/Policy contracts, or Verification facts.
