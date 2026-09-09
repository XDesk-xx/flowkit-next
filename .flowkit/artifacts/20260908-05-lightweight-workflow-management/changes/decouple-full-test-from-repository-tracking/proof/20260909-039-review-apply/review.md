# 039 review-apply

## 结论

审查对象为 `20260909-038-revise-apply`，批准合同来自 `033-review-propose`。Verdict：**changes-requested**，唯一阻断为 D05-RA039-001；不是合同缺陷，不另开 Change。

本轮按独立 `.agents/skills/review-apply/SKILL.md` 执行，未消费 candidate Reviewer HOW。038 所修普通输出参数反例已独立验证收敛；不能据此把所有 Node 启动参数组合都视为完成工具身份绑定。

## 唯一 finding：D05-RA039-001 / P1

**位置：** `src/internal/full-test-tool.ts:85–94`。

带值的 Node 选项被当作无参 flag 跳过，其值被误认作入口并触发提前停止。实际命令：

```text
node --conditions development node_modules/review-tool/cli.cjs
```

reader 跳过 `--conditions` 后，把 `development` 当作候选文件；该文件不存在，便 break，未读取真正执行的 `cli.cjs`。这不是要求跟踪任意应用输出参数，而是已经声明的直接工具启动资源丢失。

独立实际入口复验（`attempt-02/option-observations.json`）：

- 第一轮工具脚本真实通过，current reader 为 passed。
- 只把该工具脚本从输出成功改为 exitCode 7；产品输入、配置、lock 与 Node 可执行文件不变。
- inputRef/checkRef 不变，current reader 仍为 passed，未识别旧结论 stale。
- 新调用真实执行同一命令后失败，reader 才变为 failed。

**合同影响：** approved design §1–2、tasks 1.1/1.3，以及 Full Test delta 的 exact material check identities / drift 要求。不能确认真正执行的工具 bytes，却允许当前 PASS 继续被消费，是 correctness blocker；不声称已经实测绕过完整 Delivery Final。

**最小修正：** 在现有有界工具识别中正确区分 Node 选项及其值、启动资源、脚本 argv。支持的启动形式必须绑定实际入口/preload；不能可靠识别的形式在准备阶段具体拒绝，不能静默生成仅含 Node executable 的有效身份。补上述实际入口回归（工具变更后 stale 或该启动形式明确拒绝），同时保留 script/--/eval 输出新建与覆盖通过、直接工具/包内实现漂移、准备失败诊断。无需通用 CLI 解释器、依赖图、Registry、新配置平台或 Proposal 重设计；不通过只改本项目命令绕过通用入口缺陷。

## 已验证部分与连续性

- RA037-001：新建与覆盖已排除报告均 check exit 0、Full Test/current passed，选中文件、configRef/inputRef/toolRef 不变。
- RA035-001 原直接工具反例仍正确 stale；新失败不回旧 PASS。带值选项变体的遗漏单列本次 finding。
- RA035-002：配置缺失、未知字段、缺输入、缺 executable 四类入口诊断仍可区分；对应测试继续覆盖准备不发布 attempt、malformed JSON 不回显内容。
- 167 个 Author 引用的路径/bytes/hash 真实核对；累计 48 个候选文件覆盖祖先，只有申报的 2 个文件变化，其他 46 个保持。8 份计划和真实 Delivery manifest 未改。
- 本轮独立 28/28 相关测试、typecheck、exact OpenSpec 1.10.0 strict 均通过。原反例及两个边界探测的退出 0 只表示观察完成；选项探测明确暴露错误接受旧 PASS。
- Author 当前 Linux 9-check fixture 的来源、原始记录和结果已核对；本轮未重跑整套 Linux，也未执行真实 D05 Formal Full Test。
- sandbox attempt-01 为真实 spawn EPERM；原样获准另存 attempt-02，保留两次材料，不覆盖。

## 必需评估与解耦说明

当前步骤：独立审查有界 revise-apply，核对已修 finding 与未改候选连续性。

复杂度 / 最小性：两个文件的改动规模受控，但启动参数识别尚未 fail closed；应在当前 helper 内收敛，不以扩大通用系统解决。

新内容 / scope drift：NONE。finding 是已批准的真实工具输入绑定缺口，不是新业务能力或 Owner scope。

当前方案把四件事分开：项目配置决定测试范围，不依赖 Git 可见性；工具和产品输入变化决定测试结论是否过期；必要执行记录长期留 target artifacts，仅消费当前 attempt 并验证完整性；代码 gate 与 Git checkpoint 检查独立。三文件 Action Runs 不变，.tmp 可删除；旧 PASS 不自动补位。Archify 和 manager/target 边界属于前序已完成范围，本 Change 不声称已经解除 Start、完整 Final 与 Git 的全部耦合，后续 Changes 仍保留。

## 交接 / STOP

继续当前 Change 的 revise-apply，修正唯一 finding 后重新独立审查。不修改 Author source/tests/计划/Skills/manifest 或历史 Run；未执行 Archive、正式 D05 Full Test 或 Git mutation。Reviewer verdict 不产生这些 authority。
