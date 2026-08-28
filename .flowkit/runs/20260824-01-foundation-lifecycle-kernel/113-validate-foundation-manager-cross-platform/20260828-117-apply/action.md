# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `validate-foundation-manager-cross-platform`
- Action: `apply`
- Logical Run id: `20260828-117-apply`
- Role: `author`
- Input Run: `20260828-116-review-propose`
- Review chain start: `20260828-113-explore`
- Checkpoint base: `9592a30`

## Approved boundary

Applied the 116-approved acceptance/tooling-only Proposal with `skip_specs: true`.

Implemented only:

- one focused `tests/acceptance/foundation-manager.acceptance.test.ts` surface;
- one `pnpm test:acceptance` package script and Prettier scope wiring;
- the literal deferred Delivery Full Test environment/gate contract;
- task completion and this durable Apply handoff.

No `src/**` or canonical `openspec/specs/**` file changed. No lint policy, runtime dependency, generic gate/Verification framework, Git execution, OpenSpec product mutation, Archify materialization, self-hosting, Delivery Final, checkpoint or Owner promotion was introduced.

## Whole-manager Change evidence

The decisive acceptance uses built `dist/**`, Node `22.23.2`, explicit `FLOWKIT_HOME`, real managed OpenSpec `1.10.0` and Archify `2.15.0`, and disposable candidate-generated canonical Run/OpenSpec fixtures.

`pnpm test:acceptance` produced `4/4 PASS`:

1. detached prerequisites are explicit and fail closed for absent/inconsistent managed-runtime inputs;
2. emitted APIs execute terminal Apply/Archive, durable Run round-trip succeeds, emitted CLI `status` / `next` consume the candidate-owned fixture, explicit `currentRunId:null` returns `ready-action(explore)`, and exact archive + Owner checkpoint authority returns `authorized=true` without `.git`;
3. emitted `doctor` reports managed OpenSpec `1.10.0` / Archify `2.15.0` and exact root while fake PATH executables remain unused;
4. `windows-compatibility-simulation` covers Windows path-with-spaces, Run/Memo composition, portable managed entrypoint, mixed-case same-drive containment and cross-drive escape classification without any native Windows claim.

CRLF request JSON and request paths containing spaces are exercised through argv with `shell:false`.

## Frozen Delivery Full Test contract

Formal Full Test remains `deferred` and `delivery.fullTestStatus` remains `not-ready`.

After final Change archive → exact checkpoint candidate → explicit Owner Full Test authorization, the frozen gate order is:

1. `pnpm typecheck`
2. `pnpm format:check`
3. `pnpm build`
4. `pnpm test:domain`
5. exact managed OpenSpec `1.10.0`: `validate --all --strict`
6. `pnpm test:acceptance`

Detached reproducibility uses restored dependencies, pnpm `11.22.0`, and `pnpm_config_verify_deps_before_run=false` so the restored offline node_modules fixture cannot trigger an implicit `pnpm install`. No install/update/download/network fallback is part of the contract.

Lint is intentionally absent because the repository has no executable lint contract.

## Apply verification

- OpenSpec apply progress: `14/14`, `all_done`;
- `pnpm typecheck`: PASS;
- `pnpm format:check`: PASS;
- `pnpm build`: PASS;
- domain tests: `116/116 PASS`;
- exact managed OpenSpec `validate --all --strict`: `11/11 PASS`;
- acceptance: `4/4 PASS`;
- new/modified TypeScript code gate: `403 < 500` lines;
- `src/**` + canonical `openspec/specs/**`: SHA-256 baseline check PASS / byte-identical;
- package lint script: ABSENT;
- new runtime dependencies: NONE.

These are Author/Change acceptance facts only. They are **not** a formal Delivery Verification verdict and do not make Full Test ready.

## Stop boundary

This Action stops at `review-apply`.
