# 051 Revise Apply 交接

R050-01 已作最小实现修正，待独立 review-apply；不是 Reviewer approved。

## 修正

- 仅修改 src/domain/delivery-final-execution.ts 与 tests/unit/domain/delivery-final-confirmation.test.ts。
- 既有 revalidateRelated 使用同一 target 与 flowkitHome 重读 active OpenSpec set；非空或进程/观察失败返回 false。复用内容写后与确认 staging 后的两个调用点，不改变 writer/reader/Integration、两笔提交点或 schema。
- 第一笔已写时保留 null confirmationRef；既有 content-validation-failed / confirmation-publication-failed 与 written-unconfirmed 准确区分失败阶段。无自动回滚/补确认/新 Action。
- 六个新增场景：调用前活动工作、内容写后活动工作、确认 staging 时活动工作、两阶段观察失败、确认发布后活动工作。新进程 reader/Integration 核对失败不取得成功，Git callbacks=0；确认提交后不再业务重验。

## 真实验证

- regression-before：四个新增确认前场景实际错误 completed；4 subtests 失败，含父节点计 5 fail。原始流保留，不作为 PASS。
- 同一测试修正后 15/15；Windows/Linux domain 各 309/309、acceptance 各 6/6、entropy tests 各 7/7；两平台各 9 个适用工程检查均 exit 0。
- OpenSpec 1.10.0 strict PASS；650 行 gate 未放宽，累计生产文件最大 587 行。
- Linux network none，独立 offline/frozen pnpm 安装，以非 root node 用户执行；linux-source.json 与当前代码逐项核对。
- Windows 是本机 Node/文件/Git 测试；既有 windows-compatibility-simulation 仍只声称 simulation。定向 fixture 使用合成 accepted-source 与观察真实目录的合成 OpenSpec 进程，不伪称独立 Review 或实际 D05 lifecycle。
- 工程命令直接执行，没有调用实际 D05 Full Test coordinator，没有修改 real fullTestAttempt。

## 连续性与 Owner 边界

保留 049 全部累计实现（本轮替换上述两文件引用）、049 的两个删除路径与 047/048/050 exact handoff。规划/tasks/HOW/AGENTS/真实 manifest 本轮未改，历史 Runs/proof 不改。详见 result 的 cumulativeArtifacts、ancestorApply、reviewedFindingsSource、removedPaths。

Owner 决定沿用 050 result#ownerDecisionsRelevant：D05 independent-bootstrap；必要证据保留本 target artifacts，.tmp 只放可丢弃内容。历史实验/审查和旧 PASS 不替代当前实现验收。

revise-apply / implementation-convergence / debugging-and-error-recovery 限定了本轮的先复现、最小修正、当前回归；incremental-implementation 的 Git 步骤被仓库权限边界排除。没有新平台/依赖、范围扩张或计划修订。

下一边界：独立 review-apply。未执行 Review、Archive、Git 或实际 D05 Full Test；STOP。
