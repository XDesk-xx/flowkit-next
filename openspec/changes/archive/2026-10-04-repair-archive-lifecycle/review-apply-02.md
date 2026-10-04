# Review Apply 02 — repair-archive-lifecycle

- 日期：2026-10-04（Asia/Shanghai）
- Role：reviewer
- Verdict：approved
- 基线：main / 9b96b150eec8b59c40d1a72eb61054695a6e763b
- 输入：原 review-apply.md 的 RA-01–RA-03、revise-apply.md、本轮当前源码与测试；批准合同仍为 review-propose-03.md。
- 执行：按 Owner 的直接审查边界，不创建本仓库 Flowkit Run，不执行下一 Action 或 Git 写入。
- 材料根：`.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-round2/`（下文记为 R）。

## 结论

RA-01、RA-02、RA-03 均已闭合。本轮未发现新的阻断问题，批准当前 exact 候选。原 review-apply.md 的 changes-requested 作为历史保留，本报告不覆盖它，也不改写 Author 的 verification.md。

## 修复闭合

| Finding | 源码与独立复验 |
| --- | --- |
| RA-01 | ordinaryGitFileModes 根据有效 core.filemode、owner execute bit 与原普通 index mode 计算输出；拟写入树、stage 后和 commit 后的核对使用相同 mode 预期。重放原 Reviewer 的 new executable / chmod 反例，两项均 completed，实际 index 为 100755。新增测试覆盖 755→644→755、仅 group execute bit、filemode=false、写前 mode 漂移及 symlink 拒绝。 |
| RA-02 | v2 分支排除 sourcePath/defaultPath 自身及全部后代，不限于旧 suffix。原 Reviewer 的陌生源文件反例现在 preflight 拒绝，effect=none，未产生 checkpoint；新增测试覆盖平层、嵌套陌生文件并核对 index/HEAD 不变。 |
| RA-03 | inspect 的无 intent / effect=none 分支再次核对候选及日期，与执行共用 assertOpenSpecArchiveDate。原 Reviewer 跨日反例现在 canContinue=false / archive-date-drift，与实际续做一致。新增测试另证明已有原生成功的剩余工作跨日仍可完成且不会第二次调用 OpenSpec。 |

原 Reviewer 的 boundary-probes.mjs 按原字节复制到本轮 R 后运行，没有为了让候选通过而修改探针。四项输出与闭合断言见 `R/boundary-probes/stdout.txt`、`R/finding-closure.json`。

## 本轮独立验证

从当前 346 份 raw 文件复制独立快照到 Docker `/work`，安装 Linux 自有 node_modules，以普通 node 用户运行；环境为 Linux x86_64 / glibc 2.36、Node 22.23.2、pnpm 11.22.0、Git 2.39.5。

| 检查 | 结果 | R 下材料 |
| --- | --- | --- |
| typecheck | PASS，exit 0 | typecheck |
| build | PASS，exit 0 | build |
| 原 Reviewer 四项边界探针 | 均符合修正后的行为 | boundary-probes / finding-closure.json |
| 全量 domain，concurrency=4 | 439/439 PASS，fail=0、skip=0 | domain |
| Git whitespace 诊断 | git diff --check exit 0；不覆盖全部未跟踪文件 | 本次命令读回 |

这是有界 Review 回归，不是 Formal Delivery Full Test。所有测试中的 Author/Reviewer/Owner/Run/Git 事实均属于隔离 fixture，不是本仓库的正式角色执行或 checkpoint。一次性 Reviewer 容器在检查完成后清理，必要原始流保留于 R。

本轮没有重复执行 acceptance、native Archive、detached installed-manager 和完整质量矩阵；这些消费 Author 本轮的新证据并核对当前身份，未把上轮旧候选 PASS 当成本轮 PASS。已读回 Author 本轮 Linux acceptance 7/7、Windows/Linux native 各 1/1、installed-manager 3/3，以及 quality gate / dependency-health / entropy 等 exit 0。其首次 Linux ownership 与 pack 参数失败保留在原目录，后续有效结果另有独立材料。

## OCR 与 exact 输入

再次调用 Open Code Review 的 delegate preview/rule。插件提供文件选择与规则，语义判断由本 Reviewer 完成，没有虚称第二个外部模型 verdict。preview 选中的 30 项全部 accounted：reviewed=30、skipped=0、coverage_rate=1。相对上轮，5 项源码发生变化，逐项审查差异及调用上下文；其余选中文件核对 raw SHA 未变，沿用上轮实际审查并复核相关调用关系。另独立审查 3 项新增回归测试差异。完整 `(path,status)` 与依据见 `R/coverage.json`，原始输出见 preview.json / rules.json；100% 仅指插件选中列表，不表示全部排除材料逐文件重审。

相对上轮 346 文件快照，实际修改仅 5 个源码文件、3 个测试文件，与 Author 交接一致。`R/audit.json` 核对累计 63 项候选/删除、18 项批准输入、本轮与 Author Linux 快照、Author 本轮 62 份原始流、命令元数据、包与安装文件、两平台 native material refs、旧 Review/verification 和新 Author 交接，共 1139 项文件身份比较，mismatches=[]。

当前 HEAD 未变，staged paths 为空，package.json / pnpm-lock.yaml / 历史 Runs / 已归档 Change 未出现改动。当前完整测试输入及 exact raw SHA 见 `R/snapshot-inputs.json`，本次八项变化见 delta-files.json。

## 当前步骤、复杂度与范围

本轮只完成修订后 Apply Review。修复复用既有 Git projection 和日期 guard，保持不可变 indexBasis 与 candidateGit schema；没有引入新 Registry、通用恢复器或自动流程。复杂度与三个缺陷相称，scope drift: NONE。

批准仅针对上述 exact 实现与证据，不产生 Archive、Delivery Final、Git checkpoint/push 或消费项目升级授权。本轮只新增 Reviewer 报告与材料，未修改 Author production artifacts/tests，审查完成后 STOP。
