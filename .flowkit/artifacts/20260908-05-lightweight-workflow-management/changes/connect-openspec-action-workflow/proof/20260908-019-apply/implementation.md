# Apply 实现与验收说明

当前目标：D05 / connect-openspec-action-workflow，ordinal 35；批准链 015 Explore → 016 approved → 017 Propose → 018 approved。本轮 019 Apply 为独立 bootstrap 真实执行，不由候选产品管理自身。

## 实现边界

- `action-context` 与 `current-run-chain` 解析 target、exact OpenSpec、trusted manifest 与唯一合法 previousRunId 链；current 不是最大编号。首次 Explore、idle、planned、completed、cancelled、歧义、bootstrap-history 与 partial 分开处理。
- `action-command` 组合既有 single-action/kernel/Policy/admission，`action-protocol` 只负责一次 JSONL 交互。没有模型 API、Provider、Registry、自动 Author/Reviewer 循环或下一步执行。
- `action-run-reservation` 在派发前 create-once 占用并写 action.md；同一存活 closure 写 context/result 并读回。失败保留原目录，不自动删除、接管或重试；prepared failure 四个结果槽为 null。
- `action-proof` 与局部 target-path helper 校验本次和明确相关前序 proof。保留既有 facts，拒绝宿主伪造 invocationFailure；不把 hash 当语义真实性，不扫描全部历史 proof。
- status/next/entrypoint 直接消费者迁移到上下文解析，旧 currentRunId/changeStartSequence 请求被拒；doctor 与 checkpoint evaluator 的既有职责保留。
- 四条通用 raw-stream attributes 替代八条逐 Change 例外。跨 Delivery/Change/Full Test 路径形态的隔离 Git 测试通过；这不是 Full Test 范围配置，也没有修改 `.gitignore`。
- 产品十份 Action HOW 与 bootstrap 十份 HOW 独立更新，补充必要材料和相关 Owner 决定交接；产品 tool HOW 修正 next 实际依赖 exact OpenSpec 的说明。未修改 vendor mechanics。

## 真实验证与适用性

| 证据目录 | 实际结果 | 边界 |
| --- | --- | --- |
| domain-02 | 303 tests PASS，0 failed/skipped | 当前生产源码的 domain 回归；之后只新增漏传 reason 的 native 用例及 HOW 文字澄清 |
| native-02 | win32 原生 7 tests PASS | 含 EOF、kill、写失败、响应不消费、漏传 ready.reason；不是 simulation |
| linux-02 | Linux x64 glibc 2.36，Node 22.23.2，离线 frozen 依赖，domain 与安装 acceptance PASS | 非 root 验证真实 unreadable；不同平台结果分开，不冒充 Formal Full Test |
| acceptance-02 | Windows 安装 acceptance 6/6 PASS | 实际 manager-02 安装，无 target 开发依赖或 callback/glue |
| typecheck-02 / build-02 | exit 0 | 后续新增 native 用例另做 tsc 与 lint，exit 0 |
| format-02 / lint-01 | exit 0 | 修改过的 native 测试追加后再经 prettier 和 lint |
| dependency-01 | 117 modules，620 dependencies，无违规 | 结构依赖检查 |
| entropy-01 / entropy-tests-01 | 48/48 production modules reachable；7/7 tests PASS | 未增加仅测试可达的生产代码 |
| forbidden-01 / diff-01 / strict-01 | exit 0 | Git 只读检查、exact OpenSpec 1.10.0 strict；不代表语义审查或 Git 权限 |
| skill-validation.json | 21 份 HOW 结构校验成功 | UTF-8 调用原 quick_validate；行为真实性由独立宿主测试另证 |

早期 sandbox EPERM 尝试原样保留，后续明确重试使用新目录，不覆盖旧失败。`pnpm exec eslint` 的 shell executable 解析失败未算代码失败；使用已安装项目程序执行等价检查。所有记录中的命令、退出码和原始流以实际文件为准，不将摘要重建成伪造 raw stream。

## 安装与独立宿主验证

两个 tgz 均由实际 pnpm pack/prepack 形成，依赖由 manager 安装承担，runtime 使用外部 FLOWKIT_HOME/tools。第一份安装完成隔离第一 Change 的真实 Author/独立 Reviewer/Archive 七个 Action；第二份安装包含后续小修正和更明确 HOW，不覆盖第一份安装。两份包的 bytes/hash 由 candidate-inventory 记录，不能把旧包所有执行声称为新包重跑。

隔离目标位于本 proof 的 host-target。该 target 的 OpenSpec、代码、Run 和必要材料是验收夹具事实，不是 D05 自管理；fixture activation 明确标注为合成前提，不产生真实用户项目 Owner 权限。第一 Change 的 independent reviewer 报告由独立角色实际生成，不由 Author 预制。

新会话读取第二 Change 时未携带 Run 编号。首次漏传 ready.reason 被 prepare 拒绝，无 execute/Run/target mutation；独立行为测试揭示 HOW 对必填字段不够明确，已最小补充“reason 始终必填，ready 可 null”，未放宽协议。重试为明确新 invocation，已进入真实 Explore。首次 PTY wrapper exit 1 不等于 Node code；native-02 独立捕获 Node exit 2。

## Scope 与交接

未执行 D05 Archive、Formal Delivery Full Test 或 Git mutation；未处理 Archify、Full Test 选择、Git 节点或未来 Delivery 能力。原有 manifest/Proposal/Review 及历史材料未追溯重写。必要材料放 target artifacts，`.tmp` 仅可丢弃安装/请求/副本。

源码 gate 按含空行注释的真实行数核对；本轮曾超限的 acceptance 文件按 fixture/helper 与测试用例拆开，未压行或放宽 650 限制。未修改的历史 delivery-operation-execution.test.ts 678 行单列为既有事实，不冒充本轮 gate PASS，也不顺手扩张变更。

本文件不是 Reviewer verdict。以 tasks.md 的实际完成状态、019 result 与当前候选 inventory 作为最终交接；独立宿主第二 Change 完整链仍须真正完成后才能声称本轮全部完成。
