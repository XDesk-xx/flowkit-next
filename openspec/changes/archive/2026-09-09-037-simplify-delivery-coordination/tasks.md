## 1. Start 内容边界

- [x] 1.1 收敛 Start input/facts/contentCompletion，删除 acceptedBaseCommit/candidateRef/validation 快照/内嵌 commit callback 及直接导出；以 closed-shape 和旧字段拒绝测试验证。
- [x] 1.2 实现 target 规划/manifest 真实读取、已有内容复用和有界写入保护；以错项目、缺规划、同名覆盖、路径重定向、目标漂移测试验证不覆盖非目标 bytes。
- [x] 1.3 用实际已初始化无首 commit 的 Git fixture、无关 dirty fixture 验证 Start terminal，确认不要求 SHA/clean、无 Git mutation。

## 2. 相关完成来源

- [x] 2.1 将既有 host-owned completion 来源收敛为唯一 archive/直接 review-apply 地址和 admission 来源；以受控存储读回、两个 required Change 覆盖、来源缺失诊断验证，不新增 Registry/Run schema。
- [x] 2.2 保留相关三文件、身份/Role/terminal/verdict/linkage/bytes 校验，移除 Final 全链 admission 重放；以错项目、伪来源、缺文件、歧义终点和 reader 访问记录测试验证。
- [x] 2.3 实现仅内存 changeCompletions 与执行前后重验；以相关记录漂移拒绝、无关祖先/proof 不读取和 manifest 不复制快照测试验证。

## 3. Final 窄写与读回

- [x] 3.1 更新 Final package，复用当前 Full Test reader 和空 active OpenSpec 判断；以 required 未完成、当前 FAIL/partial/输入漂移/材料损坏拒绝及有效输入成功测试验证。
- [x] 3.2 复用 source-range writer：第一笔写 completed/null confirmationRef，全部必要写后复验通过才第二笔发布确认，确认替换为成功提交点；以两笔非目标 bytes/注释/顺序保留和冲突/确认发布前输入漂移负例验证。
- [x] 3.3 实现最小 Final record、局部 ref 与确认感知的只读 reader；以 golden vectors、属性重排/值变化、确认 null/缺失/mismatch、旧记录拒绝、正常成功全新进程读回及非产品追加测试验证，不从 hash 自动补确认。
- [x] 3.4 为 Start/Final 返回 not-written/written-unconfirmed/unknown 并区分内容验收失败与确认响应未知；故障注入覆盖第一笔 rename 后读回失败/输入漂移、确认替换前中断、确认发布失败、确认已发布但响应丢失，以新进程分别验证 unconfirmed/已确认提交，无自动回滚/补确认/再测。

## 4. Integration 直接消费者

- [x] 4.1 Integration preparation/写入前仅消费有效确认的 Final reader，删除旧全包/evidence/source-object 全链依赖与 finalizedCandidateRef；以第一笔写后读回失败/输入漂移之后的全新会话 preparation 拒绝且 Git callback 未调用、正常已确认成功可准备、旧输入拒绝和不读历史日志测试验证。
- [x] 4.2 同步 operation facts、record/ref/validator/golden vectors 与导出；验证不残留 dummy SHA、空 evidence 或新整仓摘要，不删除其他工程检查仍使用的 Git helper。
- [x] 4.3 保留现行独立 Git 操作/来源/prestate/实际对象与接受关系验证；以 create-new/reuse-existing、错误对象/授权/target drift/acceptance 失败回归验证，不重开 Final/Change。

## 5. HOW 与一致性

- [x] 5.1 同步产品 Start/Final/Integration HOW 及确实受影响的 AGENTS/独立 bootstrap 文字；定向检索证明不再要求 Start SHA、Final 全仓快照，product 不读取 .agents。
- [x] 5.2 核对三个 delta 的直接实现/测试对应关系及全部 breaking 消费者；交付对应清单，保留历史 archive/Runs/Owner 决定 bytes。

## 6. 当前实现验收与交接

- [x] 6.1 执行当前 candidate 的相关 domain/acceptance、Full Test reader、安装分根回归；记录实际命令和退出码，不把 043/044 proof 当实现 PASS。
- [x] 6.2 执行适用 Windows 与 Linux x64 验收，Windows 原生场景与 simulation 分别说明；必要材料保存本次 target artifacts，.tmp 只放可丢弃内容，不执行实际 D05 Formal Full Test。
- [x] 6.3 执行适用 build/typecheck/源码 quality gate/依赖健康及严格 OpenSpec 校验；修改后源码超过 650 行按职责拆分，不压行或放宽 gate。
- [x] 6.4 读回本次实际 Run/结果、当前候选与必要证据引用，明确来源和副作用限制，交独立 review-apply 后 STOP；不把 Reviewer approval 当 Author 可勾任务，不自动 Archive/Git。
