# Review Propose 02 — repair-archive-lifecycle

- 日期：2026-10-04（Asia/Shanghai）
- Role：reviewer
- Verdict：changes-requested
- 基线：main / 9b96b150eec8b59c40d1a72eb61054695a6e763b
- 对象：当前 Proposal、Design、Tasks、10 份 delta specs、相关 canonical specs 与消费者源码。
- 执行边界：按 Owner 既有要求直接审查，不创建 Flowkit Run / Delivery。上一轮 review-propose.md 与 Author revise-propose.md 均保留原文。

## 结论与前轮复核

RP-01 已在规划层闭合：delivery-finalization 两条 MODIFIED Requirements、design 第 5 节和任务 5.4 明确要求完成选择器与接纳器共享失败链解析；R15 Review → R16 安全失败 → R17 PASS 返回 R17/R15，同时拒绝 partial、错链、fork 与过期 PASS。原五字段 completion、Full Test 和 Final 授权不变。

RP-02 原有的 auto + 已修改 CRLF 文件反例已被修订覆盖：indexBasis、自动模式既有 CRLF 保留、显式 text 分支、输入或已核实输出的消费、destination 自身索引依据均已写入设计、规格和任务。已核对 Git 官方 text 合同及 v2.49.0 convert.c 的 has_crlf_in_index/crlf_to_git，该修订方向有依据。

本轮另发现 RP-03 / P2，需在 Apply 前收敛。没有其他确认的阻断项。

## RP-03 / P2：普通 add 的 stat-cache 跳过分支仍不在 blob 预测合同内

定位：design.md:111–115（尤其表格显式 text 行）、123；specs/stable-action-command-execution/spec.md:110；tasks.md:24、30。

设计承诺预测普通 git add 成功时的实际 blob，且将显式 text（包含 text eol=crlf）在任意受支持普通索引下统一映射为 CRLF→LF。但是普通 add 可以跳过 stat cache 未变的现存文件，此时它并没有进入所描述的文本转换函数。仅记录 mode/OID/EOL 和 raw/属性/配置，尚不足以保证会执行转换。

本轮在独立 Windows 临时仓库实际复现，Git 为 2.49.0.windows.1：

1. core.autocrlf=false、core.safecrlf=false，a.txt 内容为 same\\r\\n，属性为 -text。
2. 首次 add 前把 a.txt mtime 设为一分钟前，避免刚写文件的 racy-stat 情形；暂存 a.txt 和属性文件，得到正常 stage-0 i/crlf。
3. 文件内容及 stat 不变，仅把属性改为 text eol=crlf 并暂存属性。
4. 普通 git add -- a.txt 成功退出，但保留 CRLF 索引。
5. 只更新 a.txt 时间戳，raw 不变，再执行同一普通 add，才得到 LF 索引。

| 观察点 | OID / bytes |
| --- | --- |
| 原 CRLF blob | 02a8f61309286f7b5719a41b2a7039a9309daea3 |
| hash-object --path 给出的 LF blob | 1275430f1765c63e539cb0452565563bd6aef6a6 |
| 属性已改、stat 未变，普通 add 后 | 02a8f61309286f7b5719a41b2a7039a9309daea3 |
| 仅触碰时间戳再 add 后 | 1275430f1765c63e539cb0452565563bd6aef6a6 |
| 全程工作文件 raw hex | 73616d650d0a |

第一次普通 add 后为 i/crlf w/crlf attr/text eol=crlf；时间戳改变后的第二次为 i/lf w/crlf attr/text eol=crlf。两次 add 均 exit 0。两次调用前的 raw、有效属性、设置与 stage-0 mode/OID/EOL 相同，文件 stat 是否匹配改变了结果。实验目录为 C:/Users/xuser/AppData/Local/Temp/flowkit-proposal-review-cached-Q0eHqt；第二次操作已改变该 fixture 的 index，以本表和下方复现脚本重建初态。

这不是 safecrlf 拒绝、主动 filter 或错误退出，不能由设计中的“投影不保证命令成功”解释。按当前表格，Author 会保存 LF 预期，Review 可以用同一规则通过，而合法普通 staging 仍保留 CRLF；直到 stage 后才被 blob mismatch 拒绝。已有的提交前保护应保留，但它无法使更早保存的预期变正确。此前 10 个 Author 语义对照主要修改了 raw，未覆盖这一不变文件分支。

最小修订要求：

- 明确“执行 clean/EOL 转换所得内容”与“普通 add 的最终 index 内容”的区别，修订显式 text 的无条件表述。
- 对这种不能由当前绑定事实稳定预测的状态，在保存成功候选之前明确 unsupported，或给出足以证明普通 staging 结果且满足现有只读边界的有界规则；不要求引入通用 Git 模拟器或持久 stat 数据库。
- 在任务 4.1 / 5.1 补“raw 不变、旧 i/crlf、仅属性变化、非 racy stat cache 命中”及“相同 raw 但 stat 改变”的对照，贯穿候选形成与实际暂存读回。不得以自动 touch、renormalize、临时 add 试算、改配置或 stage 后重绑预期掩盖问题。

Git 官方 git-add 文档另将 --renormalize 定义为强制重新应用 clean 的特殊选项，适用于 text/core.autocrlf 改变后的重新处理；这里引用它解释普通 add 与强制重处理的区别，并非要求产品启用该选项：
[git-add --renormalize](https://git-scm.com/docs/git-add#Documentation/git-add.txt---renormalize)。

## 可复现的独立实验

下列 Node 脚本从任意目录执行；所有 Git 写入均在脚本新建的系统临时 fixture 内，无 commit。每个命令非零立即失败。不要将 root 改为业务仓库。

```js
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "archive-review-eol-"));
function git(...args) {
  const r = cp.spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (r.status !== 0) throw Error(JSON.stringify({ args, status: r.status, stderr: r.stderr }));
  return r.stdout.trim();
}
git("init", "-q");
git("config", "core.autocrlf", "false");
git("config", "core.safecrlf", "false");
const file = path.join(root, "a.txt");
const attrs = path.join(root, ".gitattributes");
fs.writeFileSync(file, "same\r\n");
fs.writeFileSync(attrs, "*.txt -text\n");
const old = new Date(Date.now() - 60000);
fs.utimesSync(file, old, old);
git("add", ".gitattributes", "a.txt");
fs.writeFileSync(attrs, "*.txt text eol=crlf\n");
git("add", ".gitattributes");
console.log({ root, projected: git("hash-object", "--path=a.txt", "--", "a.txt") });
git("add", "--", "a.txt");
console.log({ cached: git("rev-parse", ":a.txt"), eol: git("ls-files", "--eol", "--", "a.txt") });
const now = new Date();
fs.utimesSync(file, now, now);
git("add", "--", "a.txt");
console.log({ touched: git("rev-parse", ":a.txt"), raw: fs.readFileSync(file).toString("hex") });
```

## 当前步骤、最小性与范围

当前步骤仅判断修订规划是否可实施。Archive-only retry、共享来源解析与有界 Git 身份各自对应真实约束，未发现新增 Registry、通用恢复引擎、自动下一步或第二份完成数据库。RP-03 可用窄支持边界与对应回归收敛，无需扩大 Change。

LF/CRLF 是提交规划明确记录的 Owner 增补范围；本轮未将未读到原始聊天/附件等同于缺少授权。Delivery 消费者修订只处理 retry 的来源关联，不扩大到执行真实 Full Test/Final、消费项目升级或发布。terminal partial 的人工恢复仍是明确的未实现边界，不因此要求新增自动恢复器。

## 本轮验证与限制

- 受控 OpenSpec --version 返回 1.10.0。
- 实际执行 validate repair-archive-lifecycle --type change --strict --json --no-interactive，passed 1 / failed 0，valid=true、issues=[]。
- 读取完成选择器 support-delivery-final.ts、接纳器 delivery-required-evidence-source.ts、现有 candidate-git-bytes.ts 与 reviewed-checkpoint-candidate.ts，确认受影响旧假设已进入修订任务；未把尚未实施的源码行为作为新的实现缺陷。
- 新 finding 来自本轮真实临时 Git 实验。官方语义参考：[text 属性](https://git-scm.com/docs/gitattributes#_text)、[Git v2.49.0 convert.c](https://github.com/git/git/blob/v2.49.0/convert.c)。
- git diff --check 通过；它不检查当前未跟踪 Proposal 的所有文件，不能作为规划语义证明。
- 本轮未执行产品实现测试或平台验收，未修改 Author 规划、src、tests、canonical specs、旧报告、Runs、manager 或业务仓库 index/config。只新增本 Reviewer 文档。
- 本次到 review-propose 停止，不进入 revise/apply。该 verdict 不产生 Verification PASS 或 Git 权限。

## 审查输入身份

以下为相对本 Change 的路径与本轮实读 SHA-256。包含 14 份规划输入及两份前轮审查/修订交接；保留旧报告的 changes-requested 作为历史事实，本轮结论独立记录。

| 路径 | SHA-256 |
| --- | --- |
| `.openspec.yaml` | `ad734da2ba5f4c5a6979a8bbb6bad4db20fb21ec275ceca5f24842fbdfaf5bef` |
| `design.md` | `6037cc5af923b1500dd8aaf8ed50ce586cc4207fd6dd2127259db425ff2438e1` |
| `proposal.md` | `459dd720f06f1730f6b3884d7e61d9f37795119028265b4050446862b0510078` |
| `review-propose.md` | `f2fed40e0da81a3d123fbe55df0ffbf6b19b5da90c6a65188dbcb2b90b80c42e` |
| `revise-propose.md` | `657043b622464a31df518e9940cb5c00c12e06ec085698805c8ce1905aff6a06` |
| `specs/action-lifecycle/spec.md` | `484a22b80610760c5e2a32422e042f6718dcb4e1dab22bb66ff00ac3ba2dd9c8` |
| `specs/author-action-guidance/spec.md` | `9f7ddf143c229b5c8879d44de052a3cd7bddd410c6a21fff4857d49ec0649ad2` |
| `specs/delivery-finalization/spec.md` | `e22f48451c5a0d674ea7e63f6ae0e2b602a9c72fb2aa6ef6f36fb0cdcb7b88db` |
| `specs/policy-and-next-boundary/spec.md` | `9570d9ef466fa012d445c5963c31deaa29009a6cd983c81c2db58d961e405518` |
| `specs/repository-integration-and-next-base-continuity/spec.md` | `5fc535abf70fa18cbcfb2f50432a56bf3614420ade7e423094eecae44b66be61` |
| `specs/reviewer-action-guidance/spec.md` | `50b43705fd065c5968db1f6414a0cd5fccd60d58988115c25fabaf2241aceabe` |
| `specs/run-result-persistence/spec.md` | `7ee5d156d3de1504f689c1223811938810ddb095bfb61cc4d213f718a4de5749` |
| `specs/single-action-execution-terminal-boundary/spec.md` | `29eb5e0ac4c5bdbc428e2d64d975857b8c03f717fbd86d8a379b53d297e10c43` |
| `specs/stable-action-command-execution/spec.md` | `76fb151dbccc1699dab1e8727d5bf44eb864569305e1cf231928acc96aaac42c` |
| `specs/stable-delivery-support-command-execution/spec.md` | `099dfc5953c2c31f3a0e969312719f95e10142474d32c38687c960714c38a20f` |
| `tasks.md` | `ef75a1d191108b4376d5c8cdee980ad07cd8afc7135fe1599a1ed4eab3830246` |
