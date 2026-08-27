## 1. Managed Tool Contract

- [x] 1.1 Add the closed `openspec | archify` managed-tool identity/resolution domain model and deterministic diagnostic discriminant; verify focused unit tests reject unsupported tool ids and preserve the exact resolved identity shape.
- [x] 1.2 Implement lock + `FLOWKIT_HOME` runtime-root and entrypoint resolution with confinement checks and no PATH fallback; verify focused tests cover valid resolution, traversal/escape, missing home/runtime, and conflicting PATH executables.
- [x] 1.3 Validate exact installed package name/version and entrypoint file presence before success; verify focused tests cover OpenSpec `@fission-ai/openspec@1.10.0`, Archify `archify@2.15.0`, package mismatch, and missing/escaping entrypoints.
- [x] 1.4 Keep resolution on demand per requested managed tool and return identity/location facts without invocation; verify tests show OpenSpec can resolve while Archify is absent and vice versa, with no tool execution side effects.

## 2. Repository Truth Correction

- [x] 2.1 Narrow `config/tools/toolchain.lock.json` so managed-runtime authority covers OpenSpec/Archify only while retaining appropriate artifact provenance metadata; verify the lock no longer acts as exact Node/pnpm resolver authority.
- [x] 2.2 Correct `AGENTS.md` and affected derived architecture wording so `package.json#engines.node` is host compatibility truth, `package.json#packageManager` is pnpm identity, and Node `22.23.2` is only reproducibility/bootstrap fixture truth; verify no ongoing managed-tool guidance requires the exact Node patch.

## 3. Verification

- [x] 3.1 Run typecheck, focused/domain tests, formatting, and strict OpenSpec Change validation; verify all checks pass without production behavior outside the approved managed-tool resolution scope.
- [x] 3.2 Re-run managed-runtime proof against the supplied OpenSpec/Archify fixtures, including fake PATH conflict and on-demand missing-peer cases; verify the implementation remains fail closed and does not introduce installer, downloader, registry, invocation, or live-directory attestation behavior.
