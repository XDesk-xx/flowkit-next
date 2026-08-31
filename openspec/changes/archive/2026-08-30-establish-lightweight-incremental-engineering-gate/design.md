## Context

See `proposal.md` and the approved `explore.md`. Current repository already declares ESLint 9, `@eslint/js`, `typescript-eslint`, Prettier and Git-based workflows, but has no ESLint config or stable mechanical Gate command. Proof shows whole bounded checks remain interactive, selected lint can reach a zero baseline with six exact mechanical cleanups, and no changed-file/baseline subsystem is justified.

## Goals / Non-Goals

**Goals:**

- Establish one obvious repository-local command for the selected mechanical Gate.
- Reuse existing Git, Prettier and ESLint capabilities before adding custom code.
- Keep custom repository logic limited to forbidden tracked-artifact detection.
- Make the selected lint baseline zero with only the six Explore-proven unused artifacts.
- Preserve a few-second interactive boundary and deterministic non-zero failure behavior.

**Non-Goals:**

- No typecheck/build/test/OpenSpec/Archify execution inside this Gate.
- No dependency-cruiser, Knip, Full Test, Verification verdict persistence, evidence platform or quality dashboard.
- No changed-file resolver, merge-base planner, waiver/baseline registry or generic path policy.
- No new npm dependency.

## Decisions

### Decision 1: Use one package entrypoint `quality:gate`

`package.json` will expose one stable command:

```text
pnpm quality:gate
```

It will compose, in fail-fast order:

```text
git diff --check HEAD
→ format:check
→ lint
→ forbidden tracked-artifact check
```

Rationale: each underlying check already has stable process-exit semantics, and proof shows whole bounded execution is only a few seconds. A custom Gate framework or JSON result model would add no accepted value.

Alternative rejected: a changed-file planner/registry. It is unnecessary while zero-baseline whole-source checks are cheap.

### Decision 2: Add a flat `eslint.config.mjs` using only the proven rule surface

The config will reuse:

```text
@eslint/js recommended
+ typescript-eslint recommended
```

and add only the approved overrides:

- production `src/**/*.ts`: `max-lines` with `max: 650`, `skipBlankLines: false`, `skipComments: false`;
- exact `src/domain/run-result-persistence.ts`: `no-control-regex: off`;
- tests `tests/**/*.ts`: `@typescript-eslint/no-explicit-any: off`;
- tests: keep `@typescript-eslint/no-unused-vars` as error with `varsIgnorePattern: '^_'` and `argsIgnorePattern: '^_'`;
- retain upstream `@typescript-eslint/ban-ts-comment` and production `no-explicit-any` behavior.

The config will ignore non-Gate-owned durable/generated surfaces such as `.flowkit/**`, `openspec/**`, `architecture/**`, `dist/**` and `node_modules/**`.

Rationale: this is the exact surface independently reproduced by Reviewer. Type-aware/semantic lint configurations are not introduced.

Alternative rejected: broad recommended rules without overrides, because proof shows 14 current errors including intentional test/control-regex cases.

### Decision 3: Use ESLint `max-lines` for the hard source-size ratchet

No custom line-count script will be created. `src/**/*.ts` receives `max-lines=650`; the `~600` target remains documentation/guidance only.

Rationale: proof reproduced `650 → PASS` and `651 → FAIL`, and current maximum is 588 lines.

Alternative rejected: a custom source-size scanner or per-file baseline.

### Decision 4: Perform only the six proven zero-baseline cleanup edits

Apply will remove exactly the unused artifacts proven in Explore from:

```text
src/domain/action-package-result-admission.ts
src/domain/openspec-observation.ts
src/domain/single-action-execution.ts
tests/unit/domain/foundation-cli-surface.test.ts
```

No neighboring cleanup/refactor is authorized by this Change.

Rationale: disposable proof showed selected ESLint, typecheck and 124/124 domain tests pass after only these changes.

### Decision 5: Add one tiny forbidden tracked-artifact script

Add:

```text
scripts/check-forbidden-tracked-artifacts.mjs
```

The script will read Git-tracked paths (via `git ls-files` or equivalent Git command) and enforce only the accepted matcher:

```text
any segment:
node_modules / dist / coverage / .tmp

repository root only:
tools / runtime

filename suffix anywhere:
*.node-modules.tar.gz
*.pnpm-store.tar.gz
```

Diagnostics will list violating paths and exit non-zero. No mutation is performed.

Rationale: `.gitignore` can be bypassed by force-add, while a small tracked-path scan closes the selected repository-specific gap.

Alternative rejected: generic path mutation policy / registry.

### Decision 6: Keep formatting bounded and explicitly include Gate-owned files

Update existing `format` / `format:check` surfaces to retain current source/test/config inputs and add only Gate-owned files:

```text
eslint.config.mjs
scripts/check-forbidden-tracked-artifacts.mjs
```

Do not switch to `prettier --check .`.

Rationale: whole-repository formatting would absorb `.flowkit`, OpenSpec and architecture artifacts outside this Change's ownership.

## Risks / Trade-offs

- **[Recommended configs evolve across dependency upgrades]** → Current dependency versions and exact overrides are committed; future dependency upgrades must be reviewed through normal engineering Change flow rather than silently changing this Gate.
- **[650 lines is intentionally coarse]** → Keep it as a mechanical ratchet, not a maintainability score; `~600` remains human guidance and no waiver/baseline subsystem is added.
- **[Whole-source lint/format may grow over time]** → Current proof establishes a few-second boundary. If future repository scale invalidates that fact, optimization is a later proof-based Change rather than pre-building changed-file planning now.
- **[Forbidden matcher can false-positive if generalized]** → Keep exact path semantics and tests for legal nested `config/tools/**` / `skills/tools/**`.

## Migration Plan

1. Add `eslint.config.mjs` and the forbidden tracked-artifact script.
2. Remove only the six proven unused artifacts and format touched files.
3. Add `lint` and `quality:gate` package scripts; expand bounded format scripts to Gate-owned files.
4. Add focused tests for forbidden-path matching and Gate-relevant boundary behavior where practical without creating a new test framework.
5. Run the new Gate and existing correctness checks used only for implementation verification (typecheck/build/domain/acceptance as applicable); do not add those correctness checks to `quality:gate`.
6. Validate OpenSpec artifacts and `git diff --check` before Reviewer handoff.

Rollback is ordinary Git revert of this bounded Change; no persistent Gate registry/baseline data exists.
