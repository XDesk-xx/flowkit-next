# Action — Propose

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: establish-action-guidance-execution-contract
role: author
action: propose
input: 20260831-006-review-explore
review-chain-start: 20260831-001-explore
base: 9b32b98db8c989f85ac0e1e5894a91b7e04f05df
stable-manager-base: 4b45552b90ee327488bde3141c51c556e65a2e95
skills:
  - .agents/skills/openspec-propose
  - .agents/skills/proposal-convergence
```

## Authorization boundary

Reviewer 006 returned:

```text
verdict: APPROVED
nextBoundary: propose
blockingFindings: []
proposalAllowed: true
```

This Action creates planning artifacts only.

No Apply / production implementation is authorized or performed.

## Approved Explore input

Exact final Explore SHA-256:

```text
a32909fdcb0c395511f1f0b255f3fb2a25c1bedcaad0a6b8cc0f6335c63a4672
```

The Proposal preserves the approved Owner boundary:

```text
D03 / D04 flowkit-next self-development
→ .agents/skills/** independent bootstrap plane

Flowkit-managed product Guidance
→ skills/actions/<StandardActionId>/SKILL.md

self-hosting takeover before Stable Core closure
→ forbidden
```

## Proposal convergence

The Proposal commits only to the smallest approved Change 1 contract:

```text
already-decided StandardActionId
↓
trusted deterministic product GuidanceRef
↓
exact ActionPackage
↓
existing ActionPackageRef
↓
existing ApplicableCheck executionInputRef
```

Capabilities:

```text
new:
action-guidance-execution

modified:
action-package-and-result-admission
```

No separate ApplicableCheck delta is introduced because its existing contract already consumes the exact ActionPackage identity.

## Artifacts created

```text
proposal.md
specs/action-guidance-execution/spec.md
specs/action-package-and-result-admission/spec.md
design.md
tasks.md
```

No final Author / Reviewer Action Guidance bodies are created by this Change.

## Validation

```text
OpenSpec planning status: 4 / 4 complete
change strict validation: 1 / 1 PASS
all OpenSpec strict validation: 15 / 15 PASS
production source/test mutation: NONE
invented Core-v1 wording: NONE
```

## Result

```text
PASS
nextBoundary: review-propose
```

## STOP

Stop after Proposal planning artifacts and handoff.

Do not enter Apply until independent review-propose approval and a later explicit Owner instruction.
