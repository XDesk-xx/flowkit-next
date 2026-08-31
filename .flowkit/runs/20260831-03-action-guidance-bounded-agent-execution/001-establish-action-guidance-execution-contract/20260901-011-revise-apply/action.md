# Action — Revise Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: establish-action-guidance-execution-contract
role: author
action: revise-apply
input: 20260901-010-review-apply
approved-proposal: 20260831-008-review-propose
base: 9b32b98db8c989f85ac0e1e5894a91b7e04f05df
stable-manager-base: 4b45552b90ee327488bde3141c51c556e65a2e95
skill: .agents/skills/revise-apply
```

## Finding classification

Reviewer finding:

```text
D03-RA-001
→ verification-evidence-gap
→ test-only
```

The approved product contract and production implementation remain accepted.

No Proposal change is required.

## Minimum correction

Only:

```text
tests/unit/domain/action-guidance-execution.test.ts
```

was changed relative to 009 Apply.

Linux behavior is now exercised as:

```text
non-root
→ chmod(000)
→ real resolver returns null

root detached host
→ canonical SKILL.md remains root-owned 0600
→ child Node process runs with uid/gid 65534
→ child calls the real resolveActionGuidanceRef(...)
→ real permission denial occurs
→ resolver returns null
```

Windows keeps bounded platform handling and does not add an ACL framework.

## Forbidden expansion

No:

```text
filesystem adapter
dependency injection layer
mock filesystem subsystem
permission abstraction
production test seam
new compatibility contract
```

was introduced.

## Verification

Exact Node:

```text
22.23.2
```

Results:

```text
targeted unreadable/resolver test file
→ 7 PASS / 0 FAIL / 0 SKIP

full domain suite
→ 155 PASS / 0 FAIL / 0 SKIP

typecheck
→ PASS

repository Prettier
→ PASS

repository ESLint
→ PASS

forbidden tracked artifacts
→ PASS

git diff --check
→ PASS
```

010 Reviewer already independently accepted production semantics and reproduced acceptance/build/dependency/entropy/OpenSpec checks. Because 011 changes test code only, those production facts remain applicable and were not needlessly rerun.

## Result

```text
PASS
```

`D03-RA-001` is resolved with real low-privilege permission evidence on the primary detached Linux environment.

## STOP

Return to independent `review-apply`.

Do not archive automatically.
