# 035 Review Apply

结论：changes-requested。审查 034-apply，对照 033 approved Proposal；两个有界实现缺口需在当前 Change 的 revise-apply 修正，不要求重新设计已批准方案，也不改写历史 Review。

## Findings

### D05-RA035-001 / P1：实际检查工具未绑定

位置：src/internal/full-test-input.ts:250–256；相关 config/verification/full-test.json。

当前 toolRef 仅散列 program executable。本项目的 Prettier/ESLint/TypeScript 等由 node 启动，实际 node_modules 工具入口未被输入枚举或工具身份覆盖。package/lock 是期望依赖声明，并未在运行时核实实际工具 bytes。

独立反例使用同样的 Node + excluded node_modules 调用模式：真实完成一次 PASS 后，仅改变工具 JS 为 exit 7；source、配置、package、lock 与 Node 均不变。inputRef/checkRef 没变，readCurrentDeliveryFullTest 仍 passed，而再次真实执行得到 failed。新失败发布后 reader 正确返回 failed；问题是工具已变而尚未重跑时仍错误接受旧结论。未执行真实 Final，不声称证明 Final 已被绕过。

依据：design §1–2、Tasks 1.3、Full Test delta 的实际工具/检查资源覆盖与测试输入失效合同。

最小修正：在已支持命令模型内绑定实际检查工具/资源或核实真实安装身份，并补此工具漂移回归。不是全量扫描 node_modules 或新建通用命令解析器、Registry。若 Author 认为必须改已批准合同，另报告具体 contract boundary，不暗改计划。

### D05-RA035-002 / P2：准备失败缺少具体诊断

位置：src/domain/delivery-full-test-execution.ts:121–142。

prepare 吞掉所有读取/解析异常，invocation 统一返回 package-formation-rejected。实测缺配置、未知字段、缺输入、缺 executable 四种情况不可区分；不存在本次 command 日志可供追查，因为尚未开始执行。

依据：Full Test delta 的 Reject inferred or malformed Full Test plan 要求执行前拒绝并报告具体原因。

最小修正：保留有界错误阶段、原因及必要安全路径/字段，在已发行入口验证四类诊断；继续 fail-closed，不泄露环境 secret、不补造已执行事实。

## 实现与范围评估

当前步骤：独立 Apply 审查，已对照八份计划、Owner gate 扩充、034 源码和必要真实证据。计划除 Tasks 勾选外未变，真实 D05 manifest 与 033 引用相同。

复杂度/最小性：输入、文件保存、进程与当前 reader 的分工合理；单 manifest 引用和必要本地材料没有膨胀为 EvidenceStore/Registry/新 Run。仍需修正上述有效性和失败诊断闭合。

scope drift：NONE。必要 Full Test→Final→直接 Integration 值域适配、source gate/Git 分离及 bootstrap/history 测试移出代码 Full Test 均可追溯至批准范围。普通 Action v2/reuse 与后续 Start/完整 Final/Git 简化没有被此次重构接管。

## 证据与限制

- verify-review.mjs 核对 034 与所选 evidence-index 的 136 处 size/hash 引用；candidate.json 固定本次 46 个变更/实现/配置文件的实际身份。
- attempt-02 独立反例成功执行；observations.json 保存观察，原始 stdout/stderr 与 command metadata 同目录保留。fixture 内 Owner 值仅是明确合成测试输入，不产生真实 Owner authority。
- 独立 targeted tests 23/23、typecheck、exact OpenSpec 1.10.0 strict 均通过。测试 PASS 与上面的未覆盖反例不矛盾；不能代替 Reviewer verdict。
- Author Linux 9 个检查的命令与必要输出引用已经核对；本轮未重新运行整个 Linux acceptance 或 D05 Formal Full Test，不把旧 proof/当前局部 PASS 升级成 Delivery 完成。
- attempt-01 为真实 sandbox EPERM，保留；获准后同样检查另存 attempt-02，无覆盖。审查隔离摘要前后相同，不修改 Author/source/tests/Skills、manifest 或历史。

## 交接与 STOP

返回 revise-apply，当前两个 finding 在本 Change 修正并重新验收。必要 proof 默认长期留 target artifacts；.tmp 只可丢弃，runs 保持固定三文件 Action 生命周期。当前分组004/projectOrdinal36 与历史保持，不恢复 manager，不让 candidate 自管理 D05。

未执行修正、Archive、正式 Full Test 或 Git mutation；Reviewer 结论不授予这些权限。STOP。
