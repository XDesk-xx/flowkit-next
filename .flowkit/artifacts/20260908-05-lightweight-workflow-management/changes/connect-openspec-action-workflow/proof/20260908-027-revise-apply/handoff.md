# 027 revise-apply 交接

依据 026-review-apply changes-requested，对 025 累计候选进行两项最小修订。不修改已批准 Proposal/design/spec/tasks、内核、manifest 或历史 Run；D05 继续 independent-bootstrap。

## Finding 对应

- D05-RA026-001：current-run-chain 按数值 sequence 前缀后的完整 ChangeId 匹配 canonical group，bootstrap 保持 exact identity。feature 不再误读 improve-feature/another-feature；当前目标的非法数值前缀、重复、混合及 partial 仍诊断。新增 run-group-selection.test.ts 覆盖空历史、双历史和负向控制。修复前保存了失败输出，修复后通过。
- D05-RA026-002：十个产品 HOW 的 currentForExecution 示例对 exact same prepared 复用；null/不同 terminal 使用既有 transition，其他 prepared target 拒绝。内核 duplicate prepare 仍返回 null。新增 agent-how-prepared.test.ts 实际执行 HOW 分支及“prepared 失败记录 → 明确新执行 → 新 occurrence → terminal”，对照旧三文件 Buffer 不变。测试是合成执行，不是独立 Review。
- 非阻断说明：AGENTS 第 4 节清掉已撤出的 action 命令，与现有三命令表述一致。

debugging-and-error-recovery 用于重现和最小根因修复；skill-creator 用于十个 HOW 的一致性及可执行示例验证。未引入新公共 API、协议、Registry 或 helper 平台。

## 当前验证

Windows domain 284/284、acceptance 6/6；Linux x64 glibc 2.36 / Node 22.23.2 离线 domain 284/284、acceptance 6/6，均零失败、零 skip。Linux 不复用 Windows node_modules。

typecheck、build、lint、format:check、dependency-health、entropy 43/43、OpenSpec 1.10.0 strict、十个 Skill quick_validate、git diff --check 通过。累计候选 source/tests 最大 595 行，650 gate 未放宽；本轮 exact 修改 15 文件（包括两个新增测试）。67 个受保护历史/计划/内核/manifest 文件 hash 未变，详情见 verification.json。

修复前失败、sandbox spawn EPERM 和首次 Skill 校验外层 PowerShell 引号展开错误均保留。正确引号重跑 Skill 校验成功；不将这些失败记录覆盖成 PASS。

## 相关授权与材料

本次 Owner 输入“根据最新run，revise”，sourceRef 见 027 context.json。保留已接受边界：CLI 只读、Agent 实际记录；必要材料留在 target artifacts，.tmp 可丢弃；不做固定双 Change/finding 演练；不由 candidate 管理 D05。不以材料保留自动认可旧 PASS，不回填 019 或改写 025/026。

本轮是 finding-relevant 修订与回归；未重做已通过的 025 有界 Author 演示，也未要求第二套真实工作流或独立 Reviewer fixture。当前必要证据以 027 的新结果为准；025 保存其余未变候选和先前实际工作的来源。

## 交接与 STOP

累计未提交候选基于 HEAD 697088391374daa67d63c20f8a365fb44ec5c058；027 Result 提供当前累计 artifact hashes、本轮 delta 与 025/026 精确引用。025 的原有十项删除事实/备份仍适用，本轮无新增删除。

Author 已修正两项 finding；是否批准由独立 review-apply 决定。下一边界 review-apply，STOP。没有执行正式 Full Test、Archive、Git 或自动下一 Action。
