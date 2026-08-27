## Why

Flowkit already carries exact repository-tracked identities for the OpenSpec and Archify runtimes it depends on, but it does not yet have a formal candidate contract that resolves those external runtimes deterministically from `FLOWKIT_HOME` and fails closed when the resolved identity is missing or inconsistent. This Change establishes that narrow boundary while correcting the earlier bootstrap-level overstatement that exact Node patch identity belongs to the managed-tool contract.

## What Changes

- Introduce a closed managed-tool resolution capability for exactly `openspec` and `archify`.
- Resolve each requested managed tool only from repository-tracked lock data plus `FLOWKIT_HOME`; never silently fall back to PATH/global executables.
- Validate the resolved runtime's expected package name, exact managed-tool version, runtime-root confinement, and declared entrypoint before returning a resolved identity.
- Fail closed with a small deterministic diagnostic catalog when the tool id, lock/runtime root, runtime package identity, or entrypoint is invalid or unavailable.
- Resolve tools on demand so work that requires only one managed tool does not require unrelated managed runtimes to exist.
- Keep Node as a host-runtime compatibility concern governed by `package.json#engines.node`, with Node `22.23.2` retained only as a reproducible development/detached fixture rather than managed-tool authority.
- Keep pnpm governed by `package.json#packageManager`; do not add pnpm resolution or installation to this capability.
- Correct the repository managed-tool lock/guidance and derived architecture wording so ongoing managed identity covers OpenSpec/Archify only.
- Do not install, download, update, invoke, or interpret lifecycle output from resolved tools in this Change.

## Capabilities

### New Capabilities
- `managed-toolchain-resolution`: Deterministic, fail-closed resolution of the exact OpenSpec and Archify managed runtimes from repository lock truth and `FLOWKIT_HOME`, while keeping host Node compatibility outside managed-tool identity.

### Modified Capabilities

None.

## Impact

- Adds a new Foundation domain/integration boundary consumed later by OpenSpec and architecture/CLI integration.
- Updates the managed-tool lock shape and repository guidance/derived architecture wording to separate managed tool identity from host runtime/package-manager identity.
- Does not change existing OpenSpec canonical capabilities, execute external tools, install runtimes, add a generic tool registry, or alter lifecycle/Owner/Reviewer/Verification/Git authority semantics.
