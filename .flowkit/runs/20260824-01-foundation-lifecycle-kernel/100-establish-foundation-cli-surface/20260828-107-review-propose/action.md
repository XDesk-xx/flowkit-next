# Action — Review Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `review-propose`
- Logical Run id: `20260828-107-review-propose`
- Role: `reviewer`
- Input Run: `20260828-106-revise-propose`
- Review chain start: `20260828-100-explore`

## Review chain

`100 explore → 101 review-explore changes-requested → 102 revise-explore → 103 review-explore approved → 104 propose → 105 review-propose changes-requested → 106 revise-propose → 107 review-propose`

## Review boundary

Reviewer independently checked:

- historical 100–105 Run records remain byte-identical;
- the 103-approved Explore artifact and Delivery manifest remain unchanged;
- 106 changes only Proposal/spec/design/tasks plus its durable Revise Propose Run;
- RP-105-001 is formalized consistently across Proposal/spec/design/tasks;
- `next` now has exactly two explicit current-Run choices:
  - exact canonical runId: parse/read only that exact occurrence;
  - explicit JSON `currentRunId:null`: read no Run and pass null CurrentAction/RunContext/Result facts to canonical Policy;
- omitted/malformed currentRun input remains fail closed and is not normalized to explicit null;
- disconnected higher-sequence history remains non-authoritative in both branches;
- no history scan, latest/max-sequence inference, current-action registry, Run-lineage subsystem or Delivery discovery is introduced;
- `status | next | doctor` remains a closed CLI command family;
- `next` continues to delegate lifecycle legality exclusively to canonical Policy rather than copying transitions;
- checkpoint evaluation remains authorization-only and performs no Git mutation;
- OpenSpec remains read-only, Archify remains diagnostic identity only, and production code remains independent of `.agents/skills/**`.

## Verdict

`approved`

No blocking Proposal finding remains. The planning contract is ready for Apply.

## Closure of RP-105-001

Reviewer directly invoked the current canonical Policy with:

```text
changeState = active
currentAction = null
terminalRunContext = null
terminalResult = null
ownerCorrection = null
```

Result:

```text
ready-action(explore)
```

The revised planning now exposes exactly this existing canonical branch through explicit `currentRunId:null` without repository-history inference.

The previously approved exact-run authority rule remains intact:

- exact runId selects only that exact durable occurrence;
- history ordering is reporting only;
- a disconnected higher-sequence Run cannot influence Policy composition.

## Apply hard boundaries

1. `currentRunId:null` is an explicit caller fact, not an inference. Do not scan history to prove emptiness.
2. Omitted/malformed currentRun input must fail closed and must not fall back to null or latest.
3. Exact runId must continue through existing canonical occurrence parsing and controlled durable Run read.
4. Do not add current-action persistence, current-Run registry, lineage validation, Delivery discovery or self-hosting.
5. Keep CLI command catalog closed to `status | next | doctor`.
6. Keep Policy transition ownership in `evaluatePolicyAndNextBoundary(...)`.
7. Keep checkpoint authorization separate from Git execution and do not recreate MutationDeclaration/per-file mutation authority.
8. Keep OpenSpec read-only and Archify resolution-only in this Change.

## Independent verification

- Node proof fixture: `22.23.2`;
- typecheck: PASS;
- complete domain suite: `107/107 PASS`;
- format check: PASS;
- OpenSpec planning: `4/4 complete`;
- current Change strict validation: PASS;
- OpenSpec validate-all strict: `10/10 PASS`;
- canonical Policy explicit no-current branch: `ready-action(explore)`;
- production source/test/package mutation by 106: NONE.

## Non-claims

- Reviewer did not modify Author planning artifacts.
- No Apply/source/test/build implementation was created.
- `review-propose = approved` is not Delivery Verification PASS.
- No automatic discovery, self-hosting, Git execution, Archify materialization, OpenSpec mutation, Full Test or Owner promotion is introduced.
