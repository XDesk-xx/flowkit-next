# Revise Propose 073 — 阶段 Skill HOW 最小计划修订

## 输入与边界

- Run：`20260907-073-revise-propose`；Role：Author；输入：`20260907-072-review-propose`。
- `072` 已撤回 `D04-RP007-001` 并给出 `approved`；本轮不是修复该 finding，而是 Owner 明确授权在同一 `correct-delivery-content-continuity` Change 内补入新的阶段 Skill HOW 计划。
- 已核对的 Owner 材料决定：此前将原始 Explore proof 移到 `.tmp` 且无需长期保留属于明确授权，不是 Author 越权。
- 本轮只修改现有 `proposal.md`、`design.md`、`tasks.md` 并记录本 Run；不修改 Skill、生产实现、测试、delta specs、Runtime/Policy/Run schema 或 Git。

## 真实修订

1. 在 Proposal 中加入三项有界 HOW：decision-relevant Owner handoff、Explore 实验/已接受依据/当前实现验收证据分层、Reviewer 先核对且只按具体合同影响阻断。
2. 在 design D8 固定最小语义和 bootstrap/product 独立边界；`.agents/skills/**` 与 `skills/actions/**` 各自在自身 bytes 中收敛等价 HOW，不互相引用或执行。
3. 在 tasks 6.5–6.7 与 7.5 加入后续 Apply 的具体 Skill 目标、反例和交接验收；任务由 32 项变为 35 项，仍全部未勾选。
4. 核对 canonical `author-action-guidance` 与 `reviewer-action-guidance` 后，确认这是现有能力内的 HOW 优化；七个 delta specs 与 `070` 绑定 hash 全部一致，不增加 capability/spec。
5. exact managed OpenSpec `1.10.0` 的当前 Change strict PASS，全量 strict `23/23` PASS；`git diff --check` PASS。未运行产品测试或 Formal Full Test。

## 收敛与 STOP

保留原 Proposal 已批准的内容连续性合同，不重做已收敛 Explore，不创建 Registry、统一 proof 存储、永久 proof 保留义务或新 authority/schema。本轮没有 Apply、Skill/production mutation、archive、Full Test 或 Git 操作。

下一边界：独立 `review-propose`。STOP。
