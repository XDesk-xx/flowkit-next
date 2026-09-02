---
name: flowkit-delivery-start
summary: Execute an already-decided Flowkit Delivery Start from exact accepted repository truth and stop at the fixed-point boundary.
---

# Flowkit Delivery Start

## Purpose

Execute the exact `delivery-start` operation after its identity and Owner boundary have already been decided. This Guidance owns HOW only. It does not select a Delivery operation, activate a Change, create authority, or replace Git/OpenSpec truth.

## Required package facts

Consume the exact package supplied by Flowkit. Treat its content-bound Guidance identity and operation facts as fixed execution inputs.

Required Start facts include:

- exact Delivery identity;
- exact accepted-base commit;
- exact Owner-approved planning-reference artifact and content hash;
- explicit Owner `create-delivery` authority whose scope includes `delivery-start`;
- optional `single-delivery-start-fixed-point-commit` scope when one ordinary Start commit is authorized.

Fail closed if package identity, Guidance identity, Delivery identity, accepted base, planning reference, or authority does not match the trusted repository facts.

## Execution

1. Verify the repository is at the exact accepted base and the working tree satisfies the clean-start precondition.
2. Read current Git/OpenSpec/Memo/Previous-Actual inputs from their canonical owners. Do not accept caller-supplied substitutes as truth.
3. Reuse exact repository/history/runtime state when it already exists. Restore only missing exact state, verify it, then continue through the same Start path. Do not create local/detached/ZIP/bundle lifecycle modes.
4. Materialize only the bounded Delivery Start surface:
   - Delivery manifest;
   - Current Architecture;
   - Planned Architecture;
   - Current → Planned compare.
5. Keep Archify evidence valid at each document's declared repository revision. Do not cite newly-created Start files as evidence for an older accepted-base revision.
6. Validate the complete Start surface with the applicable OpenSpec, Archify, Git and receipt/hash checks. Do not activate a Change automatically.
7. If explicit bounded commit authority is absent, STOP before Git mutation.
8. If that authority is present and validation is PASS, create at most one ordinary Delivery Start fixed-point commit, read its exact SHA, and STOP. That SHA is the next Change-execution base.

## Boundaries

MUST NOT:

- discover, rank, route or choose another Delivery operation;
- create a Skill Registry/Router/Planner;
- turn Delivery operations into Standard Actions;
- infer Git mutation authority from successful validation;
- require transport artifacts when exact state is already available;
- use `.agents/skills/**` as product Guidance fallback;
- use this candidate Guidance as authority for D04 self-acceptance;
- enter Change 1 Explore/Proposal/Apply bytes in the Delivery Start fixed-point commit.

At the canonical Delivery Start fixed point: **STOP**.
