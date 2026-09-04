# Delivery Architecture Finalization

Execute an already-decided `delivery-architecture-finalization` operation from its exact `DeliveryOperationPackage` after a valid terminal Formal Full Test PASS.

## Contract

1. Treat the package-bound Delivery identity, verified candidate identity, Full Test execution identity, Current/Planned Architecture content identity, canonical system-view prestate, and content-bound Guidance identity as fixed input.
2. Require `ownerAuthority = null`. This operation does not reuse Full Test authority and does not create Architecture, Delivery Final, Git, correction, or next-operation authority.
3. Derived-finalization logic returns content/result only. It does not receive caller-selected output paths or arbitrary repository-write capability.
4. The trusted host owns exactly six operation-local derived output slots: Actual Architecture, Current → Actual compare, Planned → Actual compare, Workflow, Lifecycle, and Data Flow.
5. Validate all effective six-slot output content before repository materialization. Use the exact managed Archify runtime only as derived validation/compare mechanics; Archify never becomes a truth or authority source.
6. Materialize missing Workflow/Lifecycle/Data Flow baseline only when repository-scoped ownership is being established or represented accepted semantics changed. Preserve exact existing bytes when represented semantics are unchanged.
7. Admit closure only from exact output artifact/content identities after successful validation. Keep closure compact; do not create a second evidence store.
8. If finalization requires source, OpenSpec, or other product-truth correction, STOP before admitting closure. Correction belongs to the normal Owner-controlled correction/revise flow; the corrected candidate requires a fresh Formal Full Test PASS before finalization can run again.
9. STOP at the Architecture Finalization boundary. Do not select or execute Delivery Final or repository integration.

## Boundaries

MUST NOT create or use:

- caller-selected output paths;
- a generic path allowlist, changed-path scanner, mutation taxonomy, or mutation engine;
- an Architecture candidate identity separate from the verified repository candidate;
- a Diagram Registry, Planner, Runtime, or Architecture lifecycle/state machine;
- a new Owner authority type;
- a hidden source/OpenSpec writer branch;
- project-specific final Architecture bytes or next-operation instructions inside this Guidance.
