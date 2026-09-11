# 058 Apply 实现与交接

承接 057-review-propose approved，完成 invoke-git-at-workflow-boundaries 的 17 项任务。Author 结论是实现已完成，交接独立 review-apply；不是自审 approved，不是实际 D05 Formal Full Test、Archive 或 Git 权限。

## 实现与任务追溯

| 任务 | 当前实现/真实验证 |
| --- | --- |
| 1.1–1.2 | operation closed union、canonical clone/equality、source 和 record/ref 同步。checkpoint-operation 与 integration-projection 验证旧输入拒绝、完整操作匹配、固定 golden vector、属性顺序、路径/消息/形状绑定及 parents 顺序；golden hash 另用 PowerShell SHA256 按规范投影独立核算。 |
| 1.3 | Integration 去除默认 clean/parent/count，保留可空指定 shape、真实对象、target/source/Final confirmation；现有 fixtures 显式声明其单提交形状。null shape 的有界两提交和无关 dirty、无新对象、复用均覆盖。 |
| 2.1–2.3 | git-checkpoint-scope 复用原生 Git，Buffer/NUL 读取 index 差异，以 no-renames 同时覆盖 rename 两端；普通 unborn 可用。git-checkpoint-execution 在 add/commit 前重验权限、HEAD/branch、scope/index/worktree。新对象逐 commit 范围核对。原生中文空格、删除、范围外 staged、stage 后 drift、中间越界和真实 merge conflict 均验证，不自动 unstage。 |
| 2.4 | Integration failure 读回拆为独立文件；普通 host 返回固定非持久 outcome。真实 commit 后抛错/无法读回、stage 已有效果、publication 拒绝/远端不符、无 provider/PR pending 均如实 incomplete/failed，无自动重试或回滚。 |
| 3.1–3.4 | git-host.mjs 显式导出三个函数，引用本安装 dist。普通节点 reader 对照实际来源/target/node/operation，Change 节点复用 evaluator；Integration 继续 singleton/source/confirmed Final。实际本地 bare push 读取 remote exact ref，不以命令成功或 local ref 冒充接受。 |
| 4.1–4.2 | Integration HOW + host-call reference；Start/Final/archive 和 AGENTS 仅必要 Git 引用。Skill frontmatter validator 四项通过（Windows Python 使用 -X utf8）。真实 npm pack、解包搬移安装、target 无 Flowkit scripts/Skills、同名 target 文件不接管均验证。 |
| 4.3 | 原 Integration 文件到 621 行时拆出 failure/readback；最终 573 行。全部适用 src/tests 127 文件 <=650，最大 619 行。format/lint（quality:gate 两个组成检查）、typecheck/build、dependency-health、entropy 均通过。无依赖或 gate 配置变化。 |
| 5.1–5.3 | packed-example.json 记录本次 Owner Apply 测试工作授权交接、真实宿主 first/Change checkpoint、独立 push/复用和 pending；双平台回归、OpenSpec strict、4 MODIFIED + 3 ADDED 场景继承检查完成。 |

## 验证结果

- Windows native Git：9 类检查全部退出 0；domain 320、acceptance 7、entropy 7。
- Linux x64：相同当前 181 个源码输入文件核对一致，离线独立依赖、非 root 回归；9 类检查退出 0，domain 320、acceptance 7、entropy 7。
- verification-audit.json 核对 raw stream hash/实际退出状态、当前源码 bytes、行数和 delta 场景覆盖。
- packed-example.json / supplemental-checks.json / conflict-check 原始输出：当前 build 的真实 Git，不使用 Explore PASS 替代实现验收。
- 首次 Linux 启动因 daemon 未运行失败，原始日志保留；启动本机已有 Docker Desktop 后同源码重试通过。初期 sandbox spawn EPERM 与旧 projection/gitEffects 断言差异已分别定位并修正；不跳过测试。

## 边界与材料

无新依赖、Registry、CLI 写命令、Git Run、Runtime/Policy/Run schema、自动 provider/恢复平台。既有 OpenSpec、Full Test、Archify 和 independent-bootstrap authority 不变；未修改 .agents Skills、主 specs、历史 Run/archive 或 .gitattributes。未在当前仓库 add/commit/push。

packed 示例的真实 Owner 来源是本次“根据最新run，apply”及已批准任务 5.1，对应 Author 执行的可丢弃 Git 测试工作；不是 Owner 对实际 D05 仓库 checkpoint 的授权。示例中的 Policy/OwnerAuthorityFact/Final/source 明确是合成 fixture，不冒充独立 Review、真实 Final 或公网 PR 接受。所实现宿主只支持明确单一同读写 remote 的普通非强制 push；其他 provider/多 URL 场景按设计人工交接，不声称已原生完成。

必要报告、脚本、原始 stdout/stderr 留当前 target proofRoot；测试仓库、临时安装和 tarball 留 .tmp，可丢弃。Linux /evidence 是本目录的 bind mount，命令 metadata 的 ../../evidence 是容器路径，不是项目外保留。后续只读取与判断相关的材料。

累计交接保留 HEAD a0edb690d7208a3b81855e30a31dbc175f060a93 上的当前完整 worktree，以及 054–057 未提交祖先 Run/计划/manifest；本轮无删除/重命名仓库文件。payload.json 给出本次实际源码/HOW/任务 bytes。Owner 材料授权与保留边界沿用 054 context.json#ownerDecisionsRelevant。完成后 STOP 于独立 review-apply，不自动 Archive/Git。
