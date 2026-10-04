# Review Propose 03 — repair-archive-lifecycle

- 日期：2026-10-04（Asia/Shanghai）
- Role：reviewer
- Verdict：approved
- 基线：main / 9b96b150eec8b59c40d1a72eb61054695a6e763b
- 范围：14 份规划输入（proposal/design/tasks、10 份 delta specs、.openspec.yaml）及相关前轮 Review/Author 交接。
- 执行：沿用 Owner 明确的直接 OpenSpec 审查边界，不创建 Flowkit Run / Delivery。

## 结论

本轮未发现需要阻断实施的规划问题。RP-03 已在规划层闭合；此前 RP-01、RP-02 的修订保持有效。批准仅适用于下列 exact 规划输入，不是实现验收、Verification PASS、Archive、Final 或 Git 授权。

上一轮 review-propose-02.md 保留原始 changes-requested。本文件记录修订后的新 verdict，不改写历史。

## RP-03 的闭合依据

1. design 第 6 节已区分执行 clean/EOL 的内容与普通 add 的最终 index。表格不再无条件将显式 text 等同于实际 staging 必定生成 LF。
2. 已选择清晰、可判定的保守边界：当原普通 index blob bytes 等于 raw、但 clean/EOL 不同时，在成功候选持久化前明确 unsupported。相同 raw/index/规则下仅改变 stat 仍拒绝，不用时间戳形成脆弱的持久身份。
3. run-result-persistence 与 stable-action-command-execution delta 明确禁止保存猜测的 LF、把旧 CRLF 冒充稳定 identity，或事后重绑预期。Review、Archive、普通无 Review checkpoint 及归档目标 projection 均使用相同边界。
4. 已核实输出、absent、原 index 已等于预期内容的支持路径保留；其他 cache/索引状态不能证明时仍前置拒绝。raw 修改或 stat 不同单独不被当作转换必然发生的证明。
5. tasks 4.1、4.3、5.1、5.2 覆盖非 racy stat 命中及仅 stat 改变两种反例，要求产品接纳均拒绝且不写 index；独立语义 fixture 的 add 用于对照，不是产品规避手段。Author/Reviewer HOW 与任务 6.1 同步禁止自动 touch、refresh、renormalize、配置修改或 add 试算。
6. 归档目标独立应用该规则；如 projection 拒绝发生于已有业务效果之后，按真实 outcome 保留，不伪造 Archive PASS 或清除效果。

接受这一支持范围收窄。没有要求本 Change 支持所有 Git cache 状态，也不要求新增 stat 数据库或 Git 模拟器。

## 前轮问题与跨能力一致性

RP-01：delivery-finalization delta、design 第 5 节及任务 5.4 保持不变；成功 Archive 通过连续安全失败链关联 approved Review/Author，选择与接纳使用同一规则。Final 五字段 completion、当前 Full Test、Owner authority 与确认发布边界未被放宽。

RP-02：stage-0 indexBasis、auto 既有 CRLF 保留、输入或已核实输出关系、destination 自身索引依据继续保留。RP-03 没有退回无索引 hash 单独预测，也没有放松 raw、proof、历史 Result 的字节绑定。

## 当前步骤、复杂度与范围

当前步骤仅判断 Proposal 是否具有一致、可实施、可验收的合同。26 项实施任务仍未勾选是该阶段正常状态。

本次修订使用既有投影支持边界上的窄拒绝，复用各消费者的规则；没有新增 capability、Registry、自动流程或持久 stat 系统。复杂度与已复现问题相称。

新增文字和测试要求均服务于 RP-03；未扩展到消费项目升级、发行安装、全仓 normalize、历史迁移或真实 Delivery Full Test/Final。terminal partial 的人工恢复仍为明确限制，不宣称本 Change 提供完整自动恢复器。

## 实际验证与限制

- 本轮重新执行受控 OpenSpec，--version 为 1.10.0；validate repair-archive-lifecycle --type change --strict --json --no-interactive 返回 passed 1 / failed 0、valid=true、issues=[]。结构通过不能替代语义审查。
- 对比前轮输入，9 份规划文件发生修订，新增 revise-propose-02.md；原两份 Reviewer 文档和前轮 Author 交接未改。
- 读回 Author 材料目录 .flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/revise-propose/20261004-rp03/ 下的脚本、commands.json、原始流、git-semantics.json、planning-validation.json 与 revision-readback.json。
- 机械核对 revision-readback 的 10 份文件 SHA 均匹配当前文件；17 条命令元数据均记录 exit 0、无 signal/spawnError，原始流 offset 连续且完整覆盖实际文件。三个 index OID 与对应原始 stdout 一致。
- Author 的语义实验与本 Reviewer 上轮已亲测的 stat-cache 反例一致。本轮读取并核对已有材料，没有重复运行实验，也没有将其当成尚未实现的 candidate guard / 产品回归 PASS。
- git diff --check 通过；其不覆盖全部未跟踪文件。未运行产品实现测试、Linux/installed-manager 验收或真实 Archive。
- 本轮只新增此 Reviewer 文档；不修改 Author 规划、源码、测试、canonical specs、旧证据或 manager，不执行仓库 staging/commit/push。

## 后续边界

规划审查批准后，本次停止。后续 Apply 仍需 Owner 的新请求；实施必须按已列任务验证保守拒绝、受支持对照及跨消费者行为，不能用此批准或 Git 语义实验代替实现验收。

## 审查输入 SHA-256

路径相对本 Change。18 份输入包含 14 份规划文件及四份既有 Review/Author 文档。

| 路径 | SHA-256 |
| --- | --- |
| `.openspec.yaml` | `ad734da2ba5f4c5a6979a8bbb6bad4db20fb21ec275ceca5f24842fbdfaf5bef` |
| `design.md` | `24d7356182a107ee8425fda138754d95fb24989d007be5285c22902bc143ac19` |
| `proposal.md` | `0bf45790efaf1eee0ccfcedb3e12d58a34da2e3254ea111af3abedb221248d49` |
| `review-propose-02.md` | `d85f3dfa8d7611cd666d6adacf280bb1a60e391f1b56c4510fa499aea0e17a28` |
| `review-propose.md` | `f2fed40e0da81a3d123fbe55df0ffbf6b19b5da90c6a65188dbcb2b90b80c42e` |
| `revise-propose-02.md` | `fa24665fe648836a6249bead28dab22ebb0f96d03a0a9cf66567d3f9831611c1` |
| `revise-propose.md` | `657043b622464a31df518e9940cb5c00c12e06ec085698805c8ce1905aff6a06` |
| `specs/action-lifecycle/spec.md` | `484a22b80610760c5e2a32422e042f6718dcb4e1dab22bb66ff00ac3ba2dd9c8` |
| `specs/author-action-guidance/spec.md` | `b2938dcef95761688304896c1f3d15d941b92a5616d766cf49f43240ac3f3ad4` |
| `specs/delivery-finalization/spec.md` | `e22f48451c5a0d674ea7e63f6ae0e2b602a9c72fb2aa6ef6f36fb0cdcb7b88db` |
| `specs/policy-and-next-boundary/spec.md` | `9570d9ef466fa012d445c5963c31deaa29009a6cd983c81c2db58d961e405518` |
| `specs/repository-integration-and-next-base-continuity/spec.md` | `3748287f0b44f46bda0cc6c3f6e16cbb329e8307bf2f78f003314329fb7683e3` |
| `specs/reviewer-action-guidance/spec.md` | `148c3cfcba7a4f2cf333039e2f5d989ab50905e4c39e6b17428d3bb600fc8270` |
| `specs/run-result-persistence/spec.md` | `9fe2fddc09f28ae8bfeb9d583136162a8f8a2c047abdb082283a54fc3875f4c1` |
| `specs/single-action-execution-terminal-boundary/spec.md` | `29eb5e0ac4c5bdbc428e2d64d975857b8c03f717fbd86d8a379b53d297e10c43` |
| `specs/stable-action-command-execution/spec.md` | `dd150684969236d4b4ba200e40b8c24be736f0f193b649a5a08eb009621d7bb7` |
| `specs/stable-delivery-support-command-execution/spec.md` | `63251fcdeaf38be83c9310a26adca3f8cf658017680a23fb948fcac87c4c8dcc` |
| `tasks.md` | `742baeedddfca08a5f9dd3aeceab7666d9b5fbaef64599d83259aa47cbfe51a7` |
