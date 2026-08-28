# Action — Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-foundation-cli-surface`
- Action: `explore`
- Logical Run id: `20260828-100-explore`
- Role: `author`
- Base: owner-supplied checkpoint archive `flowkit-next-delivery-20260824-01-foundation-lifecycle-kernel-698538c.zip`
- Owner authority: `owner:58f5817b9acb80e197ffd6cf9c5340761c9e4c4fe67efff2eb9cc8c79a67f710`

## Execution

Owner authorized activation of the next eligible Delivery Change and formal proof-based Explore. The Delivery manifest was activated first, OpenSpec 1.10.0 created the Change scaffold, then the investigation followed both upstream `openspec-explore` and Flowkit `explore-proof-based`.

The Owner clarified two scope guards before activation:

```text
.agents/skills
→ bootstrap development-time mechanism only
→ continue to drive current Author/Reviewer/OpenSpec work

Archify
→ Delivery-level / long-term derived architecture projection only
→ never code/OpenSpec/lifecycle truth
```

This Explore therefore did not introduce self-hosting, Skill execution, Archify lifecycle coupling or automatic Delivery management.

## Proof performed

Focused non-production proof established:

- current source is not a real executable CLI yet because `tsconfig.json` has `noEmit: true`, package has no `bin`, and direct Node execution of source fails on emitted `.js` imports;
- an execution-local build config can emit the existing `src/**` graph to runnable JavaScript without changing product source;
- Node 22.23.2 successfully imports the emitted Core API surface, proving a small TypeScript build/bin contract is sufficient;
- canonical durable Run history can reconstruct the latest terminal CurrentAction at a STOP boundary and feed existing Policy without adding a second CurrentAction persistence file;
- completed Archive + exact terminal durable Run produces `ready-checkpoint-evaluation` through existing Policy;
- existing `OwnerAuthorityFact` supports a thin exact checkpoint authorization gate (`authorize-checkpoint`, exact Delivery/Change, `scope=[checkpoint]`), while wrong Change authority is rejected;
- exact managed OpenSpec 1.10.0 and Archify 2.15.0 both resolve through the existing managed-tool seam;
- the Delivery plan and repository guidance already reserve `flowkit status`, `flowkit next` and `flowkit doctor` as the minimal stable CLI family.

## Stable output

- activated Delivery-group state and explicit Owner authority fact;
- `openspec/changes/establish-foundation-cli-surface/.openspec.yaml`;
- `openspec/changes/establish-foundation-cli-surface/explore.md`;
- this durable 100 Explore Run.

## Proposal-ready boundary

Current V1 should:

- add a real emitted `flowkit` executable/package surface;
- expose only `status`, `next`, and `doctor` as the closed Foundation CLI command family;
- compose existing Run persistence, Policy, managed-tool and OpenSpec observation seams rather than recreate them;
- keep Delivery/Change structural context explicit instead of inventing a current-Delivery registry/YAML discovery subsystem;
- expose checkpoint authorization as a pure host/CLI evaluation fact, never as Git mutation;
- permit `doctor` to resolve Archify identity but not invoke architecture generation.

## Non-claims

- No Proposal/design/spec/tasks were created.
- No production source/test implementation was changed.
- No Git command was executed or authorized by this Explore.
- No `.agents` Skill is read by product code.
- No self-hosting, automatic Action execution, Delivery discovery, YAML parser, Archify rendering or Full Test implementation was added.
- No Reviewer or Verification verdict is claimed.
