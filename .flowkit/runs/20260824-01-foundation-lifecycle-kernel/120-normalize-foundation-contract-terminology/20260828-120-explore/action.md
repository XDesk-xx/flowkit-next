# 120 Explore — normalize-foundation-contract-terminology

## Authority

Owner authorized activation and proof-based Explore for:

```text
Delivery: 20260824-01-foundation-lifecycle-kernel
Change: normalize-foundation-contract-terminology
Action: explore
Role: author
```

The already-recorded Full Test correction/finalization memo is explicitly separate and outside this Change.

## Skills

```text
.agents/skills/openspec-explore
.agents/skills/explore-proof-based
```

## Explore target

Prove the smallest safe corrective boundary for removing unnecessary internal V1/V2/V3-style product/version terminology from canonical Foundation OpenSpec contracts without changing approved behavior.

## Authorized mutation boundary

Explore may mutate only activation/planning/history artifacts:

```text
openspec/delivery-groups/20260824-01-foundation-lifecycle-kernel.yaml
openspec/changes/normalize-foundation-contract-terminology/.openspec.yaml
openspec/changes/normalize-foundation-contract-terminology/explore.md
.flowkit/runs/.../20260828-120-explore/**
```

It MUST NOT modify canonical specs yet, production source/tests, package/build config, `.agents/**`, repository guidance, or `.flowkit/memos.json`.

## STOP

This Action stops at `review-explore`. It does not create Proposal approval, Apply, Archive, checkpoint, formal Delivery Full Test, Archify Final, Delivery Final or Owner promotion.
