# Action: review-apply

- Run: `20260824-019-review-apply`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-lifecycle-domain-contract`
- Role: `reviewer`
- Authority: explicit user instruction to invoke the repository `review-apply` skill on the 018 Apply author payload
- Execution mode: `detached-linux-review-apply-no-flowkit-lifecycle`

## Prepared boundary

- Input Action: `20260824-018-apply`
- Input Apply status: `complete`
- Input next boundary: `review-apply`
- Review skill: `.agents/skills/review-apply/SKILL.md`
- Approved planning boundary: `20260824-017-review-propose` with reviewer verdict `approved`

## Review scope

Review the approved Change against the actual Apply diff for:

- scope compliance
- implementation correctness
- verification evidence
- regression safety
- OpenSpec task/apply closure
- stable-transfer truthfulness and boundary safety

## Stable output boundary

- reviewer verdict and independently reproduced facts only
- no implementation mutation
- no OpenSpec planning/spec mutation
- no delivery-group lifecycle mutation
- external stable-transfer Run record under `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/012-establish-action-lifecycle-domain-contract/019-review-apply/`

## Non-claims

- this review does not issue Verification PASS
- this review does not grant Owner archive/checkpoint/promotion authority
- archive is not performed
- the candidate Flowkit runtime did not emit this external bridge Run
