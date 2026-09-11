# Archive 交接

connect-openspec-action-workflow 已按 028-review-apply approved 归档，projectOrdinal 35 未变。

- 归档：`openspec/changes/archive/2026-09-08-035-connect-openspec-action-workflow`，9 文件内容保持原 bytes。
- 同步：四个 capability，共 17 个新增/修改 requirement；Purpose、未受影响条款及原有场景保留。
- manifest：仅本 Change state active → completed；其余 bytes 不变。
- 本轮 Linux 临时归档候选：domain 284/284、acceptance 6/6、主规范 22/22，build/typecheck/format/lint/dependency-health/entropy 通过。Windows 正式主规范严格验证 22/22，diff-check 与 tracked-artifacts 通过。
- 本轮没有修改生产代码/Skill，也没有执行 Formal Delivery Full Test、Git 或下一 Action。

## 接续材料

027 Result 保留累计 56 个已审查文件引用及 025 的十项删除来源；028 是独立审查批准，不是本轮验证。029 的 archive-readback/stdout.txt 给出全部九项旧→新路径/哈希及四个主规范/manifest 新哈希。旧路径变化是本次授权 archive，不应被解释为证据遗失；019 未完成历史不改写。

本轮必要证据位于同目录，命令原始流保持 Buffer bytes；Linux 副本是一次性容器 tmpfs，已随容器退出销毁，不作为长期材料。Explore 实验、已接受决策、当前实现验收和本轮 archive 验证分别通过对应 Run 关联，不用历史 proof 冒充新 PASS。

Owner 决定：沿用独立 bootstrap，不恢复外部 manager、不让 candidate 管理 D05；必要材料保存在 target artifacts。用户本次“根据最新run，archive”授权本次归档与既有同步，不包含 Git。下一步如需 checkpoint commit + push，应由 Owner 明确授权；不自动激活下一 Change。STOP。
