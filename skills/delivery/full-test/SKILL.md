# Delivery Full Test

Execute an already-authorized `delivery-full-test` operation from its exact `DeliveryOperationPackage`.

## Contract

1. Treat the package-bound Delivery identity, candidate identity, ordered project-local checks, canonical Guidance identity, and exact Owner authority as fixed input.
2. Execute only the checks explicitly bound to the package, in their declared order. Do not discover, infer, add, remove, or reorder project checks.
3. Admit PASS evidence only when the current repository candidate and the material check identity still exactly match the package/evidence identity.
4. If only external environment, fixture, tool, or command-setup mechanics change while the repository candidate remains exact, rerun the affected checks; unchanged exact PASS evidence may be reused.
5. If any repository or canonical Git-visible bytes must change, STOP the current Full Test attempt. Repository correction belongs to the normal Owner-controlled correction/revise flow. A new candidate requires a new exact Full Test boundary/package and a restarted Formal Full Test.
6. Platform fixture mechanics may differ only when they prove the same semantic obligation. Never weaken or skip the obligation because a fixture differs by platform.
7. STOP at the Formal Full Test boundary. This Guidance does not grant correction, Change, Git, architecture-finalization, Delivery-final, or next-operation authority.

## Non-goals

Do not create a command registry, check planner, finding database, candidate invalidation subsystem, automatic correction path, or Standard Action wrapper for this Delivery operation.
