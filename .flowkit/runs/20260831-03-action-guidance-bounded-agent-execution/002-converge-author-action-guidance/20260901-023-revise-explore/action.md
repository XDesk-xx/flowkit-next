# 023 Revise Explore — converge-author-action-guidance

## Trigger

Owner correction after the `20260901-022-archive` candidate exposed an incorrect archive ordinal model.

## Exact correction

Previous Explore conclusion:

```text
archive ordinal
= 1-based current Delivery manifest position
```

is superseded by:

```text
archive ordinal
= project-wide monotonic Change ordinal
= stable Change slot lineage across Deliveries
```

Proof:

```text
D01 = 001..013
008 cancelled but retained

D02 = 014..019

D03
Change 1 = 020
Change 2 = 021
Change 3 = 022
```

The exact current Change therefore owns project ordinal `021`.

## Complexity result

Archive remains thin:

```text
resolve exact Delivery/Change slot
→ derive project ordinal from stable Delivery slot lineage
→ compose archive name
→ reuse OpenSpec archive mechanics
→ STOP
```

No Counter Service, Registry, allocator, new lifecycle state, or Core runtime is introduced.

## Preservation

All other approved Change-2 Explore boundaries remain unchanged:
- exactly seven Author canonical product Guidance entries;
- single-file Guidance identity;
- Mechanical Preflight internal to apply/revise-apply;
- independent `.agents` bootstrap through D04;
- one bounded archive bootstrap wrapper only;
- no self-hosting takeover;
- temporary Run bridge retained;
- no historical mass normalization by default.

No Proposal or production implementation was changed by this revise-explore Action.

STOP at `review-explore`.
