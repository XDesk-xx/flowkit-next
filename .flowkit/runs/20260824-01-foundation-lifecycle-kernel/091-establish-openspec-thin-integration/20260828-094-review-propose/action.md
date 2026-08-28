# Action — Review Propose

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `review-propose`
- Logical Run id: `20260828-094-review-propose`
- Role: `reviewer`
- Input Run: `20260828-093-propose`
- Review chain start: `20260828-091-explore`

## Review chain

`091 explore → 092 review-explore approved → 093 propose → 094 review-propose`

## Review boundary

Reviewer independently checked:

- the 091/092 historical Run records and 092-approved Explore artifact remain byte-identical in 093;
- 093 adds only formal Proposal/spec/design/tasks plus its durable Propose Run;
- all material 092 implementation-scope constraints are formalized across Proposal/spec/design/tasks;
- V1 public behavior remains exactly two read-only repo-local OpenSpec observations;
- there is no public generic `runOpenSpec(args)` / arbitrary-command executor;
- `instructions`, `context`, `validate`, `show`, `new change`, `archive` and other adjacent commands remain outside current product scope;
- managed OpenSpec invocation is internal, exact-runtime-only, argument-array child-process execution through current host Node, with no PATH/global/shell fallback;
- successful observations must exact-bind canonical requested repository root to OpenSpec-reported `root.path`;
- public observations project only the approved machine fields and do not promote raw stdout/stderr, arbitrary exit transport, `nextSteps`, `actionContext`, `planningHome`, `artifactPaths` or unrelated payload fields into stable Flowkit contract;
- non-zero + parseable OpenSpec JSON remains a closed formal-outcome category rather than a process failure, without parsing English message text into Flowkit lifecycle semantics;
- observations remain transient and authority-neutral;
- Policy, Memo, Action lifecycle, Run/Result, ActionPackage, Reviewer/Verification/Owner authority and Skills/self-hosting remain untouched;
- tasks cover the approved failure and scope-containment behavior without introducing a generic process/tool framework.

## Verdict

`approved`

No blocking Proposal finding remains. The planning contract is ready for Apply.

## Apply hard boundaries

1. **Do not export the transport seam**
   - Any child-process helper/command builder MUST remain private/internal to this focused capability.
   - Export only the two approved typed observations and their narrow diagnostics/types.
   - A generic process/OpenSpec executor is out of scope even if it would reduce a few implementation lines.

2. **Keep OpenSpec-list identity separate from Flowkit structural state**
   - The `list --json` observation represents OpenSpec's repo-local non-archived/formal Change set.
   - It MUST NOT be typed or interpreted as Flowkit `ChangeState = active`.
   - Public names/types should retain explicit OpenSpec ownership and return Change identifiers only.

3. **Formal non-zero is diagnostic, not authority**
   - `openspec-formal-outcome` may be machine-distinguishable, but it MUST NOT become a Flowkit lifecycle result, existence verdict, Reviewer/Verification result, Policy input or Owner authority.
   - Do not expose raw stdout/stderr/exit-code payload as stable exported control-flow contract.
   - Do not parse message text such as `not found` to derive Flowkit semantics.

4. **Do not widen commands while implementing fixtures**
   - Tests/fake runtime may model only the two approved command forms.
   - Do not add production wrappers for `validate/show/instructions/context/new/archive` merely to make the fake executor reusable.

5. **Exact-root behavior stays local to this adapter**
   - Canonical root comparison is required for successful observations.
   - Do not turn it into a generic repository-discovery/root-selection subsystem.

## Independent verification

Reviewer reconstructed the accepted source baseline and overlaid 093 planning, then ran:

- Node `22.23.2` proof fixture;
- typecheck: PASS;
- complete domain suite: `91/91 PASS`;
- format check: PASS;
- OpenSpec `1.10.0` current Change strict validation: PASS;
- OpenSpec validate-all strict: `9/9 PASS`;
- planning status: `4/4 complete`.

Real OpenSpec 1.10.0 was also reconfirmed:

- `list --json` returns Change identifiers plus OpenSpec root;
- `status --change establish-openspec-thin-integration --json` returns planning/artifact machine facts and exact root;
- missing exact Change returns exit `1` with JSON status document on stdout.

These facts are sufficient for the approved two observations and do not justify a broader command surface.

## Non-claims

- Reviewer did not modify Author planning artifacts.
- No production source/test mutation was performed.
- No generic OpenSpec service layer, arbitrary command executor, workflow driver, mutation adapter, Foundation CLI, Archify integration, Skill migration, self-hosting, Git checkpoint implementation, whole-manager acceptance or Verification PASS is introduced.
