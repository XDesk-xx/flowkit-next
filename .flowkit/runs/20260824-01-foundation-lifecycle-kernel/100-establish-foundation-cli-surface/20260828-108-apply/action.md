# Action — Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `apply`
- Logical Run id: `20260828-108-apply`
- Role: `author`
- Input Run: `20260828-107-review-propose`
- Base Git revision: `698538c` (owner-supplied checkpoint prefix; detached snapshot excludes `.git`)

## Execution

The reviewer-approved Proposal was implemented using upstream `openspec-apply-change` plus Flowkit `implementation-convergence`.

The implementation adds a focused production CLI composition layer while preserving all existing canonical Core authorities:

- one emitted `flowkit` package/bin target backed by a dedicated `tsconfig.build.json`;
- closed commands `status | next | doctor` using required `--input <json-file>` requests;
- exact current-Run addressing only, plus explicit `currentRunId:null` for the canonical no-current-Run branch;
- `next` delegates lifecycle legality exclusively to `evaluatePolicyAndNextBoundary(...)`;
- a pure checkpoint authorization evaluator reports authorization only and performs no Git operation;
- `doctor` composes existing managed OpenSpec/Archify resolution and exact-root OpenSpec observation, resolving Archify without invoking it;
- deterministic JSON machine results and closed non-zero error envelopes;
- no Delivery/current-Run discovery, history-based selection, self-hosting, `.agents` runtime dependency, OpenSpec mutation, Archify materialization or Git execution.

OpenSpec Apply progress reached `13/13 complete` / `all_done`.

## Verification

- focused CLI tests: `9/9 PASS`;
- complete domain tests: `116/116 PASS`;
- typecheck: PASS;
- production TypeScript build: PASS;
- format check: PASS;
- current Change strict validation: PASS;
- OpenSpec validate-all strict: `10/10 PASS`;
- emitted Node 22.23.2 CLI `status`: PASS;
- emitted CLI exact-Run `next -> ready-action(apply)`: PASS;
- emitted CLI explicit-null `next -> ready-action(explore)`: PASS;
- emitted CLI checkpoint authorization-only proof: PASS in a repository with no `.git`;
- emitted CLI `doctor` with managed OpenSpec 1.10.0 + Archify 2.15.0: PASS;
- fake PATH OpenSpec/Archify takeover markers: both absent;
- TypeScript code gate: PASS; all six new TypeScript files are below 500 lines and the historical 588-line Run persistence file remains byte-identical.

## Non-claims

- No independent `review-apply` has been performed by this Run.
- No final Windows/Linux whole-manager acceptance, Delivery Full Test, archive, checkpoint commit, Archify Delivery Final materialization or Owner promotion is claimed.
