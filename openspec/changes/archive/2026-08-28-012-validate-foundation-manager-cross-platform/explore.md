# Explore — validate-foundation-manager-cross-platform

## 1. Explore outcome

**PASS**

The final required Change has a bounded Proposal-ready problem:

> Validate the already-built Foundation Manager in the primary detached Linux x64 environment, execute a bounded Windows compatibility simulation instead of claiming Windows Native execution, and freeze the exact reusable Delivery Full Test execution contract. This Change is acceptance/tooling work; it MUST NOT invent another product lifecycle layer or silently expand into self-hosting.

Current proof found **no production capability blocker**. The expected implementation shape is therefore acceptance harness + Delivery verification-contract materialization, with production source unchanged unless a later acceptance run exposes a real contract bug.

---

## 2. Owner-refined acceptance boundary

The original Delivery wording required:

```text
Windows Native
+
Linux x64 detached
```

The Owner has explicitly refined that requirement because the real primary development and acceptance environment is detached Linux and forcing native Windows handoff would add process friction without proving a current Foundation contract that depends on Windows shell behavior.

The active Delivery truth is now:

```text
Linux x64 detached
→ real whole-manager execution

Windows
→ bounded compatibility simulation
→ MUST NOT be reported as Windows Native PASS
```

The Delivery plan was corrected before this Explore and the Change was activated under that corrected boundary.

Historical archived Explore/design text that mentioned Windows Native remains historical evidence and is not rewritten.

---

## 3. Current candidate facts

### 3.1 The Foundation Manager is already materially assembled

Canonical capabilities already exist for:

```text
Owner / Role / identity authority
Action lifecycle
Run / Result persistence
ActionPackage + exact Result admission
single Standard Action invocation / terminal / STOP
Policy + deterministic next boundary
cross-Delivery Memo
managed OpenSpec / Archify resolution
OpenSpec thin observation
Foundation CLI
```

The real emitted CLI surface is:

```text
flowkit status
flowkit next
flowkit doctor
```

and the checkpoint seam evaluates authorization only; it does not execute Git.

### 3.2 Current base remains healthy

Using the detached Node 22.23.2 reproducibility fixture:

```text
typecheck                       PASS
production build               PASS
format check                    PASS
domain regression              116 / 116 PASS
canonical OpenSpec specs       10 / 10 valid
```

The active Change itself is intentionally incomplete at Explore because no Proposal/spec planning artifacts exist yet. `openspec validate --all --strict` therefore reports the one expected “no delta yet” Change error while all 10 canonical specs remain valid.

### 3.3 Node patch remains a fixture, not product authority

Product truth remains:

```text
package.json#engines.node >=22.20.0
```

Node 22.23.2 is only the deterministic detached proof fixture.

### 3.4 Managed runtime truth remains external

The repository lock defines:

```text
OpenSpec 1.10.0
Archify 2.15.0
```

and resolution remains:

```text
repository lock
+
FLOWKIT_HOME
→ exact runtime
```

There is no PATH/global fallback.

---

## 4. Decisive proof — real detached whole-manager composition works

A controlled temporary repository was created outside the candidate repository. It used:

```text
real emitted dist/** candidate
real Node 22.23.2 detached fixture
real managed OpenSpec 1.10.0
real managed Archify 2.15.0
real OpenSpec active Change scaffold in the temporary repository
real canonical Run persistence produced through Foundation APIs
```

The proof did **not** reuse Delivery 01 bootstrap Runs as if the candidate had self-managed them.

### 4.1 Single Action + durable Run

The proof executed the actual emitted domain APIs:

```text
invokeSingleAction(apply)
→ terminal
→ writeDurableRun
→ readDurableRun
→ terminal round-trip PASS
```

It then performed another exact invocation for `archive` to exercise terminal replacement and checkpoint evaluation in the fixture.

Result:

```text
apply terminal        PASS
archive terminal      PASS
durable round-trip    PASS
```

### 4.2 Real emitted CLI reads the fixture

`flowkit status` against the exact persisted Run returned:

```text
runId   = 20260828-113-apply
action  = apply
state   = terminal
role    = author
OpenSpec active Change includes validate-foundation-manager-cross-platform
```

Result: **PASS**.

### 4.3 Canonical Policy remains authoritative

`flowkit next` with the exact terminal Apply Run returned:

```text
ready-action(review-apply)
```

`flowkit next` with explicit:

```json
{"currentRunId": null}
```

returned:

```text
ready-action(explore)
```

even though fixture Run directories existed physically.

This reconfirms that Run history is not current-Run authority and no implicit latest discovery is required for acceptance.

### 4.4 Checkpoint remains authorization-only

A fixture terminal Archive Run plus exact `authorize-checkpoint` Owner authority produced:

```text
Policy → ready-checkpoint-evaluation
checkpoint.authorized → true
```

No Git repository was required by this logic and no Git command belongs to the acceptance contract.

### 4.5 Managed tools and PATH isolation

`flowkit doctor` returned:

```text
OpenSpec runtime  1.10.0 PASS
Archify runtime   2.15.0 PASS
OpenSpec root            PASS
```

A fake PATH containing fake `openspec` and `archify` executables was installed during proof.

Markers showed:

```text
fake PATH openspec used = false
fake PATH archify used  = false
```

The managed runtime contract therefore remains effective at whole-manager composition level.

### 4.6 Request files remain shell-independent

The emitted CLI accepted CRLF-terminated JSON request files through exact argv file paths.

Result: **PASS**.

Detached proof script SHA-256:

```text
63c12d4cb344619825e6594161ad724ca0e72a16ea44fc99e9b52ad6976579b1
```

Detached proof output SHA-256:

```text
d5cfdfc8adac6151d802d003437b1505a5c5dcc290f8a73ca4c7385b55c0de87
```

---

## 5. Decisive proof — Windows compatibility can be bounded without native execution

The current Foundation does not expose Windows-specific shell, service, installer or Git behavior. Its relevant portability surface is primarily:

```text
Node path semantics
portable managed-tool entrypoint segments
repository/FLOWKIT_HOME paths
JSON request files
argv/process spawning
package bin metadata
```

A `path.win32` compatibility model was executed against the same path algorithms/constraints used by the candidate.

### 5.1 Run persistence path model

Representative input:

```text
repositoryRoot = C:\Work Space\flowkit-next
```

produced:

```text
C:\Work Space\flowkit-next\.flowkit\runs\
  20260824-01-foundation-lifecycle-kernel\
  113-validate-foundation-manager-cross-platform\
  20260828-113-apply
```

Checks:

```text
dirname(runDir) == exact changeRoot   PASS
basename(runDir) == exact runId       PASS
```

Canonical Delivery/Change/Action IDs cannot contain `/` or `\`, so semantic path segments remain controlled.

### 5.2 Managed-tool path model

Representative input:

```text
FLOWKIT_HOME = C:\Flowkit Home
```

produced:

```text
C:\Flowkit Home\tools\openspec\1.10.0\bin\openspec.js
```

Checks:

```text
runtime inside managed parent                   PASS
mixed-case same-drive runtime remains inside    PASS
portable "bin/openspec.js" resolves on win32    PASS
cross-drive escape is rejected                  PASS
```

This confirms the lock's portable `/` entrypoint representation is compatible with a Windows host path implementation.

### 5.3 Memo path model

`path.win32.join` produces:

```text
C:\Work Space\flowkit-next\.flowkit\memos.json
```

without a separate Windows branch.

### 5.4 CLI/process compatibility signals

Current candidate facts:

```text
package.json#bin.flowkit = dist/cli/entrypoint.js        PASS
emitted entrypoint exists                                PASS
emitted entrypoint has Node shebang                      PASS
OpenSpec spawn uses process.execPath                     PASS
production source has no shell: true                     PASS
production source has no path.posix binding              PASS
input path containing spaces is passed as one argv item  PASS
CRLF JSON input accepted                                 PASS
```

Windows compatibility simulation script SHA-256:

```text
b5e1aed3289a90f24e438f91e7344c8d337ffa0f8405af96e9abc84340acb265
```

Simulation output SHA-256:

```text
8dc7fe73092f56d4c1041331b8f1538c145454f34bfcc416d8456d532d7e9a94
```

### 5.5 Explicit non-claims

This simulation does **not** prove:

```text
cmd.exe behavior
PowerShell behavior
NTFS ACL / junction / antivirus / file-lock behavior
package-manager generated Windows .cmd shim execution
native Windows process creation
```

Those are not current Foundation product inputs. They MUST NOT be relabeled as native PASS, but they do not block this Delivery under the Owner-refined scope.

If a later Delivery adds Windows-specific launcher/installer/service behavior, native Windows smoke testing can be authorized there.

---

## 6. No production capability gap was found

The decisive question for this final Change is whether acceptance requires another product implementation layer.

Current evidence says **no**.

The candidate already supports the minimum real path:

```text
compatible detached Node
+
restored dependency bundle
+
FLOWKIT_HOME exact runtimes
+
built candidate
→ real canonical Action fixture
→ durable Run
→ real CLI
→ Policy
→ managed OpenSpec observation
→ managed Archify identity diagnostic
```

Therefore Proposal should default to:

```text
production source change = NONE
```

Expected repository mutations are acceptance/tooling only, such as:

```text
focused whole-manager acceptance test/harness
package test script if useful
Delivery Full Test execution contract materialization
Change planning/history artifacts
```

If Apply discovers a real product bug, it must not silently broaden this Change. Re-enter Proposal/Owner scope decision as appropriate, then invalidate and rerun affected acceptance evidence.

---

## 7. Delivery 01 bootstrap Runs are not candidate self-management evidence

The current repository contains `.flowkit/runs/**` produced by the external bootstrap orchestrator.

Those historical records intentionally contain facts such as:

```text
canonicalFlowkitRuntimeRun = false
```

The final acceptance MUST NOT do this:

```text
bootstrap history
→ candidate reads it as its own managed lifecycle
→ claim self-hosting success
```

Instead acceptance should use a temporary canonical fixture generated through the candidate's own domain seams, exactly as the decisive proof did.

This proves the candidate capability without converting Delivery 01 into self-management.

---

## 8. Minimal persistent acceptance harness

The proof is sufficient to show the shape. Proposal should make it reproducible with one focused acceptance suite rather than create an evidence platform.

Recommended boundary:

```text
tests/acceptance/foundation-manager...
```

or an equivalently small test-only location.

The suite should:

1. require an already-built `dist/**` candidate;
2. require explicit `FLOWKIT_HOME` with the exact managed tools;
3. create a disposable temporary repository;
4. create/observe a disposable OpenSpec Change only inside that fixture;
5. create canonical Run/Result data through candidate APIs;
6. execute the emitted `flowkit` CLI as a child process;
7. assert `status`, `next`, `doctor`, exact-run and checkpoint cases;
8. install fake PATH probes and verify no fallback;
9. execute the bounded Windows compatibility model;
10. clean the fixture;
11. emit normal machine-test output, not a new durable evidence database.

The acceptance suite itself MUST NOT:

```text
manage Delivery 01
read .agents Skills
archive the real active Change
commit Git
materialize Archify architecture
perform Owner promotion
claim formal Delivery Verification PASS
```

---

## 9. Independent evidence without a new Verification subsystem

The Delivery requires independent acceptance evidence, but the current Foundation deliberately separates:

```text
Author conclusion
Reviewer verdict
Verification evidence
Owner authority
```

A Standard Action Result is forbidden from fabricating `verificationVerdict`.

Therefore this Change should not add a Verification registry merely to persist test output.

Minimum sufficient pattern:

```text
Author Apply
→ runs deterministic acceptance suite
→ records exact command/result/hash in its external Run facts

Reviewer Review-Apply
→ independently reruns the same frozen suite
→ records independent command/result/hash
→ review verdict remains Review authority only
```

Then, after the final Change is archived and checkpointed:

```text
Owner authorizes Delivery Full Test
→ independent Verification executes the frozen Full Test contract
→ formal Delivery Verification PASS/FAIL occurs there
```

Thus:

```text
Change acceptance evidence ≠ Delivery Full Test Verification PASS
```

No generic evidence platform is needed.

---

## 10. Exact Full Test contract can now be frozen

The original Delivery deferred exact Full Test commands because the Foundation CLI did not yet exist. That reason is no longer true.

This Change should freeze the execution contract while still deferring the **formal run** until:

```text
final Change review-apply approved
→ archive final Change
→ checkpoint exact candidate
→ Owner authorize Full Test
```

### 10.1 Required environment inputs

Full Test should require only explicit/restored inputs already used by detached development:

```text
compatible Node satisfying package.json engines
restored repository node_modules for that platform
FLOWKIT_HOME containing exact managed OpenSpec 1.10.0 and Archify 2.15.0
exact repository candidate/checkpoint identity supplied by the host/handoff
```

No runtime binaries, node_modules or pnpm store enter Git.

### 10.2 Frozen gate family

The exact executable contract should be composed from real existing gates plus the new acceptance suite:

```text
1. typecheck
2. format check
3. production build
4. full domain regression
5. OpenSpec --all --strict
6. real detached whole-manager acceptance
7. Windows compatibility simulation
```

The acceptance suite may combine items 6 and 7 in one deterministic test command.

### 10.3 Do not invent a lint gate

The repository currently has ESLint packages but:

```text
eslint.config.* = absent
package.json lint script = absent
```

Focused proof:

```text
eslint src
→ exit 2
→ "ESLint couldn't find an eslint.config... file"
```

The Delivery plan already says type/build/lint/test gates **once those commands exist**. Lint is not currently an executable project gate.

Therefore this Change MUST NOT add an unrelated ESLint configuration merely to make the Full Test list look symmetrical. If lint policy is desired later, it should be a separately authorized quality change.

### 10.4 Package-manager/network neutrality

Detached acceptance should not require dependency installation or network access.

The command contract should run against the already-restored dependency bundle and external managed runtimes. It should not call install/update/download operations.

---

## 11. Delivery Full Test state boundary

While this Change is active:

```text
delivery.fullTestStatus = not-ready
```

remains truthful because the final Change has not yet been reviewed/archived/checkpointed.

During Apply, the exact command/environment contract can be materialized into the Delivery verification section while formal execution remains deferred.

After:

```text
final Change archive
+
exact checkpoint candidate
```

the Owner can authorize the already-frozen Full Test without inventing new commands at that point.

No new Full Test state machine is required in this Change.

---

## 12. OpenSpec shape

This Change is currently an acceptance/tooling Change with:

```text
architectureImpact = false
product semantic change = none found
```

Therefore Proposal should prefer OpenSpec's supported pure-tooling form:

```yaml
skip_specs: true
```

and use:

```text
proposal.md
+ design.md
+ tasks.md
```

without inventing a permanent `foundation-manager-acceptance` product capability solely to satisfy the planning schema.

If a later proof finds a true product requirement change, Proposal must be revised and `skip_specs` reconsidered before implementation.

---

## 13. Explicit non-goals

```text
Windows Native PASS claim
cmd.exe / PowerShell native acceptance
Windows installer/service/launcher framework
NTFS-specific hardening subsystem
Flowkit self-hosting
Delivery 01 self-management
automatic Author/Reviewer loop
automatic next Action execution
new Delivery/current-Run discovery
new Verification registry/evidence database
new generic test orchestrator
new lint policy/configuration
Git add/commit/push/merge/tag execution
OpenSpec workflow mutation from product CLI
Archify architecture materialization
Delivery actual/current/planned comparison generation
Delivery Final
Owner promotion
```

---

## 14. Risks and bounded decisions

### R1 — simulation is mislabeled as Windows Native

**Decision:** machine evidence and documentation must call it `windows-compatibility-simulation`; native Windows claims are forbidden.

### R2 — acceptance Change turns into a new product subsystem

**Decision:** no production source mutation is planned. Acceptance harness + Delivery verification contract only.

### R3 — candidate “proves” itself using bootstrap history

**Decision:** use disposable canonical candidate-generated fixture Runs; bootstrap Delivery 01 Runs remain external history.

### R4 — reviewer evidence is mistaken for formal Verification PASS

**Decision:** independent reviewer rerun is Change evidence only. Formal Delivery Verification is later and Owner-authorized.

### R5 — Full Test invents commands that never existed

**Decision:** freeze only executable current gates plus the acceptance suite. Do not invent lint.

### R6 — acceptance mutates the real repository

**Decision:** all manager workflow fixtures are disposable temporary repositories. The real Change is observed only through normal planning/validation, never used as a self-managed lifecycle target.

### R7 — acceptance evidence becomes stale after mutation

**Decision:** any candidate implementation/config mutation after an acceptance run invalidates affected evidence and requires the relevant suite to rerun before reviewer approval.

---

## 15. Minimum Proposal direction

Proposal should remain limited to four concerns:

1. **Persist a focused whole-manager acceptance suite**
   - exercise built `dist/**`;
   - real detached managed tools;
   - disposable canonical Run/OpenSpec fixture;
   - emitted CLI `status/next/doctor` and checkpoint gate;
   - fake PATH isolation.

2. **Persist bounded Windows compatibility simulation**
   - `path.win32` path/confinement cases;
   - spaces/mixed-case/cross-drive cases;
   - portable entrypoint resolution;
   - CRLF/spaced argv input;
   - explicitly no native Windows claim.

3. **Freeze Delivery Full Test execution contract**
   - typecheck;
   - format check;
   - build;
   - domain regression;
   - OpenSpec strict;
   - whole-manager acceptance suite;
   - no lint invention.

4. **Preserve authority and closure boundaries**
   - no formal Verification PASS during Standard Actions;
   - reviewer independently reruns acceptance;
   - formal Full Test only after archive + checkpoint + Owner authorization;
   - no Archify Final or Owner promotion in this Change.

---

## 16. Proof summary

```text
base typecheck                                      PASS
base build                                          PASS
base format check                                   PASS
base domain tests                                   116/116 PASS
canonical OpenSpec specs                            10/10 valid
active Change before Proposal                       expected incomplete
real emitted single Action invocation               PASS
real durable Run write/read                         PASS
real emitted status                                 PASS
real emitted next exact Run                         PASS
real emitted next explicit null                     PASS
real emitted doctor                                 PASS
real checkpoint authorization gate                  PASS
fake PATH OpenSpec used                             NO
fake PATH Archify used                              NO
CRLF request input                                  PASS
spaced argv input path                              PASS
Windows run path model                              PASS
Windows managed-tool path/confinement model         PASS
Windows mixed-case same-drive containment           PASS
Windows cross-drive escape rejection                PASS
portable lock entrypoint under path.win32            PASS
native Windows execution claimed                    NO
production source blocker found                     NO
new generic subsystem required                      NO
```

---

## 17. Stop condition

Explore can stop successfully because:

```text
primary real environment bounded                    YES
Windows simulation boundary bounded                 YES
native non-claims explicit                          YES
whole-manager candidate composition proven          YES
managed-tool isolation proven                       YES
bootstrap/self-hosting boundary preserved           YES
independent evidence pattern bounded                 YES
exact Full Test gate family identifiable            YES
lint ambiguity resolved                             YES
production capability gap found                     NO
Proposal can be written without new architecture    YES
```

Result:

```text
PASS
→ review-explore
```
