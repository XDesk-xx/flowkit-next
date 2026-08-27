# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `review-explore`
- Logical Run id: `20260827-083-review-explore`
- Role: `reviewer`
- Input Run: `20260827-082-explore`
- Review chain start: `20260827-082-explore`

## Review boundary

Reviewer independently checked the 082 Explore against the repository `review-explore` skill and reconstructed current accepted source/spec facts.

The review verified:

- the Delivery activation delta is limited to `establish-managed-toolchain-resolution: planned -> active` plus one explicit Owner `activate-change` authority fact;
- the Owner authority fact is structurally valid under the existing canonical authority contract;
- the managed-tool boundary is exactly OpenSpec `1.10.0` and Archify `2.15.0`;
- Node is correctly separated as host-runtime compatibility (`package.json#engines.node >=22.20.0`) rather than exact managed-tool patch identity;
- pnpm remains repository package-manager identity (`pnpm@11.22.0`) rather than a managed runtime resolver target;
- all four repository-tracked OpenSpec/Archify artifact SHA-256 values match the supplied external artifacts exactly;
- restored package identities are `@fission-ai/openspec@1.10.0` and `archify@2.15.0` with the expected entrypoints;
- a fake PATH `openspec` reporting `9.9.9` does not affect direct `FLOWKIT_HOME` resolution to OpenSpec `1.10.0`;
- a focused resolver proof passes both managed tools and fails closed on unsupported tool, missing home, incoherent/wrong runtime root, missing runtime, lock traversal, and entrypoint escape;
- on-demand resolution is real: OpenSpec resolves while Archify is absent, and Archify resolves while OpenSpec is absent;
- current accepted source baseline remains healthy;
- canonical OpenSpec specs remain healthy; the active Change itself is correctly still `0/4` planning artifacts at Explore and therefore is not expected to pass strict Change validation yet.

## Verdict

`approved`

No current-scope Explore blocker remains. The Change is ready for Proposal.

## Proposal constraints

1. **Closed managed-tool identity**
   - V1 managed tool ids remain exactly `openspec | archify`.
   - The contract MUST establish exact expected package name, version, runtime root and entrypoint for each managed tool.
   - Do not generalize into a plugin/tool registry.

2. **Host runtime separation**
   - `package.json#engines.node` remains the host compatibility truth.
   - `.node-version` / detached Node `22.23.2` may remain reproducibility fixtures but MUST NOT become exact managed-runtime authority.
   - pnpm resolution/installation is not part of this resolver.

3. **FLOWKIT_HOME confinement**
   - Runtime roots MUST resolve under the expected `FLOWKIT_HOME/tools/<tool>/<version>` location using host path semantics.
   - Malformed roots, traversal/escape, package identity mismatch, missing runtime or missing/escaping entrypoint MUST fail closed.
   - PATH/global CLI lookup MUST NOT be a fallback.

4. **Resolution only**
   - Success returns resolved identity/location facts only.
   - This Change MUST NOT install, download, update, invoke, interpret lifecycle output, or create OpenSpec/Archify authority.
   - Later OpenSpec/CLI/architecture integration consumes the returned entrypoint.

5. **Artifact hashes**
   - Existing archive hashes may remain provenance/restore facts.
   - Do not expand this Change into whole-directory live attestation or environment bootstrap.

6. **Documentation correction**
   - Repository guidance/derived architecture should stop presenting exact Node `22.23.2` as ongoing managed-tool identity.
   - Historical initialization material may retain it as bootstrap snapshot where clearly labeled historical/fixture truth.

## Review limitation

The exact owner-supplied `853c622` checkpoint archive referenced by 082 was not present in this review turn, so its archive SHA/Git revision was not independently re-derived from that exact file. This is non-blocking for Explore readiness because:

- the 082 transfer itself contains no production source/test mutation;
- its Delivery-manifest activation is independently consistent with the reviewed corrected plan;
- current accepted source/spec facts were reconstructed from available accepted repository material;
- all material managed-tool claims were independently reproved from the repository lock and supplied external artifacts.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No tool installer/downloader/registry, OpenSpec lifecycle adapter, Archify authority, CLI, Git checkpoint, cross-platform whole-manager acceptance, or Verification PASS is introduced.
