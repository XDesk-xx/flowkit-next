# 020 Apply — establish-lightweight-incremental-engineering-gate

## Identity

- Delivery: `20260829-02-lightweight-incremental-engineering-quality`
- Change: `establish-lightweight-incremental-engineering-gate`
- Action: `apply`
- Run: `20260830-020-apply`
- Role: `author`
- Input Run: `20260830-019-review-propose`
- Base: `e2c0e4ed21ac872993197aaf17c006c41cb448ba`

## Bounded implementation

Implemented only the approved mechanical Gate surface:

- added `eslint.config.mjs` with the approved source/test overrides and `src/**/*.ts` `max-lines=650`;
- removed exactly the six Explore-proven unused artifacts from four existing files;
- added the read-only `scripts/check-forbidden-tracked-artifacts.mjs` exact matcher;
- expanded bounded Prettier ownership to `src`, `tests`, existing config plus the two Gate-owned files;
- added `lint`, `check:forbidden-tracked-artifacts`, and stable `quality:gate` package scripts.

No npm dependency or lockfile mutation occurred. No typecheck/build/test/OpenSpec/Archify/dependency-cruiser/Knip/Full Test execution was added to `quality:gate`.

## Verification

- selected lint zero-baseline proof: PASS;
- six-item cleanup + typecheck + domain regression: PASS;
- forbidden tracked-artifact positive/negative fixtures: PASS;
- Gate counterexamples for whitespace, 650/651 lines, TS suppression, production explicit-any, and forbidden tracked artifacts: PASS;
- test explicit-any / underscore-discard boundary: PASS;
- `pnpm quality:gate`: PASS;
- `pnpm typecheck`: PASS;
- `pnpm build`: PASS;
- domain tests: `124 / 124` PASS;
- acceptance tests: `4 / 4` PASS;
- OpenSpec Change strict: PASS;
- OpenSpec all strict: `11 / 11` PASS;
- `git diff --check HEAD`: PASS.

Detached verification reused the prepared dependency snapshot and disabled pnpm's run-time automatic dependency rebuild; no environment repackaging is part of this Change.

## Conclusion

```text
PASS
```

All `10 / 10` Apply tasks are complete.

## Next boundary

```text
review-apply
```
