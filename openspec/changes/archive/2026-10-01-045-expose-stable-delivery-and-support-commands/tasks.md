## 1. 固定发行入口与授权边界

- [x] 1.1 扩展 `flowkit` 封闭命令解析、help、`--input <path|->` 和可见 target 对照；用 CLI 回归证明所有列出的命令可解析，未知命令、额外字段、目标冲突与可执行字段在副作用前拒绝。
- [x] 1.2 为各写命令接入 Agent 提供的精确 Owner/sourceRef 声明及当前状态重验，保留 Project 无 Delivery 的接入形状；用缺 authority、错 decision/scope/target/sourceRef 和无聊天连接的负/正例证明信任边界。

## 2. Project、Delivery、Change 与 Memo

- [x] 2.1 实现 `project init` 的 OpenSpec root 核对和 `.flowkit/project.json` create-once/readback；用无 Delivery 的新目标、同值复用、冲突文件和缺 OpenSpec root 验证。
- [x] 2.2 将结构化规划转换为确定的 Delivery manifest 并由固定 `delivery start` 接入现有 Start package/writeManifest；用无首个 commit、无关 dirty、同值复用、冲突及写后未确认验证不夹带 Git/激活。
- [x] 2.3 实现 `change activate` 的依赖/单 active/Owner 前置、exact OpenSpec scaffold 与 manifest 窄写；用首次 Explore 前无 ordinal/Run、目标冲突及两写之间 partial 验证。
- [x] 2.4 接入 `memo list/get/create/promote/dismiss` 到现有 Memo 持久化；用 exact 状态、重复 ID、错 Owner scope 和 Delivery 不被自动修改验证。

## 3. Archive、Full Test 与 Final

- [x] 3.1 实现 `change archive` 对 A 的 exact started archive Action、真实 Review/tasks/ordinal/readiness 的核对和受管 OpenSpec 归档；用成功读回、写前拒绝、归档 partial 以及无 Action Result/Git 自动写入验证。
- [x] 3.2 实现 `delivery full-test` 的显式 `attemptId`/`expectedCurrentAttemptId`、create-once 开始记录绑定和 current 关联前置核对，并接入固定配置/检查执行与只读 `delivery full-test current`；分别验证 terminal 成功/失败后的响应丢失重投、开始未发布及 pending/partial 的同次重投只读、冲突 ID/Owner fact 拒绝、关联漂移拒绝、相同输入上新 ID/新 Owner fact 的明确重跑、旧格式历史开始记录只读，以及新失败覆盖旧 PASS、配置/代码输入漂移与 partial 材料。
- [x] 3.3 实现 `delivery final` 的可信 required Change 完成读取、当前 Full Test、两笔窄写与 confirmation 读回；用缺来源、失效测试、无 confirmation 和无 Git/Integration 副作用验证。

## 4. Git 固定宿主

- [x] 4.1 将 Agent 本次 Owner 操作声明接入固定 Git host，复用现有独立 checkpoint/push/integration API 而不接收 caller callback；用无授权、错 target/sourceRef、Policy/Final 不符验证写前拒绝，并明确测试只证明结构/状态而非聊天认证。
- [x] 4.2 实现 `git checkpoint` 与 `git push` 的独立命令/读回；在隔离 Git 仓库以范围外 staged、原始证据 bytes、commit shape、远端 exact ref 和 commit 已有但 push 未接受验证部分效果。
- [x] 4.3 实现 `git integrate` 对 confirmed Final、singleton、create-new/reuse-existing 与真实接受的固定调用；以无 Final、错误 Git prestate、已确认 checkpoint 复用和未完成 PR/merge 交接验证。

## 5. 收敛与有界验收

- [x] 5.1 更新 B 新命令直接影响的 CLI help、接入示例和冲突规范措辞；逐项执行示例或负例，核对其与实际发行命令一致，保留 C 的全目录 Skills/HOW 任务。
- [x] 5.2 在独立最小 target 用同一候选构建验证 Project→Start→activation→Memo→archive→Full Test→Final 的机械链与每步 STOP；真实角色结论由相应执行者提供，合成 fixture 不声称独立 Review。
- [x] 5.3 运行 typecheck、production build、相关回归与 OpenSpec strict validation，并核对 B 的候选源码/发行入口可达、旧 A Action 与 Policy/Full Test/Final/Git 回归未退化；只报告当前实际覆盖，不宣称 D07 Formal Full Test 或 Change E 发行验收。
