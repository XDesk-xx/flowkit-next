## 1. E01：命令选择的有界请求预算（D01）

- [x] 1.1 在既有 request/entrypoint seam 共享默认 65,536 和 Git 1,048,576 bytes 预算，仅由已解析 `git checkpoint/push/integrate` 命令选择并更新原 CLI help 的额度描述；以三种 Git 命令均接受 >64 KiB 合法请求、其他命令及 correction/manifest 仍拒绝 >64 KiB、help 如实区分额度的 parser/CLI 回归验证。
- [x] 1.2 为文件/stdin 接入同一有界 Buffer 读取，关闭 handle，实际读取计数而非仅 stat 判定；以额度边界、limit+1、多字节、分块输入及文件读取期间增长的回归验证，确认超限不会进入业务写入。
- [x] 1.3 增加封闭安全 `error.budget` 及输入错误透传，保留 `invalid-request-json`/固定 message、I/O 的 `invalid-arguments`；以文件/stdin machine 输出一致、下界诚实、未知字段/duplicate key/depth 32 原拒绝、payload/cause/stack 不泄漏的回归验证。
- [x] 1.4 独立构造 910 路径约 128 KiB 的合法 closed Git 请求并测试新上限拒绝；在隔离 Git fixture 验证 Owner、exact paths、范围外 staged、candidate/hash/index/blob 和提交后核对原规则仍生效，不触碰当前仓库 Git 节点。

## 2. E02：普通 Author FAIL 的 exact Owner correction（D02）

- [x] 2.1 在 Policy exact terminal linkage 后、普通失败 early return 前加入六个 Author FAIL/null 的 bounded correction，保留原 normal/reported 和 reached-stage 矩阵；以六个 Action 的同阶段/此前阶段、无授权、错误单项 scope/target/decision、forward skip、non-null next、stale/role/state 反例验证 consistency→stage→authority→structural 的确定检查顺序；同名 PASS revise 通过前置检查后才验证 action-boundary-not-enterable。
- [x] 2.2 在 action-lifecycle 增加仅三个失败 revise 同名的新 occurrence 结构边，并供 Policy structural-enterability 使用；以普通 prepare/重复 terminal 仍拒绝、已核准 FAIL 同名可暂存、PASS/UNKNOWN/Reviewer/Archive 不扩大、旧 occurrence absorbing 的回归验证。
- [x] 2.3 在 `invokeSingleAction` 适用 entry 复用新结构边，封闭内部失败来源与 exact Owner/parent/目标 prepared context 核对；以缺失败来源的裸 READY 拒绝、错 parent/authority 拒绝、package/readiness 失败不发布 current 或执行业务、新 occurrence 单 Action/STOP 的内核回归验证。
- [x] 2.4 将固定 start/inspect/finish/current-run-chain 的 correction 重建统一到既有 seam，绑定直接失败 parent、Owner fact、唯一 sequence，禁止 caller 新填内部 witness；以六种失败来源的真实新 descriptor→工作→inspect→finish→独立查询读回验证一致性，包括三个 revise 自身失败后的同名 revise。
- [x] 2.5 对新失败 successor 及消费点补齐对抗回归：旧三文件 bytes 不变、竞争 successor/错 parent/stale evidence 拒绝、新 PASS 指向自己的 Review、不继承旧 approval；同时验证 Owner correction 不豁免缺 ordinal/其他机器 readiness、既有安全 Archive retry/correction、partial/unknown-intent/machine partial 和历史 bootstrap 边界未回归。

## 3. E03：fresh first Explore 的 ordinal=1（D03）

- [x] 3.1 在现有 ordinal derivation/readiness seam 校验 assigned 值的正安全整数/全项目唯一性，保留当前复用和 max+1；以重复/非法/溢出拒绝、已有值不改、cancelled 消费留下空号、已有基线不强制 fresh predicate 的回归验证。
- [x] 3.2 仅为 canonical product-managed first Explore 的无 assigned baseline 接入 design 的完整 fresh predicate：project、全部 coordination/activation、唯一 OpenSpec active、Runs、Change-scoped artifacts、archive；以所有来源可判定的 fresh fixture 返回候选 1，及逐一历史/未知/linked/unreadable/malformed/其他 active 反例拒绝验证，不读取历史 transcript 猜恢复。
- [x] 3.3 支持唯一当前 first Explore descriptor-only 与当前合法 proof 的 continuation，保持 create-once；以 start 不写 ordinal、当前 descriptor 继续合法、重复 start 不新建、其他 complete/partial/bootstrap Run 或 orphan proof 阻断的入口回归验证。
- [x] 3.4 在发行 Explore HOW 更新 canonical fresh 一次性分配，重读 eligibility/manifest bytes 后仅写 exact current entry；独立 bootstrap HOW 仅澄清产品例外不适用且原无基线 bounded Owner 决定保留。以文档对照与隔离产品首次流程验证 ordinal=1、漂移停止，Init/Start/Activate/查询不写值、bootstrap 不消费产品 predicate/Guidance 或自动新建首值。
- [x] 3.5 在新 terminal Explore PASS 的 finish 核对真实持久 ordinal 有效、唯一并等于 Result；以 PASS 缺失/重复/冲突拒绝、正常首次完成可读回、编号前真实 FAIL/null 仍可保存且后续 correction 不重置 ordinal、Run sequence/PackageId 不成为编号来源验证，无 seed/计数器/历史重编号。

## 4. E04：facts node 预算与写前诊断（D04）

- [x] 4.1 在 run-result-persistence 既有 JSON validator seam 共享有界测量，将 nodes 调整为 4,096，保持 bytes=65,536/depth=16；以节点计数含根/容器/值而不计 key、根 depth=0、4,096/4,097、16/17、65,536/65,537 和多维冲突的确定首维度验证；已发现的非 JSON/schema 错误不被容量诊断遮蔽，提前容量拒绝不声称全部 schema 合法。
- [x] 4.2 将 caller facts 容量错误映射到 `invalid-request` 和安全 `result-facts` budget，保持 CLI envelope 优先；以合法 envelope 内 nodes/depth overflow 和 envelope 本身先超限的 CLI 回归验证，不写 machine files、不泄漏 facts。
- [x] 4.3 在 manager 生成 candidateGit 后对最终 merged facts 统一测量，超限保留 `result-admission-rejected`、既有 effect/runId 并在 context/result 首写前拒绝；以 caller 未传 candidateGit 的真实生成后超限验证 descriptor/proof 保留、两个 machine files 均不存在，真实修正后同 Run finish 可继续。
- [x] 4.4 接入 writer/readback/Review/Archive/correction 的相关共同 validator；以独立构造、覆盖 Explore 证明规模的 absent/entry 合法候选 fixture 在 bytes 内接受、超界共同拒绝和旧 bytes 不回写验证，保留 action.md/proof/Archive diagnostics bytes 及 refs/hash 完整性。

## 5. Guidance 与跨入口实现验收（D05）

- [x] 5.1 更新直接相关发行 Action Guidance、onboarding 和独立开发 HOW 的四项限制说明及修正步骤；以逐项对照七个 delta specs 验证明确 Owner correction、新 occurrence、fresh 首值和两层预算，不增加命令/状态/registry/通用恢复器或自动 Review/next。
- [x] 5.2 执行相应 domain/CLI/acceptance/bootstrap 回归、`pnpm typecheck`、`pnpm build` 及适用 quality checks，记录真实命令/结果；以独立构造的 E01–E04 正反例和改动范围匹配的 PASS/已存在失败分类验证（不导入 Explore probes/observations 作为验收依赖），不将结构校验或测试声明为独立 Review/正式 Full Test。
- [x] 5.3 在隔离安装目录打包候选并验证同一 build 的固定 CLI machine 输出、首次 Explore 和失败 correction 链读回；以安装包 bytes/版本/命令和 Guidance 定位核对作为集成证据，不替换当前 external stable manager，不制造当前 Change 的 Flowkit Run。
- [x] 5.4 用 exact managed OpenSpec 1.10.0 执行 `validate repair-bounded-lifecycle-entry-limits --strict`，核对 tasks 与最终实现/证据、Git diff 范围和无历史改写；交付 Apply 候选后停止，独立 Review、Archive、checkpoint/push 和本地 manager 更新留在各自后续授权边界。
