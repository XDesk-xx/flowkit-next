# 113 Explore — validate-foundation-manager-cross-platform

## Authority

Owner authorized activation and proof-based Explore for:

```text
Delivery: 20260824-01-foundation-lifecycle-kernel
Change: validate-foundation-manager-cross-platform
Action: explore
Role: author
```

Owner also refined the final acceptance boundary before activation:

```text
Linux x64 detached
→ real whole-manager acceptance

Windows
→ bounded compatibility simulation
→ no Windows Native PASS claim
```

## Skills

```text
.agents/skills/openspec-explore
.agents/skills/explore-proof-based
```

## Explore target

Determine the smallest Proposal-safe boundary for the final required Foundation Change:

1. prove the built candidate can execute a real whole-manager path in detached Linux;
2. bound Windows compatibility simulation without pretending to perform native Windows execution;
3. determine whether another production capability is required;
4. freeze the shape of the exact Delivery Full Test execution contract;
5. preserve bootstrap/self-hosting, authority, Git and Archify boundaries.

## Mutation boundary

Explore may mutate only planning/governance/history artifacts required to activate and capture the Change. It MUST NOT implement production functionality.

Expected mutations:

```text
openspec/delivery-groups/20260824-01-foundation-lifecycle-kernel.yaml
openspec/changes/validate-foundation-manager-cross-platform/.openspec.yaml
openspec/changes/validate-foundation-manager-cross-platform/explore.md
.flowkit/runs/.../20260828-113-explore/**
```

Production `src/**`, tests, package/build config and canonical specs remain unchanged.

## STOP

This Action stops at `review-explore`. It does not create Proposal approval, Apply, formal Verification PASS, Archive, checkpoint, Delivery Full Test PASS, Archify Final or Owner promotion.
