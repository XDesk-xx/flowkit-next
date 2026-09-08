# Apply 实现与退役对照

Change：remove-archify-from-delivery-workflow；D05；projectOrdinal 33。
依据：004 独立 review-propose approved；本次 Owner 单次 apply 授权。Proposal/design/delta specs 不改语义。

## 实现边界

- Final input/facts/record、requiredEvidence/source 和 deterministic projection 同步去除架构字段；current candidate 直接等于真实 Full Test record.candidateRef。
- requiredEvidence 仍按 projectId、deliveryId、changeClosures、fullTest 投影；readChangeClosure/readFullTest 和完整 outcome/source/admission 校验保留。
- Integration 本身的 projection、checkpointOperation、Owner/Git/accepted-object 校验不变；现有共享消费者直接消费新 Final。
- Start 仅保留 manifest 固定输出；三个 checks 顺序不变。acceptedBaseCommit、clean、checkpoint authority 未放宽。
- Operation 仅 Start、Full Test、Final、Repository Integration；managed tool 仅 OpenSpec 1.10.0。旧 literal/额外字段拒绝，无兼容成功 stub。
- 本次只删除仓库跟踪的专属模块/资产。用户外部 runtime/独立 Skill 不在任何修改目标内；删去的跟踪文件可由 Git 历史恢复。
- 不修改 Full Test candidate v2 排除算法、不新增存储政策/Registry/Runtime/Policy/Run schema。其他五个 Changes 保持 planned。

## 专属测试退役对照

下列原测试均位于已退役 delivery-architecture-finalization-execution.test.ts；历史版本仍由 Git 保存。

| 原测试关注点 | 本次归属 |
| --- | --- |
| third closed variant / null authority | 退役 variant；delivery-operation-execution 测试四项集合和旧 literal 拒绝 |
| closure serialization golden vector | 架构专属 ref 退役；Final projection 新 golden vector、重排、值改变和旧形状拒绝继续测试 |
| stale/failed Full Test preparation | 共享保护保留于 delivery-final-execution、delivery-without-archify 与 full-test 测试 |
| six fixed slots / preserved Data Flow | 六槽专属输出退役，不移植到活动流程 |
| callback retained correction/terminal lineage | Final defensive callback 与 correction/invalid result 不写 coordination 测试保留 |
| thin compare canonical fields | compare 专属校验退役 |
| Architecture ref reorder/value binding | 专属 ref 退役；活动 Final/Integration deterministic projection 测试保留 |
| caller-selected output paths | 架构专属 paths 退役；Final 固定 coordination artifact/精确字段拒绝仍测试 |
| invalid staged derived output | derived stage 退役；Final staging/replace/readback 失败不成功测试保留 |
| correction-required no writes | Final correction/invalid result 不关闭 coordination 测试保留 |
| hidden repository mutation callback | Final candidate/coordination drift 与 defensive callback 测试保留 |
| preserve-existing baseline / missing system views | 架构专属预态退役 |
| Architecture Guidance generic/bounded | 专属 Guidance 退役；活动 Guidance content binding 与 .agents 禁止 fallback 测试保留 |

其他夹具只移除架构构造、reader 和字段，未取消 required Run 缺失/错来源、Git authority/prestate、accepted-object 内容或 checkpoint 负向校验。

## 测试事实与限制

- 新增无 Archify 跨边界测试：真实 Node check、Start/Final invocation、本地隔离 fixture Git；OpenSpec observation 和远端接纳为明确模拟。预先已接受的 Change closure 为 admission fixture，不声称真实执行整条 OpenSpec Change。
- 真实 failed check 使用 exit 7；incomplete checks 为故障注入。均不作为通过证据。
- 原始历史测试仅读取冻结旧类型 bytes，不转换、不补图、不签发历史 PASS；新入口拒绝旧形状。
- focused-01：沙箱 EPERM，未运行测试；focused-02：50/51，旧 golden vector 未更新。projection-01 已验证新投影。
- windows-regression-01：命令转义错误，即使进程 exit 0 也不作为 PASS。
- windows-regression-02 / continuity-01：单一 manifest 后旧 reverse/sparse index fixture 假设不成立。修正测试的实际变更输入，不改产品拒绝逻辑，后续重测记录为准。
- 历史 Explore 59/59 不代表当前实现通过；当前结果只认本次真实日志和最终 summary。
- Linux 必须使用独立依赖、exact-lock 检查、非 root 测试和断网验证；不以 Windows 测试替代。所有检查均属 Apply verification，不是 Owner 已授权的 Formal Full Test invocation。

## Review handoff

使用当前未提交工作树及可检索的 HEAD 祖先进行独立 review-apply。既有 D05 manifest/001–004 Runs/规划与 Explore proof 是本轮之前的工作，不归为本轮代码修改。

按 approved design，在后续 archive/spec-sync 时同步 architecture-and-canonical-diagram-continuity 与 managed-toolchain-resolution 的 Purpose。此处不提前修改 canonical specs 或执行 archive。

必要 evidence 在本项目 .flowkit/artifacts 内；一次性 Linux 工作树/依赖仅为测试临时环境，不作为长期证据根。Run 只保留 action.md/context.json/result.json，结果与 reviewer verdict 分离。完成后 STOP，不自动 review、Git 或 archive。
