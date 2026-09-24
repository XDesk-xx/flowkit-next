## 1. 目标 Git 字节规则

- [x] 1.1 更新本仓库 .gitattributes：新 Run/proof 路径保字节、四类原始流保留空白豁免、结构化证据不豁免；用 git check-attr 与 CRLF/尾随空白 fixture 验证有效属性和 git diff --cached --check 结果。
- [x] 1.2 在 canonical Action start 写入前核验已知 Run 三文件 exact 路径及目标规则；在必要 proof 接纳前核验其后确定的 exact 路径。用已配置、未配置和具体 proof 文件名覆盖通用规则的 fixture 证明 Run 前置失败不产生 action.md、proof 路径不保字节时不接纳，普通 status/next 仍只读。

## 2. 授权 checkpoint 字节核对

- [x] 2.1 在既有 create-new checkpoint 提交前，对本次相对 HEAD 新增的 managed Run/proof 比较 index blob 与当前原始 bytes；对已声明 proofRef 还核对记录的 SHA/bytes，未声明来源不冒充已接纳 proof。用一致、Git clean 转换、具体路径覆写及 Result 接纳后改动再暂存的 fixture 验证 fail-closed 和 index 保留。
- [x] 2.2 验证 checkpoint 原有 Owner authority、exact scope、空白诊断、partial-effect 与 push/reuse 分离边界；相关宿主测试须覆盖无关 staged 文件和历史已提交 proof 不被新检查扫描。

## 3. 完成验证

- [x] 3.1 运行适用的类型、质量和行为检查，记录真实结果与限制；核对目标配置指引只说明未来新证据、项目自有配置及受阻恢复，不宣称旧证据已迁移。
