# Action: explore

- Run: `20260824-012-explore`
- Delivery: `20260824-01-foundation-lifecycle-kernel`
- Change: `establish-action-lifecycle-domain-contract`
- Role: `author`
- Authority: `owner:78f2d96bf54dd7e6b4729a53d7f603480353624b4deaea174a172bec4fa80856`
- Execution mode: `detached-linux-direct-openspec-no-flowkit-lifecycle`

## Prepared boundary

- goalClass: `investigate-change`
- mutationClass: `explore-planning-only`
- outputClass: `current-explore-artifact-set`

本 Run 由外部流程连接者根据 Owner 明确授权接续未完成流程，并直接通过 OpenSpec `explore` skill 执行；同时使用 proof-based explore 辅助验证。

本文件是稳定传递所需的 Action 描述，不声称由 candidate Flowkit runtime / Policy 自动创建，也不伪造 Flowkit runtime 才能产生的 semantic input fingerprint。

本 Action 的稳定输出边界为：

- `openspec/changes/establish-action-lifecycle-domain-contract/explore.md`
- OpenSpec change scaffold `.openspec.yaml`
- Delivery-group 中目标 Change 的 `active` 状态与对应 Owner authority fact
- `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/012-establish-action-lifecycle-domain-contract/012-explore/context.json`
- `.flowkit/runs/20260824-01-foundation-lifecycle-kernel/012-establish-action-lifecycle-domain-contract/012-explore/result.json`

Proof 临时文件用于执行期验证，但不属于 stable-transfer payload。
