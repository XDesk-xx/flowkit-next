---
name: flowkit-delivery-start
description: 在已确定的 Owner Delivery Start 边界建立并读回本项目交付内容，不执行 Git。
---

# Delivery Start

只执行已经确定的 `delivery-start`，不选择操作、激活 Change 或创造权限。Guidance 从同一 manager 安装来源实读；项目写入归 target，不回退到 target 同名 Guidance 或 `.agents/skills/**`。

- 输入为 deliveryId、ownerAuthority、planningReference；Owner 已选规划文件必须从 target 实读并匹配 artifact/contentSha256。
- Package 只绑定 projectId、规划引用和固定 manifest 的 coordinationPrestate；不存在以 contentRef=null 表示。不要求 HEAD、acceptedBaseCommit、首个 commit 或全仓 clean。
- 唯一业务输出是 `openspec/delivery-groups/<deliveryId>.yaml`。使用 host 提供的 writeManifest create-once 能力，保存项目/Delivery、规划引用与 Change 组织；已有匹配内容只读复用，不覆盖冲突或不安全地址。
- 写入前复核规划、目标及活动 Delivery 歧义。无关 dirty 文件不是 Start 冲突；不要求 Archify、ZIP/bundle、Git/OpenSpec PASS receipt。
- 真实内容验证和读回成功，返回 contentCompletion：projectId、deliveryId、planningReference、coordinationRef。没有 candidateRef、validation 快照或 fixedPointCommit。
- 失败如实报告 not-written、written-unconfirmed 或 unknown；写后抛错不等于没有副作用，不自动回滚或重试。

额外 Git scope 不在 Start 内执行；没有 commit callback。Git 节点另依明确授权处理。成功或失败后 STOP，不创建 Delivery Run，不使用 candidate HOW 管理当前 independent-bootstrap Delivery。

单独授权 Start 后 Git 时，可使用本安装 [Git 宿主 HOW](../repository-integration/references/host-call.md) 的普通节点；不要求 Final、不把 commit 内嵌 Start。
