# Source

Production TypeScript source for the current Flowkit Stable Core candidate.

Main layers:

```text
src/domain/   → authority, identity, lifecycle, persistence, Policy, Memo, applicable-check execution and integration contracts
src/cli/      → minimal flowkit CLI / trusted host seams over Core contracts
src/internal/ → bounded non-public implementation leaves such as candidate/check identity and process classification
```

The D02 engineering-quality slice keeps repository mechanical checks mostly in repository tooling/scripts rather than turning them into a new Flowkit control plane. The production applicable-check seam executes only checks already required by formal input and records exact candidate/check-bound Result facts; it does not select checks, scan Run history automatically, or create a Verification Planner/Registry/cache platform.

The CLI remains intentionally thin. It does not become a second lifecycle implementation, does not execute Git checkpoint mutations, does not auto-run Policy's next Action, and does not execute `.agents/skills/**` in production.
