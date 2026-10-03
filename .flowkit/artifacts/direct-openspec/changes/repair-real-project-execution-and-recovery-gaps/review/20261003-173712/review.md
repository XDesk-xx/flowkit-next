# 独立 review-apply

Verdict: changes-requested

审查目标：repair-real-project-execution-and-recovery-gaps

按 Owner 指示直接审查，不走 Flowkit lifecycle；本记录不是 canonical Run、Delivery Verification PASS 或 Git 授权。本次未修改实现、测试或规划材料。

## 问题

1. **P1 — Author 纠正后无法完成后续 Review。** `src/cli/run-effective-facts.ts:306-310` 在检查父链前就用 `runMaterialLocation` 将所有同组目录读成完整 Run。合法纠正并 `action start review-apply` 后，新建的 descriptor-only 目录使 `readEffectiveRun` 抛出 `Incomplete Run record`；真实 fixed CLI 的 `action finish` 返回 `internal-error`，仅留下 `action.md`。应先识别 descriptor/父链，再对实际 terminal 消费者核对完整事实；保持 fork/partial-machine 拒绝规则，补充 correction → start → finish 回归。

2. **P2 — workspace 内部依赖链接被误判为源码别名。** `src/cli/action-readiness.ts:462` 调用 `src/internal/archive-dependency-snapshot.ts:214-218`，递归将 `packages/app/node_modules` 当源码检查。已复现：完全指向 target 内部 `.pnpm` store 的 junction 在依赖重定位前被拒绝，而依赖复制函数仅处理根目录 `node_modules`。应区分 workspace 依赖根与源码，按相同 containment 规则映射至 scratch，并增加嵌套 workspace 反例。

3. **P2 — native 验收将暂态测试数量固化为不变量。** `tests/acceptance/native-windows-archive.test.ts:287` 和 `:308` 对从当前仓库复制的测试套件断言 `406` 和 `[406,406]`。正常新增领域测试后，即使完整执行成功，也会使 native 验收失败。应从当前输入独立获取预期集合/数量，或比较实际测试身份；保留 recursive-skip、非零退出及 shard 完整性检查。

## 证据

- `reproduce.mjs`、`stdout.txt`、`stderr.txt`、`command.json`：新建 disposable synthetic fixtures；通过真实 fixed CLI 复现 correction/start/finish，并直接复现 workspace 链接检查；记录 exact 源码哈希。探针 exit 0 仅表示成功收集观察，输出明确记录产品失败，不代表产品 PASS。
- 独立执行 `node --import tsx --test tests/unit/domain/action-correction.test.ts tests/unit/domain/rejected-review-recovery.test.ts tests/unit/domain/action-archive-cli.test.ts`：9 tests、9 pass、0 fail、exit 0。已有套件没有覆盖本次纠正后的 successor 或嵌套 workspace 复现。
- 核对 Author `verification/20261003-190004-final/domain/command.json` 的全部 252 个 `sourceInputs`：当前仅 `tests/acceptance/native-windows-archive.test.ts` 不同，符合 Author 所述后续 native-only fixture 修改。既有全量领域测试 PASS 不能排除上述遗漏。本次未独立重跑完整 Linux/native acceptance。

复杂度/最小性：有界辅助模块服务于既定纠正、隔离、恢复和 checkpoint 行为；上述问题可以局部修正并补回归，无需新增子系统。

新增内容/范围评估：scope drift: NONE。本次问题均属于既定范围内的实现正确性及暂态测试字面量。
