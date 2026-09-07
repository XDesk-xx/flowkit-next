# Action — Propose

```text
delivery: 20260902-04-delivery-continuity-stable-core-closure
change: converge-cross-platform-unreadable-fixture-discipline
role: author
action: propose
base: 875b7827867fd8489f9c3d05837fa3879ec15e2b
projectOrdinal: 031
input: 20260905-051-review-explore
```

## Result

```text
PASS
```

Proposal freezes the Reviewer-approved minimum correction:

```text
2 existing unreadable Guidance fixture tests
+
1 narrow MODIFIED requirement in formal-full-test-execution-and-correction
```

Capability-bound SKIP is explicitly project-local test/fixture accounting only. The Proposal does not add Core skipped status, skip registry, evidence persistence, platform lifecycle, ACL/filesystem subsystem, production resolver mutation, sixth planned capability, or D05.

The canonical rule continues to reject silent skip, OS-name-only skip and fabricated PASS. Explicit capability-bound accounting is allowed only after actual capability probe proves the fixture unavailable and the same exact candidate retains a real enforcement-capable proof of the semantic behavior.

Fresh native-Windows proof is mandatory after Apply. The older 227/229 Windows result remains trigger evidence only.

## Verification

```text
current Change strict: PASS
OpenSpec --all --strict: 23/23 PASS
git diff --check: PASS
production mutation: NONE
scope drift: NONE
```

## Next boundary

```text
review-propose
```

STOP.
