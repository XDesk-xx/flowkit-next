# Apply Action

- delivery: `20260824-01-foundation-lifecycle-kernel`
- change: `establish-lifecycle-authority-and-identity-contracts`
- run: `20260824-009-apply`
- role: `author`
- action: `apply`
- canonical base: `23ca52715df7c52738edeb59206f496c7bf2d2a9`
- canonical review-propose authority: `20260824-008-review-propose`
- canonical 008-v2 package SHA-256: `ebb668e879e9f83633516d84ea351bed6801af3c2f969c7946290b3dc3433e53`
- canonical 008-v2 result SHA-256: `0bff6faaaece164fe60d201b3cd6014e019e6d00683c8eba91d74bf1bc6d8922`
- new Owner authorize-apply ref: `owner:717f5e224185cdc59be791c881fab2949642702ab956f1acbfeab8908d923ba4`

## Authority boundary

本 Run 只接受 canonical `008-review-propose-reviewer-v2` 的 approved Proposal 作为 Apply authority source，并消费本条消息产生的全新 Owner authorize-apply fact。

旧错误 chain 中产生的任何 009 Apply 均不是本 Run 的 authority/source。

## Allowed mutation

仅允许 approved Proposal/Design/Spec/Tasks 明确要求的：

- 最小 TypeScript verification baseline；
- `src/domain/{identity,authority,state,index}.ts`；
- `tests/unit/domain/*.test.ts`；
- `tasks.md` completion checkboxes。

明确禁止 Policy、persistence、CLI、Action lifecycle engine、group lifecycle、Git checkpoint、archive、commit、push 与 auto-next。
