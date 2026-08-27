## 1. Memo domain contract

- [x] 1.1 Add closed `ProjectMemosDocument` / `ProjectMemo` / provenance / resolution validation with canonical SemanticId reuse, exact state-resolution consistency, duplicate/order rejection, and existing Run occurrence/runId validation; verify focused unit tests cover valid null/Delivery/Change/Run provenance plus malformed/unknown-field cases.
- [x] 1.2 Add pure Memo transition/authority eligibility functions for create, promote and dismiss; verify tests prove exact `create-memo|promote-memo|dismiss-memo` + `[memoId]` matching, terminal-state rejection, no defer transition, and promotion target exact binding to authority delivery/change.

## 2. Memo persistence seam

- [x] 2.1 Add fixed `.flowkit/memos.json` read/get/list-open persistence with missing-file-as-empty, fail-closed existing-document validation and deterministic memoId ordering; verify filesystem tests cover missing, valid mixed-state and invalid-existing-file cases.
- [x] 2.2 Add create/promote/dismiss persistence rewrite using a same-directory temporary replacement without introducing database/index/WAL/locking abstractions; verify tests prove duplicate create and invalid/terminal mutations leave the canonical document unchanged and successful writes round-trip canonically.

## 3. Isolation and integration surface

- [x] 3.1 Export only the bounded Memo capability needed by callers and verify no `StandardActionId`, CurrentAction, Run/Result, ActionPackage or Policy contract is extended with Memo fields/actions.
- [x] 3.2 Add isolation tests proving open Memos do not affect existing Policy decisions or Standard Action lifecycle and that Memo mutation does not create Run/STOP semantics.
- [x] 3.3 Verify promotion only records a caller-established target and never creates/modifies Delivery manifest or OpenSpec Change artifacts; verify with focused tests over a repository fixture.

## 4. Closure

- [x] 4.1 Run typecheck, domain unit tests, repository format check and `openspec validate establish-cross-delivery-memo-contract --strict`; verify all pass and existing `run-result-persistence.ts` / `policy-and-next-boundary.ts` do not acquire Memo responsibility.
