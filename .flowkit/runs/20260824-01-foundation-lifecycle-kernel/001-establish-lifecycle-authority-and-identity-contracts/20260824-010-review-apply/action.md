# Review Apply Action

- delivery: `20260824-01-foundation-lifecycle-kernel`
- change: `establish-lifecycle-authority-and-identity-contracts`
- run: `20260824-010-review-apply`
- role: `reviewer`
- action: `review-apply`
- entry base: `23ca52715df7c52738edeb59206f496c7bf2d2a9`
- reviewed run: `20260824-009-apply`
- reviewed package sha256: `2437793168e2ae7bcebdb6411f3c575f29451a3037c599aea0080c54ab1c7e94`
- canonical source review: `20260824-008-review-propose` from `008-review-propose-reviewer-v2`
- canonical source review package sha256: `ebb668e879e9f83633516d84ea351bed6801af3c2f969c7946290b3dc3433e53`
- fresh Owner authorize-apply ref: `owner:717f5e224185cdc59be791c881fab2949642702ab956f1acbfeab8908d923ba4`

## Authority review

009(2) correctly binds the canonical `008-review-propose-reviewer-v2` package/result and a fresh Owner authorize-apply fact created after that review boundary.

The fresh authority ref is deterministic for its recorded sourceRef:

```text
sourceRef:
owner-input:2026-08-24T05:08+08:00:authorize-apply:20260824-01-foundation-lifecycle-kernel:establish-lifecycle-authority-and-identity-contracts:008-review-propose-reviewer-v2

sha256(sourceRef):
717f5e224185cdc59be791c881fab2949642702ab956f1acbfeab8908d923ba4

ref:
owner:717f5e224185cdc59be791c881fab2949642702ab956f1acbfeab8908d923ba4
```

The stale pre-008-v2 authorization `owner:85b9125...` is not reused.

## Independent implementation review

Reviewer independently reconstructed:

```text
base 23ca52715df7c52738edeb59206f496c7bf2d2a9
+ canonical 009(2) payload
+ Linux x64 node_modules bundle
+ exact Node/OpenSpec runtimes
```

Observed exact toolchain:

```text
Node      v22.23.2
pnpm      11.22.0
OpenSpec  1.10.0
```

Independent checks:

```text
TypeScript typecheck               PASS
targeted domain tests              PASS (13/13)
Prettier format check              PASS
git diff --check                   PASS
OpenSpec apply progress            10/10
OpenSpec status                    4/4 artifacts complete
OpenSpec strict validation         PASS (1/1)
```

Implementation conforms to the approved contract:

- one canonical semantic Change id; no `key` identity;
- fixed ten Standard Action identities;
- group remains metadata only;
- Owner / Author / Reviewer / Verification authority dimensions remain distinct;
- `OwnerAuthorityFact` frozen wire validation is fail-closed and does not implement Policy eligibility;
- Delivery/Change structural state literals are closed;
- no Action lifecycle state machine, Policy, persistence, CLI, group lifecycle or Git checkpoint implementation was introduced.

## Mutation review

Relative to canonical 008-v2:

- common historical/planning files are byte-identical except `tasks.md`;
- `tasks.md` changed only `[ ] -> [x]`;
- added implementation is limited to the approved `package.json`, `tsconfig.json`, `src/domain/**`, `tests/unit/domain/**`, and 009 Run;
- canonical 008-v2 result remains byte-identical.

## Non-blocking environment observation

The derived node_modules bundle contains pnpm workspace-state generated at `/build`.
When relocated, pnpm 11.22.0 default `verify-deps-before-run=install` may attempt a dependency reinstall even though the lockfile/dependency payload is correct.

Reviewer therefore also ran the package scripts with:

```text
pnpm_config_verify_deps_before_run=false
```

against the supplied immutable node_modules bundle; `typecheck`, `test:domain`, and `format:check` all PASS.

This is a detached dependency-bundle portability concern, not an implementation/contract defect in this Change, and does not block this Review Apply verdict.

## Verdict

```text
approved
```

No blocking findings.

## Next boundary

The implementation is approved. The next lifecycle boundary is **Owner authorize archive -> Author archive**.

This review does not authorize or execute archive, commit, push, checkpoint, or auto-next.
