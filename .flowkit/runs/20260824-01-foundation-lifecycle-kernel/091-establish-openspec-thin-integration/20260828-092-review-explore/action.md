# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `review-explore`
- Logical Run id: `20260828-092-review-explore`
- Role: `reviewer`
- Input Run: `20260828-091-explore`
- Review chain start: `20260828-091-explore`

## Review boundary

Reviewer independently checked 091 under the repository `review-explore` model, with special attention to implementation-scope containment.

The review verified:

- the Delivery has exactly one active Change: `establish-openspec-thin-integration`;
- both declared dependencies are completed;
- 091 itself carries no production source/test mutation and no Proposal/spec/design/tasks;
- OpenSpec remains formal Change-artifact authority and Policy remains free of OpenSpec filesystem/CLI reads;
- the already accepted managed-tool resolver is sufficient to select the exact managed OpenSpec 1.10.0 entrypoint without PATH fallback;
- real OpenSpec 1.10.0 `list --json` and `status --change <id> --json` provide the machine facts required by the current Delivery output;
- missing Change may return exit 1 with valid machine JSON, so non-zero exit cannot be collapsed into process/transport failure;
- running from a nested cwd can silently bind OpenSpec to the parent project, so successful observations must verify exact requested-root binding;
- current accepted source baseline remains healthy;
- canonical OpenSpec specs reconstructed after the preceding accepted archives remain healthy.

## Verdict

`approved`

No current-scope Explore blocker remains. The Change is ready for Proposal.

## Implementation boundary — MUST remain narrow

This approval explicitly allows one real product integration module to invoke the exact managed OpenSpec entrypoint, because observation cannot exist without an invocation seam.

That permission is bounded as follows.

### 1. Closed observation commands only

V1 product behavior is limited to the two currently justified observations:

- list the repo-local non-archived/formal Change set;
- observe one exact Change's formal artifact/planning status.

The implementation MUST NOT expose a generic public `runOpenSpec(args)` / arbitrary-command executor.

The command/argument shapes must remain internal, closed and hard-bounded to the approved observations.

### 2. No adjacent OpenSpec commands

Do not implement or expose wrappers for:

- `instructions`
- `context`
- `validate`
- `show`
- `new change`
- `archive`
- any other mutating or workflow-driving operation

merely because OpenSpec offers them.

A future concrete Flowkit consumer must justify any additional command surface.

### 3. Project observations, not raw CLI transport

Public Flowkit results should project only the machine fields required by the approved observations.

Do not make these stable Flowkit public contract fields merely because OpenSpec returns them:

- raw stdout/stderr;
- arbitrary exit-code/result passthrough;
- `nextSteps`;
- `actionContext`;
- instruction text;
- unrelated OpenSpec payload fields.

Non-zero + valid OpenSpec machine JSON must remain distinguishable from spawn/process/malformed-output failure, but this does not authorize a generic raw OpenSpec command-result API.

### 4. Exact invocation seam

Internal invocation must use:

- existing `resolveManagedTool({ toolId: "openspec" })`;
- current host Node via `process.execPath`;
- the resolved exact managed entrypoint;
- argument-array process execution without shell lookup;
- explicit requested repository cwd;
- no PATH/global OpenSpec fallback.

This Change does not install, download, update or select Node/OpenSpec versions.

### 5. Exact root binding

For a successful observation, both requested repository root and OpenSpec-reported `root.path` must be compared as canonical host paths.

A nested/wrong cwd that OpenSpec resolves upward to a parent project must fail closed for this adapter.

Do not broaden this into a generic repository discovery service.

### 6. Closed shape validation

Validate only the machine shape needed by the approved observation.

Do not parse English error text to recreate OpenSpec lifecycle semantics.

Do not mirror OpenSpec artifact state into `.flowkit`.

### 7. No Core-authority coupling

This Change MUST NOT modify or extend:

- Policy / `READY_ACTION`;
- CurrentAction or Action lifecycle;
- Run/Result;
- ActionPackage;
- Reviewer/Verification/Owner authority;
- Cross-Delivery Memo semantics.

A future caller may consume the observation, but the observation itself never becomes Policy or authority truth.

### 8. No bootstrap Skill/self-hosting coupling

Production code MUST NOT read or execute `.agents/skills/**`.

Current Skills continue to drive development-time OpenSpec workflow until a later explicitly authorized self-hosting phase.

## Independent proof

Reviewer independently reproduced with real OpenSpec 1.10.0:

- exact-root `list --json`: PASS;
- exact-root `status --change establish-openspec-thin-integration --json`: PASS;
- `root.path` exact match on both successful observations: PASS;
- nonexistent Change: exit 1 + valid machine JSON: PASS;
- nested cwd resolves parent OpenSpec root: PASS;
- exact-root adapter would therefore reject the nested-root mismatch: PASS.

Result: `6/6 PASS`.

Current reconstructed baseline:

- Node `22.23.2` proof fixture;
- typecheck: PASS;
- complete domain suite: `91/91 PASS`;
- format: PASS;
- canonical OpenSpec specs: `8/8 strict PASS`;
- active Change planning state: `0/4`, Proposal ready.

## Review limitation

The exact checkpoint archive named by 091 (`...-91d1271.zip`) was not supplied in this review turn, so its archive SHA/Git revision was not independently re-derived from that exact file.

This is non-blocking for Explore readiness because 091 is a six-file Explore/activation overlay with no production implementation mutation, while the material source/spec/OpenSpec 1.10.0 behavior claims were independently reconstructed and reproved.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or production implementation was created.
- No generic OpenSpec service layer, workflow driver, mutation adapter, Foundation CLI, Git checkpoint implementation, Archify integration, Skill migration, self-hosting behavior or Verification PASS is introduced.
