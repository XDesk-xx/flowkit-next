## Context

见 proposal.md。目标的全局 text=auto eol=lf 可将 CRLF 结构化证据转换为另一 Git blob；既有四条 raw-stream attributes 只覆盖日志。本 Change 只处理新 managed 证据，使用现有 canonical Action start 与 scoped checkpoint 宿主。

## Goals / Non-Goals

**Goals:** 在新 Run 写入前诊断已知 Run 路径规则；在后续 proof 接纳前诊断其 exact 路径；在已授权提交前检出 index 字节与记录身份漂移；同时保留结构化证据的空白诊断。

**Non-Goals:** 历史迁移或重验、自动修改其他 target 的 .gitattributes、证据注册表、新 Git 权限、其他项目的通用 Git 策略。

## Decisions

1. **分两次检查 exact 路径的有效 Git 属性。** canonical start 在写入前已知道 action.md、context.json、result.json 的实际路径，先通过目标 Git 属性解析检查这些路径及目标规则。proof 文件名可能稍后才确定；在必要 proof 进入 terminal Result 前逐个检查其实际路径，结合既有归属与 hash 核对。通用规则或代表文件不能证明某个文件名未被更具体规则覆盖。错误诊断指出 exact 路径；普通只读 status/next 不执行检查。-text 保留原始字节且不隐含 -whitespace；四类 raw stream 继续单独豁免。测试覆盖具体文件名覆盖通用规则的情况。
2. **提交前同时核对 Git 与记录身份。** 在既有 create-new checkpoint 限定暂存与完整 index 核对之后、commit 之前，对本次范围内相对 HEAD 新增的 managed Run/proof exact 路径读取 index blob 与目标工作区原始 bytes。Run 三文件以真实 create-once 文件为来源；已有 terminal Result proofRef 的 proof 还必须使 index、当前 bytes 与所记录 SHA/bytes 三者一致。新增 proof 若无法对应应有的 Result 声明则拒绝把它当作已接纳材料；无声明的 Run 文件不伪造 proof 身份。属性漂移、接纳后 proof 变更或来源不可确认均停止。失败时保留 index，沿用已有 partial-effect 交接；不扫描历史证据。此处的“新”以本次 checkpoint 相对 HEAD 的新增 managed 证据为有界判断，历史已提交路径不纳入。
3. **目标配置由项目持有。** 本仓库在 Apply 更新自身 .gitattributes 为两类路径 -text，保留四类 raw stream -whitespace；外部 manager 对其他 target 只验证，不写入。文档给出最小配置和受阻诊断，不把发布 manager 误述为自动改造所有项目。

## Risks / Trade-offs

- [目标未配置] → 首次新 Run 会受阻；明确报告缺失规则，由目标项目维护者修正后重新开始合法 Action。
- [后续 proof 文件名覆写通用属性] → 在该 exact proof 接纳前阻断；不借开始时的代表路径检查宣称保护已成立。
- [暂存后属性、工作区或已接纳 proof 变化] → 提交前字节及记录身份对照失败并保留 index；由 Owner/宿主按现有 Git 边界处理，不自动 reset。
- [已有历史证据曾被转换] → 不改变历史；新检查只保护未来执行和本次新增证据。

## Migration Plan

Apply 时更新本仓库 attributes、manager 检查和有界测试。其他项目在使用新 manager 创建下一 Run 前由自身配置有效保字节规则；具体 proof 路径仍在接纳时核验。无需重写旧提交。若检查失败，修正 target 配置后按既有 Action/Owner 边界重试；不能覆盖 partial Run。
