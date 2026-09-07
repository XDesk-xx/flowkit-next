# Review Propose — correct-delivery-content-continuity

- Run：`20260907-071-review-propose`；Role：Reviewer；输入：`20260907-070-propose`。
- 已批准 Explore：`068-explore`，独立审查 `069-review-explore` 为 approved。
- Delivery：`20260902-04-delivery-continuity-stable-core-closure`；projectOrdinal：`32`；physical group：`007`。
- 基线：`b0b2d918c41212fe80e1ad5e58bc14dcd7217c1d`。
- 本次请求：根据最新的 runs，`review-propose`。
- HOW：独立 `.agents/skills/review-propose/SKILL.md`；外部 `flowkit` 命令不可用，未调用 candidate CLI、candidate Reviewer Skill 或声称 canonical Runtime admission。

## Verdict

`changes-requested`；一项阻断 finding：`D04-RP007-001`。当前交接的已批准 Explore 证据引用不完整，暂不交付 Apply。没有发现需要扩大产品范围或重写既有设计方向的理由。

## D04-RP007-001 — 恢复已批准 Explore proof 的可续接引用

级别：P2；类别：当前输入/交接完整性。

受影响位置：`explore.md:23,29,106`、`proposal.md:34`，以及 068/069 context 对该 Change `proof/` 下三份文件的 exact path/hash 绑定。070 声明 `stableTransfer: true`、`packageClass: full-propose-handoff`，但当前这些引用路径均不存在：

- `proof/continuity-proof-model.mjs`
- `proof/continuity-proof.mjs`
- `proof/execution.json`

Reviewer 找到了 `.tmp/correct-delivery-content-continuity-proof/` 中的三份真实副本，SHA-256 分别与 069 的绑定完全一致；因此不判为原字节永久丢失，也不需要重跑实验或从聊天重建。问题是 `.tmp/` 被 `.gitignore:4` 排除，当前 Explore 的三个链接仍断开，既有 Run 也没有指向一个已验证的耐久替代交接。接收端仅取得当前 Change/正常 Git-visible 交付物时，不能按声明路径取得这些材料。

这不是把旧 proof 变成永久产品测试的要求，也不是要求新建 Evidence 平台。它只要求当前已选择作为 Explore/Review 输入并明确引用的材料，能按真实的交接边界继续取得。上述问题与未来 D04 Full Test 外部 evidence 的已知 UNKNOWN 是两件事，不能互相豁免。

最小修正：优先从现有已核验副本恢复三份原 bytes 到原绑定路径，保持 068/069/070 历史 Run 原样；若 Owner 已决定外置，则以新的真实交接事实说明耐久位置、原 hash、取回及随交付保留方式，并通过相应合法边界收敛当前引用。不要只把链接改到 ignored `.tmp`，不要手改历史 Result 或重新生成同名“成功证明”。不要求为此无意义地重写已经一致的 Proposal/Design/spec 内容。

本次没有观察到移动操作本身或相应 Owner 决定，不推断由 Author 070 执行了移动；finding 针对当前接收到的状态。

## 其余合同审查与检查

- 070 的 8 个输入 hash、10 个输出 hash 全部匹配；069 的 Explore/最终方案/manifest/metadata 绑定仍匹配，缺口仅为上述三个原路径，真实替代副本已逐个核验。
- 已读 proposal/design/tasks、七个 delta、approved Explore/069，以及相关 canonical/source 合同。共享材料/v2、Start 完成事实、Final 必要证据、Integration 具体操作及阶段 lineage 均可追溯至批准范围；32 项任务全部未完成，未把计划当作实现 PASS。
- closed projection、兼容性拒绝、error/race、来源/覆盖、Git prestate、create/reuse 分支、阶段 failure/STOP 与 direct-consumer 验收有相应设计和任务；future host/roots、Registry、通用恢复及 D05 没有回流。
- managed OpenSpec `1.10.0`：当前 Change strict PASS；all strict 23/23 PASS，仅证明结构。10 个新计划文件 UTF-8/LF/EOF/无 trailing whitespace 检查通过；包括 Explore 的 7 个相对链接中 3 个断开，正是本 finding。`git diff --check` PASS。
- 没有执行产品实现、产品测试或 Formal Full Test；当前读到的既有实验/测试记录不升级为本轮 Verification verdict。

当前步骤：验证 Proposal 对批准 Explore 的溯源、可实现/可验收合同及交接完整性。复杂度/最小性：一个共享材料合同及必要直接消费者，无新增控制平台；范围漂移：NONE。阻断来自证据交接，不是新增产品需求。

按 canonical Policy 的 `review-propose changes-requested → revise-propose` 映射记录续接引用；本轮不执行修正或下一 Action，不产生 Owner/Git authority。Reviewer durable 写入仅为本 Run 三文件，所有 Author 产物、临时副本、manifest、Memo、历史 Runs、生产代码/测试和项目 Git index/history 均未修改。

STOP。
