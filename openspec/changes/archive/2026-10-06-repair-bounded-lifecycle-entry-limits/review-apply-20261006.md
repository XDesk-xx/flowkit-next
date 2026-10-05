# Review Apply：repair-bounded-lifecycle-entry-limits

- 日期：2026-10-06（Asia/Shanghai）。
- Verdict：**approved**；无新增阻断 findings。
- 当前步骤：按已批准 Proposal 进行直接 OpenSpec 独立实现审查。基线 main / 96179b50b70a7582e264a7af111436d3ca52f788；精确候选及覆盖清单见 [本轮证据](evidence/review-apply-20261006/review.json)。

## 合同与实现

E01 的 Git 专用 1 MiB / 默认 64 KiB 输入预算只由已解析命令选择；文件/stdin 有界读取、关闭 handle、容量与 I/O 分类、help 和安全诊断一致。扩容继续经过原业务授权校验。

E02 的六类 ordinary Author FAIL correction 复用 exact Policy、阶段及 Owner fact；三个同名 revise 通过窄结构边形成新 occurrence，start/inspect/finish/current chain 使用同一来源。已审查内核无失败来源的 bare READY 拒绝、package/readiness 失败不发布 current、旧 Run 不改写和新 PASS 进入对应 Review。

E03 的 fresh predicate 与 bootstrap 分离，readiness 只计算首值；HOW 负责复核和窄写。上一轮 RP-01 已在实现测试中闭合：编号前 FAIL 可保存，缺编号的后续 correction 仍拒绝 start，不自动重置首值。

E04 的共享事实预算保持 bytes/depth，仅放宽 nodes；输入与生成 candidateGit 后的超限都在 machine 文件首写前拒绝。较大 absent/entry 候选已验证 finish/readback/Review/Archive admission，超限保留 descriptor/proof，并可在真实修正后使用同 Run。

批准的 Proposal/Design/delta specs 身份未变，tasks 变为完成标记。新增文件分别承担有界输入、ordinal/fresh 材料核对和诊断类型，复杂度与原四项要求相称。scope drift: NONE；未发现新增 registry、通用恢复协议、依赖或自动下一 Action。

## OCR delegate 覆盖

使用 Open Code Review delegate 的 preview/rule；OCR 只负责文件筛选和规则解析，未调用模型，不构成第二个独立 Reviewer verdict。宿主完成语义判断。

- total_files=23，reviewed_files=23，skipped_files=0，coverage_rate=100%。
- OCR 排除的 30 个测试/Markdown 文件补充审查；工作区候选合计 53 个文件。
- 3 个规则组已核对；历史 Explore/Proposal 证据通过本会话既有审查及当前 hash 读回确认，不将旧探针输出当作本轮实现 PASS。
- 原始工具输出保存在 evidence/review-apply-20261006/ocr-preview.stdout.txt 和 ocr-rules.stdout.txt。

## 本轮独立核验

- 七个相关 domain/CLI 测试文件：49/49 PASS，0 FAIL，0 SKIP。
- pnpm typecheck、pnpm build：PASS。
- exact OpenSpec 1.10.0 strict validation、git diff --check：PASS。
- 重新构建后 137 个 dist/Guidance/docs/lock 发行文件与隔离安装逐文件原 bytes 一致；tarball SHA-256 为 b77e44c2154133ca59c27ef7eb72c0199a7c743717f79af1b1553a0ef9225ef9。
- 外部 manager doctor=pass；status/next 如实报告本独立 Change 无 coordination 的 context-inconsistent，未据此构造或执行 Flowkit lifecycle。

Author verification.md 中的完整 domain/acceptance/quality 检查已阅读；本轮没有把这些汇总冒充全部独立重跑。当前复验在 Windows / Node v22.23.2 进行，没有本轮 Linux 执行或正式 Delivery Full Test 结论。

本次只新增 Reviewer 报告和证据，运行必要构建/测试；未修改 Author 源码、测试、规划或历史材料。停在 Review approved，不执行 Archive、Git checkpoint/push 或 manager 更新。
