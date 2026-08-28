# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `apply`
- Logical Run id: `20260827-086-apply`
- Role: `author`
- Input Run: `20260827-085-review-propose`
- Reviewer verdict: `approved`
- Approved next boundary: `apply`

## Skills

- `.agents/skills/openspec-apply-change/SKILL.md`
- `.agents/skills/implementation-convergence/SKILL.md`

## Apply boundary

Implement only the approved managed-tool resolution capability:

- support exactly `openspec | archify`;
- resolve the requested tool on demand from repository-tracked managed identity plus explicit `FLOWKIT_HOME`;
- require the exact managed location `FLOWKIT_HOME/tools/<tool>/<version>` and reject malformed/traversing/escaping configuration;
- validate exact runtime package name/version and a confined file entrypoint before success;
- return identity/location facts only, without invocation;
- use a closed deterministic diagnostic catalog;
- narrow `config/tools/toolchain.lock.json` to OpenSpec/Archify managed identity and provenance;
- preserve `package.json#engines.node` as Node host-compatibility truth and `package.json#packageManager` as pnpm identity;
- keep Node `22.23.2` as a reproducibility fixture rather than managed-tool authority;
- synchronize only affected guidance/derived planned architecture wording.

## Verification boundary

- OpenSpec apply progress must become `8/8 complete` / `all_done`;
- focused managed-tool resolver tests;
- complete domain regression suite;
- `tsc --noEmit`;
- repository Prettier check;
- strict OpenSpec Change validation and strict all validation;
- real supplied OpenSpec/Archify fixture proof;
- fake PATH conflict proof;
- requested-tool-only proof with the peer runtime absent.

## Explicit non-goals

- no installer/downloader/updater/cache/restore framework;
- no generic managed-tool registry;
- no PATH/global fallback;
- no Node version manager or exact Node patch enforcement;
- no pnpm managed-runtime resolver;
- no managed-tool invocation or lifecycle-output interpretation;
- no whole-directory live cryptographic attestation;
- no CLI, Git checkpoint, archive, or cross-platform whole-manager acceptance;
- no dependency addition;
- no candidate self-management of Delivery 01.

## Stable output boundary

This Run stops at `review-apply`. It does not perform Reviewer work, Archive, checkpoint, or promotion.
