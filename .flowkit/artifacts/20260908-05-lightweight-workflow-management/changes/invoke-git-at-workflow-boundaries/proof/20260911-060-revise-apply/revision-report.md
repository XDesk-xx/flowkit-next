# 060 Revise Apply 交接

承接 059-review-apply 的三项 finding；批准 Proposal 无缺陷，本轮仅修实现及回归，不修改计划、Skill、manifest、主 specs 或历史材料。

## 修正范围

| Finding | 根因与最小修正 | 当前回归 |
| --- | --- | --- |
| D05-RA038-001 | Git push 继承 push.followTags，导致 exact branch ref 之外的 annotated tag 被发布。增加单次命令 --no-follow-tags；不修改持久配置、不删除远端 tag。 | 原生本地 bare remote 只出现 refs/heads/main，原 config bytes 保持。 |
| D05-RA038-002 | index 无冲突不代表不存在待完成 merge；git commit 会消耗 MERGE_HEAD。普通宿主在 add 前和每次 commit 前重验 Git 自身目录中的 merge/cherry-pick/revert/rebase/sequencer 状态。 | 真实无冲突 pending merge 返回 preflight/incomplete/effect=none，HEAD/index/MERGE_HEAD 不变；其他待续标记、stage 后出现 MERGE_HEAD 均覆盖。reuse 分支不执行此提交检查。 |
| D05-RA038-003 | 已核验 checkpoint 只随 mutation/provider 状态保存，reuse 在 provider 前拒绝时丢失。对象实读通过立即保留 checkpoint，与 writeAttempted 分开；失败沿既有 gitEffects 映射返回。 | 第三次 source 读取失败仍是 incomplete/acceptance，保留 exact SHA，effect=none，provider 未调用，HEAD 不变。 |

仅五个原有 source 文件与一个新增 regression test。继续复用现有 Git helper、failure/readback 与宿主 outcome，不新增状态机、Registry、依赖、统一 clean/固定 parent-count gate。外部明确授权 callback 的提交形状合同未改变。

## 验证与证据

before/ 保留同一组三个测试在修正前的 3 FAIL；after/ 为修正后 3 PASS。补充待续状态与暂存后漂移回归后，当前双平台 domain 为 324 项，acceptance 7 项，entropy 7 项。各平台 format/lint（既有 quality:gate 两个组成检查）、typecheck/build、dependency-health、entropy 全部检查的实际退出状态由 finish-revise.mjs 再次核对，见 verification-audit.json。

本轮新 pack/build 的 manager 完成分根 first/Change checkpoint、独立 bare push、reuse、人工 pending 示例，报告 packed-example.json。示例承接本次 Owner revise apply 的有界测试工作权限；其中 evaluator/Final/来源合同的合成 fixture 均保留标记，不冒充实际 D05 Git 授权、独立 Review、Formal Full Test 或公网 PR 接受。

Linux 使用已有离线 x64 镜像、独立依赖、非 root 测试，/evidence 映射本项目当前 proofRoot，不是项目外长期保留。必要原始流与报告留 artifacts，临时安装/仓库可丢弃。不覆盖 058/059 的 PASS、FAIL 或 verdict；旧测试 PASS 不代替本轮实现验收。

## 连续性交接与 STOP

保留 058 累计 payload、059 审查、当前完整未提交 worktree；060 payload 给出五个 source 修正与新增测试的 exact bytes，无删除/重命名。Owner 决定与保留边界沿用 054 context.json#ownerDecisionsRelevant。D05 仍 independent-bootstrap，candidate 未接管当前 Delivery。

Author 修正完成后仅交独立 review-apply。此报告不是 Reviewer approved。未 archive，未在当前仓库 add/commit/push，也不执行实际 D05 Full Test。
