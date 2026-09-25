# Proof Explore: recognize prepared correction production entrypoint

## 问题与范围

D06 当前正式 Full Test attempt `c5b6c820-5d84-4bfc-a77d-d7493e246adc` 的前七项检查通过，`entropy-tests` 与 `entropy` 因 `src/cli/prepared-owner-correction-start.ts` 不可达而失败。该模块是已归档 Change `support-owner-correction-of-prepared-actions` 为三个 revise Skill 提供的 manager 安装内直调入口。本 Change 只纠正该真实产品入口与现有 repository entropy 合同之间的遗漏；不重新设计 prepared correction、修改旧 Run，或把 Full Test 失败改写为 PASS。

## 已核对事实

- `openspec/specs/repository-entropy-hygiene/spec.md` 明确把 `src/cli/entrypoint.ts` 与 `src/domain/index.ts` 列为仅有的两个 production roots；`scripts/check-production-reachability.mjs` 使用相同静态列表。测试引用和 Skill 文本不形成依赖图边。
- 三份 `skills/actions/revise-{explore,propose,apply}/SKILL.md` 均明确从 manager 安装导入 `dist/cli/prepared-owner-correction-start.js`；`src/cli/prepared-owner-correction-start.ts` 没有被上述两个 root 静态导入。构建后的对应 `dist` 文件存在，`package.json#files` 包含 `dist/`。
- 受控依赖图实验在当前源码上测得：现有两个 roots 为 59 个生产模块中 58 个可达，唯一不可达者是该 start 模块；在同一图上**仅把该模块作为第三个精确 root** 时为 59/59，可达性无其他缺口。原始失败输出与实验脚本、观察值保存在本次 proof 目录。
- `projectOrdinal: 43` 来自全项目既有已分配 ordinal 的最大值 42 加一；它不是 Run sequence `32`。Delivery 的 `fullTestStatus: failed` 和两个既有 attempt 保持原样。

## 风险、决策影响与边界

当前合同只承认两个入口，因此单改 checker 会违反已归档的 canonical spec。反过来，把这个 CLI composition 模块强行导入 `src/domain/index.ts` 会改变 domain facade 的依赖方向；从只读 `status/next/doctor` CLI 导入它也不能代表真实 Skill 直调。最小 Proposal 应在现有 `repository-entropy-hygiene` capability 中明确第三个**精确的 manager 发布入口**，同步更新静态 roots 与有针对性的回归，并核对 `dist` 入口和 Skill 路径一致。仍须保持其余未从任何 root 可达的 `src` 模块为失败；不得添加通配 root、自动发现、豁免表、Registry 或一般化的动态入口平台。

这项 proof 只证明同一依赖图下边界如何变化，不证明修改后的实现、发行验收或正式 Full Test PASS。后续 Apply 需在已批准 Proposal 内完成实际改动与验证；独立 Reviewer、Archive、checkpoint 后，正式 Full Test 必须由新的 Owner 授权创建新 attempt。

## 非目标与 Explore 结论

- 不修改 `src/**`、`scripts/**`、`tests/**` 或 canonical spec；不重跑或覆盖已失败的 Full Test attempt。
- 不新增 CLI 写命令、Action lifecycle、Owner/Reviewer 权限、Git 权限或跨项目通用入口发现机制。
- Explore 结论：**PASS，已具备有界 Proposal 输入**。下一边界是独立 `review-explore`；本结论不是 Reviewer 批准。
