# Open Code Review 辅助复审

Verdict: **changes-requested**

目标：`repair-real-project-execution-and-recovery-gaps` 当前 worktree，`main` / `7ccd269bae0fa550fa6fd61b660c98390dd7937e`。沿用 Owner 已明确的直接审查 / no-Runs。本会话参与过较早修复，因此本报告不冒充全新独立 Reviewer 或整个 Change 的独立批准。

## P2 — inspect 漏掉同 Run Archive 的日期前置条件

`src/cli/action-inspect.ts:244-246` 只按 effect 是否为 unknown 设置 `canContinue`，未包含 `src/cli/support-change-archive.ts:157-162` 对无业务效果恢复所要求的日期检查。

已通过 disposable fixture 中真实 fixed CLI 建立 Archive descriptor，并通过实际 `archiveChange` 产生 immutable prestate；模拟 OpenSpec 在业务效果前退出非零后，仅将宿主日期推进一天，不改 Run/prestate/source/spec/coordination。`inspectAction` 返回 `actualEffect=none`、`canContinue=true`，建议执行 preflight/openspec/rename/coordination/finish；同一目标的 `archiveChange` 随即返回 `status=incomplete`、`effect=none`、`reason=archive-date-drift`。保存的 prestate bytes 保持不变。这是正常跨日恢复时的确定性判断冲突，而不是检查脚本后来失败所导致的不确定性。

最小修正：在 inspect 中复用或等价核对无效果分支的日期前置条件，遇到此阻断给出 `canContinue=false` 和明确原因；加入真实已保存 prestate 的跨日回归。若另行支持跨日继续，应同时保持 immutable prestate 及真实 OpenSpec 路径合同，不能只删除执行端日期 guard 或覆盖历史材料。

证据：`date-probe.mjs`、`date.stdout.txt`、`date.stderr.txt`、`date-command.json`。探针 exit0 仅证明观察正常完成；产品失败原样记录于输出。

## 上轮问题与验证

- optional Review map：首次追加 correction 对既有 Review 的候选声明仍严格核对；已有 correction 消费新 Review 时允许省略可选 map，声明时仍要求一致。approved、changes-requested、rejected 及后续 Archive/revise/checkpoint 相关回归通过，原件保持不变。
- workspace 隔离与暂态 `406`：实现及测试与上一轮修正输入一致；本次相关回归通过。
- 平台证据缺口已补齐。Windows domain、native、typecheck、gate、build、acceptance、dependency-health、entropy、ownership 的 9 份实际记录分别绑定 255 项输入，全部与当前一致。Linux 的 255 项输入也全部一致，其原始 domain 输出为 412/412 PASS；native 原始输出为 1/1 PASS、0 skip，实际两轮 domain 计数为 [412,412]、8 条分片命令，sourceUnchanged=true。这些是对 Author 实际材料的核查，不声称本次重新执行整套平台验收。
- 本次实际运行 correction continuation、correction admission、isolation/diagnostics、reporter、managed-evidence checkpoint 五个测试文件：**19/19 PASS，0 skip**。原始流和实际命令见 `focused.*`、`focused-command.json`。`git diff --check` exit0。

## 插件使用与覆盖

实际调用 Open Code Review 的 `ocr review --audience agent --background ... --format json --output ...`，因未配置 LLM endpoint 而退出1，未生成外部模型意见。随后使用插件提供的无需 LLM 的 `ocr delegate preview --format json` 与 `ocr delegate rule --format json`，获得文件清单和分组规则；审查判断由宿主完成。没有配置凭据、安装升级或调用外部模型。

OCR 选出26个源码/辅助文件，逐项核查（包含沿用本会话已读、经当前哈希确认不变的源码上下文），reviewed_files=26、skipped_files=0、coverage_rate=100%（分母是26个 reviewable entries）。原始发现总数1171，其中1145项由用户范围或默认规则排除；默认排除的19个测试文件显式列入补充清单，重点检查本轮修改及上述5个实际执行文件，不将插件的测试默认排除等同于通过。清单、规则、哈希、理由见 `preview.json`、`rules.json`、`coverage.json`。

规则按仓库合同应用：未将非React仓库的React规则、synthetic fixture身份常量或单纯风格偏好报成阻断。复杂度与最小性仍在既有 correction / Archive / checkpoint 边界内；**scope drift: NONE**。本次仅新增审查证据，未修改生产代码、tests、规划、verification、历史 verdict/Run，未执行仓库 Git mutation 或推进下一 Action。
