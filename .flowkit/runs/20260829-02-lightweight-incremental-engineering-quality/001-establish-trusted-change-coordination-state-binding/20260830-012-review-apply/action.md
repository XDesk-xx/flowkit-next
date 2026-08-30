# 012 Review Apply — establish-trusted-change-coordination-state-binding

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-trusted-change-coordination-state-binding`
- Action: `review-apply`
- Run: `20260830-012-review-apply`
- Role: `reviewer`
- Input Run: `20260830-011-apply`
- Review chain start: `20260830-001-explore`

## Proposal fidelity

Reviewer independently inspected the implementation delta.

The implementation faithfully carries the approved contract:

```text
repository-owned Delivery manifest
+ exact Delivery / Change identity
+ exact activate-change scope=["explore"] provenance
+ active-only direct dependency completion
↓
trusted read-only coordination resolver
↓
canonical ChangeState
↓
status + next
↓
pure Policy
```

Confirmed:

- authority-bearing caller `changeState` is removed from the request contract;
- legacy caller `changeState` is rejected as unsupported input;
- `status` and `next` share the same trusted resolver;
- non-active durable states remain reportable without activation provenance/dependency completion;
- durable `active` requires exact activation provenance and completed direct dependencies;
- wrong scope / wrong Delivery / wrong Change fail closed;
- Policy implementation is unchanged and remains IO-free;
- checkpoint authority remains separate;
- no second coordination store, registry, reconciliation engine, automatic activation, generic authority subsystem, or V1/V2 contract family was introduced;
- `yaml` is directly declared in package truth.

## Independent implementation checks

Reviewer reconstructed the candidate from the accepted base + approved OpenSpec proposal + Apply delta.

Artifact hashes declared by Author match the supplied Apply files.

With an externally prepared direct `yaml` link matching the new package/lock truth, Reviewer independently reproduced:

```text
Node 22.23.2
format check                 PASS
typecheck                    PASS
build                        PASS
domain tests                 124 / 124 PASS
acceptance tests             4 / 4 PASS
OpenSpec Change --strict     PASS
OpenSpec --all --strict      11 / 11 PASS
git diff --check             PASS
```

This supports the implementation logic itself.

## Blocking finding

### RA-012-001 — documented YAML runtime-resolution evidence is not reproducible from the stated prepared D02 environment

The Author Result claims:

```text
directYamlRuntimeResolution = PASS
```

and the Apply action states:

```text
Direct runtime import("yaml") resolves to the prepared D02 dependency snapshot.
```

Reviewer independently restored the uploaded prepared D02 dependency environment:

```text
flowkit-next-d02-dependency-environment-linux-x64-node22.23.2-pnpm11.22.0-runtime-v1.tar.gz
```

That archive contains:

```text
node_modules/.pnpm/yaml@2.9.0/...
```

as a transitive package, but it does NOT contain the top-level direct dependency link:

```text
node_modules/yaml
```

Against the reconstructed exact candidate and the archive restored as-is:

```text
node --input-type=module -e 'import("yaml")'
→ ERR_MODULE_NOT_FOUND

tsc --noEmit
→ TS2307 Cannot find module 'yaml'
```

Therefore the stated check is not reproducible from the documented prepared environment artifact.

After Reviewer externally created the direct dependency link corresponding to the new package/lock truth:

```text
node_modules/yaml
→ .pnpm/yaml@2.9.0/node_modules/yaml
```

the implementation checks passed.

This demonstrates:

```text
implementation logic
→ appears correct

but

011 verification/environment evidence
→ is incomplete or overstates what the pre-existing prepared archive provides
```

## Required smallest revise-apply

Do NOT reopen the approved implementation contract or put detached archive packaging back into OpenSpec tasks.

Revise only the Apply evidence/environment handoff:

1. Explicitly distinguish:
   ```text
   pre-existing prepared D02 dependency archive
   ≠ exact post-package-mutation node_modules layout
   ```
2. Use an explicitly prepared external execution environment whose `node_modules` reflects the exact new `package.json` + `pnpm-lock.yaml` direct dependency layout.
3. Re-run the declared Apply checks in that exact environment.
4. Record the exact external environment preparation/identity used for those checks.
5. Do not claim the old prepared archive resolves direct `import("yaml")` as-is.
6. Keep detached archive regeneration outside this OpenSpec Change lifecycle. A later external packaging step may materialize the exact environment for reuse, but it is not a Change task or completion condition.

No production-code revision is requested by this finding unless the Author independently discovers a real implementation defect while reproducing the checks.

## Verdict

```text
changes-requested
```

## Next boundary

```text
revise-apply
```

Reviewer did not mutate production/package truth, revise Author artifacts, archive the Change, run Delivery Formal Full Test, checkpoint, commit, push, or merge.
