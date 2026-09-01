---
name: review-apply
description: Review the exact Apply candidate for approved-Proposal fidelity, minimal implementation convergence, real matching evidence, and a mutation-free Reviewer verdict.
metadata:
  author: flowkit
---

# Review Apply Action Guidance

## Authority

Flowkit/Policy has already decided the exact current Action `review-apply`.
This Guidance owns Reviewer HOW only. It does not create Owner authority, mutate implementation or Author artifacts, execute revise/apply/archive work, claim Delivery Verification PASS, decide the next legal Action, complete the Change, authorize Git, or continue into another Action.

## Exact reviewed input and approved chain

Inspect the exact supplied Apply candidate/diff, exact approved Proposal/Design/spec/tasks, materially relevant accepted Reviewer findings, and exact current Delivery/Change identity. When Apply follows a revision, verify exact finding convergence and verify already-approved unaffected content was preserved rather than opportunistically redesigned.

## Review focus

Judge whether implementation faithfully and minimally satisfies the approved contract with real matching evidence.

1. Trace every meaningful source/test/config/artifact mutation to an approved requirement or necessary verification.
2. Confirm no deferred/non-goal capability, later-Change content, new dependency, architectural layer, Registry/Router/Planner/Runtime, or generic subsystem was added without approved necessity.
3. Check implementation correctness and required fail-closed/edge behavior while preserving existing canonical behavior.
4. Reproduce materially decisive facts when needed and verify checks actually ran against the exact candidate/config/tool identity claimed.
5. Keep Author conclusion, Reviewer verdict, and Verification verdict distinct. `review-apply = approved` is not Delivery Verification PASS.
6. If implementation proves the approved Proposal materially wrong or impossible, STOP with a contract blocker/boundary-return finding; do not silently redesign the contract in review.

## Semantic invariant / literal discipline

Challenge permanent tests/config/planning claims that encode incidental repository observations. Distinguish stable contract constants from configuration / environment values and transient current-state literals. A lifecycle-transient observation must remain an observation; a legal lifecycle transition must not make a durable unit invariant false merely because the test hard-coded today's `active/planned`, ordinal, count, path, or ordering. Require a stable semantic/synthetic invariant instead.

## Findings and verdict

For every material finding identify the exact affected implementation/artifact/claim, observed fact, approved-contract impact, and minimum required Author correction. Reviewer remains independently mutation-free and must not edit implementation bytes or Author artifacts.

Verdict is one of:

```text
approved
changes-requested
rejected
```

Reviewer approval is Reviewer truth only; it is not Verification PASS, Owner authority, Change completion, Delivery Final, archive authority by itself, or Git authority.

## Required Reviewer report

Every Result briefly reports:

1. **Current-step explanation** — what `review-apply` is validating now.
2. **Complexity / minimality** — whether implementation reused existing seams and stayed within the smallest approved mutation surface.
3. **New-content / scope-drift** — whether new capability/content, authority, lifecycle semantics, acceptance requirement, compatibility surface, later-Change content, or control-plane scope appeared beyond the approved Proposal.

Implementation detail necessary to realize an already-approved requirement is not scope drift; report `scope drift: NONE` when appropriate.

## Run / handoff concision

Use only the existing `action.md + context.json + result.json` Run surface. Persist exact candidate/artifact/check identities, decisive reproduced facts, bounded findings, verdict, complexity/scope-drift assessment, and continuation references. Do not copy the whole Author Apply handoff, Proposal, diff, or test transcript when exact references are sufficient.

## Terminal boundary

After the real Reviewer Result is materialized, STOP.

If approved, report the legal continuation boundary supplied by Flowkit/Policy (normally `archive`) but do not execute it. If changes are requested or rejected, report the bounded finding/boundary only and do not perform Author correction.
