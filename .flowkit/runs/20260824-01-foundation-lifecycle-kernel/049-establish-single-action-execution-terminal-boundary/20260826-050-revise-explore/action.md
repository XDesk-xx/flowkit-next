# Action — Revise Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-single-action-execution-terminal-boundary`
- Action: `revise-explore`
- Logical Run id: `20260826-050-revise-explore`
- Role: `author`
- Base Git revision: `b0a38849aed94476e67245d89a31c7106f9d266d`
- Input Run: `20260826-049-explore`
- Trigger: Owner scope correction after clarifying that `prepare` must not become an independent stop boundary

## Revision

049's proof that `resumed` is unnecessary for the current Foundation happy path is preserved. This revision fixes the remaining ambiguity around `prepare`.

Focused proof establishes:

- `prepare` is an `ActionLifecycleEvent`, not a `StandardActionId`;
- internal `prepare` deterministically establishes the selected Standard Action as `CurrentAction/prepared`;
- a canonical `RunOccurrence` cannot use `prepare` as its Action id;
- therefore `prepare` must remain an internal Core structural seam, not an independent Action/Run/Result or ordinary STOP boundary;
- `prepared` remains useful as the structural interval where the exact current Action exists but its Result has not yet been admitted.

The Change 5 target is therefore one complete Standard Action invocation with internal prepare/package formation and internal admission/terminalization, followed by exactly one STOP.

## Stable output

- revised Delivery/Agent/planned-architecture wording for the internal prepare boundary
- revised `explore.md`
- this durable Revise Explore Run

## Non-claims

- No Proposal/spec/design/tasks were created.
- No production source or tests were modified.
- Existing canonical `prepared/resumed/terminal` contract is still unchanged until an approved Proposal/Apply.
- No prepare Standard Action, prepare Run, Policy legality, automatic next, crash recovery, Git checkpoint, or Full Test is introduced.
