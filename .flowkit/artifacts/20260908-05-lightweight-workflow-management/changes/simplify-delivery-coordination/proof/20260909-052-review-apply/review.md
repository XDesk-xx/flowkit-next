# 052 review-apply — simplify-delivery-coordination

结论：approved。独立审查 051-revise-apply，R050-01 已闭合，无新增 finding；047/048 批准合同及 049 未受影响内容保持。050 的历史 changes-requested 原样保留，本轮是其后续修正审查，不覆盖旧结论。

## 决定性核验

R050-01：src/domain/delivery-final-execution.ts:373 的 revalidateRelated 现在通过同一 target/flowkitHome 读取 active OpenSpec set，非空或 observation 失败返回 false。既有 writer 在内容精确读回后与确认临时文件 staging/flush 后调用该复验（src/internal/delivery-final-coordination.ts:474、:500），未新增提交点或事后业务验收。

复用 050 独立探针的方法，在本轮新 fixture/证据目录重跑，保留旧证据不覆盖。四个实际结果：

| 场景 | 当前结果 | 持久读取 |
| --- | --- | --- |
| 正常 | terminal，两次替换 | completed |
| 调用前已有活动 Change | failed，零次替换 | not-completed |
| 内容写后新增活动 Change | content-validation-failed，仅第一笔替换 | unconfirmed，record=null |
| 确认 staging 时新增活动 Change | confirmation-publication-failed，仅第一笔替换 | unconfirmed，record=null |

两个原反例现在均保留 null confirmationRef、返回 written-unconfirmed；未把未完成内容升级为成功。完整观察、manifest 样本和真实原始流见 active-set-probe-01/，方法见 probe-active-set.mjs。

本轮独立 domain 回归 309/309，包含 14 个确认场景及父测试（15/15）：既有八个故障/正常场景保留，新增调用前活动、两阶段活动、两阶段 observation 失败及确认发布后活动。测试使用全新进程核对 reader/Integration；确认前失败不能 prepare，Git callbacks=0；确认发布后的变化不倒推否定已提交事实。没有引入持续监控或任意多 writer 强事务保证。

## 精确范围与来源

- 051 仅修改声明的两个文件：delivery-final-execution.ts、delivery-final-confirmation.test.ts。将本次新增输入类型收窄及 active observation 代码从当前文本作内存反向比较后，raw bytes hash 精确等于 049 原实现；没有隐藏生产重构。
- 其余 32 项累计实现材料与 049 exact references 一致；六份规划与 049 完全一致，047 批准合同除原有任务勾选外不变。19 项任务仍已完成。
- 原有两个已退役 fixture 删除路径不变；没有新删除。真实 manifest 与前序受控引用一致；本轮不修改其状态。
- 当前 051 共 126 个相关材料/交接引用完成可读性、长度及摘要核对；Linux 168 个验收输入与当前 bytes 一致。保留并区分 Author regression-before 的真实 4 个子场景失败（含父节点共 5 fail）及修正后 PASS。
- 宿主 accepted-source、Owner fixture 和按真实目录输出的 OpenSpec 进程明确是隔离测试输入，不伪称真实独立 Review 或实际 D05 lifecycle。

## 当前验证

Reviewer 独立运行：exact OpenSpec 1.10.0 确认、原缺口四场景探针、domain 309/309、typecheck、OpenSpec strict，五项命令均 exit 0，原始 stdout/stderr 与命令元数据在 attempt-01/。基于已知沙箱子进程限制，获准直接在沙箱外执行，没有覆盖或伪造失败尝试。

Author 当前 Windows/Linux 各 domain 309/309、acceptance 6/6、entropy tests 7/7 及其余适用工程检查的原始结果与来源已核对。Linux 采用固定镜像、network none、独立 offline/frozen pnpm 安装、非 root 测试。Reviewer 本轮没有重复全部平台/安装验收；这些明确标为 Author 当前验证证据，不改称独立重跑。

本轮没有运行实际 D05 Full Test coordinator，常规回归 PASS 不等于 Formal Full Test 或 Delivery 完成。只读 strict 证明结构，不单独承担语义批准。

## 必要评估

当前步骤：按 independent-bootstrap 的 review-apply skill，独立确认 R050-01 修正、批准合同保持和当前实现回归。

复杂度/最小性：复用现有函数与两个有限检查点，没有新增服务、持久字段、工作流或第二证据系统；修正没有把校验搬回历史链或 Git。

new-content / scope drift：NONE。Start 内容边界、Final 最小完成来源/当前 Full Test、两笔确认、Integration 独立 Git 权限均保持；本轮只是补齐确认前必要事实。

## 当前方案与下一边界

Start 只建立并核对本项目的规划/manifest，不以 Git SHA 或全仓 clean 为准入。Final 只消费 required Change 的可信 archive/直接 approved review 和当前有效 Full Test；先写未确认内容，必要复验通过再发布局部确认。确认引用不是 Git commit hash，也不表示未来代码永久有效。Integration 消费已确认结果，独立核对 Owner Git 授权及实际对象，不重复历史/整仓验收。

此 Change 的后续边界为 archive，实际调用按既有 Owner/host 边界；本轮不自动执行。D05 尚有 planned 的 invoke-git-at-workflow-boundaries，以及后续正式交付闭合，不宣称整个 Delivery 已完成。

Owner 决定来源沿用 051 context.json#ownerDecisionsRelevant：D05 independent-bootstrap；必要材料默认保留 target artifacts，.tmp 可丢弃；历史不改写。Reviewer 仅新增 052 三文件 Run 与自有 proof，未修改 Author artifacts、历史、真实 manifest 或仓库 Git。
