## ADDED Requirements

### Requirement: Result facts share bounded bytes depth and node admission

Run Result facts SHALL 保持 JSON-compatible、UTF-8 JSON.stringify bytes 至多 65,536、depth 至多 16，并将节点预算限定为 4,096。节点 SHALL 计根、对象/数组容器和所有值，不计 object key；根 depth SHALL 为 0。共享有界 DFS SHALL 先检查 depth，再递增检查 nodes，首次超限即停止，完整兼容遍历后才量 bytes；多个超限 SHALL 按该固定顺序报告首个维度，提前停止计数 SHALL 标为 lower-bound，完整计数 SHALL 标为 exact。已发现的 schema/非 JSON-compatible 错误 SHALL 不被 budget 错误遮蔽；提前容量拒绝 SHALL 不要求遍历未访问部分，也不声明整个 facts schema 合法。

生产 writer/admission、readback、Review/Archive/correction 的相关消费者 SHALL 使用同一预算和原完整性规则。Action markdown、proof、Archive diagnostics bytes SHALL 保持；既有 Run SHALL 不改写/重签，不外置或删减 candidateGit 身份以满足预算。节点增加 SHALL 不承诺任意 64 KiB facts 均可接纳。

#### Scenario: Accept valid candidate metadata above the previous node limit

- **WHEN** otherwise-valid facts 为 1,856/1,967 nodes 且在 bytes/depth 预算内
- **THEN** writer/readers SHALL 接受并继续 schema、角色和完整性核对

#### Scenario: Enforce the exact node boundary

- **WHEN** otherwise-valid facts 分别有 4,096 和 4,097 nodes
- **THEN** 共享 validator SHALL 分别接受和拒绝，后者报告 nodes limit=4,096 与诚实测量

#### Scenario: Preserve bytes and depth boundaries

- **WHEN** otherwise-valid facts 在 depth 16/17 或 JSON UTF-8 bytes 65,536/65,537 两侧
- **THEN** 共享 validator SHALL 分别接受和拒绝，不随节点增加放宽其他额度

#### Scenario: Report a deterministic first exceeded dimension

- **WHEN** facts 同时超多项预算
- **THEN** validator SHALL 按 depth-first traversal 的 depth/nodes、完整遍历后 bytes 顺序报告，不生成无界计数或 payload 诊断

#### Scenario: Keep historical results unchanged

- **WHEN** 新 validator 读取既有完整 Run 或拒绝超限新 Result
- **THEN** 系统 SHALL 不回填旧文件、不重签、不将拒绝变成保存成功

### Requirement: Owner-corrected terminal Author failure remains immutable in one successor chain

已核准 active 普通 Author FAIL/null correction 在原机器 readiness 通过且真实新 occurrence 开始/执行后，SHALL 按既有保存边界记录 successor；previousRunId SHALL 为 exact 当前失败 Run，序号 SHALL 复用现有唯一 occupancy 规则，Owner fact SHALL 绑定新 descriptor/preparedContext。三个同名 revise SHALL 具有新 Run identity，不复用失败 Run。旧三文件 SHALL byte-immutable；竞争 successor、错 parent/linkage/authority SHALL fail closed。新 PASS SHALL 要求其自己的独立 Review，不继承前序 approval。没有 Owner correction SHALL 保持停止；bootstrap/history SHALL NOT 转成 canonical current，machine partial SHALL 不伪造完整结果。

#### Scenario: Persist a same-revise failure successor

- **WHEN** exact terminal revise FAIL/null 有合法同名 Owner correction 且新 occurrence 实际执行
- **THEN** 新 Run SHALL 直接接失败 parent，唯一链 SHALL 可读回，旧失败 bytes SHALL 不变

#### Scenario: Reject competing or stale successors

- **WHEN** 另一 successor 已占用，或指定 parent 不是 exact 当前 terminal failed Run
- **THEN** 系统 SHALL 拒绝，不覆盖旧目录或猜测当前链

#### Scenario: Keep a new successful correction subject to review

- **WHEN** 新的真实 revise Author PASS 已接纳
- **THEN** next SHALL 为该阶段 Review；旧 Review verdict SHALL 不作为新 approval

#### Scenario: Allow old complete failure only through new authority

- **WHEN** 原完整普通 Author FAIL 仍为 active exact current，Owner 新授权合法 revise 且原机器 readiness 通过
- **THEN** 系统 SHALL 可创建新 occurrence，但 SHALL 不重写旧失败或补造历史 authority
