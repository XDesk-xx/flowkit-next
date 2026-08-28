# Action — Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `explore`
- Logical Run id: `20260827-082-explore`
- Role: `author`
- Base: owner-supplied checkpoint archive `flowkit-next-delivery-20260824-01-foundation-lifecycle-kernel-853c622.zip`
- Owner authority: `owner:e38686db4a2e40359d96bcc19497cd7fe3ce62e2598e90c50691526d8849fd7a`

## Execution

Owner authorized activation of the next eligible Delivery Change and proof-based Explore. The Delivery manifest was activated first, OpenSpec 1.10.0 created the Change scaffold, and the investigation then used both the upstream `openspec-explore` stance and Flowkit `explore-proof-based` discipline.

The Owner clarified the central boundary before activation:

```text
OpenSpec / Archify
→ exact Flowkit-managed external tools

Node
→ host runtime compatibility
→ not an exact patch-level managed identity
```

Explore therefore concentrates on the smallest resolver contract that later OpenSpec/Archify integrations can consume:

- repository-tracked exact identity for OpenSpec 1.10.0 and Archify 2.15.0;
- explicit `FLOWKIT_HOME` resolution;
- exact installed package name/version and entrypoint checks;
- deterministic fail-closed diagnostics;
- zero silent PATH fallback;
- separation of host Node compatibility from managed-tool identity;
- on-demand resolution per requested tool rather than global presence of every tool.

## Proof performed

Focused non-production proof established:

- all four supplied OpenSpec/Archify runtime/source artifact SHA-256 values exactly match the current lock;
- the restored OpenSpec package is `@fission-ai/openspec@1.10.0` with `bin/openspec.js`;
- the restored Archify package is `archify@2.15.0` with `bin/archify.mjs`;
- a fake PATH `openspec` returning `9.9.9` does not affect direct `FLOWKIT_HOME`-rooted resolution to OpenSpec `1.10.0`;
- missing runtime root, wrong package version, and missing entrypoint all fail closed in the focused prototype;
- repository `package.json` already declares Node compatibility as `>=22.20.0`, while Node 22.23.2 remains a deterministic detached/developer fixture.

## Stable output

- activated Delivery-group state and explicit Owner authority fact;
- `openspec/changes/establish-managed-toolchain-resolution/.openspec.yaml`;
- `openspec/changes/establish-managed-toolchain-resolution/explore.md`;
- this durable 082 Explore Run.

## Non-claims

- No Proposal/design/spec/tasks were created.
- No production source/test implementation was changed.
- No OpenSpec or Archify invocation adapter was implemented.
- No installer/downloader/version manager/tool registry was introduced.
- No exact Node 22.23.2 product requirement is claimed.
- No Reviewer or Verification verdict is claimed.
- No Apply, Archive, Git checkpoint, push, merge or tag authority is claimed.
