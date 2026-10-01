---
name: flowkit-delivery-start
description: 在已确定的 Owner Delivery Start 边界建立并读回本项目交付内容，不执行 Git。
---

# Delivery Start

只执行已经确定的 `delivery-start`，不选择操作、激活 Change 或创造权限。Guidance 从同一 manager 安装来源实读；项目写入归 target，不回退到 target 同名 Guidance 或 `.agents/skills/**`。

- 输入为 deliveryId、ownerAuthority、planningReference；Owner 已选规划文件必须从 target 实读并匹配 artifact/contentSha256。
- Package 只绑定 projectId、规划引用和固定 manifest 的 coordinationPrestate；不存在以 contentRef=null 表示。不要求 HEAD、acceptedBaseCommit、首个 commit 或全仓 clean。
- 唯一业务输出是 `openspec/delivery-groups/<deliveryId>.yaml`。已确定本次 Start 后，向选定 manager 的 `flowkit delivery start --repository-root <target> --delivery-id <deliveryId> --input <request.json>` 提交封闭数据：`repositoryRoot`、`flowkitHome`、`deliveryId`、真实 `ownerAuthority`、实读 `planningReference` 与固定 `manifest`。命令负责 create-once、冲突拒绝和读回；不要求 Agent 实现 `writeManifest` callback。
- 写入前复核规划、目标及活动 Delivery 歧义。无关 dirty 文件不是 Start 冲突；不要求 Archify、ZIP/bundle、Git/OpenSpec PASS receipt。
- 真实内容验证和读回成功，返回 contentCompletion：projectId、deliveryId、planningReference、coordinationRef。没有 candidateRef、validation 快照或 fixedPointCommit。
- 失败如实报告 not-written、written-unconfirmed 或 unknown；写后抛错不等于没有副作用，不自动回滚或重试。

额外 Git scope 不在 Start 内执行；没有 commit callback。Git 节点另依明确授权处理。成功或失败后 STOP，不创建 Delivery Run，不使用 candidate HOW 管理当前 independent-bootstrap Delivery。

若尚无 `.flowkit/project.json` 且 Owner 已明确选定项目身份，先在独立项目接入节点调用 `flowkit project init --repository-root <target> --input <request.json>`；请求只含共同的 `repositoryRoot`、`flowkitHome` 与 `projectId`、`repository`、`runtimeFamily: "new"`、真实 `sourceRef`。确认该节点效果后 STOP，再进入独立授权的 Delivery Start；不得为满足 Start 虚构接入来源。

检查 CLI 退出码与 JSON `status`/`effect`、exact target 及读回；`completed` 仅表示本命令完成。`incomplete`、`not-written`、`written-unconfirmed` 或未知效果按返回的已确认部分交接，不覆盖或盲重试。单独授权 Start 后 Git 时，使用 [固定 Git 命令 HOW](../repository-integration/references/host-call.md) 的 `git checkpoint` 节点；不要求 Final、不把 commit 内嵌 Start。
