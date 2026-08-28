# OpenSpec

This is the canonical OpenSpec project root for `flowkit-next`.

Current managed OpenSpec identity is exact `1.10.0` as locked by `config/tools/toolchain.lock.json` and restored through external `FLOWKIT_HOME`.

Repository roles:

```text
openspec/specs/             → canonical synchronized specifications
openspec/changes/           → active Changes (normally empty when no Change is active)
openspec/changes/archive/   → archived Change history
openspec/delivery-groups/   → external Delivery planning/finalization facts
```

Flowkit integrates with OpenSpec thinly and must not create a second proposal/design/tasks/archive state machine.
