# Revise Apply — repair-archive-lifecycle

日期：2026-10-04（Asia/Shanghai）。角色：Author / Verification。输入为 `review-apply.md` 的 RA-01–RA-03（changes-requested），批准合同仍为 `review-propose-03.md`。沿用 Owner 在本会话明确授权的直接 OpenSpec 方式，本次不创建本仓库 Flowkit Run / Delivery。

基线保持 `main` / `9b96b150eec8b59c40d1a72eb61054695a6e763b`。三个发现均为实现缺陷，可在当前批准合同内局部修正，无须修改 Proposal。原 `review-apply.md`、`verification.md`、规划与历史证据保持原字节；本文件只交接新修正，不替代独立 Reviewer verdict。

## 修正与回归

| Finding | 最小修正 | 本轮真实回归 |
| --- | --- | --- |
| RA-01 | `candidate-git-bytes.ts` 共用普通 Git 输出 mode 判断；`checkpoint-candidate-tree.ts` 将当前预期 mode 投影并核对漂移；`git-checkpoint-execution.ts` / `reviewed-checkpoint-candidate.ts` 在 stage/commit 后同时核对 mode 与 blob。不可变 indexBasis 仍是原输入，candidateGit schema 不变。 | `git-eol-checkpoint.test.ts` 新增三项 Linux 回归：新 755、755→644→755；仅 group 执行位仍是 100644；filemode=false 保留已有 100755、新文件 100644；mode 漂移与 symlink 在 stage 前拒绝、index 不变。 |
| RA-02 | v2 checkpoint 的拟写入树同时排除整个 sourcePath / defaultPath 前缀，保留 suffix 精确集合核对。 | `action-archive-cli.test.ts` 在真实 fixture Archive/finish 后新增陌生源文件及嵌套陌生文件，即使列入授权 paths 仍 preflight 拒绝，effect=none，index/HEAD 不变。 |
| RA-03 | inspect 的 effect=none 分支复用候选核对与 `assertOpenSpecArchiveDate`；已发生原生效果的剩余步骤不受首次执行日期限制。 | `archive-date-continuation.test.ts` 注入真实 prestate 保存时跨日、无 intent：inspect 和 execute 都拒绝 archive-date-drift，prestate 不改写、原生命令调用数为 0；已成功执行但 ack 保存受阻的场景跨日仍能只补剩余步骤，调用数为 1。原安全 FAIL 次日 finish-only 回归继续通过。 |

输出 mode 遵守有效 `core.filemode`：true 取 owner execute bit；false 保留普通旧 index mode，新文件为 100644。依据实际 Git fixture，并核对 [Git read-cache.h](https://github.com/git/git/blob/v2.49.0/read-cache.h) 的 `ce_mode_from_stat`。未预先 staging、未关闭 filemode、未新增持久输出 mode 字段或依赖。

本轮相对 Reviewer 的 346 文件快照仅修改上述 5 个源码文件和 3 个测试文件。既有 Apply 的累计 63 项候选文件/删除继续保留，包括 `src/cli/archive-check-selection.ts` 与 `src/internal/archive-dependency-snapshot.ts` 的删除；新 readback 给出完整累计身份和这 8 项 before/after。没有改写已批准规划、HOW 或旧 Review。

## 本轮验证

证据根：`.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/revise-apply/20261004-ra01-ra03/`（下表目录均相对此根）。每个命令目录保存真实 `command.json`、Buffer `stdout.txt` / `stderr.txt`，旧 Apply/Reviewer 材料继续保留。

| 检查 | 结果 | 材料目录 |
| --- | --- | --- |
| Windows 针对性 domain（归档、跨日、EOL、candidate projection） | 20 PASS / 3 Linux 专属 skip，fail=0 | windows-focused |
| Linux 同组针对性 domain | 23/23 PASS，无 skip | linux-focused |
| Linux 全量 domain，concurrency=4 | 439/439 PASS，无 skip | linux-domain |
| Linux Git host / Foundation acceptance | 7/7 PASS，无 skip | linux-acceptance |
| 真实 Windows OpenSpec / Git 归档链 | 1/1 PASS，无 skip | windows-native-archive / windows-native-materials |
| 真实 Linux OpenSpec / Git 归档链 | 1/1 PASS，无 skip | linux-native-archive / linux-native-materials |
| 仓库外 detached installed-manager | 3/3 PASS | installed-manager |
| Windows / Linux typecheck、build | 均 PASS，exit 0 | typecheck / build / linux-typecheck / linux-build |
| formatting / lint | PASS，exit 0 | quality-gate |
| dependency-health、production reachability entropy、owned-source | 均 PASS，exit 0 | dependency-health / entropy / owned-source |
| forbidden tracked artifacts、OpenSpec strict、Git whitespace 诊断 | 均 PASS，exit 0 | forbidden-tracked / openspec-strict / diff-check |

Linux 环境本轮已可用：Docker Linux x86_64 / glibc 2.36、Node 22.23.2、pnpm 11.22.0、Git 2.39.5。346 项当前 raw 输入复制进隔离 `/work`，独立 Linux node_modules，使用普通 node 用户；未复用 Windows 依赖。版本输出见 linux-platform，安装与调用脚本分别为 linux-setup.sh / linux-checks.sh / linux-acceptance.sh。

Linux native 测试使用 Reviewer 适配副本 `native-linux.test.mts`，调整仅为平台开关、绝对 import 与 junction→dir；运行本轮 `/work` 源码，生产测试文件未进一步修改。Windows 使用现有 native 测试，设置 `FLOWKIT_HOME=C:/Users/xuser/.flowkit`、`FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE=1`、`FLOWKIT_NATIVE_ARCHIVE_EVIDENCE=<本轮证据根>/windows-native-materials`。Linux 在一次性容器安装明确版本 `@fission-ai/openspec@1.10.0`，真实目录 runtime 位于 `/work/revision-home/tools/openspec/1.10.0`，CLI 版本及原始工具流均保留。

两平台 native 链均实跑 collision safe FAIL → 新 Run PASS → scoped checkpoint → completion consumer，并核对 LP 的 i/lf w/crlf 路径及原始材料。这里所有 Author/Reviewer/Owner/Run/Git 记录仅属隔离 fixture，不是本仓库独立 Review、真实 checkpoint 或 Formal Delivery Full Test/Final。

## 包、失败记录与交接

当前 build 打包到 `.tmp/revise-apply-linux-20261004/package/flowkit-next-1.0.0.tgz`，SHA-256 `1641be581279a88021eeee0a123b059220a37e8257a2b9a24a0139b19bf0777c`。pack 使用 `npm_config_ignore_scripts=true` 消费已完成的 build。仓库外安装根为 `C:/Users/xuser/AppData/Local/Temp/flowkit-revise-apply-aWZQsg`，fixture override 为仓库 lock 的 yaml 2.9.0，offline / ignore-scripts 安装。不更新 `D:/tools/flowkit-manager` 或消费项目。

本轮保留两项 harness 失败及后续修正：linux-setup-host 先 chown `/work` 后以 root 配 Git，触发 ownership 拒绝（exit 128）；修正隔离 `.git` ownership 后以 node 运行全部 Linux 检查。package 首次传入 pnpm pack 不支持的 `--ignore-scripts`（exit 1）；改用上述环境设置后 package-corrected 成功。这两项失败不是产品 PASS，也没有删除失败流。

`revision-readback.json` 核对当前 Linux 测试输入、8 项修正、累计候选与删除、18 项批准输入、旧 Author 命令/流、原 verification、当前包安装文件、两平台 native material refs、HEAD/index/lock。tasks 保持原 26 项完成状态，不能替代本次独立 Review。

本次完成 revise-apply，修正与新证据可交给独立 Review Apply。未自审批准、未归档、未 stage/commit/push、未替换 stable manager，未自动进入下一 Action。
