# Apply 验收与审查交接

本 Change 按 Owner 明确授权直接使用 OpenSpec，Apply 27/27 完成；此记录是 Author 的实现与 Verification 交接，不是 Reviewer verdict、Flowkit Run、Formal Delivery Full Test 或 Delivery Final。

## 实现范围

- Run 分配读取同 Delivery 已验证 occupancy；旧跨 Change 重号/缺口保持只读兼容，新 Change 从最大序号之后开始。同 Change 断链、未知占用、partial 和耗尽明确阻断。
- 三个 Review finish 统一绑定 direct terminal Author；apply/revise-apply 与 review-apply 在写前核对 raw/filter 字节。known rejected/null 可真实持久化，只有 exact Owner 同阶段 revise 才能接续。
- `action correct` 使用 closed request 和外部 create-once supplement，绑定原三文件、Role、Owner 与原声明候选证据；共享 effective view 不改原 outcome/verdict。候选 Git 树独立校验 supplement 和 original/proof。
- Archive 独立复制依赖、内部链接和可识别 pnpm shims；源 pnpm11 preflight 为 error/no-install，scratch 局部 no-sync。失败保存 raw 流、真实退出、截断/timeout/storage 分类与 refs。
- `action inspect` 只读核对 descriptor/package/Guidance/链与实际副作用；同 Run Archive 只执行已证明剩余步骤。pre/post 材料绑定真实目录完整 suffix/hash、spec 后态与 coordination 的唯一允许变更。
- scoped checkpoint 在拟写入树、实际 index 和最终 blob 核对已审候选及已接纳 Archive 的合法后态，保留既有授权范围与异常交接。
- 更新发行 Action/Git HOW、onboarding 和 help，保持既有 concept ownership、三文件 Run 与 prepared/terminal。

## 证据与执行环境

最终 raw 输出与命令元数据保存在仓库相对路径：

`.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/verification/`

其中 Windows capture 为每个真实进程保存 `command.json/stdout.txt/stderr.txt`，记录 actual timestamps/exit/signal、252 个源输入 SHA-256 与 `sourceUnchanged`。attempt 目录名是定位 ID，实际时间以 metadata 为准。它不创建 `.flowkit/runs/**`，也不写 Delivery Full Test state。

Windows 环境：Node `22.23.2`、pnpm `11.22.0`、exact OpenSpec `1.10.0`。Linux 使用独立 container、只读 source mount、普通 `node` 用户和自身 frozen-lockfile 依赖；未共享 Windows `node_modules`。

Linux image：`node:22.23.2-bookworm-slim`，digest `sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9`。Linux OpenSpec 独立安装 exact `1.10.0`；Node/pnpm 与 Windows 相同。

## 当前输入检查

| 环境与记录 | 实际检查 | 结果 |
| --- | --- | --- |
| Windows `20261003-190004-final/domain` | `node --import tsx --test --test-concurrency=4 tests/unit/domain/*.test.ts` | 406/406，exit0，sourceUnchanged=true |
| Windows `20261003-190004-final` | typecheck、quality:gate、build、quality:dependency-health、quality:entropy、quality:owned-source | 全部exit0、sourceUnchanged=true |
| Windows `20261003-190004-final/acceptance` | `pnpm test:acceptance` | 7 PASS /1 native opt-in skip，exit0 |
| Linux `20261003-190003-final/linux/final-current-v2` | typecheck、quality:gate、build、`pnpm test:domain`、acceptance、dependency-health、entropy、owned-source | 全部exit0，domain406/406，acceptance7 PASS /1 native Windows skip |
| Windows `20261003-190005-final` | 最终 native fixture 的 typecheck、quality:gate、build、acceptance | 全部exit0、sourceUnchanged=true；acceptance7 PASS /1 native opt-in skip |
| native Windows `20261003-190005-final` | 两处真实 Archive preflight、完整领域shards/full checks、OpenSpec与finish/新进程读回、真实check失败 | 验收exit0；每轮四shards合计406/406，8条domain命令和2条full-checks成功；真实失败探针exit1；source candidate/依赖保持原hash |

Windows standalone domain 与 Linux 的 production/shared fixture 输入已固定并通过。之后仅修改 Linux 不执行的 native Windows acceptance fixture，将完整领域套件拆为四个命令并断言每轮合计406项，适配既有每check300秒上限；当前 native fixture 的 typecheck/quality/build另行记录于 `20261003-190005-final`。本记录区分实际输入与执行范围，不声明 Formal Full Test。

native 完整 raw 证据位于 `20261003-190005-final/native-evidence/all-attempts`，实际effect材料位于 `native-evidence/archive-effects`；`native-evidence/source-identities.json` 保存 source前后身份、实际shim/link映射、`actualDomainCounts=[406,406]`、真实归档结果和已确认finish。早期递归skip/timeout与source drift尝试均保留在原attempt，不抵扣最终证据。

exact OpenSpec命令：`node C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js validate repair-real-project-execution-and-recovery-gaps --strict`，实际exit0；`instructions apply --json`读回27/27。

## 贯通与反例

`delivery-occupancy-compatibility.test.ts` 证明历史 `[1–11,12–22,1–11]` 原 Run/proof hashes 不变，新 fixed CLI Explore 从23开始、后续 Review 为24，三个旧 Change 独立查询有效。failure fixtures 覆盖 unknown/bootstrap/partial/同 Change duplicate/gap/跨 Change collision/exhaustion。

`rejected-review-recovery.test.ts` 覆盖三个 Review 的写前 binding/alias/map/Role/outcome 反例、真实 rejected terminal、新进程 blocked、exact Owner revise 和父链/原 verdict 不变。correction fixtures 覆盖 strict parser、原件/hash/Role/proof 来源、一次追加与只读 replay、直接 Reviewer 一致性及 candidate tree 缺证据/未知 Run。

`action-archive-cli.test.ts` 使用隔离 fixture 中真实 fixed CLI 与实际文件副作用，先拒绝旧 Review 缺 binding，再追加 Reviewer supplement；覆盖 OpenSpec 响应丢失、rename/coordination 后丢响应、同 Run 恢复/finish、新进程读回、conflicting phase evidence 阻断，以及规划/spec/coordination 的合法 Archive→scoped checkpoint。fixture 内 Git commit 后读取 blob，证明旧路径移除、完整迁移 hash 保持；额外 drift 在 stage 前拒绝。

依赖/诊断 fixtures 验证 scratch 写入不改变 source/hardlink、内部链接/shim 重定位、未知外部链接拒绝、环境副本、CRLF/non-UTF8、filter 失败、16MiB prefix overflow、command missing/timeout/存储失败与 create-once。

native Windows 验收使用 disposable target 和 synthetic predecessor；实际 OpenSpec/领域检查/full checks/归档/finish 属于真实执行，但 synthetic approved Review 不声称独立 Reviewer。fixture 的 offline install 仅建立其自身合法迁移后的 pnpm metadata；产品 preflight 没有 install。

## 修正与 baseline 对照

- Linux root 用户会绕过 chmod 读权限反例，最终验收改为普通 `node` 用户。
- baseline HEAD 的 Git pre-commit fixture 未设置 executable bit，Linux focused baseline `31 tests /30 PASS /1 FAIL`；candidate 对该 fixture 设置0755，实际非零 hook 反例通过。没有为该 baseline debt 改产品行为。
- Linux capture helper 起初置于 candidate 根目录，被 source ownership 正确拒绝；移至独立 verification 目录后通过。原失败日志保留，不覆写为 PASS。
- Windows 含40份 proof 的 CLI fixture 在全量并发下遇到旧30秒等待上限；调整测试等待为120秒，产品 timeout 合同保持。
- native 初轮 stderr 证明继承 `NODE_TEST_CONTEXT` 导致内部 domain 被递归跳过，虽 exit0 也不计作验收。fixture 的 CLI 子进程移除此测试宿主字段，并对每次 native domain 的实际数量、fail0与递归 warning 作断言，重新执行最终验收。
- 真实 domain 的 Windows 默认并发及单命令并发4在 scratch 触发既有300秒 timeout；保留该 process-failed 材料。standalone domain 使用并发4执行完整406项。最终 native fixture 用四个预先声明 `test:domain:1..4` 命令执行 Node `--test-shard=1/4..4/4` 的完整相同文件集，每条check保持300秒，逐项保存raw输出，断言每次preflight四个shard齐全且合计406项，不跳过文件或缩减测试。

## 边界

仓库保持 `main` / HEAD `7ccd269bae0fa550fa6fd61b660c98390dd7937e`；保留先前未提交编号草案与两个 issue 文档。两个 issue SHA-256 分别为 `0820086010e11b1f44ae95fdaf288b74c27a77350176270635ba3cb6dbc5cd12`、`f88e8f376e0e17fcdd11299b770546a462c321cb540bc485367ba6f9162789ad`。

没有执行真实仓库 stage/commit/push/merge/tag，未修改消费项目或升级安装 manager。历史 Run、archive、canonical specs、Delivery manifest、project/memo 未改写。所有 synthetic Runs/Owner facts/Git 操作仅在明确标注的 disposable fixtures 内。

完成 Apply 后停在独立 review-apply 边界，不自动审查、Archive、Full Test、Final、Git checkpoint 或发布。

## 2026-10-03 Owner 授权直接修复审查发现

Owner 明确要求直接修复独立审查发现的三个问题，沿用本 Change 不走 Flowkit Runs 的约定。原审查材料保留于 `.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/review/20261003-173712/`，本节记录修复及 Verification，不改写原 Reviewer verdict 或声称独立复审批准。

- Author correction 的消费者扫描现在区分 descriptor-only 与完整 Run，核对 descriptor 的目标、身份及父链；prepared Review 不再被误读成完整 Run。直接消费者 fork、partial machine files、错误 root 和不一致 terminal Review 仍拒绝。新增 fixed CLI 回归证明 correction → review-apply start → finish 可完成且原 Author 三文件 hash 不变。
- Archive 源码遍历收集嵌套 workspace 的 `node_modules`，源码复制时排除这些目录，再统一复制、重定位并核对依赖链接。回归覆盖内部 store/workspace 链接、shim、scratch 写入隔离、外部逃逸及源码 alias 拒绝；现有 Archive readiness 用例新增实际 workspace check，验证写入仅发生于 scratch。
- native 验收移除 `406` 固定断言，使用保留 TAP 的 reporter 记录实际执行的领域测试文件，并逐轮对照当前输入文件集合；保留分片齐全、非零退出、真实计数及递归跳过检查。新增真实子进程回归验证新增测试文件可通过、缺失分片或文件会失败。

本次当前源码证据根：`.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/fix/20261003-174945/`。各检查目录含 `command.json`、`stdout.txt`、`stderr.txt`，记录实际命令、起止时间、退出状态及输入 SHA-256；全部已完成检查的 `sourceUnchanged=true`，读回哈希与当前源码一致。

| 检查 | 本次结果 |
| --- | --- |
| 完整领域测试，concurrency=4 | 409/409 PASS，0 skip |
| 常规 acceptance | 7 PASS，1 skip（需显式启用的 native Windows 完整验收） |
| typecheck / quality:gate / build | exit 0 |
| quality:dependency-health / quality:entropy / quality:owned-source | exit 0 |
| 原审查 reproduce.mjs | correction/start/finish confirmed，完整三文件，内部 workspace source 检查通过 |
| git diff --check | exit 0 |

本次在 Windows 实机执行针对性回归及上述全量领域/常规验收；没有重跑完整 opt-in native Windows Archive 验收或 Linux detached 验收。先前平台材料保留为原输入的历史证据，不代替此次修改后的平台全量验收。未创建正式 Run、未修改历史结果、未执行真实仓库 stage/commit/push/merge/tag，也未升级安装 manager。

## 补充复审后修正：optional Review map 与当前平台验收

Owner 随后明确要求“直接修复这两个问题”，对应补充复审报告 `.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/review/20261003-181100/review.md` 的 P1/P2。继续直接 OpenSpec / no-Runs，不修改原 Reviewer verdict，不声称独立 Review approved。

P1 在既有 correction seam 内修正：首次追加 Author correction 仍要求已存在直接 Review 声明一致候选 map，来源不足或冲突在写前拒绝；已有 correction 的后续读回及相同请求 replay，按既有合同允许新 Review 省略可选 map，声明 map 时仍须一致。三个 verdict 的 fixed CLI 回归覆盖完成后读回、correction replay、approved 后 Archive start/checkpoint 候选消费、changes-requested 后 revise，以及 rejected 后缺 Owner 拒绝／正确 Owner revise。partial-machine、错误 descriptor、fork、历史未证明及候选冲突仍拒绝，原三文件 bytes 保持不变。

本次材料根为 `.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/fix/20261003-193550/`，最终输入验收位于其 `final/`。先前本轮 native 在第四领域分片发现既有 `managed-evidence-checkpoint.test.ts` 的时序依赖：恢复 `-text` 后普通 Git add 可复用 stat 缓存，保留已转换的 LF index blob。五轮最小复现中四轮 plain add 为9字节，显式 renormalize 每轮恢复原10字节且 source不变；该 fixture 修正前 SHA-256 与 baseline HEAD 一致。仅将 fixture 的属性恢复步骤改为 `git add --renormalize`，保留全部 raw/index 字节断言；没有修改产品 Git 行为。原失败、最小复现及初轮格式失败材料均保留，不覆写、不计为最终通过。

| 最终当前输入检查 | 实际结果 |
| --- | --- |
| Windows 全量 domain | 412/412 PASS，0 skip，exit0，sourceUnchanged=true |
| Linux x64 glibc 全量 domain | 412/412 PASS，0 skip，exit0，普通 node 用户、独立 frozen-lockfile 依赖 |
| Windows / Linux 常规 acceptance | 各7 PASS /1 native opt-in或平台skip，exit0 |
| 两平台 typecheck、quality:gate、build、dependency-health、entropy、owned-source | 全部exit0，sourceUnchanged=true |
| 6个map声明与verdict组合的fixed CLI probe | 全部prepared/terminal读回通过，finish confirmed，原Author三文件hash不变 |
| native Windows + pnpm11 完整 Archive | 1/1 PASS，0 skip；两轮四shards均完整，每轮412项，共8条domain命令；2条full-checks通过，真实check失败反例exit1；实际归档、finish、新进程读回通过，source candidate/依赖hash保持 |
| exact OpenSpec1.10.0 validate --strict | 当前Change有效，exit0 |

最终native原始材料在 `final/native-evidence/all-attempts/`，真实转换材料在 `final/native-evidence/archive-effects/`，source/shim/link/actualDomainCounts及归档/finish结果在 `final/native-evidence/source-identities.json`。每个外层进程的程序、参数、实际时间、退出、255项代码/config/HOW输入hash和sourceUnchanged见对应 `command.json`；Linux使用相同255项输入，环境与原始命令材料在 `final/linux/`。输入一致性、原Reviewer材料保留与变更范围核对见 `final/audit.json`。

此处补齐当前实现验收，替代旧输入平台PASS作为本次修正的验收依据；不改写历史事实。本次不创建正式 Run、不执行 Formal Delivery Full Test/Final、不自动进入 Review/Archive，不进行真实仓库 Git mutation或安装升级。实现及证据交给后续独立 review-apply。

## 跨日 inspect 判断一致性修正

Owner 授权直接修复 `review/20261003-ocr-rereview/review.md` 的 P2。`action inspect` 与 `change archive` 现共用 `assertOpenSpecArchiveDate`：已有 prestate 且实际效果为 `none` 时核对当前本地日期，日期漂移统一报告 `archive-date-drift`；inspect 返回 blocked / canContinue=false。已经证明 OpenSpec 归档效果的接续仍只执行剩余步骤，不因跨日误阻断，不覆盖 immutable prestate。

新增 `archive-date-continuation.test.ts` 通过真实 fixed CLI 建立 disposable Archive descriptor、实际保存 prestate，再推进宿主日期。覆盖同日无效果可接续、跨日无效果一致阻断且 `.flowkit` bytes 不变、已发生 OpenSpec 效果后次日完成 rename/coordination，以及原 prestate 保持不变。此 fixture 不声称真实独立 Reviewer authority。

本次证据根：`.flowkit/artifacts/direct-openspec/changes/repair-real-project-execution-and-recovery-gaps/fix/20261003-date-consistency/`。Archive CLI/readiness/date/competing-Run 四个测试文件共 **5/5 PASS，0 skip**；typecheck、quality:gate、build、dependency-health 均 exit0，所有检查 sourceUnchanged=true；`git diff --check` exit0。每项实际命令、输入哈希和原始流见对应目录的 `command.json`、`stdout.txt`、`stderr.txt`。

本次为日期诊断改动的针对性 Windows 回归，未重跑整套 domain、Linux 或完整 native Archive；上节平台材料继续保留其原输入身份，不被重标为本次全量平台 PASS。未改写原审查、Run 或历史证据，未创建正式 Run、执行真实仓库 Git mutation、安装升级或自动推进下一 Action。
