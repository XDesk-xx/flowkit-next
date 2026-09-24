## Context

`033-review-explore` 已批准 `032-explore` 的有界结论：现有静态双 root 图为 58/59，唯一未覆盖的是 `src/cli/prepared-owner-correction-start.ts`；仅加入该精确 root 的同图实验为 59/59。见 `proposal.md` 与本 Change 的 delta spec。实验结果不是修改后验收。

## Goals / Non-Goals

**Goals:** 让静态 reachability 检查准确识别已发布、由 revise Skills 直接调用的第三个生产入口；保持对其余不可达源码的失败判定。

**Non-Goals:** 不改变 prepared correction 执行逻辑，不通过从 `src/domain/index.ts` 或普通 CLI 导入该模块来制造可达性，不增加自动发现、豁免表或新的发行入口框架。

## Decisions

1. 在 `scripts/check-production-reachability.mjs` 的 `PRODUCTION_ROOTS` 静态列表增加唯一精确路径 `src/cli/prepared-owner-correction-start.ts`。现有分析器已经对每个 root 做存在性核对和依赖闭包遍历，无需修改算法。Skill 直调路径不形成静态 import 边，因此显式 root 是对此发行入口的准确表示。
2. 更新 `tests/unit/quality/production-reachability.test.mjs` 的合成图，使第三个 root 以独立入口出现，并检验它及其局部依赖可达、缺少第三个 root 时 fail closed、额外死源码及测试引用仍不能变活。保留现有真实仓库基线测试和其他异常图测试。
3. 在 Apply 验收中对照三个 revise Skill 的 `dist/cli/prepared-owner-correction-start.js` 引用、构建产物与发行文件包含规则，再运行聚焦测试、`quality:entropy` 和相关构建/打包检查。路径一致性是本次精确入口的证据，不把探索实验当成当前实现 PASS。

## Risks / Trade-offs

- 精确静态列表需要在新增独立生产入口时同步维护 → 缺失 root 的测试和真实仓库可达性检查保持失败闭合；本 Change 不推广为通用发现机制。
- Skill 引用的 `dist` 路径与源码 root 可能漂移 → Apply 对照实际 Skill 路径、编译输出和 package `files` 后记录验收结果。
