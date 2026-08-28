# Action — Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `validate-foundation-manager-cross-platform`
- Action: `propose`
- Logical Run id: `20260828-115-propose`
- Role: `author`
- Input Run: `20260828-114-review-explore`
- Base Git revision: `9592a3042dd8b49b35920850038753ae10b67348` (from owner-supplied checkpoint archive metadata; detached snapshot excludes `.git`)

## Execution

The approved `113 explore → 114 review-explore approved` chain was converged into the smallest formal OpenSpec planning contract using upstream `openspec-propose` plus the Flowkit `proposal-convergence` discipline.

This is a pure acceptance/tooling Change. OpenSpec `.openspec.yaml` now declares `skip_specs: true`; no new or modified canonical product capability is proposed.

The Proposal freezes these boundaries:

- detached Linux x64 is the real primary whole-manager acceptance environment;
- Windows evidence is explicitly `windows-compatibility-simulation`, never `Windows Native PASS`;
- one focused acceptance test surface exercises built `dist/**`, real managed OpenSpec `1.10.0` / Archify `2.15.0`, explicit `FLOWKIT_HOME`, disposable candidate-generated OpenSpec/Run fixtures, emitted `status/next/doctor`, Policy/checkpoint authorization, CRLF/spaced request paths and fake-PATH isolation;
- Delivery 01 bootstrap Runs remain external-orchestrator history and cannot be reused as candidate self-management evidence;
- package wiring is limited to a focused `test:acceptance` command and formatting scope if needed; no generic test orchestrator, gate registry, Verification database, background runner or new Full Test state machine is introduced;
- the literal reusable Delivery Full Test gate family is frozen to typecheck, format check, production build, full domain regression, exact managed OpenSpec `validate --all --strict`, and the focused acceptance suite;
- lint is not invented because no current executable lint contract exists;
- formal Delivery Full Test remains deferred until final Change archive → exact checkpoint candidate → explicit Owner Full Test authorization;
- production source and canonical specs are expected to remain unchanged during Apply; any acceptance-discovered product defect requires STOP + Proposal/Owner reauthorization rather than a silent product fix in this Change;
- all new/modified TypeScript files remain under the existing 500-line code gate.

No contract-changing unknown emerged during Proposal convergence.

## Stable output

- `.openspec.yaml` with `skip_specs: true`
- `proposal.md`
- `design.md`
- `tasks.md`
- no delta spec by design
- this durable Propose Run

## Non-claims

- No production source, product test, package/build implementation, canonical spec, Full Test execution or Verification verdict was created by this Propose Run.
- No native Windows PASS, self-hosting, Git execution, OpenSpec product mutation, Archify materialization, Delivery Final or Owner promotion is introduced.
