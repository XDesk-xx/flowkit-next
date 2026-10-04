# Review Apply — repair-archive-lifecycle

- 日期：2026-10-04（Asia/Shanghai）
- Role：reviewer
- Verdict：changes-requested
- 基线：main / 9b96b150eec8b59c40d1a72eb61054695a6e763b
- 对象：当前未提交实现；批准合同为 review-propose-03.md。
- 执行边界：按 Owner 指令直接审查，不创建本仓库 Flowkit Run，不修改 Author 源码、测试、规划或旧证据。
- 本轮材料：`.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/review/20261004-ocr-linux/`（下文记为 R）。

## 结论与发现

发现三个需修复的问题。已有常规测试通过不能覆盖下列补充反例；本轮不批准当前候选。

### RA-01 / P2：Linux 合法执行位变化在 staging 后被错误拒绝

位置：`src/internal/candidate-git-bytes.ts:219–228`，关联 `src/internal/checkpoint-candidate-tree.ts` 的 mode 投影。

已绑定输入是 absent 时，输出 mode 被硬编码为 100644；已有输入则只能使用旧 mode。Linux 的普通 git add 会把新建 chmod 755 文件，以及从 644 改为 755 的已有文件写成 100755。真实 scoped checkpoint 的 stage 前检查放行，add 成功后 validateRules 将合法输出判成 `index is neither bound input nor verified output`，返回 incomplete / phase=stage / effect=confirmed，留下已暂存条目而不提交。

`R/boundary-probes.mjs` 的 executable-new-file 与 executable-mode-change 均复现该错误。相同 Node/Linux/Git、相同隔离场景下，使用 HEAD 原始源码的 `R/baseline-probe.mjs` 两项均 completed，并提交 100755。因此这是 baseline PASS → candidate FAIL 的回归，不是 Linux 测试环境问题。

最小修正：将已授权普通路径的真实输出 mode 纳入一致的投影/验证，遵守 Git 的有效 filemode 行为；不要把合法 chmod 变化与原 indexBasis 混为一谈，也不要通过预先 staging 或关闭 filemode 规避。补充新 executable、双向执行位变化及不支持状态必须在 staging 前拒绝的回归。

### RA-02 / P2：Archive v2 checkpoint 未排除整个旧源目录

位置：`src/internal/reviewed-checkpoint-candidate.ts:318–326`。

新 v2 分支仅验证默认中间目录不存在，并逐个验证 pre.sourceFiles 中的旧文件已删除；遗漏旧 sourcePath 下其他 suffix。真实隔离测试先完成 Archive 与 finish，再新增 `openspec/changes/change-one/unreviewed.md` 并将其列入 scoped checkpoint paths。当前实现返回 completed，HEAD 同时包含 ordinal archive、completed coordination 和重新出现的 active source 文件。

这违反 design 第 7 节“旧路径与默认中间路径必须消失”，也丢失了当前文件 legacy 分支已具备的 sourcePath 前缀排除。Git paths 授权不能替代被审 Archive 迁移身份。

最小修正：在拟写入树中同时排除 sourcePath 与 defaultPath 的整个前缀，保留原 suffix 精确集合核对；新增陌生 suffix、嵌套陌生文件的负向测试，并确认拒绝发生于真实 staging 前。复现输出为 `R/linux-boundary-probes/stdout.txt` 的 archive-source-resurrection。

### RA-03 / P2：跨日 prestate 的 inspect 错误报告可继续

位置：`src/cli/action-inspect.ts:206–209`。

Archive 保存 prestate 后、创建 command intent 前跨过本地午夜，或在这个位置中断后次日恢复时，observeArchiveV2 可合法返回 effect=none。inspect 将 none 无条件标为 canContinue=true，remaining 包含 openspec；实际 archiveChange 仍调用 assertOpenSpecArchiveDate，并持续返回 archive-date-drift / incomplete。prestate 不可变，同 Run 无法按提示继续。

本轮用 Date 边界注入让实际 archiveChange 保存前一天 prestate，未伪造该 prestate、未执行原生 archive。随后恢复真实时钟：inspect 返回 canContinue=true，显式继续再次 archive-date-drift。输出见 `R/linux-boundary-probes/stdout.txt` 的 midnight-pre-intent。现有 archive-date-continuation 测试仅覆盖已执行的安全 FAIL 次日不可重放，遗漏无 intent 分支。

最小修正：effect=none 的续做检查与执行共用日期及必要候选检查，日期已漂移时返回明确不可续做诊断；保留已发生原生效果的剩余步骤续做，不对其施加首次调用日期限制。

## Linux 验证

Docker Linux x86_64 / glibc 2.36，Node 22.23.2、项目 pnpm 11.22.0、Git 2.39.5；工作目录内完整版本输出见 `R/linux-platform-workspace/stdout.txt`。使用 346 份当前文件 raw 快照、独立 Linux node_modules 和普通 node 用户；不复用 Windows 依赖。另一次工作目录外的 linux-platform 查询显示 Corepack 默认 pnpm 12.9.1，不作为项目测试的 pnpm 身份。

| 本轮实跑 | 结果 | 材料目录（R 下） |
| --- | --- | --- |
| typecheck | PASS | linux-typecheck |
| build | PASS | linux-build |
| 全量 domain，concurrency=4 | 433/433 PASS，无 skip | linux-domain-nonroot |
| Git host / Foundation acceptance | 7/7 PASS，无 skip | linux-acceptance-real-root |
| 原生 exact OpenSpec 1.10.0 Archive 链 | 1/1 PASS，无 skip | linux-native-archive-esm |
| 两项执行位基线对照 | HEAD 两项 completed；候选两项 staging 后 incomplete | linux-baseline-executable / linux-boundary-probes |
| 额外边界探针 | 复现 RA-02、RA-03 | linux-boundary-probes |

原生 Archive 测试为当前 native-windows-archive.test.ts 的 Reviewer 独立 Linux 适配副本，只调整平台开关、绝对 import 与 junction→dir。执行 exact OpenSpec 的 collision safe FAIL → 新 Run PASS → scoped checkpoint → completion consumer，保留 LP i/lf w/crlf、源/归档路径 auto 转换和原始流断言。生产测试文件未修改。工具在一次性容器内按 exact 1.10.0 安装，未替换用户 stable manager。实际工具材料及合成角色记录保存于 `R/linux-native-materials/`；这些是隔离测试 fixture，不是本仓库 Reviewer Run、Git checkpoint 或 Delivery Full Test/Final。

环境/Reviewer harness 的失败全部保留：最初 root 用户绕过 chmod 权限使 domain 430/433；改普通用户后 433/433。首次 acceptance 使用 symlink runtime root 被正确拒绝，改成真实目录后 7/7。首次外部 `.ts` 探针被 tsx 当成 CJS，改用 `.mts` 后 native 1/1。这些不计为产品回归，也不隐藏原始失败。RA-01 的 baseline/candidate 对照使用同一普通用户环境。

本轮没有重跑 detached installed-manager 的专用三项或完整质量矩阵；Author 已有 Windows/installed 检查仅作已校验历史材料引用。上述是有界 Review 验证，不声称 Formal Full Test。

## OCR、输入与范围

已调用 Open Code Review 插件 delegate preview/rule；OCR 负责确定文件和规则，语义判断由本 Reviewer 完成，未声称外部 LLM 第二份独立 verdict。选中 30 项，reviewed=30、skipped=0、coverage_rate=1；原始 preview 总共 506 项、排除 476 项，100% 仅指选中列表。详细 `(path,status)` 见 `R/coverage.json`，规则见 `R/rules.json`。另核对退役模块、关键新增测试、批准合同和相关 HOW；React 规则不适用。

`R/review-readback.json` 核对 Author final-readback 的 63 项候选文件/删除、18 项批准/交接输入、128 份命令流以及本轮 346 项快照，mismatches=[]。任务勾选按 Author 已记录的 progress-only 身份处理。源码/HOW/测试未被本 Reviewer 改写，HEAD 不变、staged paths 为空。

当前步骤是 Apply 候选审查。移除 Archive 预演/依赖快照、专用安全重试边和共用 Git 投影均在已批准范围内；没有发现新增 Registry、通用 workflow 或自动循环。复杂度总体与合同相称，上述三个问题可局部修复；scope drift: NONE。

本轮只保存 Reviewer 报告和复现材料。下一步需要 Author 修复 RA-01–RA-03 后再次独立 Review；未自动 revise/archive、未 stage/commit/push。
