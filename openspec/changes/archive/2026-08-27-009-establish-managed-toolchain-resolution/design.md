## Context

See `proposal.md` for motivation and `specs/managed-toolchain-resolution/spec.md` for the observable contract. The repository already carries `config/tools/toolchain.lock.json`, while Node host compatibility and pnpm package-manager identity are independently expressed in `package.json`. Executable OpenSpec/Archify runtimes intentionally live outside Git under caller-provided `FLOWKIT_HOME`.

The current lock originated as bootstrap material and currently includes exact Node/pnpm fields alongside OpenSpec/Archify. No production managed-tool resolver consumes that shape yet, so this Change can narrow the formal lock without a legacy parser or migration subsystem.

## Goals / Non-Goals

**Goals:**

- Add one small domain/integration boundary for resolving `openspec | archify` on demand.
- Keep expected managed-tool identity repository-controlled and runtime location caller-controlled through `FLOWKIT_HOME`.
- Validate path confinement, exact package identity, and entrypoint presence before returning a resolved identity.
- Provide deterministic closed failure categories suitable for later integrations to stop safely.
- Correct repository guidance and derived architecture so Node exact patch identity is not presented as managed-tool authority.

**Non-Goals:**

- Generic plugin/tool registry or arbitrary third-party tool support.
- Node/pnpm installation or exact Node patch enforcement.
- Runtime download, unpack, upgrade, cache, restore orchestration, or whole-directory attestation.
- OpenSpec/Archify invocation or lifecycle-output interpretation.
- CLI surface, Git checkpoint behavior, or whole-manager Windows/Linux acceptance.

## Decisions

### 1. Keep managed tool ids as a closed union

The domain model will accept only `openspec` and `archify` rather than introducing a generic registry.

**Rationale:** these are the only managed runtime consumers authorized by this Delivery. A closed union makes unsupported values fail closed and avoids infrastructure with no current consumer.

**Alternative considered:** generic string ids plus registry entries. Rejected because it expands the contract before another managed tool exists.

### 2. Narrow `toolchain.lock.json` to managed external tool identity

The formal managed-tool lock will retain only OpenSpec/Archify identity required by resolution: exact version, expected package name, managed runtime location template, entrypoint, and existing artifact provenance metadata as appropriate. Exact Node and pnpm bootstrap fields will stop being resolver authority.

Node host compatibility remains `package.json#engines.node`; pnpm identity remains `package.json#packageManager`. `.node-version` may remain a developer/detached reproducibility fixture.

**Rationale:** each concern already has a better existing authority. Keeping duplicate exact Node/pnpm values in the managed resolver would create unnecessary drift and incorrectly reject compatible hosts.

**Alternative considered:** retain all four identities and teach the resolver to ignore Node/pnpm. Rejected because it preserves misleading duplicate truth in the formal managed-tool lock.

### 3. Resolve an explicit requested tool from lock + `FLOWKIT_HOME`

The resolver takes one supported managed-tool id and explicit/caller environment state sufficient to obtain `FLOWKIT_HOME`. It derives the expected runtime location from the lock and current host path semantics.

Resolution is on demand; it does not preflight every managed tool globally.

**Rationale:** later OpenSpec integration should not fail because Archify is absent, and architecture work should not require OpenSpec unless it actually consumes it.

**Alternative considered:** validate the entire toolchain at process startup. Rejected because it creates unrelated failure coupling.

### 4. Constrain runtime-root and entrypoint paths before identity success

The resolver normalizes the configured runtime root and verifies it remains beneath the exact expected `FLOWKIT_HOME/tools/<tool>/<version>` location. It similarly resolves the declared entrypoint beneath that validated runtime root and requires it to exist as a file.

The lock must not authorize arbitrary absolute paths, `..` traversal, or entrypoint escape.

**Rationale:** deterministic managed resolution requires the lock to identify a runtime within the managed external tree, not become a generic path execution facility.

**Alternative considered:** trust configured paths as-is. Rejected because malformed lock content could escape the managed runtime boundary.

### 5. Verify installed package identity from the runtime package manifest

After path confinement succeeds, the resolver reads the resolved runtime's package manifest and compares exact expected package name and version before returning success.

For this Change the expected identities remain:

- OpenSpec: `@fission-ai/openspec@1.10.0`
- Archify: `archify@2.15.0`

**Rationale:** directory names alone do not prove which package is installed. Package manifest identity is enough for the bounded runtime-resolution use case demonstrated by Explore.

**Alternative considered:** hash the whole unpacked runtime on every resolution. Rejected because archive/source hashes are provenance/restore facts and whole-directory attestation is outside scope.

### 6. Return identity/location only; invocation belongs to consumers

The resolver returns a small immutable result containing tool id, exact version, validated runtime root, and validated entrypoint. Later OpenSpec/CLI/architecture integration decides whether and how to invoke that entrypoint under the host runtime contract.

**Rationale:** separating resolution from execution prevents this Change from accidentally creating OpenSpec lifecycle authority or Archify truth.

**Alternative considered:** expose `runManagedTool(...)`. Rejected because invocation behavior belongs to later integration Changes.

### 7. Use a closed diagnostic discriminant

Resolution failures will use a small discriminated catalog covering at least:

- `unsupported-managed-tool`
- `invalid-lock`
- `missing-flowkit-home`
- `invalid-runtime-root`
- `missing-runtime`
- `package-identity-mismatch`
- `missing-entrypoint`

The implementation may attach factual detail for debugging, but callers determine control flow from the closed diagnostic kind rather than parsing prose.

**Rationale:** later integration needs stable fail-closed behavior without promoting resolver diagnostics into Verification/Review/Policy evidence.

**Alternative considered:** throw only free-form errors. Rejected because callers would be forced to infer machine behavior from text.

### 8. Keep implementation local and small

Add a focused managed-tool domain/integration module plus unit tests rather than a new environment manager. Export only the minimal public types/functions needed by later consumers. Update repository guidance and derived planned architecture only where they currently conflate exact Node/pnpm bootstrap identity with managed tools.

**Rationale:** the approved Explore established a narrow seam and explicitly rejected a broader bootstrap/tooling subsystem.

## Risks / Trade-offs

- **[Risk] Lock schema correction could leave stale documentation or derived views** → Update the authoritative lock/guidance and synchronize only affected derived architecture wording in the same Apply.
- **[Risk] Host-specific path behavior differs between Windows and Linux** → Use host path primitives and confinement tests that avoid hard-coded Linux absolute paths; final whole-manager platform acceptance remains in the later dedicated Change.
- **[Risk] Package manifest validation proves package identity but not byte-for-byte runtime integrity** → Accept this intentionally; archive hashes remain restore provenance and stronger attestation is deferred.
- **[Risk] Closed tool ids require a future contract change for a third managed tool** → Accept this deliberately; adding a real consumer later is the right time to expand the union.

## Migration Plan

1. Add the managed-tool resolution domain/integration contract and focused unit tests.
2. Narrow `config/tools/toolchain.lock.json` so managed resolution authority covers OpenSpec/Archify only while preserving useful artifact provenance fields.
3. Correct `AGENTS.md` and affected derived architecture wording to distinguish managed tools from Node/pnpm host/bootstrap facts; preserve clearly historical initialization material as historical/fixture truth.
4. Run typecheck, focused/domain tests, formatting, and strict OpenSpec validation.
5. No runtime data migration, installer migration, or legacy resolver compatibility layer is required because no production resolver consumes the pre-contract lock shape.
