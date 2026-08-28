# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `propose`
- Logical Run id: `20260827-084-propose`
- Role: `author`
- Input Run: `20260827-083-review-explore`
- Base Git revision: owner-supplied prefix `853c622`

## Execution

The approved `082 explore → 083 review-explore` chain was converged into formal OpenSpec planning artifacts using upstream `openspec-propose` plus the Flowkit `proposal-convergence` discipline.

The Proposal introduces one new capability, `managed-toolchain-resolution`, and modifies zero existing canonical capabilities.

The planning contract keeps the reviewer-approved boundary:

- managed tool ids are closed to `openspec | archify`;
- OpenSpec remains exact `@fission-ai/openspec@1.10.0` and Archify remains exact `archify@2.15.0`;
- `FLOWKIT_HOME` plus repository-tracked managed-tool identity is the sole runtime-resolution authority;
- PATH/global tool discovery is never a fallback;
- runtime root and entrypoint must remain confined to the exact managed location and mismatches fail closed;
- resolution is on demand per requested tool;
- success returns validated identity/location only and does not invoke the tool;
- `package.json#engines.node` remains host compatibility truth, so exact Node `22.23.2` is not promoted into managed-tool authority;
- pnpm remains repository package-manager identity and is not a resolver target;
- artifact hashes remain provenance/restore metadata rather than a live whole-directory attestation requirement.

No contract-changing unknown emerged during Proposal convergence.

## Stable output

- `proposal.md`
- new `managed-toolchain-resolution` delta spec
- `design.md`
- `tasks.md`
- this durable Propose Run

## Non-claims

- No production source or test mutation was performed.
- No Apply is executed by this Run.
- No installer, downloader, updater, plugin/tool registry, PATH fallback, runtime invocation, OpenSpec lifecycle adapter, Archify authority, Node version manager, pnpm resolver, live directory attestation, CLI, Git checkpoint capability, or cross-platform whole-manager acceptance is introduced.
