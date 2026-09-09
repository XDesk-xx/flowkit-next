# 037 Review Apply

结论：changes-requested。对象 036-revise-apply；上轮两个问题的直接修复已通过独立复验，但工具材料识别新增一项阻断回归，需继续当前 Change 的有界 revise-apply。

## 上轮 findings

- D05-RA035-001：原反例已修复。真实工具改变后 inputRef/checkRef 均变化，current reader 从 passed 变 stale；随后新失败实际执行得到 failed，未回退旧 PASS。包内实现/preload 的定向测试也通过。本结论不忽略下述修复引入的边界回归。
- D05-RA035-002：已修复。实际入口对缺配置、未知字段、缺输入、缺 executable 分别返回 config.read/config.parse/inputs[0]/checks[0].executable 的安全诊断；定向测试同时覆盖不发布 attempt 与 malformed JSON 不回显正文。

## D05-RA037-001 / P1：输出被误作工具输入

位置：src/internal/full-test-tool.ts:73–86。

普通参数分支把 argv 中可解析为现存文件的路径加入 resources。它没有区分真实启动资源与脚本自己的输出文件参数，因此从另一条路径绕回了已排除材料的输入耦合。

独立真实 fixture：config inputs 只有 src，明确 exclude .tmp/.flowkit；执行 node src/check.cjs .tmp/report.json，脚本只生成报告，不改产品/config。分别测试报告原本不存在及已有报告被覆盖：两种情况均 command exit 0、check passed，选中文件/配置保持；但 toolRef/inputRef 改变，Full Test 最终 failed，原因 test-input-drift。

证据：attempt-02/output-observations.json；实际命令输出、fixture start/result/command 与探测源码均位于本轮 proof。该 fixture 不操作真实 D05 Full Test。

违反已批准 design §2、Tasks 1.3–1.4 及 formal-full-test-execution-and-correction 的 Process material is not a product scan input。修正工具绑定不能让普通输出参数自动变成产品/工具输入。

最小修正：只识别有界支持的真实启动脚本/preload/工具资源；普通程序参数由原显式输入合同决定，不按文件是否存在猜输入。保留工具/包内实现变化使旧结果 stale 的能力，补新建/覆盖已排除输出的真实入口回归。不要全扫依赖、引入 Registry 或把这个缺口转成另一个 Change。

## 范围、复杂度与证据

当前步骤：核对 036→035→033/034 的实际链、六个修正文件及累计48文件；原计划和其余祖先实现保持。150 处来源 bytes/hash 引用通过；审查前后受保护文件摘要相同。

复杂度/最小性：共享准备函数和有界错误分类合理；单一工具材料 helper 可复用，但当前普通 argv 文件推断越过输入/输出边界，需要缩窄。没有独立新子系统需求。

scope drift：未新增业务能力、Registry、Runtime/Policy/Run schema、Git/Delivery 操作；当前 finding 是修复范围内的过宽输入推断，不是 Owner 授权缺失或 Proposal 合同缺陷。

独立 original-counterexamples/output-scope 探测成功执行；targeted tests 22/22、typecheck、exact OpenSpec 1.10.0 strict 通过。探测退出0表示反例执行完成，不表示其中 Full Test 通过。现有测试未覆盖输出参数回归，因此这些 PASS 不改变 changes-requested。

Author 本轮 Linux 命令与所选原始输出引用已校验，本轮不重跑整套 Linux acceptance，不升级为 D05 Formal Full Test。首次 sandbox EPERM 保留，获准后同样检查另存 attempt-02，不覆盖历史材料。

## 交接

当前 Change 继续 revise-apply，保留 035 两个修复并解决唯一新 finding。D05 independent-bootstrap、004/projectOrdinal36、必要 proof 长期留 target artifacts 与三文件 Runs 边界不变；不恢复外部 manager，不让 candidate 自管理。

未修改 Author/source/tests/Skills/manifest/历史，未执行修正、Archive、正式 Full Test 或 Git mutation。Reviewer verdict 不产生后续执行权限。STOP。
