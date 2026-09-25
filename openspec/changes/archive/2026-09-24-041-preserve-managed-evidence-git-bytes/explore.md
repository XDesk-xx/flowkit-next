# 今后 Flowkit 管理证据的 Git 字节保持：proof Explore

## 范围

Delivery `20260924-06-action-boundary-corrections` 的本 Change 由 Owner 本次输入激活，Author `explore` Run 为 `20260924-008-explore`，持久 `projectOrdinal` 为 41。目标仅是让**今后新产生**的 Flowkit Run/proof 在目标项目的 Git 暂存与提交中保持被记录的原始字节。已有 Run、proof、归档和提交不重写、不重验、不迁移。目标仓库的 Git 配置仍由该项目持有；Flowkit 不静默修改它。

## 直接证据

| 当前事实 | 合同影响 |
| --- | --- |
| LearningPlatform 的 `.gitattributes` 对 `.flowkit/artifacts/**` 与 `.flowkit/runs/**` 设置 `-text -whitespace`。已跟踪的 `web-typecheck.command.json` 含 6 个 CRLF；`git hash-object --no-filters`、`git hash-object --path` 与 index blob 均为 `a8e2ee23cf3193dfdae1f720ce98f90eb0225a08`。 | Git 对其正式证据不做文本转换；这解释了该项目没有遇到同类 SHA 漂移。规则保护原始字节，并不宣称所有结构化证据都采用 LF。 |
| Flowkit-next 的 `.gitattributes` 仅对四类原始 stdout/stderr 路径设置 `-text -whitespace`。本次 archive 的 `command.json` 含 CRLF：原始 blob 为 `317fc99027956083a909cb9c23c5efdc99e3258e`，按其路径属性计算的 Git clean blob 为 `84b8f23d5f19b80d45f20352f355664ec46d477a`。 | 已接纳 Run 按原始字节记录 SHA，而普通 `git add` 会产生另一组证据字节；只靠 `git diff --cached --check` 或工作区 SHA 不能证明提交保真。 |
| 当前 `action-guidance-execution` 主规格只对四类原始流关闭文本转换和空白诊断；`raw-stream-attributes.test.ts` 同时要求结构化文件保留空白诊断。 | 不能只编辑 `.gitattributes`：Proposal 必须将 Git 保字节与结构化文本空白诊断拆开，并同步修订合同与对应测试。 |
| Git 宿主已有 `create-new` 精确 paths、完整 index 范围检查和提交读回；新 Action start 已有 manager 自有可信入口。 | 复用现有 Action 开始与 checkpoint 边界作有界校验，不建立 Evidence Registry、通用校验平台或目标配置自动写入。 |

## 必须保持的未来不变量

1. 对新版 Flowkit 正常管理路径中新建的 Run/proof，target 项目必须提供使 `.flowkit/runs/**` 和 `.flowkit/artifacts/**` 不发生 Git 文本转换的有效规则；对 `.flowkit/runs/**` 和 `.flowkit/artifacts/**` 使用 `-text` 即可保持字节；结构化证据不得因此获得 `-whitespace` 豁免。Flowkit 只验证并给出精确缺失诊断，不自行注入目标 `.gitattributes`。
2. 新 Run 开始前在实际 target 上检查该规则；不满足时不得先写 create-once `action.md` 再报告错误。新 proof 进入 terminal Result 前，仍需按现有来源、归属与 hash 规则核对真实 bytes。
3. 精确 Change checkpoint 在提交前核对本次范围内**新** Run/proof 的 index blob 与已记录原始 bytes；规则漂移或 Git clean 转换不得悄悄形成与 Result 不一致的 checkpoint。保留既有授权、scope/index、非强制 push 分离边界。
4. 只对新执行和本次 checkpoint 生效。历史 Run 可读且原字节不动；不扫描所有旧 proof，不要求旧项目或旧提交补造 PASS。普通 `status/next` 仍保持只读且不遍历 proof。
5. 保字节与文本风格是两个问题。此 Change 解决被 Git 转换导致的证据身份漂移；不把所有结构化文件改名为原始日志，也不把新格式化/写入器体系纳入本次范围。

## Proposal-ready 最小方向

修订现有 `action-guidance-execution` 的 target 证据 Git 策略，并在既有 manager Action start 与 scoped checkpoint 宿主上添加前向 fail-closed 检查。结构化 Run/proof 使用 `-text` 保持原始字节，继续接受 `git diff --cached --check` 的空白诊断；四类原始 stdout/stderr 继续使用 `-text -whitespace`。Git 对照 fixture 已证明 `-text` 与 `-text -whitespace` 均保住 CRLF 结构化 JSON 的 blob，只有前者对尾随空白返回失败（见 `20260924-009-review-explore` 的 `git-attributes-probe.json`）。Proposal 验收应覆盖未配置 target 在首次写入前被明确拒绝、已配置 target 的原始 blob 与 index blob 一致、结构化尾随空白仍被报告，以及 checkpoint 前规则变化不能静默提交错误 bytes。

## 结论与边界

**PASS（可进入独立 `review-explore`）**：两个项目的差异由真实 Git 属性与 blob 投影直接证明；独立 Git 对照还证明 `-text` 已足以保字节，无需放宽结构化证据的空白诊断。未来规则可以由 Flowkit 在正常管理路径强制检查，但发布新版管理器本身不会替目标仓库改写 Git 配置；未满足者应在新 Run 创建前得到明确 blocked 诊断。尚未实现代码、修改测试或证明新 manager 行为，Explore 证据不充当 Apply PASS。
