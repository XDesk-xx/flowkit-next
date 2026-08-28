# Action — Revise Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `revise-explore`
- Logical Run id: `20260828-102-revise-explore`
- Role: `author`
- Input Run: `20260828-101-review-explore`
- Trigger: Reviewer `changes-requested`

## Revision

Reviewer identified one unsafe inference in 100: durable Run sequence ordering is stable history, but it is not current-Action authority. A disconnected higher-sequence valid Run can exist and would be incorrectly selected by a `max(sequence)` heuristic.

This revision closes `RE-101-001` without adding a persistence or self-hosting subsystem:

1. V1 caller/host MUST supply the exact authoritative current Run reference (`runId` or equivalent exact occurrence) together with the existing explicit repository/Delivery/Change structural context;
2. CLI validates/parses that exact reference and reads only that occurrence through `readDurableRun(...)`;
3. CurrentAction is reconstructed only from the explicitly selected Run context;
4. terminal selected context passes its exact linked context/result to Policy;
5. prepared selected context passes no manufactured terminal facts;
6. `listChangeRunHistory(...)` may support reporting only; max sequence, mtime, directory order or Git order MUST NOT select lifecycle authority.

Focused proof recreated the reviewer counterexample with disconnected sequence 101 and 999 Runs. History still orders 999 last and a hypothetical max-sequence selection can produce `ready-checkpoint-evaluation`, while explicit selection of Run 101 deterministically reads Run 101 and produces `ready-action(archive)`. The disconnected Run cannot affect Policy unless explicitly selected.

## Stable output

- revised `explore.md` preserving the failed max-sequence proof as historical evidence;
- this durable Revise Explore Run.

## Non-claims

- No Proposal/spec/design/tasks were created.
- No production source or tests were modified.
- No current-action registry, Run-lineage database or automatic Run selection was added.
- No self-hosting, Skill execution, Delivery discovery, Archify materialization, OpenSpec mutation or Git execution was introduced.
