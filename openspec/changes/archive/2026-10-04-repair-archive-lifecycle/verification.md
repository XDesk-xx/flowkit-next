# Apply Verification — repair-archive-lifecycle

日期：2026-10-04（Asia/Shanghai）。角色：Author / Verification。执行方式：Owner 已授权的直接 OpenSpec Apply；本仓库不创建 Flowkit Run / Delivery。

## 输入与实现

基线为 `main` / `9b96b150eec8b59c40d1a72eb61054695a6e763b`。Apply 开始时核对 `review-propose-03.md` 的18份输入 SHA 均匹配，verdict 为 approved；该批准不代替实现审查。proposal/design/delta specs、旧 Review/修订交接均保持原字节，tasks 只记录本次完成进度。

实现以下已批准合同：

- Archive version-2 先完成 admission / descriptor，再至多一次真实 exact OpenSpec archive。删除 Archive 专属 checks/snapshot/预演代码；后态取自实际操作，nested capability 与完整 raw suffix 映射保持可核对。
- 三种封闭 outcome 贯通 finish/query/inspect/Policy。安全 FAIL 使用新 Run、保留旧 Result；共享来源解析贯通连续失败父链、approved Review 与 direct Author，以及 checkpoint 和 Final 完成来源。partial 保持 recovery-required，不自动解锁。
- 新成功 Author finish 生成 candidateGit version-1，raw SHA 与 Git blob OID 分离，保存相关 indexBasis、有效 text/eol/settings/object format。Review/Archive/checkpoint 共用原绑定；归档后使用 destination 自身投影。RP-03 的 raw==旧 blob 而 clean 不同在成功候选和 staging 前拒绝，stat 改变不解锁。
- checkpoint 在 stage 前核对 scope/相关属性树和预期 blob，stage 后核对 cached rules/index，commit 后核对实际 blob。raw proof/log 保持原字节；Git 失败不重做 Archive。
- 当前 HOW、README/onboarding/AGENTS 与新旧兼容边界同步；旧完整 version-1 只读，旧 started 不由新 manager 冒充接管。

不实现上游 rollback 或通用恢复器。fixture 的真实写入再恢复前态按 `no-mutation` 接纳；没有正面回滚证据的 `rolled-back` finish 明确拒绝。terminal partial 的真实人工恢复未执行。

## 最终检查

证据根：[apply 材料](../../../.flowkit/artifacts/direct-openspec/changes/repair-archive-lifecycle/apply/)。每次真实命令都有独立目录的 `command.json`、原始 Buffer `stdout.txt` / `stderr.txt`；exit、signal、spawnError、timeout 均由实际子进程取得，失败材料保留。

| 检查 | 最终材料目录 | 结果 |
| --- | --- | --- |
| typecheck | `final-typecheck-lp` | PASS，exit 0 |
| quality:gate（format / lint） | `final-quality-gate-lp` | PASS，exit 0 |
| build | `final-build-v3` | PASS，exit 0 |
| 全量 domain，显式 concurrency=4 | `final-domain-v3` | PASS，433/433，exit 0 |
| Git host / Foundation manager acceptance | `final-acceptance-v3` | PASS，7/7，exit 0 |
| native Windows exact OpenSpec / Git | `final-native-windows-v3` / `final-native-windows-lp` | 两者均 PASS，各1/1，exit 0 |
| detached installed-manager | `final-installed-manager-v3` | PASS，3/3，exit 0 |
| dependency-health | `final-dependency-health-v3` | PASS，exit 0 |
| production reachability entropy | `final-entropy-v3` | PASS，exit 0 |
| entropy tests | `final-entropy-tests-v2` | PASS，exit 0 |
| owned-source policy | `final-owned-source-v3` | PASS，exit 0 |
| forbidden tracked artifacts | `final-forbidden-tracked-v2` | PASS，exit 0 |
| OpenSpec strict change validation | `final-openspec-readback` | PASS，valid=true / issues=[]，exit 0 |
| git diff --check | `final-diff-check` | PASS，exit 0；不覆盖全部未跟踪文件 |

测试执行使用 Node `22.23.2`、pnpm `11.22.0`、本机 Git `2.49.0.windows.1`、受控 OpenSpec `1.10.0`。OpenSpec entrypoint 为 `C:/Users/xuser/.flowkit/tools/openspec/1.10.0/bin/openspec.js`；没有 PATH/latest 替代。

native 测试明确设置 `FLOWKIT_HOME=C:/Users/xuser/.flowkit`、`FLOWKIT_NATIVE_ARCHIVE_ACCEPTANCE=1` 和受控材料目的地 `FLOWKIT_NATIVE_ARCHIVE_EVIDENCE=<apply>/native-windows-lp-materials`。最终 `instructions apply --change repair-archive-lifecycle --json` 返回 `state=all_done`、total=26 / complete=26 / remaining=0，读回保存在 `final-apply-instructions`；其 ready-to-archive 提示不替代独立 Review 或 Owner 的新 Archive 请求。

## 合同覆盖与实际限制

| Tasks | 主要实现/测试覆盖 |
| --- | --- |
| 1.1–1.3 | outcome/schema/raw 绑定、Policy 与 retry、descriptor/request migration、旧完整/started 格式 |
| 2.1–2.4 | ignored junction/pnpm shim/无 checks 的 admission；真实子进程 non-UTF8/CRLF、16MiB 上限、缺程序/timeout/storage failure；nested spec after、一次调用；安全失败、恢复前态、候选漂移、晚 ordinal collision、预存目标原字节与 partial |
| 3.1–3.5 | 两次安全失败后 PASS、immutable Result、精确 parent、fork/错目标/缺链/不连续/partial 拒绝；Owner revise-apply→新 Review 角色 fixture；coordination 损坏后 terminal FAIL/null state；成功响应丢失只补剩余操作，未知 intent 不重放 |
| 4.1–4.3 | 真实 Git 的 absent/LF/CRLF/mixed、auto/eol/inherited autocrlf、RP-03 cache/touch 独立对照、BOM/lone CR/non-UTF8/NUL；属性/设置/index 漂移、active filter 拒绝；manager finish 与 duplicate/correction 兼容 |
| 5.1–5.4 | scope/属性未入候选树/范围外 index 拒绝；stage/index/commit blob；source i/crlf auto identity→absent archive destination LF；raw non-UTF8 日志；safecrlf 真实 Git 拒绝；零/一/多次 FAIL 后完成来源、缺链/fork/过期/不一致拒绝，原五字段与 bounded legacy consumer |
| 6.1–6.3 | 固定 start/finish/proof inspect HOW、Reviewer 独立与 STOP；退役模块移除，类型/依赖/可达性；旧记录与 frozen Guidance 不改写，不回填历史 candidateGit |
| 7.1–7.4 | 同一最终源码的 domain/native/acceptance 与包安装；集中检查、实际原始流、final-readback 与本文件；Linux 环境限制见下文 |

native Windows 场景实际执行受控 OpenSpec：默认归档目标 collision 的安全 FAIL → 新 Archive Run PASS → 临时 Git 仓库 scoped checkpoint → required Change 完成来源接纳。必要实际工具流、效果材料和 synthetic Run 保存在 `native-windows-v3-materials` 与 LP 补充的 `native-windows-lp-materials`；这里的 Author/Reviewer/Owner 角色记录仅是隔离测试 fixture，不声称独立 Reviewer 审查，也不是本仓库 Git checkpoint，更不是实际 Delivery Full Test/Final。

全量 domain 后仅补充 LP 三条路径的 native fixture 分支，production/HOW/package bytes 不变。LP 分支以 `config/verification/structure-policy.json`、`scripts/verification/structure-inventory.test.ts`、`scripts/verification/structure-sources.ts` 重建 `i/lf w/crlf`，使用明确合成内容，未读写消费项目。补充后重新 typecheck/quality gate，单独执行 native 完整链；domain 原默认分支没有改变。

Git 投影只绑定支持范围内的入库 blob，不承诺 Git 命令一定成功。`core.safecrlf=true` 的真实拒绝由 add/checkpoint 保留为 Git 失败，测试核对 HEAD/index/raw/config 未被改成“成功”；没有关闭安全设置。Git 的无 `-w` hash 与 ordinary add 的 round-trip flags 不相同，参考 [Git convert.c](https://github.com/git/git/blob/v2.49.0/convert.c)；行为依据是本次独立真实 Git fixture，而非仅源码推断。

Linux x64 glibc 本次 **未执行**。WSL 只列出 docker-desktop，Docker Linux engine 不可用；`linux-docker-prerequisite` 的真实 `docker info --format "{{.OSType}} {{.Architecture}}"` 在15秒后超时，记录 `exitCode=null`、`signal=SIGTERM`、`timedOut=true`。这不是 Linux PASS，也不以 Windows simulation 或历史 PASS 替代。任务7.3按“环境不具备则记录明确限制”交接。

## 包与身份读回

最终包是忽略 prepack scripts、消费本次已 build 的 dist 后生成的 `.tmp/repair-archive-lifecycle-package/final-v3/flowkit-next-1.0.0.tgz`，SHA-256 `4a08f65c6cd2a83062615f503036c54805bd9dceb350447749ea08d2ad831e41`。

包安装在仓库外临时目录 `C:/Users/xuser/AppData/Local/Temp/flowkit-repair-archive-final-EqtTxx`。隔离 fixture 的 `pnpm-workspace.yaml` 将 yaml 固定为仓库 lock 的 `2.9.0`，离线/no-scripts 安装；不升级消费项目或正式 stable manager。最初仓库内安装被 pnpm 识别为 workspace 成员并改写 repository lock；本次意外改动已按 HEAD 原始 Buffer 恢复，final-readback 核对 exact equality。无 override 的隔离安装因离线 store 缺 yaml2.9.1 失败，相关真实材料也保留；该失败不是产品测试 PASS。

`final-readback.json` 记录最终修改/新增/删除源码与 HOW 的 raw SHA、批准输入、命令流 SHA/bytes、包 SHA、安装包文件/metadata、fixture lock 和仓库边界。132份安装 dist/Guidance/tool/onboarding 文件与最终候选逐文件 raw 相等。旧 `frozen-source.json` 是早一轮检查快照，不能替代最终 readback；中间检查失败与已撤回的实现尝试也不代表最终候选 PASS。

## 失败修正与 STOP

初轮 domain 的过时 checkpoint fixture 未授权相关 `.gitattributes`，以及 Windows 长 argv 路径批量查询问题已修复；后续清理 EBUSY 用隔离 fixture 的有限 rm retries 处理。quality gate 的 fixture unsafe-finally 已修正。集中检查发现 Archive HOW 缺命令示例、safecrlf 测试错误地将 blob 投影等同 add 保证，以及新 rollback 拒绝测试错误文案断言；最终候选与测试均按批准合同收敛。每轮真实失败输出保留，不能用早一轮 PASS 覆盖最终状态。

本次只完成 Apply。未自审、未归档此 Change，未执行真实 Delivery Full Test/Final、仓库 staging/commit/push 或消费项目升级；历史 Run/归档与 main/HEAD 保持原样。下一边界为独立 Review Apply。
