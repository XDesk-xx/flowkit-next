## 1. 共享 Final 合同与直接消费者

- [x] 1.1 按 design 字段表收敛 Final input/facts/record 与 requiredEvidence/source 的去架构形状，保留 readChangeClosure/readFullTest；通过形状、缺字段、旧架构字段拒绝及 clone 测试验证。
- [x] 1.2 将 Final current candidate 直接绑定真实 Full Test record.candidateRef，移除架构 closure/六槽来源校验；通过真实 passed/failed/incomplete check、candidate drift、空 active-set 与 required Changes 前置测试验证，不能只用 synthetic PASS。
- [x] 1.3 同步 Final deterministic projection、validator 与 golden vectors；通过属性重排同 ref、included value/array 改变异 ref、旧 ref/旧形状拒绝验证。
- [x] 1.4 从 coordination 写入/读回移除架构字段，保持 narrow source-range 修改和失败顺序；通过非目标全文 bytes/顺序相等、prestate drift、写入/readback 失败测试验证。
- [x] 1.5 同步 Integration preparation、执行重验和 accepted-object 必要证据消费；通过无架构 reader 的正向、accepted-object 缺 Run、错来源、错权限/Git prestate 负向验证，保持现有 checkpointOperation 与 Integration projection。

## 2. Start 与活动 operation 退役

- [x] 2.1 将 Start 固定输出改为唯一 manifest，checks 只保留 git-start-prestate、openspec-delivery-manifest、content-receipt；通过无图完整 Start、manifest/receipt 缺失或漂移、独立 checkpoint 权限测试验证。
- [x] 2.2 将 operation catalog/Guidance mapping/formation/clone 收敛为四项，删除 Architecture variant 和仅服务它的 domain/internal 六模块及导出；通过旧 literal 拒绝、其他 operation 权限/Guidance 测试与 build 验证无遗留引用，不保留兼容成功 stub。
- [x] 2.3 改造共用 fixture，删除仅验收退役六槽/compare 的专属测试，将共享保障留在活动操作测试；用测试清单对照说明每个删除项归属，并确认非架构 authority、来源完整性、callback 隔离和写入失败回归仍执行。

## 3. 工具、发行与活动 HOW

- [x] 3.1 managed tool/lock 仅保留 OpenSpec 1.10.0，不改变 root/confinement/诊断目录；通过无 Archify 解析成功、archify id unsupported、缺失/错误 OpenSpec 和 PATH 不回退测试验证。
- [x] 3.2 doctor 仅输出 openspec-runtime/openspec-root，移除所有 Archify 调用及 diagnostic；通过仅两个 diagnostics 的正向、OpenSpec 缺失/identity/root mismatch 负向和 CLI entrypoint 测试验证。
- [x] 3.3 退役产品 skills/delivery/architecture-finalization、skills/tools/archify、skills/vendors/archify 及发行直接引用；用产品入口/build/资产清单核对验证不存在必需依赖，并确认用户外部 runtime/独立 Skill 未被修改。
- [x] 3.4 同步 Start/Final 及相关 Delivery HOW、AGENTS/README 的活动架构前置，保持 bootstrap/product 独立；定向核对 `.agents/skills/**`，只处理实际矛盾，不删通用架构讨论文字。验证活动指导不要求图/skip 证明，历史 archive/Run/manifest/图不变；交接中注明 design 所列两处 Purpose 的后续规范同步范围。

## 4. 跨边界验收与交接

- [x] 4.1 在隔离 fixture 中，满足其余现行前置且完全无 Archify runtime/图/Architecture outcome，真实执行 Start → checks → Final，再验证显式授权的 Integration；保存新 candidate 的实际输出，区分模拟 OpenSpec/远端与真实执行部分，不以旧 Explore PASS 代替。
- [x] 4.2 用冻结的旧类型历史 fixture 验证无 Archify 时原始读取/bytes 保持不变，同时新 operation/Final 拒绝旧输入；确认没有新增历史转换、补图或双轨执行机制。
- [x] 4.3 执行受影响 domain/CLI/accepted-object/projection 测试、typecheck、build、domain/acceptance 回归和现有 quality/dependency/entropy checks；按适用平台报告真实结果，Linux detached 要求不以 Windows fixture PASS 替代，不将这些检查称为已授权 Formal Full Test。
- [x] 4.4 执行现有 650 行源码 gate；超限文件按职责拆分，减法后未超限不强制拆，不压行或豁免。保存必要新证据到项目 .flowkit/artifacts 并核对可读/归属/结果一致性，记录真实 Apply Run，交接独立 review-apply 后 STOP，不自动 Git/Archive。
