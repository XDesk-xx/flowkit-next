# Action — Review Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `review-apply`
- Logical Run id: `20260828-096-review-apply`
- Role: `reviewer`
- Input Run: `20260828-095-apply`
- Review chain start: `20260828-091-explore`

## Review chain

`091 explore → 092 review-explore approved → 093 propose → 094 review-propose approved → 095 apply → 096 review-apply`

## Review boundary

Reviewer independently checked:

- historical 091–094 Run records remain byte-identical in 095;
- approved Explore / Proposal / Design / Spec / Delivery manifest remain unchanged;
- 095 mutations are limited to the approved focused observation module, index export, two focused test files, task completion, and the 095 durable Run;
- no dependency, generic process/tool framework, public arbitrary OpenSpec executor, adjacent OpenSpec command wrappers, Policy/Memo/Run/authority coupling, Skill runtime dependency, self-hosting, Foundation CLI or Archify integration was introduced;
- the exact managed OpenSpec runtime is used with current host Node, argument-array child process execution, requested cwd and no PATH/shell fallback;
- successful observations exact-bind canonical requested root to OpenSpec `root.path`;
- list/status success projections remain narrow and transient;
- current accepted source/spec baseline and real OpenSpec 1.10.0 observation behavior were independently rerun.

## Verdict

`changes-requested`

One blocking fail-closed implementation defect remains.

### RA-096-001 — arbitrary non-zero JSON object is misclassified as an OpenSpec formal outcome

The approved Spec requires the non-zero branch to preserve a **valid OpenSpec machine JSON formal outcome**, not merely any parseable JSON object.

Current implementation performs:

`parseMachineDocument(stdout)`
→ if result is any object
→ if `exitCode !== 0`
→ `openspec-formal-outcome`

No formal-outcome machine-shape check occurs before that classification.

Reviewer reproduced:

1. non-zero + `{}`
   - actual: `openspec-formal-outcome`
   - required: malformed/invalid machine shape

2. non-zero + `{"hello":"world"}`
   - actual: `openspec-formal-outcome`
   - required: malformed/invalid machine shape

3. non-zero + `[]`
   - actual: `invalid-machine-shape`
   - demonstrates only the generic object gate currently separates the branch

Real OpenSpec 1.10.0 missing-Change output was independently observed as:

- exit `1`;
- JSON object with a `status` array;
- status item carrying machine fields such as `severity`, `code`, and `message`.

The current defect therefore weakens the fail-closed machine boundary: unrelated object-shaped output can be promoted into a trusted OpenSpec formal-outcome category.

### Minimum required revision

Keep the existing narrow adapter.

Before classifying a non-zero result as `openspec-formal-outcome`, validate only the minimal closed machine envelope needed to prove it is an OpenSpec formal outcome for the current managed version.

For example, validate the current OpenSpec 1.10.0 `status` machine envelope structurally enough to distinguish it from arbitrary JSON objects.

Do NOT:

- parse English `message` text;
- map OpenSpec error codes into Flowkit lifecycle semantics;
- create a generic OpenSpec error model;
- expose raw stdout/stderr/exit code;
- add wrappers for other OpenSpec commands.

Add focused negative tests for at least `{}` and an unrelated object on non-zero exit, while preserving the real missing-Change formal-outcome case.

## Confirmed Apply facts

- typecheck: PASS;
- complete domain suite: `105/105 PASS`;
- format: PASS;
- current Change strict validation: PASS;
- OpenSpec validate-all strict: `9/9 PASS`;
- tasks: `9/9 all_done`;
- real managed OpenSpec 1.10.0 list observation: PASS;
- real exact Change status observation: PASS;
- real missing-Change exit 1 + OpenSpec status JSON: correctly reaches formal-outcome;
- conflicting PATH cannot redirect managed OpenSpec: PASS;
- successful exact-root binding: PASS;
- public command surface remains only list/status: PASS;
- no `.flowkit` OpenSpec-state mirror or OpenSpec mutation: PASS;
- no production dependency on `.agents/skills/**`: PASS.

## Non-claims

- Reviewer did not modify Author implementation or tests.
- `review-apply = changes-requested` is not Delivery Verification FAIL.
- No archive, checkpoint, Owner authority, Foundation CLI, Archify integration, Skill migration, self-hosting or whole-manager acceptance was performed.
