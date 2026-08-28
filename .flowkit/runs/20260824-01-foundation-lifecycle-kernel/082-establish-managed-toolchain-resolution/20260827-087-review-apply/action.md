# Action — Review Apply

## Identity

- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-managed-toolchain-resolution`
- Action: `review-apply`
- Logical Run id: `20260827-087-review-apply`
- Role: `reviewer`
- Input Run: `20260827-086-apply`
- Review chain start: `20260827-082-explore`

## Review chain

`082 explore → 083 review-explore approved → 084 propose → 085 review-propose approved → 086 apply → 087 review-apply`

## Review boundary

Reviewer independently checked:

- 082–085 historical Run records remain unchanged in 086;
- approved Explore / Proposal / Design / Spec / Delivery manifest remain unchanged;
- 086 mutations trace to the approved managed-tool resolver contract;
- no dependencies, installer/downloader/updater, generic tool registry, PATH fallback or managed-tool invocation were introduced;
- Node exact patch remains outside managed-tool authority and pnpm remains package-manager identity only;
- repository lock, AGENTS guidance and derived planned architecture were narrowed as approved;
- real supplied OpenSpec and Archify runtime fixtures resolve successfully from `FLOWKIT_HOME`;
- typecheck, the complete domain suite, formatting and strict OpenSpec validation pass;
- fail-closed and on-demand behavior was adversarially checked beyond the Author test names.

## Verdict

`changes-requested`

One blocking implementation defect remains.

### RA-087-001 — peer lock/config invalidity incorrectly blocks on-demand resolution

The approved Spec requires:

> Absence or invalidity of another managed tool SHALL NOT prevent successful resolution of the requested tool.

The implementation correctly avoids requiring the peer **runtime**, but it does not avoid requiring the peer **lock entry**.

Current flow:

`resolveManagedTool(requestedTool)`
→ `readManagedToolLock()`
→ `parseManagedToolLock()`
→ eagerly parse both `openspec` and `archify`
→ only afterwards select `lock[toolId]`.

Therefore a malformed or incomplete peer entry blocks an otherwise valid requested tool.

Reviewer reproduced both directions using valid requested runtimes:

1. request `openspec`
   - OpenSpec lock/runtime valid
   - Archify lock entry missing `entrypoint`
   - actual result: `invalid-lock`
   - required result: OpenSpec resolution succeeds

2. request `archify`
   - Archify lock/runtime valid
   - OpenSpec lock entry missing `entrypoint`
   - actual result: `invalid-lock`
   - required result: Archify resolution succeeds

This is a direct violation of the approved on-demand requirement and is not covered by the current 11 focused tests.

### Minimum required revision

Keep the current small resolver and closed root schema, but make entry validation request-scoped:

1. validate the lock document/root schema as needed for closed authority;
2. select the requested `toolId`;
3. fully parse/validate only that requested managed-tool entry for this resolution;
4. do not require the peer entry to be present or internally valid for the current request;
5. add focused tests for both malformed-peer directions.

Do not add a lazy registry, cache, environment manager, migration layer, repair behavior or new abstraction.

## Confirmed Apply facts

- Real `@fission-ai/openspec@1.10.0` runtime resolution: PASS.
- Real `archify@2.15.0` runtime resolution: PASS.
- Supplied artifact hashes match lock provenance: 4/4 PASS.
- Conflicting PATH does not redirect managed resolution: PASS.
- Missing peer runtime does not block requested runtime: PASS.
- Unsupported tool / missing home / traversal / runtime absence / package mismatch / missing-or-escaping entrypoint fail closed as tested.
- Resolver does not invoke the managed entrypoint.
- Node 22.23.2 is only the detached proof fixture, not exact managed authority.
- No dependency mutation or production behavior outside the approved resolver scope was added.

## Non-claims

- Reviewer did not modify Author implementation or tests.
- `review-apply = changes-requested` is not Verification FAIL.
- No archive, checkpoint, Owner authority, CLI, tool invocation or cross-platform whole-manager acceptance was performed.
