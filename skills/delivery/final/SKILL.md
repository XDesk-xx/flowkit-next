---
name: flowkit-delivery-final
description: 在已授权 Final 边界消费相关完成终点与当前 Full Test，以两笔窄写发布成功确认。
---

# Delivery Final

只执行已确定的 `delivery-final`。精确 singleton finalize-delivery/delivery-final Owner authority 与同一 manager 的 content-bound Guidance 保持；不回退到 target 同名系统材料或 `.agents/skills/**`。

## 有限前置

- 从 canonical manifest 取得全部 required Changes；它们 completed，managed OpenSpec active set 为空。不可由 caller 缩小集合。
- 使用可信 host 已接纳来源选定每个 Change 唯一 archive 及其直接 approved review-apply；来源负责排除歧义/未完成矛盾。host 实读这两个受控三文件，核对身份、Role、terminal 完成、verdict、linkage 及 source-bound bytes。
- 结构合法、自签 hash 或 caller JSON 不等于已接纳；来源能力缺失报 completion-source-unavailable。不要重放祖先 admission 或遍历历史 proof。
- 复用 target 当前 fullTestAttempt reader：完整真实 PASS、当前输入及必要材料有效。新的 FAIL/partial/缺失/损坏/输入变化不得回用旧 PASS。verifiedCandidateRef 是 Full Test inputRef，不是 Git candidate。
- Package 的 changeCompletions 只在本次内存中用于相关重验，不持久复制第二份 evidence 快照。

## 窄写与确认

Agent 仅返回 defensive package 对应的 ready/correction-required，不指定任意路径或获得 Git capability。

1. host 写前重验本次 prerequisites、Guidance 和固定 manifest prestate。
2. 第一笔仅将 delivery state/finalizationStatus 完成，保留 passed/fullTestAttempt 和非目标 bytes；finalization 保存 state、ownerAuthorityRef、sourceRef、fullTestAttempt、verifiedCandidateRef、fullTestExecutionRef、confirmationRef=null。
3. 精确读回并复验相关完成事实、当前 attempt/输入及必要材料后，第二笔仅写 confirmationRef=局部 deliveryFinalizationRef。发布前再核对目标与当前输入。
4. 确认的原子替换是成功提交点；其后只有标记读回/响应，不追加决定本次成功资格的业务验收。
5. 成功返回最小 record 并 STOP。只读 readDeliveryFinalization 从 project/manifest 和有效确认识别完成，不依赖聊天 package，也不再次执行 Final/Review/测试。

确认前失败留下 null，不得仅因 completed 或自签 ref 宣称成功。确认发布后的读回/响应失败如实报告；新会话只依据实际有效标记识别已提交事实，不补确认或重试。失败区分 not-written/written-unconfirmed/unknown。确认不证明未来代码永远未变。

不写 gitCheckpoint、重复 formalVerificationCandidate、requiredEvidence 或 finalizedCandidateRef；不生成 Git/全仓摘要、额外结果库、事务平台或 Archify 证明。历史不迁移/重签。没有 commit、push、PR、merge、自动下一操作权限；D05 继续独立 bootstrap。

后续独立 Git 授权使用 [Git 宿主 HOW](../repository-integration/references/host-call.md)；Final confirmation 不是 Git 权限，不把其 SHA 读回变成再次提交的资格字段。
