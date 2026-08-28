# Action — Review Explore

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `validate-foundation-manager-cross-platform`
- Action: `review-explore`
- Logical Run id: `20260828-114-review-explore`
- Role: `reviewer`
- Input Run: `20260828-113-explore`
- Review chain start: `20260828-113-explore`

## Review boundary

Reviewer independently checked 113 under the repository `review-explore` model, with special attention to preventing the final acceptance Change from expanding back into product implementation or a generic Verification/test platform.

The review verified:

- Delivery state is coherent: the preceding Foundation CLI Change is completed and `validate-foundation-manager-cross-platform` is the only active final required Change;
- the exact Owner `activate-change` authority fact is structurally valid under the canonical authority contract;
- the Owner-refined acceptance boundary is honored:
  - detached Linux x64 is the real primary whole-manager acceptance environment;
  - Windows is bounded compatibility simulation only;
  - no Windows Native PASS is claimed;
- 113 itself mutates only Delivery activation/Explore/Run planning artifacts and does not touch production source, tests, package/build configuration, or canonical specs;
- current accepted source baseline typechecks, builds, formats and passes the complete domain suite;
- after replaying the accepted preceding archives, canonical OpenSpec specs validate `10/10 strict PASS`;
- the active acceptance Change is correctly still `0/4` planning artifacts at Explore and is Proposal-ready;
- real emitted candidate code composes Single Action execution, durable Run persistence, exact CLI status/next/doctor observation, managed OpenSpec/Archify resolution, Policy and checkpoint authorization without another product layer;
- fake PATH cannot take over managed OpenSpec/Archify;
- checkpoint remains authorization-only and performs no Git mutation;
- the bounded Windows simulation covers the actual current portability surfaces without claiming native Windows execution;
- the repository has ESLint packages but no executable lint contract (`eslint.config.*` absent, `package.json#scripts.lint` absent), so lint must not be invented merely for Full Test symmetry.

## Verdict

`approved`

No current-scope Explore blocker remains. The Change is ready for Proposal.

## Independent whole-manager proof

Reviewer reconstructed the accepted candidate from retained approved repository material, built it with the detached Node `22.23.2` proof fixture, restored real managed tools, and used a disposable repository fixture.

Real managed tools:

- OpenSpec `1.10.0`;
- Archify `2.15.0`.

Observed result:

1. `invokeSingleAction(apply)` → terminal: PASS;
2. `writeDurableRun` / exact `readDurableRun` terminal round-trip: PASS;
3. emitted `flowkit status` on the exact Apply Run: PASS;
4. emitted `flowkit next` on the exact Apply Run:
   - `ready-action(review-apply)`;
5. emitted `flowkit next` with explicit `currentRunId:null`:
   - `ready-action(explore)`;
6. emitted `flowkit doctor`:
   - OpenSpec runtime PASS;
   - Archify runtime PASS;
   - exact OpenSpec root PASS;
7. fake PATH OpenSpec/Archify executables:
   - not invoked;
8. exact terminal Archive Run + exact `authorize-checkpoint` Owner authority:
   - Policy `ready-checkpoint-evaluation`;
   - checkpoint `authorized=true`;
9. disposable proof repository:
   - no `.git` before or after checkpoint evaluation.

This independently supports the 113 conclusion that no additional production lifecycle layer is required.

## Independent Windows compatibility proof

Reviewer executed a separate `path.win32` compatibility model against the current candidate's concrete path contracts.

Confirmed:

- Run persistence path composition with repository path containing spaces;
- exact Run directory parent/basename structure;
- managed OpenSpec runtime under `C:\Flowkit Home\tools\openspec\1.10.0`;
- mixed-case same-drive containment remains inside the managed parent;
- cross-drive candidate is recognized as outside the managed parent;
- portable lock entrypoint `bin/openspec.js` resolves to the expected Windows path;
- Memo sidecar resolves under `.flowkit\memos.json`;
- current production source contains no `shell: true`, `path.posix`, `cmd.exe`, or PowerShell contract.

This remains a compatibility simulation, not native Windows execution.

## Proposal hard boundaries

### 1. Acceptance/tooling only

Proposal should default to:

`production source mutation = none`

Expected implementation is limited to:

- one focused deterministic whole-manager acceptance harness/test;
- bounded Windows compatibility simulation;
- package/test-script wiring only if needed;
- Delivery verification-contract materialization.

If the acceptance suite exposes a genuine production contract defect, Author MUST NOT silently fix it inside this acceptance scope. Stop and revise/reauthorize the product boundary first.

### 2. No generic Verification/test subsystem

The frozen Delivery Full Test contract should be a literal bounded environment + command/gate sequence.

Do NOT introduce:

- a generic gate registry;
- Verification database/evidence store;
- generic test orchestrator;
- background runner;
- new Full Test state machine.

Author/Reviewer Run facts may record deterministic command/result/hash evidence; formal Delivery Verification remains a later Owner-authorized boundary.

### 3. Freeze only executable current gates

The reusable Full Test gate family may contain:

1. typecheck;
2. format check;
3. production build;
4. full domain regression;
5. OpenSpec `--all --strict`;
6. detached real whole-manager acceptance;
7. bounded Windows compatibility simulation.

Do not invent lint.

Current evidence:

- ESLint dependencies exist;
- `eslint.config.*` does not exist;
- `package.json#scripts.lint` does not exist;
- direct `eslint src` exits `2` because configuration is absent.

A future lint policy requires separate authority.

### 4. Real acceptance must use built candidate + real managed tools

The decisive acceptance path must exercise emitted `dist/**` against:

- explicit compatible Node;
- restored platform dependency bundle;
- explicit `FLOWKIT_HOME`;
- exact managed OpenSpec `1.10.0`;
- exact managed Archify `2.15.0`;
- disposable repository/OpenSpec/Run fixture.

Mocks may support focused unit checks, but cannot replace the real whole-manager acceptance path.

### 5. Windows claims remain bounded

Machine output/documentation must say `windows-compatibility-simulation`.

Do not claim native coverage of:

- `cmd.exe`;
- PowerShell;
- NTFS ACL/junction/file-lock/antivirus behavior;
- package-manager generated `.cmd` shim execution;
- native Windows process creation.

### 6. Preserve bootstrap/self-hosting boundary

Delivery 01 historical `.flowkit/runs` remain external-orchestrator history.

The candidate must not use them as evidence that it self-managed Delivery 01.

Use disposable candidate-generated fixture Runs for whole-manager acceptance.

### 7. Formal Verification and promotion remain later

During this Change:

- Author acceptance evidence ≠ Verification PASS;
- Reviewer rerun evidence ≠ Verification PASS;
- `delivery.fullTestStatus` remains `not-ready`;
- no Delivery Final / Archify Final / Owner promotion occurs.

Formal Full Test remains after:

`final Change archive → exact checkpoint candidate → explicit Owner Full Test authorization`.

### 8. `skip_specs` is conditional on no product behavior change

`skip_specs: true` is appropriate only while this remains pure acceptance/tooling work.

If Proposal or later proof changes an existing product requirement, remove/reconsider `skip_specs` and revise the planning contract before implementation.

## Independent baseline verification

Reviewer reconstructed the accepted candidate and ran:

- Node proof fixture: `22.23.2`;
- typecheck: PASS;
- full domain suite: `116/116 PASS`;
- format check: PASS;
- production build: PASS;
- canonical OpenSpec specs after accepted archive replay: `10/10 strict PASS`;
- current active acceptance Change: `0/4`, Proposal ready;
- managed artifact hashes against repository lock: `4/4 PASS`;
- lint executable contract: absent as claimed.

## Review limitation

The exact checkpoint archive named by 113 (`...-9592a30.zip`) was not supplied in this review turn, so its archive SHA/Git revision and the exact Author proof scripts identified only by SHA-256 were not independently re-derived from those exact files.

This is non-blocking for Explore readiness because:

- 113 itself is only a six-file activation/Explore overlay with no production implementation mutation;
- the accepted implementation baseline was independently reconstructed from retained approved material;
- the material whole-manager, managed-tool, Policy/checkpoint, Windows-compatibility, lint and OpenSpec claims were independently reproduced.

## Non-claims

- Reviewer did not modify Author Explore artifacts.
- No Proposal/spec/design/tasks or acceptance implementation was created.
- No native Windows PASS, new production capability, generic Verification platform, lint policy, Git execution, OpenSpec mutation, Archify materialization, self-hosting, Delivery Full Test PASS, Delivery Final or Owner promotion is introduced.
