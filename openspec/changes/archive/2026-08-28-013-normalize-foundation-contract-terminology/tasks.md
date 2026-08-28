## 1. Canonical terminology correction

- [x] 1.1 Apply the `openspec-thin-integration` requirement rename through the approved `RENAMED Requirements` delta and verify the archived requirement body/scenarios remain unchanged.
- [x] 1.2 Apply the full `policy-and-next-boundary` Owner-correction `MODIFIED Requirements` delta with only `Policy V1` → `Policy`, and verify every other predicate and scenario remains unchanged.

## 2. Boundary and regression verification

- [x] 2.1 Verify canonical `openspec/specs/**` contains no remaining Flowkit-internal `V1`/`V2`/`V3` hierarchy wording while preserving legitimate OpenSpec/Archify/Node/schema/package version facts.
- [x] 2.2 Verify `src/**`, `tests/**`, package/build configuration, `.agents/**`, `.flowkit/memos.json`, repository guidance, archived Change artifacts and prior Runs are unchanged.
- [x] 2.3 Run strict OpenSpec validation plus existing typecheck, format, build and domain regression gates; confirm no functional behavior change and stop/re-scope if any predicate or scenario drift is detected.
