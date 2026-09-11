# 026 review-apply findings

审查对象：`20260908-025-apply`；批准合同：`024-review-propose → 023-revise-propose`。结论：`changes-requested`。

## D05-RA026-001 · P2 · Run group 后缀匹配混入其他 Change

位置：`src/cli/current-run-chain.ts:198`（过滤条件在 201 行）。

`entry.name.endsWith("-" + changeId)` 没有按 canonical group 的 sequence 与完整 ChangeId 分界。两个合法 Change `feature` 和 `improve-feature` 在同一 Delivery 时，后者的 `001-improve-feature` 被选为前者的 group。

独立反例：

- `feature` 确实空历史，仅另一个 Change 有合法历史：返回 `run-chain-invalid / Invalid Run group prefix: 001-improve-feature`，而不是合法空历史。
- 两个 Change 都有合法历史：查询 `feature` 返回 `context-ambiguous / Multiple Run groups for feature`。
- 对照：另一个 Change 改为无后缀重叠的 `different-change`，相同查询正常。

影响：正常独立 Change 的存在会阻断已明确目标的 status/next，违反 design §1 的“读取仅限选定 Change 的受控 Run group”及 foundation-cli-surface 的 exact target / empty-history 约定。不是 Owner 未选择目标，也不是损坏历史。

最小修正：用 canonical group 结构识别受控 sequence 前缀与完整 ChangeId；semantic bootstrap 仍仅 exact identity 匹配。区分其他合法 Change 与当前 Change 的真实重复/混合/坏 group，保留现有 fail-closed 行为，不改名目录、不迁移历史、不新增 registry。补上后缀重叠的空历史与双有效历史回归。对应 tasks 1.2/1.3/5.2。

## D05-RA026-002 · P2 · HOW 对已有 prepared Action 重复 prepare

位置：`skills/actions/explore/SKILL.md:114`。核对其他 Action 中同类直接条款，避免只修一个副本。

HOW 无条件要求用 `transitionCurrentAction(previousAction, {type:"prepare", identity})` 得到 currentAction，但既有内核会拒绝对 `prepared A` 再次 `prepare A`。这与 HOW 同时承诺的失败后使用新 occurrence 再次执行不相容。

独立反例：旧 occurrence 为合法 `explore/prepared`、四个 outcome/next 槽均为 null，Policy 返回 `ready-action(explore)`。使用新 occurrence 按 HOW 做 prepare 得到 null，随后已发布 Explore 示例 `startRecord` 报 `invalid package/Role`，新开始记录无法建立。对照：直接复用 exact prepared CurrentAction，仅更换 occurrence/previousRunId，既有 formActionPackage 与 startRecord 均可成功，旧失败记录未变。

影响：合法再次执行被 HOW 阻断。canonical single-action 规范“Reuse the same prepared Action for a later invocation”明确要求复用而非 duplicate prepare；023 的 Agent 同合同路径和新 occurrence 约定仍保留这一语义。不是 Proposal 缺陷，也不需要新增 retry/resumed 生命周期。

最小修正：HOW 区分 null/不同 terminal 的合法 prepare 与 exact same prepared 的复用；不同 prepared target 继续拒绝。增加按 HOW 从真实形态 prepared 失败记录到新 occurrence 的用例，保留旧记录与单次 STOP。不通过修改内核允许 duplicate prepare 绕过问题。对应 tasks 2.3/4.1–4.3/5.2。

## 非阻断说明

`AGENTS.md:69` 仍称新产品 `status / next / doctor / action` 参与验收，与同文件第 10 节和三命令实现不一致。可在已有 task 4.5 的直接说明收敛中去掉旧 action 字样；无需改历史 Review/Run。

## 实际复核与边界

218 个相关输入/材料引用核对一致，批准的六份非 tasks 计划正文未变，tasks 只改变完成标记；10 个协议源/测试文件已撤出且保留原始备份，manifest 仅三处批准说明字符串变化。20 个受影响 source/tests 最大 595 行，未放宽 650 行 gate。

本次六个定向测试文件共 21/21 通过，OpenSpec strict 和 git diff --check 通过；最小反例在当前候选独立复现两项缺陷。这些事实可同时成立，已有 PASS 不覆盖遗漏场景。attempt-01 的 sandbox EPERM 和 attempt-02 真实输出均保留。

Reviewer 使用独立 bootstrap HOW；没有读取或执行 candidate review-apply HOW，也未跑会加载该文件的全 HOW 测试循环。测试选择用于维持独立性，不作为完整候选测试通过的声明。本次没有重新执行全部 Windows/Linux suite 或 Formal Full Test。

下一交接 `revise-apply`，只修上述现有合同内的实现/HOW 缺口并补回归；不回到 Explore/Proposal，不恢复 JSONL，不改写 019/020/025 历史结果。Reviewer 仅写自己的 Run/proof，STOP。
