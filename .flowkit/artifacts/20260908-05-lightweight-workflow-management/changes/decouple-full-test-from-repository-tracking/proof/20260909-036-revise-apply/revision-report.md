# 036 revise-apply 交接

## 本轮结论与范围

依据 035-review-apply 的 D05-RA035-001/002，在 033 已批准合同内做最小实现修正。下一边界为独立 review-apply；本结论是 Author 修正完成，不冒充 Reviewer approved。

仅修改四个既有 source/test 文件，新增 `src/internal/full-test-tool.ts` 与 `tests/unit/domain/full-test-revision.test.ts`。其余未提交祖先工作按 034/035 的 exact refs 和当前累计文件引用保留。Proposal/design/specs/tasks、项目 Full Test 配置、两套 Skills、真实 manifest、Git/Archify/历史 Runs 均未由本轮改写。

## D05-RA035-001：实际检查工具绑定

- `toolRef` 同时覆盖真实 executable bytes 和显式启动资源的实际 bytes，而不是只有 Node + lock 声明。
- 对显式文件参数，以及 Node 的 `--import` / `--require` / `-r` preload 资源，读取实际文件；工具位于 node_modules 包时，绑定被选中包自身的文件树，涵盖 bin/loader 后的包内实现，不只散列薄入口。
- 不枚举整个 node_modules、不跨包递归推导依赖图、不解释任意 shell/命令语言、不增加配置字段或 Registry；嵌套 node_modules 不纳入工具包自身树。项目其他实际消费资源仍按既有显式 inputs/命令范围合同覆盖，非通用命令沙箱。
- `readFullTestInput` 与真实进程启动前使用同一工具材料计算；current reader 通过新 inputRef/checkRef 拒绝旧结果，不迁移或重签旧 PASS。
- 新测试覆盖包内 implementation 改变、两种 Node preload 写法、无关未选中包不影响身份。Reviewer 原反例重跑后：inputRef/checkRef 改变，原 current `passed → stale`；新失败执行后 current 为 failed，不回退旧成功。

## D05-RA035-002：准备诊断

准备与 invocation 共用内部准备函数。原 prepare 的 package/null 查询签名保留；实际 invocation 不再丢失准备异常，返回 bounded stage/reason。配置正文、JSON 错误片段、argv 内容及环境值不进入诊断。

实际入口反例结果：

| 情况 | reason |
| --- | --- |
| 缺配置 | preparation-rejected: config.read:config/verification/full-test.json: ENOENT |
| 未知字段 | preparation-rejected: config.parse: invalid Full Test config: unknown-or-missing-fields |
| 缺输入 | preparation-rejected: inputs[0]: ENOENT |
| 缺 executable | preparation-rejected: checks[0].executable: executable missing or unsupported |

回归还验证 malformed JSON 不回显测试用 secret 标记，四类错误都不创建 attempt/启动检查。既有 unreadable fixture 的断言改为准确的 `inputs[0]: EACCES`，没有去掉拒绝或降低覆盖。

## 当前真实验收

- `regression-before`：新增两项反例在修正前真实失败；原输出保留。
- `regression-final`：14/14 定向回归通过。
- `counterexamples/observations.json`：复制 Reviewer probe 到本轮新目录作为 Author 复验；未触碰 Reviewer proof 或 verdict。
- Windows `domain-01` 285/285、`acceptance-01` 6/6；typecheck/build/format/lint/dependency-health/strict OpenSpec 通过。
- Linux `linux-01`：当前代码、当前 lock、pnpm offline/frozen + existing policy metadata，network none，9/9 原配置检查通过；domain 285/285、acceptance 6/6、entropy 7/7，独立进程和清除 fixture .tmp 后 current 读回通过。
- Linux 使用不含真实 Git/Run/OpenSpec history/Archify/bootstrap 资产的代码副本和合成 `revise-full-test-fixture`。这是发行 API 实现验收，不是 D05 Formal Full Test，不产生真实 D05 Full Test/Owner authority。
- 初次 lint 检出控制字符正则后，改为等价显式字符检查并复验通过，没有放宽 lint 规则。

## 收敛与 Owner 决定

采用 revise-apply / implementation-convergence 约束最小修正；debugging 先保留反例，incremental/security 约束输入诊断与分步验证。未照搬 Skill 的 Git commit/release/web security 步骤：本轮没有相关授权或发布/Web 工作。

保留 035 result 中 Owner 决定的 sourceRef：D05 independent-bootstrap，当前004分组/projectOrdinal36，必要 proof 在 target artifacts、.tmp 可丢弃；不因历史空白阻断 checkpoint，不补 attributes、不改历史。未执行 Git mutation、Archive、独立 Review、D05 Formal Full Test 或外部 manager 恢复。记录真实三文件 Run 后 STOP。
