## 1. Run occurrence and address contract

- [x] 1.1 Add the Change-scoped Run occurrence/domain model that keeps date/sequence/action separate from semantic `ActionIdentity`, and verify unit tests distinguish repeated executions of the same Standard Action.
- [x] 1.2 Implement Flowkit-controlled Change root and `YYYYMMDD-NNN-<known-action>` Run directory generation from validated inputs, and verify invalid date/sequence/identity/action inputs fail before filesystem use while valid addresses remain exact Change-root direct children.

## 2. Stable machine record contracts

- [x] 2.1 Implement the exact `context.json` machine envelope and runtime validator using existing identity, role, lifecycle and `OwnerAuthorityFact` validators, and verify explicit authority round-trips exactly while absent authority remains absent.
- [x] 2.2 Implement the exact `result.json` machine envelope and runtime validator with separate Author conclusion, Reviewer verdict and Verification verdict slots plus reported next-boundary/facts data, and verify Reviewer approval never becomes Verification PASS and `verificationVerdict = null` remains valid.
- [x] 2.3 Implement complete Run linkage validation across context/result occurrence, Delivery, Change and Action identity, and verify any mismatch or unknown/malformed envelope field fails closed.

## 3. Repository persistence seam

- [x] 3.1 Implement create-once writing of one Change-scoped Run directory with `action.md`, `context.json` and `result.json`; verify a valid Run can be written to an isolated temporary repository, an already-existing target is rejected without changing its prior bytes, and a new occurrence that reuses an occupied controlled sequence in the same Change history is rejected.
- [x] 3.2 Implement reading/parsing/validation of one complete Run, and verify missing machine files, invalid/truncated JSON and malformed embedded authority/identity facts are rejected without partial recovery or silent repair.
- [x] 3.3 Implement Change-local Run history listing ordered by controlled Action sequence, reject histories/creation attempts that would introduce an unresolved duplicate-sequence tie, and verify sequential Author → Reviewer → Author occurrences are returned deterministically without global discovery or automatic next-Action execution.

## 4. Scope and regression verification

- [x] 4.1 Add focused persistence tests covering repeated Action occurrence, create-once existing-occurrence collision with byte preservation, duplicate-sequence rejection, stable three-file surface, context/result JSON round-trip, role/verdict separation, previous/input Run references and reported next-boundary preservation as data.
- [x] 4.2 Run the repository typecheck, domain/unit tests, formatting check and `openspec validate --strict` for this Change, and verify source audit shows no Result admission, Policy, scheduler, locking, WAL/database, multi-Agent coordination, generic filesystem path API, CLI, OpenSpec adapter or Git checkpoint behavior was introduced.
