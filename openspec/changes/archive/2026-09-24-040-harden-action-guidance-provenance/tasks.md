## 1. 可信开始边界

- [x] 1.1 在 manager 域内实现有界 canonical start，复用真实 resolver、package/readiness 与受控 create-once Run 地址；以合法启动的单元测试验证写出的 `action.md` 和返回 package 含同一真实 GuidanceRef。
- [x] 1.2 在首次目标 Run 创建前拒绝伪造/错 Action SHA、安装 A/B 内容差异、准备后 bytes 漂移、缺失或 non-regular Skill、Action/Role/context/地址不匹配；以负例测试验证对应 Run 目录不存在。
- [x] 1.3 保持写入后的 partial、序号唯一与历史 Run 原时点身份；以持久化和跨安装回归验证不覆盖旧 bytes、不用当前安装 SHA 否决旧 Run。

## 2. 产品 Action HOW 与接纳边界

- [x] 2.1 将十份 `skills/actions/**/SKILL.md` 的 Agent start 示例改为调用 manager 可信入口，并明确纯结构 ref/package 不许可新 Run；以覆盖全部 Standard Action 的 HOW 测试验证没有手工 Guidance SHA 写入路径。
- [x] 2.2 核对 finish/Result admission 继续消费该次 held package，Author/Reviewer/Verification outcome 与一次 Action 后 STOP 保持分离；以适用的 HOW 和 admission 回归验证。

## 3. 集成验证

- [x] 3.1 对同一 build 运行适用的 `pnpm test:domain`、`pnpm test:acceptance`、`pnpm typecheck`、`pnpm build` 与 `openspec validate harden-action-guidance-provenance --strict`，记录真实结果及环境限制；确认未引入 CLI 写命令、历史 Run 迁移或第二个 Change 的 prepared correction。
