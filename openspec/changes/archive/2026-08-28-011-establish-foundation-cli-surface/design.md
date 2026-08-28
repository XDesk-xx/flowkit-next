## Context

See `proposal.md` for motivation. The repository already has canonical domain seams for Action lifecycle, durable Run/Result persistence, Policy, Owner authority, managed-tool resolution and read-only OpenSpec observation. It has no production CLI source, no emitted `dist` contract and no `package.json#bin`. `tsconfig.json` is intentionally `noEmit: true` for typecheck. Delivery 01 remains externally governed, and `.agents` remains bootstrap development tooling rather than production runtime input.

The revised Explore proved a negative boundary: durable Run history is ordered but ordering is not current-Run authority. Therefore the Foundation CLI must receive an explicit current-Run choice from its caller/host: an exact current Run occurrence when one exists, or an explicit `currentRunId:null` when the canonical current-Action slot is empty. It never selects max sequence/latest history or scans history to infer absence.

## Goals / Non-Goals

**Goals:**

- make one real `flowkit` executable surface that can be exercised by the following cross-platform Change;
- expose only `status`, `next` and `doctor` as closed commands;
- reconstruct current Action facts only from an explicit caller choice: an exact durable Run occurrence when one exists, or an explicit no-current-run value for the canonical empty slot;
- delegate lifecycle legality to existing Policy instead of copying transitions;
- keep checkpoint evaluation as a pure exact Owner-authorization gate outside Policy and outside Git;
- keep machine output deterministic and fail closed on invalid input/integration failures;
- preserve the existing 500-line code gate on every new/modified TypeScript file.

**Non-Goals:**

- automatic active-Delivery/current-Run discovery or persistence;
- Run lineage/current-selection subsystem;
- self-hosting, Skill execution, provider/Agent orchestration or auto-next;
- OpenSpec mutation/workflow commands;
- Archify rendering/materialization, Delivery actual/reference generation or treating Archify as truth;
- Git mutation or checkpoint commit execution;
- final Windows/Linux acceptance, Delivery Full Test, Delivery Final or Owner promotion.
- parallel internal product/API compatibility tiers for the Foundation CLI; later capability changes remain normal OpenSpec Change evolution of the canonical contract.

## Decisions

### 1. Keep the existing no-emit typecheck and add a dedicated production build config

Use the existing `tsconfig.json` as the typecheck authority and add a small `tsconfig.build.json` that extends it but enables emit to a deterministic `dist/` tree for production source. Add a `build` script and `package.json#bin.flowkit` pointing at the emitted CLI entrypoint.

The CLI source entrypoint should include a Node shebang so package/bin linking works on Unix-like hosts while package-manager generated shims can support Windows. Cross-platform acceptance remains the next Change; this Change only proves the emitted entrypoint is runnable on the detached fixture.

**Alternative considered:** change the existing `tsconfig.json` to emit. Rejected because it would mix typecheck and production build concerns and change a currently stable developer gate.

**Alternative considered:** introduce a bundler/runtime framework. Rejected because plain TypeScript emit is already proven sufficient and a new framework has no current consumer.

### 2. Keep command dispatch closed and place CLI composition outside domain authority modules

Add focused CLI/host modules rather than extending Policy, Run persistence or OpenSpec observation modules. The entrypoint performs only argument/request decoding, delegates to command-specific composition functions, serializes a closed machine result and chooses process exit status.

No generic command registry/plugin system is required: a small closed dispatch over `status | next | doctor` is enough for the current Foundation CLI.

**Alternative considered:** a generic `run(command, args)` or plugin/command framework. Rejected because it would create expansion surface before a real need exists.

### 3. Use an explicit command request document instead of automatic repository/Delivery/current-Run discovery

Each command consumes one explicit JSON request document supplied by the caller through a required `--input <path>` argument. A file-based request avoids shell-specific quoting for nested Owner facts and gives the next Windows/Linux Change one deterministic machine fixture format.

The common request fields are intentionally explicit where applicable:

```text
repositoryRoot
deliveryId
changeId
changeState
changeStartSequence
currentRunId  # exact canonical runId where a current Run exists; `null` is allowed only for the explicit no-current-run branch accepted by the command contract
flowkitHome
```

Command-specific optional/required fields are bounded by the command request validator. `next` may additionally carry existing Policy `ownerCorrection` input and a separately supplied checkpoint Owner authority fact. `doctor` needs only repository/runtime diagnostic inputs and does not require a current Run.

For commands that require a selected Run, the CLI validates exact identifiers/states and parses a string `currentRunId` with the existing occurrence parser before constructing the controlled `readDurableRun(...)` input. `next` additionally accepts an explicit `currentRunId: null` form meaning the canonical current-Action slot is empty: in that branch the CLI performs no Run read and passes `currentAction=null`, `currentRunContext=null`, and `currentRunResult=null` to Policy. Omitted/undefined currentRunId is not normalized to this branch. The CLI never calls `listChangeRunHistory(...)` to choose between exact Run and no-current-run authority. If status later displays history, that is presentation-only and must not feed selection; the current approved surface need not include history output.

**Alternative considered:** many nested command-line flags. Rejected because Owner authority and structural facts are already JSON-compatible domain facts and cross-platform shell quoting would become unnecessary surface complexity.

**Alternative considered:** infer active Delivery/current Run from manifests, Git, mtime or highest Run sequence. Rejected by RE-101-001 and the revised decisive proof.

### 4. Reconstruct Policy facts from the explicit current-Run choice only

For `next`, the caller must choose one of exactly two forms:

- `currentRunId: <exact canonical runId>` → derive `CurrentAction` from that selected Run's exact `actionIdentity` plus `context.lifecycleState`; `prepared` passes null terminal context/result, `terminal` passes that same exact Run context/result, and a selected Run with null lifecycle state fails closed rather than guessing from other records;
- `currentRunId: null` → represent the canonical active-Change state with no current Run by passing `currentAction=null`, `currentRunContext=null`, and `currentRunResult=null` directly to Policy without reading Run history.

Omitted currentRunId is malformed rather than an implicit no-current-run choice. For the exact-run form, caller-supplied DeliveryId/ChangeId must match the selected Run's exact action identity. `changeState` remains explicit caller structural input because this Change does not own Delivery/Change discovery. Existing Policy validators remain responsible for canonical Policy semantics.

If caller supplies an existing Policy `ownerCorrection`, the CLI passes it through only after its command request shape is bounded; Policy remains responsible for recognition/eligibility.

**Alternative considered:** reconstruct terminal facts from another later/history Run. Rejected because only the selected occurrence owns current-Action authority under this Change.

### 5. Treat `status`, `next`, and `doctor` as composition, not new authorities

`status` reads the exact selected durable Run and existing OpenSpec observations, then projects only bounded formal fields. It does not call Policy to create a next boundary.

`next` builds Policy facts from the caller's explicit current-Run choice: exact selected Run when a runId is supplied, or an empty CurrentAction/terminal slot when `currentRunId:null` is supplied. It returns the existing closed Policy decision unchanged. A `blocked` decision is a successful formal result, not a CLI transport failure.

`doctor` composes existing managed-tool resolution for `openspec` and `archify` plus existing exact-root OpenSpec observation. Archify is resolved only; no Archify command is invoked.

No command persists a new mirror of these observations.

### 6. Implement checkpoint authorization as a tiny pure evaluator outside Policy

Add a focused host/CLI utility that accepts:

```text
PolicyDecision
OwnerAuthorityFact | absent
exact DeliveryId
exact ChangeId
```

It reports `authorized=true` only when:

```text
PolicyDecision.kind == ready-checkpoint-evaluation
decision == authorize-checkpoint
deliveryId == exact current Delivery
changeId == exact current Change
scope == [checkpoint]
```

All other cases return a closed not-authorized result/reason. It neither mutates Git nor turns Review/Verification into Owner authority.

**Alternative considered:** add checkpoint eligibility into Policy. Rejected because canonical Policy explicitly stops at `ready-checkpoint-evaluation` and does not create Git authority.

**Alternative considered:** implement `flowkit checkpoint` that runs Git. Rejected because the cancelled mutation/checkpoint Change established that Git execution remains an external host operation for this Foundation boundary.

### 7. Keep machine result and process-exit semantics separate

Every command writes one JSON result document to stdout. Normal domain outcomes—including Policy `blocked`, doctor diagnostic status and checkpoint `authorized=false`—remain valid machine outcomes and use a successful CLI transport exit. Invalid command/request shape, exact Run read failure, managed-tool/OpenSpec integration failure or unexpected internal failure produce a closed CLI error envelope and non-zero exit.

Human-readable prose is not required as a stable contract in this Change; callers can render the JSON themselves. This avoids parsing free-text and gives the next cross-platform Change deterministic assertions.

### 8. Keep the code gate visible in module boundaries

Do not add CLI convenience methods to the historical >500-line `run-result-persistence.ts`. Keep entrypoint/argument decoding, request validation/command composition and checkpoint authorization in focused files. Every new/modified TypeScript file in this Change must remain below 500 lines; if implementation cannot satisfy that without changing approved contract, stop rather than hide scope in a large module.

## Risks / Trade-offs

- **[Explicit JSON request is less convenient for humans]** → This is intentional for the current Foundation CLI boundary: it avoids unapproved discovery and gives deterministic cross-platform fixtures. A later stable manager may add ergonomic discovery only under a separate contract.
- **[Caller can supply structurally inconsistent Delivery/Change facts]** → Validate canonical shapes and exact selected Run identity linkage; let existing Policy/OpenSpec contracts fail closed rather than silently reconcile facts.
- **[Explicit null could be confused with missing input]** → Treat `currentRunId:null` as a deliberate no-current-run value only where the command contract allows it; omitted/undefined or malformed values fail closed and never trigger history discovery.
- **[Build output adds a second TypeScript configuration]** → Keep `tsconfig.build.json` minimal and extending the existing config; typecheck remains `noEmit` and production build only overrides emit/output fields.
- **[Checkpoint gate could be mistaken for Git permission execution]** → Return authorization data only; no Git imports or commands belong in the implementation.
- **[CLI can become a dumping ground]** → Closed command catalog, no generic registry, and the 500-line gate force composition to stay small.

## Migration Plan

1. Add production emit configuration, build script and package bin metadata without changing the existing typecheck command.
2. Add focused CLI/host modules and tests for explicit request parsing, exact Run selection, command outputs and checkpoint authorization.
3. Build and run the emitted CLI under the detached Node 22.23.2 fixture as a proof instance while preserving `engines.node >=22.20.0` as product compatibility truth.
4. Leave final Windows/Linux package/bin acceptance to `validate-foundation-manager-cross-platform`.
5. Rollback is file-local: remove the new CLI/build files and package build/bin metadata; existing canonical domain/integration capabilities remain unchanged.
