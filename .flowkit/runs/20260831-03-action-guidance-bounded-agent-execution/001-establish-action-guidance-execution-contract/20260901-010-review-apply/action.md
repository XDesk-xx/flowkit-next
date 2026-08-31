# Action — Review Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: establish-action-guidance-execution-contract
role: reviewer
action: review-apply
input: 20260831-009-apply
approved-proposal: 20260831-008-review-propose
base: 9b32b98db8c989f85ac0e1e5894a91b7e04f05df
stable-manager-base: 4b45552b90ee327488bde3141c51c556e65a2e95
```

## Verdict

```text
CHANGES REQUESTED
```

The production implementation is accepted in direction and scope.

One bounded **test-only** correction is required before Apply can be approved.

No production redesign is requested.

---

# D03-RA-001 — Required unreadable-file scenario is skipped in the primary detached environment

The approved Proposal / tasks require proof that:

```text
canonical Guidance entry is unreadable
→ resolver fails closed
→ no executable GuidanceRef
```

The current test exists, but on the actual detached Linux host:

```text
process.getuid() === 0
```

so it intentionally skips:

```text
unreadable canonical Guidance fails closed
→ SKIP
```

Current independent rerun:

```text
domain:
155 total
154 PASS
0 FAIL
1 SKIP
```

The implementation itself is straightforward:

```text
readFile(...)
→ EACCES/other filesystem failure
→ catch
→ null
```

but the required unreadable scenario is not actually exercised in the environment used for D03 review.

---

## Minimal simulation exists — no production abstraction is needed

Reviewer independently proved a smaller, realistic test method on the same detached host:

```text
root test process
↓
create canonical SKILL.md owned by root
↓
chmod file 0600
↓
spawn child Node process with uid/gid 65534
↓
child calls resolveActionGuidanceRef(...)
↓
read receives real permission denial
↓
resolver returns null
```

Prototype result:

```text
resolver result
→ null

child exit
→ 0
```

So the current SKIP is avoidable on the actual Linux detached environment.

### Required revise-apply

Update only the unreadable-file test.

Recommended bounded strategy:

```text
non-Windows + non-root
→ existing chmod(000) test is sufficient

non-Windows + root
→ spawn a child Node process under a non-privileged numeric uid/gid
→ call the real resolver against a root-owned unreadable canonical file
→ assert null

Windows
→ keep platform-bounded handling; do not invent an ACL framework in this Change
```

Equivalent minimal simulation is acceptable.

Do **not** introduce:

```text
filesystem adapter
dependency injection layer
mock filesystem subsystem
permission abstraction
production-only test seam
new platform compatibility contract
```

This finding requires test evidence only.

---

# Production implementation — PASS

Reviewer independently inspected the implementation.

Accepted shape:

```text
StandardActionId
↓
skills/actions/<actionId>/SKILL.md
↓
path + exact content SHA-256
↓
ActionGuidanceRef
↓
ActionPackage
↓
existing ActionPackageRef
↓
existing ApplicableCheck executionInputRef
```

Key properties pass:

```text
caller does not nominate Guidance path
missing canonical entry fails closed
.agents fallback is forbidden
final-entry symlink fails closed
parent-path symlink redirection fails closed
non-regular entry fails closed
content drift changes Guidance identity
wrong-Action GuidanceRef fails ActionPackage formation
RunContext durable schema remains unchanged
Guidance identity participates in ActionPackageRef
executionInputRef naturally inherits Guidance changes
single-Action callback is not invoked on Guidance/package failure
```

No production issue requiring redesign was found.

---

# Independent verification

Reviewer restored D03 `9b32b98` and overlaid the exact 009 Author package.

Exact Node:

```text
22.23.2
```

Results:

```text
domain tests
→ 154 PASS / 0 FAIL / 1 SKIP

acceptance
→ 4 / 4 PASS

typecheck
→ PASS

build
→ PASS

Prettier
→ PASS

ESLint
→ PASS

forbidden tracked artifacts
→ PASS

dependency health
→ 57 modules / 204 dependencies / 0 violations

repository entropy
→ 25 / 25 reachable

git diff --check
→ PASS

OpenSpec change strict
→ PASS

OpenSpec --all --strict
→ 15 / 15 PASS
```

The one SKIP is exactly D03-RA-001.

---

# Complexity assessment

Production complexity remains:

```text
MINIMAL_REQUIRED
```

The implementation adds only the proven seam:

```text
ActionGuidanceRef + deterministic resolver
+
ActionPackage package-only Guidance identity
```

and reuses existing:

```text
StandardActionId
RunContext validation
single-Action failure boundary
ActionPackageRef
ApplicableCheck executionInputRef
```

No new:

```text
Registry
Router
Planner
Agent Runtime
Guidance cache
second execution identity
new lifecycle state
new Run artifact
self-hosting takeover
```

was introduced.

The requested correction should add **zero production complexity**.

---

# New-content / scope-drift assessment

Reviewer explicitly checked whether 009 introduced new content beyond the approved 007/008 Proposal.

Result:

```text
new capability
→ NONE

new authority
→ NONE

new lifecycle semantics
→ NONE

new Guidance graph / Registry
→ NONE

self-hosting convergence
→ NONE

Changes 2/3 Guidance-body convergence pulled forward
→ NONE

Run persistence redesign
→ NONE

ApplicableCheck redesign
→ NONE
```

The acceptance fixture additions only provide bounded temporary canonical Guidance bodies required to keep existing single-Action acceptance tests valid.

Therefore:

```text
scope drift
→ NONE
```

D03-RA-001 does not authorize any new product content.
It closes one already-approved test obligation only.

---

# Current-step explanation

This Review Apply asks whether the approved Proposal was implemented correctly and whether the implementation has enough real mechanical evidence for independent acceptance.

Current result:

```text
implementation semantics
→ PASS

approved scope
→ PASS

complexity/minimality
→ PASS

new-content drift
→ NONE

verification completeness
→ one bounded unreadable-file evidence gap
```

The next boundary is:

```text
revise-apply
```

and the revision should be test-only.

STOP.
