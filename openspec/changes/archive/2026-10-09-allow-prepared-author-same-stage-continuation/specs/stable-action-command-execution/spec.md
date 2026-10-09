## MODIFIED Requirements

### Requirement: Prepared Owner correction uses the same bounded command path

当 Policy 允许 Owner 对 active Change 的 exact 完整 prepared Author Run 作 revise correction 时，受信 Agent 宿主 SHALL 从明确覆盖当前续跑的真实 Owner 指令形成并提交现有 OwnerAuthorityFact，可用真实 conversation sourceRef。已存在且覆盖该续跑的授权可作为来源，SHALL NOT 要求每轮重复询问；仅因父 Run 保存 authority SHALL NOT 推定本轮获授权。命令 SHALL NOT 自行生成权限，也不要求新增 Delivery manifest 授权记录。

start SHALL 核对 fact 的结构、decision=revise-action、Delivery/Change、单元素 revise scope、原 prepared 三文件和四槽 null、合法 correction edge、既有 machine readiness 与唯一 successor。该入口 SHALL 包括三个同 identity revise 的新 occurrence，使用既有编号分配、指向 exact current tip 的 previousRunId，并在写前重新核对 current 未变化；不得接受 caller 自选 parent 或内部 READY token。exact fact/sourceRef SHALL 绑定新 package、action.md 和随后 context.json。

finish 与 inspect SHALL 从开始记录恢复同一 fact，并重建相同 parent/Policy/结构/package/Guidance binding，不依赖临时宿主或对话可重读，也不得在 finish 替换 authority。前序 Run、Proof 与原始 bytes SHALL 保留，不能被 terminalize、覆盖或伪装 PASS。每个新 occurrence SHALL 可如实 finish 为完整 prepared/null，后续另一合法 invocation 可创建下一同名 occurrence；真实 terminal PASS SHALL 继续满足现有 Author artifact/candidate/proof/check admission 并要求其自己的独立 Review。每次 invocation SHALL 只处理一个 Action并 STOP，不自动下一轮或 Review。

已完整记录的 finish SHALL 继续仅允许既有相同结果的幂等读回；改变结果、state 或 authority SHALL 拒绝。普通 prepared reuse 的 READY SHALL NOT 授权新 start；普通 Author 的同名重复 start、prepared Reviewer、Archive、forward skip 或不完整前序 SHALL NOT 通过此入口。

#### Scenario: Authorized prepared correction
- **WHEN** exact prepared Author Run、Owner 来源及 revise target 均满足 correction 合同
- **THEN** 新 start SHALL 形成指向该 Run 的唯一 successor 开始记录，而旧 Run 保持原样；新三文件完成保存并读回后才报告新的完整 current tip

#### Scenario: Unsupported correction
- **WHEN** Owner 来源缺失、Role/Action 不匹配或前序既非合法 prepared Author、也非已有合同支持的合法 terminal correction
- **THEN** 命令 SHALL 在新 occurrence 创建前拒绝，不把一般 Review/FAIL 当成 Owner 授权

#### Scenario: Conversation-sourced Owner instruction survives process exit
- **WHEN** 受信宿主依据明确 Owner 输入提交 exact fact，其 sourceRef 指向 conversation，且 prepared correction 已成功开始
- **THEN** 独立 finish/inspect 进程 SHALL 从 action.md 中绑定的 package/context 核对同一 fact 与 Policy，不要求聊天复制到 target 或新 Owner registry，也不得让 finish 替换该 fact

#### Scenario: Continue multiple prepared revise rounds through fixed commands
- **WHEN** 某个 revise 阶段的完整 prepared R1 经授权 start R2，真实工作后 finish R2 为 prepared/null，再依据覆盖当前续跑的 Owner 授权 start R3
- **THEN** 每轮 start、独立 inspect、finish、status/next 和历史读回 SHALL 使用同一合法 edge；R1/R2 原件不变，R3 的真实 PASS 后续 SHALL 只交接到其自身的独立 Review

#### Scenario: Reject current drift and duplicate finish mutation
- **WHEN** 写前 exact parent/tip 已变化，出现竞争/不完整 occurrence，或对完整旧 Run 提交不同结果
- **THEN** 命令 SHALL 拒绝并保留已存在 bytes；已写 partial SHALL 保留并报告 incomplete，不清理、接管或补造成功

## ADDED Requirements

### Requirement: Prepared continuation preserves existing descriptor Guidance compatibility

发布本次 prepared 同名 revise 续跑能力的 manager SHALL 保持现有产品 Action Guidance bytes 及身份不变，避免仅因该修复造成此前合法完整 prepared Author descriptor 的 package/Guidance drift。原记录 SHALL 可通过匹配 target 的只读 status/next/inspect 核对；补充解释 SHALL 不改写历史 descriptor/Result 或绕过 Guidance/hash 校验。此兼容不允许消费本来已漂移、partial 或非法的记录，也不扩大 inspect 为任意历史 Run 续跑接口。

#### Scenario: Inspect a complete prepared descriptor after the repair
- **WHEN** 原 manager 建立的完整 prepared Author Run 及其必要绑定原本有效，修复后的 manager 读取同一原件
- **THEN** 只读查询与当前 tip inspect SHALL 仍确认原 prepared 事实和 Guidance identity，原 Run/Proof 字节不变；新的续跑权限仍需本 capability 的 exact Owner correction 合同
