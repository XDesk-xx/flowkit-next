# Revise Propose Action

- delivery: `20260824-01-foundation-lifecycle-kernel`
- change: `establish-lifecycle-authority-and-identity-contracts`
- run: `20260824-007-revise-propose`
- role: `author`
- action: `revise-propose`
- entry base: `23ca52715df7c52738edeb59206f496c7bf2d2a9`
- source review: `20260824-006-review-propose`
- source verdict: `changes-requested`
- blocking finding: `NEXT-RP-001`
- carried Owner propose authorization: `owner:11cffd71771d89e9f9c7ced1ed0e2f5f22018c2782e63501c001a60a5a225b24`

## Goal

只关闭 `NEXT-RP-001`：把 canonical semantic identifier grammar 与 Owner authority fact/ref wire shape 冻结到 Apply 不需要临时发明规则。

## Allowed planning mutation

- `proposal.md`
- `design.md`
- `specs/lifecycle-authority-and-identity/spec.md`
- `tasks.md`
- 本 Run `action.md / context.json / result.json`

## Required closure

1. 冻结 `SemanticId` accepted/rejected grammar；
2. 冻结 `OwnerAuthorityFact` 字段、必填/可选性、`ref/sourceRef/scope` representation；
3. 明确 structural validation 与后续 Policy recognition/eligibility 分离；
4. 对齐 tasks 2.1 / 3.2；
5. 保持 OpenSpec 4/4 complete 且 strict validation PASS。

## Forbidden

- production source / tests implementation；
- Apply；
- Git commit / push；
- 自动进入下一 Action。
