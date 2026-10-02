## 1. Proof 归属与 Action 闭合

- [x] 1.1 建立从唯一 canonical Run 分组得到编号与语义 Proof 候选路径的有界规则；用编号、语义、错误编号与双目录 fixture 验证语义 `changeId` 和 Run group 不混淆。
- [x] 1.2 修正 `proof inspect`、`checkDeclaredProofs` 与 own-Run finish 闭合；用含真实文件但 `proofRefs: []`、完整声明、空目录、双目录、链接和损坏摘要的测试验证写前拒绝与历史语义路径可读。
- [x] 1.3 修正受管理 checkpoint 的 Proof→Run 归属解析，保持候选树、唯一 Result 声明及 index 原始字节检查；用编号与语义正例、错误编号/双目录/未声明反例验证 commit 前 fail closed。

## 2. Proposal 产物路径

- [x] 2.1 将成功 Propose/Revise Propose 的 `artifactHashes` 限定为当前 Change 的项目根相对规划路径并在 finish 写前核对；用合法 `proposal.md`/`design.md`/`specs/**/spec.md`/`tasks.md`、越界、错误 Change 与摘要漂移测试验证。
- [x] 2.2 修正 `review-propose` readiness 从 `repositoryRoot` 复核前序 Proposal 摘要；用 MenDi 现有键形式的 Propose→Review Propose 集成测试验证 Reviewer 可启动机器边界，同时确认 `review-apply` 的源码摘要路径未被收窄。

## 3. 已启动 Run 的兼容恢复

- [x] 3.1 在更新产品 Skill bytes 前构造隔离兼容安装，读回 Explore Skill SHA 与 LearningPlatform 原 `action.md` 绑定值相等，并只读核对其 `repositoryRoot`、Run 地址及 40 个 Proof 原始 bytes；用隔离 fixture **自行创建的合法 descriptor**重现编号路径，验证 inspect、完整声明、空声明拒绝和跨进程 finish，确认未复制原 descriptor 冒充恢复且目标文件未变化。
- [x] 3.2 只读核对 MenDi 已接受 Propose Result、语义 Proof 路径及规划文件 SHA；在 fixture 自有项目根和完整 Run 上复现相同项目相对键，验证 `review-propose` readiness，确认未重写历史 Result、未生成真实 Reviewer verdict，且两个项目的正式 Action 均未被本 Change 执行。

## 4. Skill 与交付核对

- [x] 4.1 更新发行 `skills/actions/**`、相关 `.agents/skills/**` 和 `docs/onboarding.md` 的 Proof 分组及 partial Run 恢复说明；逐项搜索旧含糊路径并核对 bootstrap HOW 不成为产品运行时 authority。
- [x] 4.2 对最终候选运行适用单元/集成测试、OpenSpec strict validation、打包与隔离安装读回；比较兼容与最终 Skill SHA，验证最终安装不会被误用于完成仍绑定旧 SHA 的 prepared Run，并记录未执行的真实目标恢复边界。

## Apply 验证记录

- `pnpm test:domain`：382 PASS；`pnpm test:acceptance`：7 PASS；`pnpm test:bootstrap`：9 PASS。`pnpm typecheck`、`pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm quality:entropy`、`pnpm test:entropy`、`pnpm quality:owned-source`、`pnpm check:forbidden-tracked-artifacts` 与本 Change 的 OpenSpec strict validation 均通过。
- 隔离兼容安装的 Explore Skill SHA-256：`79504e4f23eb22052f75d6d350f315db599bd985e2a7f82d9208d4f3b6d9135d`，与 LearningPlatform 当前 prepared descriptor 绑定值一致。初次 Apply `1.0.0` 候选的 Explore Skill SHA-256：`bca96bacc1f7016ff8081dc6605bd677b337726b09c1cb4a1876becd427eb2f7`；tgz SHA-256：`57c54966135b3fa053c9d85a6bc524547e9d9a0ff7dec038f0ceec84bfb55654`。初次隔离安装的跨进程 Action fixture 4/4 PASS；旧安装 start、该安装 finish 的隔离负例返回 `package-drift`，且未写 `context.json`/`result.json`。
- LearningPlatform 的实际 Explore 仍只读；原 Author 须在原项目根、绑定旧 Skill 的兼容安装下判断实质 Explore 并完成 fixed finish。MenDi 的实际 Reviewer Action 未启动。本 Change 没有选用或替换两个目标项目的 Stable manager，也没有形成 Git checkpoint 或发布。

## Revise Apply 验证记录

- Reviewer 的三项 finding 均在实现/验收层修正：checkpoint 使用 Git index 中的候选 Proof 路径判断双目录；编号段也要求语义 Change 仅有唯一 canonical Run 分组；固定 `test:domain` 只使用源码入口，安装验收移至 `tests/installed/manager-action-install.test.ts`，通过显式路径参数单独运行，不改变 Formal Full Test 的被测入口或环境输入。
- 新增 index 中语义目录仍存在而工作区已删除的完整 checkpoint 反例，以及重复编号 Run 分组反例；定向测试通过。上一轮修订包 SHA-256：`ab993ad78227d3394d56e5cd8915a3b49e7650dd38fdc652c658f064ee983293`，Explore Skill SHA-256 为 `bca96bacc1f7016ff8081dc6605bd677b337726b09c1cb4a1876becd427eb2f7`。对该包与兼容安装运行独立安装验收 2/2 PASS，包含新版自己启动/完成编号 Proof Run、旧 Skill 绑定触发 `package-drift`。
- 修订后的完整 `pnpm test:domain` 串行复跑为 383/383 PASS，`pnpm test:acceptance` 为 7/7 PASS；`pnpm typecheck`、`pnpm quality:gate`、`pnpm quality:dependency-health` 与 OpenSpec strict validation 通过。此前并行运行 domain 与 acceptance 的一次 domain 结果为 381/382 PASS，输出截断而未保留失败测试名称；随后串行重跑的完整日志保留在可丢弃的 `.tmp/revise-domain.log`。

## 再次 Revise Apply 验证记录

- Reviewer 指出 checkpoint 的 Run 分组唯一性仍来自工作区。现从同一 Git index 中读取 `.flowkit/runs/` 候选路径，提取当前 Delivery 的分组，再执行唯一性检查；Proof 目录和 Run 分组均以待提交内容为准。回归在 index 加入第二编号分组后，分别于工作区仍有该分组、移走该分组时要求拒绝；移除 index 中的第二分组后恢复通过。
- 本轮定向 checkpoint 测试 5/5 PASS，完整 `pnpm test:domain` 串行复跑 383/383 PASS，`pnpm test:acceptance` 7/7 PASS；`pnpm typecheck`、`pnpm quality:gate`、`pnpm quality:dependency-health` 与 OpenSpec strict validation 通过。最终隔离包 SHA-256：`28423eadd6f75e0a03a2c7a999be7dd1528d46d76e7980f27180f5d48146177f`，Explore Skill SHA-256 仍为 `bca96bacc1f7016ff8081dc6605bd677b337726b09c1cb4a1876becd427eb2f7`。最终包与兼容安装的独立安装验收 2/2 PASS，包含 `package-drift` 负例。
