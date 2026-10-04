# Review Propose — repair-archive-lifecycle

- 审查日期：2026-10-04（Asia/Shanghai）
- Role：`reviewer`
- Verdict：`changes-requested`
- 项目：`D:\Projects\flowkit-next`
- 基线分支：`main`
- 基线 HEAD：`9b96b150eec8b59c40d1a72eb61054695a6e763b`
- Change：`openspec/changes/repair-archive-lifecycle`
- 生命周期：原生 OpenSpec；本次审查不创建 Flowkit Run / Delivery。
- 审查对象：Proposal、Design、Tasks、9 份 delta specs、相关 canonical specs 与现有消费者源码。

## 1. 结论

当前 Proposal 需要先收敛两项问题，再交独立 `review-propose`。整体 Archive 简化方向可以保留，无需重做 Explore 或引入新的恢复平台。

| ID | 优先级 | 需要收敛的问题 | 直接影响 |
| --- | --- | --- | --- |
| RP-01 | P1 | Archive retry 改变父链，但缺少 `delivery-finalization` 的对应合同修订 | 合法的 retry 成功链与现行 Delivery 完成来源合同冲突 |
| RP-02 | P2 | 将无 `-w` 的 `git hash-object --path` 当成实际 staging 的充分预测 | 既有 CRLF index + `text=auto` 下保存错误 blob 预期，之后合法 checkpoint 被拒绝 |

已使用受控 OpenSpec 1.10.0 执行严格校验，结果 `valid: true`、`issues: []`。该结果证明本次变更通过了 OpenSpec 的该项校验，不证明上述跨能力合同和 Git 语义已经闭合。

## 2. RP-01 / P1：补齐 Delivery Final 对 retry 后成功 Archive 的完成消费合同

### 定位与已确认事实

- 本提案 `proposal.md:20–30` 的 Modified Capabilities 列表没有 `delivery-finalization`，当前也没有该 capability 的 delta。
- `design.md:79–85`、`specs/run-result-persistence/spec.md:20–25` 明确要求新 Archive Run 的直接父 Run 为前一次失败 Archive，失败记录不可跳过。
- `design.md:95–97` 已写到统一“成功消费者”及“Delivery 已有完成消费”；`tasks.md:31` 的 5.2 也有一般性覆盖意图。
- 仍然有效的 `openspec/specs/delivery-finalization/spec.md:9–11` 和 `101–105`，要求唯一 accepted Archive 与其直接关联的 approved `review-apply`。
- 当前实际消费者 `src/internal/delivery-required-evidence-source.ts:224–234` 明确执行以下直接父链检查：

```ts
archive.record.context.previousRunId !== review.record.context.runId
```

### 冲突场景

设 `R15` 是 approved `review-apply`，`R16` 是安全失败的 Archive，`R17` 是重试成功的 Archive。

| 约束来源 | 对 R17 的要求 |
| --- | --- |
| 本次新的 retry 合同 | `R17.previousRunId = R16`，保留失败直接前序 |
| 现行完成消费者及直接 Review 合同 | `R17.previousRunId = R15` |

这两项不能同时满足。即使 Archive 与 scoped checkpoint 已成功，沿用现行完成来源规则仍会拒绝该 Change 的 Delivery 完成证据。只改实现而没有相应 delta，又会留下正式规范与行为不一致。

本 finding 针对的是缺少正式合同收敛，不是把尚未实施的旧源码再次当作实现回归；设计已经提到的消费意图应落实到这一具体能力。

### 最小修订要求

1. 在 Proposal 中增加受影响 capability `delivery-finalization`，为上述两条 Requirement 增加最小 MODIFIED delta。
2. 明确成功消费选择当前 Change 的可信完成终点，并通过共享解析器穿过连续、已接纳的安全失败 Archive，定位其批准的 `review-apply` 及 Author；仍拒绝 partial、未知结果、错目标、fork、过期成功或错误链接。
3. 明确 `delivery-required-evidence-source.ts` 及其受影响调用方复用该规则。保留真实来源、三文件完整性和结果身份检查；不把查找最近 Review 的目录扫描当成依据，也不重放无关祖先 admission。
4. 在任务 5.2 / 集成验收中增加“安全 FAIL → 新 Archive PASS → required Change completion 接纳”的消费者回归，并保留 partial/错链拒绝用例。

该修订验证完成证据的读取与接纳，本次仍不运行实际 Delivery Full Test/Final，也不产生 Final 或 Git 授权。

## 3. RP-02 / P2：Git EOL 投影必须考虑相关 index 的既有内容

### 定位

- `design.md:103、111–112、124–128、142`。
- `specs/stable-action-command-execution/spec.md:108–110`。
- `specs/repository-integration-and-next-base-continuity/spec.md:4–8`。
- `tasks.md` 的 4.1、5.1 应补充相应验收输入。

设计第 111–112 行使用无 `-w` 的 `git hash-object --path` 核对原生 Git 投影，再将其记录为预期入库 `blobOid`。这个命令的结果不能单独证明实际 `git add` 的结果。

Git 的 `text=auto` 转换还受相关文件是否已在 index 中以 CRLF 保存影响。官方文档明确描述了既有 CRLF 内容保留、不执行自动换行转换的分支：[Git gitattributes — text](https://git-scm.com/docs/gitattributes#_text)。本次同时以本机真实 Git 验证了该差异。

### 本机 Windows 最小复现

运行环境：`git version 2.49.0.windows.1`。仅在系统临时目录中新建隔离仓库；未修改 `flowkit-next` 的 index、Git 配置或工作文件。

1. 临时仓库设置 `core.autocrlf=false`、`core.safecrlf=false`。
2. 先将 `a.txt` 的 `old\r\n` 加入 index，使其成为既有 `i/crlf` 文件。
3. 写入并暂存 `.gitattributes`：`*.txt text=auto`。
4. 将工作文件改为 `new\r\n`，分别读取 raw hash、`hash-object --path` 的输出，然后真实执行 `git add a.txt`。

| 检查项 | 本机实测 |
| --- | --- |
| 调用前 EOL | `i/crlf w/crlf attr/text=auto` |
| raw OID | `d2eb92c3f437753a118e0fb686bbc3d3bba96b63` |
| `git hash-object --path=a.txt a.txt` | `3e757656cf36eca53338e520d134963a44f793f8` |
| `git add a.txt` | exit 0，无 stderr |
| 实际 index OID | `d2eb92c3f437753a118e0fb686bbc3d3bba96b63` |
| 调用后 EOL | `i/crlf w/crlf attr/text=auto` |
| 工作文件原始 hex | `6e65770d0a`，仍是 `new\r\n` |

实测结果是：`hash-object --path` 给出 LF 投影，实际 staging 保留 CRLF。相同类别的差异也在隔离 Linux Git 2.51.1 实验中复现；本机 Windows 结果足以支撑此 finding。

### 对提案的影响

按当前设计指定的机制，Author 可能保存 LF 的 `candidateGit.blobOid`，Review 用同一命令复核也会通过。但 raw 与 `.gitattributes` 均未漂移，后续合法 checkpoint 的实际 index 仍与该预期不符。

现有设计的 stage 后核对能够避免错误提交，这项保护应保留；它无法修复更早保存的错误投影，只会在已经发生 staging 后拒绝继续。重复形成候选和 Review 也不能消除同一计算机制的错误。设计第 142 行提到了“索引历史”风险，但所选机制还不足以处理它。

### 最小修订要求

1. 将相关 stage-0 index 的 CRLF / LF / absent 状态纳入有界转换判断和后续一致性核对，明确计算结果对应实际 staging 语义；不能只以 `hash-object --path` 返回值认定预期 blob。
2. 对既有 CRLF + `text=auto` 的本例，形成可验证的 `identity` 绑定。若决定暂不支持某个分支，应在生成成功候选前明确报 unsupported，并收窄支持范围，避免先保存错误投影。
3. 在 4.1 / 5.1 增加“已有 `i/crlf` + `text=auto`，raw 经过修改仍为 CRLF”的真实 Git 用例，贯穿候选生成、Review、scoped staging 与 index 读回；覆盖继承 `core.autocrlf` 的同类分支，并保留已有 LF / 新文件对照。
4. 保持原有边界：候选生成阶段只读、不写真实 index/object/worktree、不执行任意 filter、不改项目配置、不自动 normalize；不需要复制整个开发环境或增加通用 Git 转换平台。

## 4. 已核对并可保留的设计

| 审查点 | 判断 | 当前依据 |
| --- | --- | --- |
| 先保存 started Run，再执行真实 OpenSpec | 已明确；可以保留 | `design.md:24–42` |
| 去除隔离预演、依赖复制、无关 symlink/shim 扫描 | 与本次问题匹配 | `design.md:38–44`；任务 2.1、6.2 |
| failed / partial / completed 与机器 incomplete 区分 | 已明确，不把进程失败等同无副作用 | `design.md:58–72` |
| 安全失败用新 Run，保留原失败与直接 parent | 已明确；RP-01 补齐下游消费 | `design.md:74–85` |
| 失败后 Owner revise-propose / revise-apply，再独立 Review | 已给出窄边界，未要求修订候选仍等于旧 Review | `design.md:87` |
| descriptor-only 同 Run 仅继续已证明的剩余步骤 | 已明确；有 intent 无结果时不盲重放 | `design.md:89–91` |
| terminal partial 只交接恢复 | 是明确范围限制，本次不要求新增自动恢复器 | `design.md:91、145` |
| raw 与 Git blob 分离，Run/proof/日志字节保持 | 方向合理；RP-02 修正具体投影机制 | `design.md:99–128` |
| 归档目标路径属性可能不同，保存 after projection | 已覆盖，不要求源/目标 blob 永远相同 | `design.md:125–127` |
| Git 失败不重跑成功 Archive | 已明确 | `design.md:129` |
| 旧记录不回填，duplicate finish 只读复用已存事实 | 已明确 | `design.md:105、131–135` |

## 5. 复杂度、范围与本轮证据

### 当前步骤

本次 `review-propose` 判断规划是否具备实施所需的完整、一致、可验收合同。未完成的实施任务在此阶段是正常状态；未将任务未勾选或尚无修复后测试当作 finding。

### 复杂度 / 最小性

Archive-only retry seam、版本化实际效果材料、共享 Review 来源解析，分别对应 terminal 吸收规则、归档转换证明和失败父链的真实约束，规模基本合理。当前没有引入通用 Multi-Run、第三种 lifecycle state、错误 Registry、候选数据库或自动恢复引擎。两项修订均可在既有模块和能力内完成。

### 新内容 / 范围漂移

提交的 Proposal / Design 已显式记录 LF/CRLF 为 Owner 后续增补范围，本次按该提交范围审查。未发现需要扩大到 OpenSpec 升级、消费项目安装、MenDi reopen、发布或实际 Full Test/Final 的理由。未把本轮未提供的 Explore 原始试验冒充本轮亲测，也未仅因未见其原始附件就推断未授权。

### 已执行核对

- 附件 `repair-archive-lifecycle-proposal.md` 与本地 `proposal.md` 的 SHA-256 完全相同。
- 基线 HEAD 与分支已核对；审查开始时仅本 Change 目录未跟踪，没有 tracked 实现代码修改。
- 读取独立开发 Reviewer 指引 `.agents/skills/review-propose/SKILL.md`、根 `AGENTS.md`、toolchain lock、完整规划与相关规范/实现。产品 Guidance 作为受审内容，不作为自审批准依据。
- 受控 OpenSpec 版本为 1.10.0；执行以下只读严格校验：

```text
node C:\Users\xuser\.flowkit\tools\openspec\1.10.0\bin\openspec.js validate repair-archive-lifecycle --type change --strict --json --no-interactive
```

- 严格校验返回一个 Change，`valid: true`、`issues: []`、passed 1 / failed 0。
- 在 Windows 临时 Git 仓库执行 RP-02 的原生语义复现；这不是修复实现验收。
- 保存 Reviewer 结果前重新计算下表 13 份输入的 SHA-256，全部未漂移。

本次仅保存独立 Reviewer 文档，没有修改 Author 的 Proposal / Design / Tasks / delta specs 或生产源码，没有运行修复实现的测试、build、真实 Archive、Delivery Full Test/Final、发布安装或项目 Git commit/push。

## 6. 给 Author 的下一步

在当前 Change 内执行 `revise-propose`，集中收敛 RP-01 与 RP-02：补 Delivery completion 的规范与验收；修正 EOL 预期 blob 的输入和生成机制，并加已有 CRLF index 的反例。完成后重新提交独立 `review-propose`。本次不进入 Apply。

## 附录 A：本轮审查输入身份

下列路径相对 `openspec/changes/repair-archive-lifecycle/`；SHA-256 为本轮从本机原始文件读回的值。

| 文件 | SHA-256 |
| --- | --- |
| `proposal.md` | `6df542fb0631bf58b4b13bc0322d919cf0a6f7c89b9e4ad54a5b9c2327790522` |
| `design.md` | `4a7a5f0d2c543cfe3a29f35bad89993f901f91dcb0523f24510d52eb2882da82` |
| `tasks.md` | `92b04fd22fe441854d731ade03201ec70dc637ef8a5e7f91d9772a65a924d9ea` |
| `specs/stable-action-command-execution/spec.md` | `e3d330cf3879d4751bc31ec8dd9fca0fae3da6e50ac2fe13285bdd124282f75a` |
| `specs/stable-delivery-support-command-execution/spec.md` | `b996c8103506f78d60928df32621d3c00e5a1710a036a5ee138cde37152fd914` |
| `specs/run-result-persistence/spec.md` | `0a4593454d5ef7e621b3bde344b9398861c33863a596e9ea4e78ce8693a56c49` |
| `specs/repository-integration-and-next-base-continuity/spec.md` | `4b858e2d29e5784fc1404bdfc53fae9d3e21b966c041247d7d6d3ad22257983b` |
| `specs/action-lifecycle/spec.md` | `484a22b80610760c5e2a32422e042f6718dcb4e1dab22bb66ff00ac3ba2dd9c8` |
| `specs/policy-and-next-boundary/spec.md` | `9570d9ef466fa012d445c5963c31deaa29009a6cd983c81c2db58d961e405518` |
| `specs/single-action-execution-terminal-boundary/spec.md` | `29eb5e0ac4c5bdbc428e2d64d975857b8c03f717fbd86d8a379b53d297e10c43` |
| `specs/author-action-guidance/spec.md` | `b43126d0ea08d876d1156793ac5354d50cb700f2ebf9cfe3229fb476bd402900` |
| `specs/reviewer-action-guidance/spec.md` | `f0461578b604e5ba85ac0a8ae6495aa53d0e97f14e7f67dfe06d76ff9c6bb0af` |
| `.openspec.yaml` | `ad734da2ba5f4c5a6979a8bbb6bad4db20fb21ec275ceca5f24842fbdfaf5bef` |

## 附录 B：Windows Git 语义实验原始结果

该输出来自本轮单独临时仓库中的实际命令；目录名只定位实验，不是产品配置或支持前提。

```json
{
  "gitVersion": "git version 2.49.0.windows.1",
  "fixture": "C:\\Users\\xuser\\AppData\\Local\\Temp\\flowkit-review-eol-kqPKhD",
  "before": "i/crlf  w/crlf  attr/text=auto        \ta.txt",
  "rawOid": "d2eb92c3f437753a118e0fb686bbc3d3bba96b63",
  "predictedOid": "3e757656cf36eca53338e520d134963a44f793f8",
  "gitAdd": {
    "exitCode": 0,
    "stderr": ""
  },
  "indexOid": "d2eb92c3f437753a118e0fb686bbc3d3bba96b63",
  "after": "i/crlf  w/crlf  attr/text=auto        \ta.txt",
  "predictedMatchesIndex": false,
  "rawMatchesIndex": true,
  "worktreeHex": "6e65770d0a"
}
```

## 附录 C：RP-02 的可复现命令

在另一个临时目录运行；不要在业务仓库运行下面的初始化或配置。此例不需要 commit。

```powershell
git init -q
git config core.autocrlf false
git config core.safecrlf false
node -e "require('fs').writeFileSync('a.txt', Buffer.from('old\r\n'))"
git add a.txt
node -e "require('fs').writeFileSync('.gitattributes', '*.txt text=auto\n')"
git add .gitattributes
node -e "require('fs').writeFileSync('a.txt', Buffer.from('new\r\n'))"
git ls-files --eol -- a.txt
git hash-object --no-filters -- a.txt
git hash-object --path=a.txt -- a.txt
git add a.txt
git rev-parse :a.txt
git ls-files --eol -- a.txt
```

本文中的源码/规范行号绑定上述审查版本，Author 修订后应以新版本重新审查。
