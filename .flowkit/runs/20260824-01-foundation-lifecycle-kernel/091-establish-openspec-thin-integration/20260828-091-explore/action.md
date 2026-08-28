# Action — Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-openspec-thin-integration`
- Action: `explore`
- Logical Run id: `20260828-091-explore`
- Role: `author`
- Base: owner-supplied checkpoint archive `flowkit-next-delivery-20260824-01-foundation-lifecycle-kernel-91d1271.zip`
- Owner authority: `owner:4ccae943be38129c515abb36bb29f6723df36ff83346f12c069c68ee91f50bc6`

## Execution

Owner authorized activation of the next eligible Delivery Change and proof-based Explore. The Delivery manifest was activated first, OpenSpec 1.10.0 created the Change scaffold, then the investigation used both the upstream `openspec-explore` stance and Flowkit `explore-proof-based` discipline.

The Owner clarified the bootstrap boundary before activation:

```text
.agents/skills
→ continue to drive current development-time OpenSpec workflow

Flowkit runtime
→ must not consume/execute Skills
→ must not start self-hosting before the first complete version exists
```

Explore therefore bounded this Change to current product integration needs only.

## Proof performed

Focused non-production proof established:

- `openspec list --json` provides the formal active Change set and exact resolved root;
- `openspec status --change <id> --json` provides formal Change/artifact readiness, dependency and resolved artifact path facts;
- real OpenSpec may return non-zero exit with valid machine JSON for formal failures such as missing Change or validation failure;
- an execution-local TypeScript invocation prototype successfully consumed the existing production `resolveManagedTool("openspec")` seam;
- valid JSON with exit `1` was preserved as an OpenSpec formal result, while malformed JSON was rejected as integration failure;
- OpenSpec nearest-root behavior can resolve a parent project from a nested cwd, proving successful observations must bind returned `root.path` to the exact requested repository root;
- OpenSpec 1.10.0 exposes a JS package API, but the already-approved managed-tool contract deliberately exposes a validated executable entrypoint, making CLI JSON the smaller current coupling seam.

## Stable output

- activated Delivery-group state and explicit Owner authority fact;
- `openspec/changes/establish-openspec-thin-integration/.openspec.yaml`;
- `openspec/changes/establish-openspec-thin-integration/explore.md`;
- this durable 091 Explore Run.

## Proposal-ready boundary

Current V1 should be observation-only:

- consume the validated managed OpenSpec 1.10.0 entrypoint;
- expose only active Change observation and exact Change artifact-status observation required by current downstream contracts;
- validate exact repository-root binding and required machine JSON shape;
- keep observations transient and non-authoritative outside OpenSpec;
- do not expose a generic arbitrary OpenSpec command executor.

## Non-claims

- No Proposal/design/spec/tasks were created.
- No production source/test implementation was changed.
- No OpenSpec mutation command was integrated into Flowkit runtime.
- No `.agents` Skill is read or invoked by product code.
- No self-hosting, automatic workflow execution, Policy/OpenSpec coupling, CLI, Git checkpoint or cross-platform whole-manager behavior was implemented.
- No Reviewer or Verification verdict is claimed.
