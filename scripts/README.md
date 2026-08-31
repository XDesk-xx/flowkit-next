# Scripts

Deterministic repository scripts live here. Tool runtimes themselves do not.

Current D02 scripts include:

```text
check-forbidden-tracked-artifacts.mjs → cheap tracked-artifact hygiene used by the lightweight gate
check-production-reachability.mjs     → conservative production-root reachability entropy check
```

Repository scripts provide mechanical facts only. They do not create Reviewer, Verification, Owner, lifecycle, or Git authority.
