## ADDED Requirements

### Requirement: Architecture 使用共享 v2 材料并保持阶段来源

Architecture Finalization SHALL 使用共享 v2 候选合同验证 passed Full Test 输入，并在六个 fixed slots 成功 validation/materialization/exact readback 后推导新的 post-materialization candidate。系统 SHALL 保持 `verified → architecture-materialized` 的原始 Full Test execution、output identities 和既有 closure projection，不要求两阶段 candidate 相等，也不得接纳无关产品变化。Memo/Run 产品隔离 SHALL NOT 豁免该 operation 消费的必要证据来源及完整性。

#### Scenario: 合法派生输出改变候选

- **WHEN** 六槽输出合法变化、原始 v2 Full Test 来源仍有效，且没有无关产品修改
- **THEN** closure SHALL 绑定前后各自真实候选及六槽输出，不伪称候选未变

#### Scenario: 产品相同但验证来源丢失

- **WHEN** 产品 projection 相同，但所依赖 Full Test 完整 outcome 无法取得、来源未知或完整性不匹配
- **THEN** Architecture Finalization SHALL 拒绝，不从 candidate 相等或独立 hash 恢复 PASS

#### Scenario: 部分写入不形成成功

- **WHEN** 六槽中仅部分输出写成或 readback 失败
- **THEN** 系统 SHALL 不返回成功 closure，不自动重试/回滚；既有实际效果 SHALL 与失败结果分开保存供有权限的后续核对
