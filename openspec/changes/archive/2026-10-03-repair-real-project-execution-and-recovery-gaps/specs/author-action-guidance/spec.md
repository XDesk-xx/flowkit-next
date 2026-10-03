## ADDED Requirements

### Requirement: Author HOW separates candidate bytes correction from metadata completion and observed recovery

发行Author HOW SHALL 在形成apply/revise-apply PASS候选身份前检查raw/Git-filtered bytes，使用新fixed binding/Archive依赖和诊断合同，并在遇partial时先调用只读action inspect核对实际效果。纯缺字段且有原证据的terminal元数据补齐 SHALL 走Owner明确授权action correct；没有原candidate proof、候选内容变化或下游冲突 SHALL 请求既有合法Owner revise与独立review，不改原Run。Archive环境-only修正保持原candidate，但不得跳过当次适用检查。HOW SHALL 使用同安装固定命令，不提供临时内部callback、自造PASS、自动retry/next或Git授权。

#### Scenario: Author corrects source formatting before declaring candidate identity
- **WHEN** raw/filter检查指出本次source bytes不一致
- **THEN** Author SHALL 按项目文本规则重新形成真实candidate，并以该新身份进入独立review，不追改历史hash

#### Scenario: Archive continuation starts with actual effect observation
- **WHEN** 已开始archive遇unknown/incomplete
- **THEN** Author SHALL 先核对inspect及所需原始材料，再明确进入同Run合法剩余步骤或STOP，不创建替代Run掩盖历史
