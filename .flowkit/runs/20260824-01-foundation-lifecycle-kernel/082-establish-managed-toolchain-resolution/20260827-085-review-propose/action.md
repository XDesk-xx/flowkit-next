# Action — Review Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `review-propose`
- Logical Run id: `20260827-085-review-propose`
- Role: `reviewer`
- Input Run: `20260827-084-propose`
- Review chain start: `20260827-082-explore`

## Review chain

`082 explore → 083 review-explore approved → 084 propose → 085 review-propose`

## Review boundary

Reviewer independently checked:

- 082 and 083 historical Run records remain byte-identical;
- the 083-approved Explore artifact and Delivery manifest remain byte-identical;
- 084 adds only Proposal/spec/design/tasks plus its durable Propose Run;
- all six material 083 Proposal constraints are carried into the formal planning contract:
  - managed ids remain closed to `openspec | archify`;
  - exact Node patch is excluded from managed-tool authority and `package.json#engines.node` remains host compatibility truth;
  - runtime root and entrypoint are confined beneath the exact managed `FLOWKIT_HOME` location and configured traversal/escape fails closed;
  - PATH/global lookup is never a fallback;
  - success returns resolved identity/location only and invocation remains deferred;
  - artifact hashes remain provenance/restore metadata rather than live whole-directory attestation;
- pnpm remains repository package-manager identity and is not a managed runtime target;
- the formal lock correction removes duplicate exact Node/pnpm resolver authority without introducing a migration subsystem;
- failure behavior is represented by a small closed diagnostic discriminant rather than prose parsing or a new evidence system;
- resolution is on demand per requested managed tool and does not preflight unrelated tools;
- tasks cover implementation, repository-truth correction and focused verification without adding installer/downloader/updater/registry/invocation scope;
- existing canonical source/spec baseline remains healthy.

## Verdict

`approved`

No blocking Proposal finding remains. The planning contract is ready for Apply.

## Apply cautions

- Keep lock/config validation fail closed, including malformed/missing required managed-tool fields; do not silently repair the lock.
- Confinement tests should prove the approved configured traversal/entrypoint-escape cases while remaining a narrow resolver check rather than a generic filesystem sandbox.
- Do not make runtime archive availability or archive hashing a prerequisite for normal resolution.
- Do not execute the resolved entrypoint in this Change; later consumers own invocation.

## Non-claims

- Reviewer did not modify Author planning artifacts.
- No production source/test mutation was performed.
- No installer, downloader, auto-updater, generic tool registry, PATH fallback, OpenSpec lifecycle adapter, Archify lifecycle authority, Node version manager, pnpm resolver, live-directory attestation, CLI, Git checkpoint capability, cross-platform whole-manager acceptance or Verification PASS is introduced.
