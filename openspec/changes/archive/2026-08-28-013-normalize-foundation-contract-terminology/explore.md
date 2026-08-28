# Explore — normalize-foundation-contract-terminology

## Owner-authorized problem

The current Foundation candidate is functionally complete and the Delivery Full Test contract is already frozen. Before formal Full Test, Owner authorized one minimal corrective Change to remove unnecessary internal version terminology from canonical OpenSpec contracts.

This Change is intentionally narrow:

- correct canonical `openspec/specs/**` wording only;
- preserve all approved behavior and requirement predicates;
- do not introduce a replacement V1/V2/V3 hierarchy;
- do not modify production source, tests, CLI behavior, Policy behavior, OpenSpec integration behavior, `.agents/**`, repository guidance, or the separately recorded Full Test correction/finalization memo.

## Facts

1. Canonical OpenSpec is the formal product/contract truth for the affected requirements.
2. Git + OpenSpec Change history already provides evolution/history; no internal product/API version hierarchy is needed here.
3. Repo-wide history contains older exploratory/archive wording using `V1`; archived Change artifacts and `.flowkit/runs` are historical evidence and MUST NOT be rewritten by this corrective Change.
4. External/runtime versions such as OpenSpec `1.10.0`, Archify `2.15.0`, Node `22.23.2`, package/schema/serialization versions, and vendor metadata are legitimate version facts and are not targets.
5. `.flowkit/memos.json` contains the separately authorized future Full Test correction/finalization memo. It is non-canonical sidecar state and is outside this Change.

## Proof 1 — canonical internal-version scan

A bounded scan of `openspec/specs/**` for V-number/product-version terminology found exactly two Flowkit-internal occurrences:

```text
openspec/specs/openspec-thin-integration/spec.md
  Requirement: V1 exposes only two closed read-only observations

openspec/specs/policy-and-next-boundary/spec.md
  Policy V1 SHALL 仅识别 `decision == "revise-action"` ...
```

No other canonical `V1`, `V2`, or `V3` product/API hierarchy wording was found.

The same scan also found legitimate version facts that MUST remain unchanged, including:

```text
OpenSpec 1.10.0
Archify 2.15.0
Node 22.23.2
managed-tool exact version requirements
```

Decision impact: Proposal only needs to modify two existing canonical capabilities; no broad terminology migration is required.

## Proof 2 — production behavior does not depend on V-number terminology

A scan of `src/**`, `tests/**`, package/build configuration found no `V1`/`V2`/`V3` product branch, discriminator, compatibility path, versioned API type, or runtime behavior tied to these two phrases.

Decision impact: removing the words from canonical requirements does not require product implementation or test changes.

## Proof 3 — exact edits are semantic-preserving wording normalization

Candidate edit A:

```text
Requirement: V1 exposes only two closed read-only observations
→
Requirement: Exposes only two closed read-only observations
```

The requirement body remains unchanged and still says the system SHALL provide exactly two repo-local read-only observations and MUST NOT expose a generic arbitrary OpenSpec executor or mutating/workflow-driving operations.

Candidate edit B:

```text
Policy V1 SHALL 仅识别 `decision == "revise-action"`
→
Policy SHALL 仅识别 `decision == "revise-action"`
```

All authority identity/scope predicates and blocked outcomes remain unchanged.

A controlled in-memory transform proved each candidate changes only the exact `V1 ` token; surrounding text, normative SHALL/MUST predicates, exact action/decision literals and all scenarios remain byte-identical.

Decision impact: this is wording normalization, not behavior expansion or contraction.

## Historical boundary

Repo-wide non-canonical history still contains `V1` wording in archived Explore/Design/Task artifacts. Those occurrences describe what authors believed at the time and are durable history. They MUST remain untouched.

Likewise this Change MUST NOT normalize:

- archived Change artifacts;
- prior `.flowkit/runs`;
- `.agents` skill metadata versions;
- vendor/upstream skill versions;
- managed runtime/package versions;
- serialization/schema `formatVersion` concepts;
- the Full Test correction/finalization memo.

## Proposal-ready boundary

### Required canonical modifications

Only these existing capabilities are affected:

1. `openspec-thin-integration`
   - rename the requirement heading to remove the `V1` qualifier;
   - requirement body/scenarios remain semantically unchanged.

2. `policy-and-next-boundary`
   - remove `V1` from the Owner-correction requirement sentence;
   - all recognized decision/identity/scope/outcome rules remain unchanged.

### Expected implementation boundary

```text
src/**             no mutation
tests/**           no mutation
package/build      no mutation
.agents/**         no mutation
.flowkit/memos.json no mutation
```

Apply should consist only of canonical spec wording edits plus normal Change artifacts/history. If Proposal or Apply discovers a requested change to behavior, lifecycle, Full Test semantics, CLI, Policy predicates or OpenSpec integration scope, that is out of Owner-authorized scope and requires stopping/replanning rather than expanding this Change.

## Explicit non-goals

- Full Test correction/finalization machine model
- planned/corrective Change type machinery
- Delivery state enum changes
- memo mechanism changes
- repository `AGENTS.md` / README guidance convergence
- CLI/runtime/API versioning
- V2/V3 replacement terminology
- code/test refactoring
- rewriting historical records

## Explore conclusion

**PASS — Proposal-ready.**

The real problem is exactly two canonical wording occurrences. They can be normalized without changing behavior. No production implementation, test behavior, new capability, new lifecycle mechanism or version hierarchy is justified.
