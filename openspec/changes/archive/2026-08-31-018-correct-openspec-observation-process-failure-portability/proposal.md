## Why

现有 `openspec-thin-integration` 使用 self-`SIGKILL` fixture 作为通用“managed process abnormal termination”证明，但 exact Node 22.23.2 在 Windows 与 Linux 对该 fixture 暴露不同的 child-process outcome，导致 Windows `test:domain` 将一个 numeric close + empty stdout 错误地期待为 `openspec-process-failed`。当前 production classification 已按 host-observable `{code, signal, stdout}` 工作，因此需要澄清 formal contract 的 observable precedence，并把非跨平台测试改成 deterministic portable boundary proof，而不是引入 Windows 特判或新的 process machinery。

## What Changes

- 澄清 `openspec-thin-integration` 的 process-failure precedence：只依据 host 实际暴露的 invocation/close facts；spawn/error、`code=null` 或 `signal!=null` 才属于 host-observable process failure。
- 明确 numeric close 已形成时先要求 valid machine JSON：numeric close + malformed/empty required stdout 继续归类为 `malformed-machine-output`；numeric non-zero + valid formal JSON 继续归类为 `openspec-formal-outcome`。
- 保持现有 diagnostic taxonomy 与 production classification semantics，不增加 `win32 + code=1`、non-zero + empty stdout、stderr inference 等 heuristic。
- 将当前 universal self-`SIGKILL` assertion 替换为 deterministic portable boundary coverage；如需要，只抽取一个不进入 public API 的极小 process-outcome classification seam 以直接测试现有 `{code, signal}` 判定。
- 不新增 dependency、不修改 package/lock、不建立 process supervisor/runtime abstraction，也不并入 `establish-explicit-applicable-check-execution`。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec-thin-integration`: 澄清 host-observable process failure、numeric close machine-output parsing 与 formal non-zero outcome 之间的 portable classification precedence。

## Impact

- Canonical spec: `openspec/specs/openspec-thin-integration/spec.md` 的一条 requirement 会获得最小语义澄清。
- Implementation: 默认保持 `src/domain/openspec-observation.ts` 的现有 externally observable classification；若 deterministic proof 需要，可仅抽取内部纯 classification seam，不改变 public export surface。
- Tests: 修正 `tests/unit/domain/openspec-observation-boundary.test.ts` 的非跨平台 self-`SIGKILL` universal assertion，并保留 process-failure / malformed-output / formal-outcome 三类显式覆盖。
- Dependencies / package / lock / architecture: 无预期变化；`architectureImpact=false`。
