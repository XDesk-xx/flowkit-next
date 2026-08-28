# Source

Production TypeScript source for the Foundation Lifecycle Kernel.

Main layers:

```text
src/domain/ → authority, identity, lifecycle, persistence, Policy, Memo and integration contracts
src/cli/    → minimal flowkit CLI / host seams over Core contracts
```

The CLI is intentionally thin. It does not become a second lifecycle implementation, does not execute Git checkpoint mutations, does not auto-run Policy's next Action, and does not execute `.agents/skills/**` in production.
