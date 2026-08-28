# Action — Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-mutation-and-git-checkpoint-boundary`
- Action: `explore`
- Logical Run id: `20260827-077-explore`
- Role: `author`
- Base Git revision: `8c0c150b4bd15e837c3f579a91e0303678fbbe4b`
- Owner instruction: activate the next planned governance Change and execute OpenSpec Explore with proof-based exploration

## Execution

The dependency-ready planned Change was activated in the Delivery manifest and scaffolded through OpenSpec 1.10.0. Explore used `.agents/skills/openspec-explore/SKILL.md` together with `.agents/skills/explore-proof-based/SKILL.md` and intentionally did not create Proposal/spec/design/tasks or production implementation.

Focused proof established the minimum mutation/checkpoint boundary:

- repository paths need a canonical cross-platform lexical contract that allows legitimate root dotfiles and hidden project paths while rejecting `.git`, traversal, absolute paths, backslashes and obvious Windows-invalid names;
- V1 can use sorted unique exact file paths bound to the exact Run occurrence, avoiding a glob/selector subsystem;
- unstaged Git status can observe modified/deleted/untracked checkpoint candidate paths without performing `git add`;
- the existing Policy `READY_CHECKPOINT_EVALUATION` seam should be reused rather than duplicating archive ordering;
- existing `OwnerAuthorityFact` is structurally sufficient for explicit checkpoint authority, but checkpoint eligibility must perform exact semantic matching for decision/delivery/change/scope;
- checkpoint eligibility, Owner authorization and actual Git execution remain three distinct facts/boundaries;
- Verification can contribute correctness evidence but never grants mutation or Git authority.

## Stable output

- Delivery Change state `active` and explicit Owner activation fact
- OpenSpec Change scaffold
- `openspec/changes/establish-mutation-and-git-checkpoint-boundary/explore.md`
- this durable Explore Run

## Non-claims

- This is not the final Delivery Change; four required planned Changes remain after it.
- No Proposal/spec/design/tasks were created.
- No production source or tests were modified.
- No Git checkpoint/commit was performed or authorized by this Explore.
- No glob/path-policy DSL, Git wrapper CLI, Verification registry, OpenSpec adapter, scheduler or automatic next-Change behavior was introduced.
