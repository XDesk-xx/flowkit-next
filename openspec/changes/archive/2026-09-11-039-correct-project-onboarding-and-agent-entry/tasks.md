## 1. 随包接入与当前说明

- [x] 1.1 新增 docs/onboarding.md，说明固定实际 tgz 安装、运行依赖、Node/exact OpenSpec、manager/target 分根及按用途准备；核对 Windows 示例可执行，不假设公开 latest 或新增 CLI 写命令。
- [x] 1.2 在文档中提供短 AGENTS 入口区块，列明实际 target、安装定位和 Role 来源；验证合并保留已有文件与非授权 bytes，重复接入不重复区块，冲突不强制覆盖。
- [x] 1.3 整理 README 当前产品说明与历史说明，链接接入文档，并在 package.json.files 精确包含该文档；从实际发行包核对 README、文档、bin 和 Guidance 可读，不以 pack dry-run 代替安装。

## 2. 薄入口与有界回归

- [x] 2.1 写清先查询 status/next 再读取安装内 canonical Skill 的入口步骤；验证 review/revise 简称匹配、实际 Role 冲突和只读请求，保持 Action 内 normative HOW 不变。
- [x] 2.2 补充必要的接入/说明回归，覆盖 idle、blocked、歧义、partial、bootstrap-history、缺安装与安装定位变化；标明合成负例，不引入路由器、第二份 current 或自动切 Role/执行。
- [x] 2.3 核对首次查询、真实 Start/activation/ordinal、Action 和 Full Test 的材料边界；验证说明不从空目录猜历史、不制造 Owner 权限、不要求首次查询准备 Full Test 或干净 Git。

## 3. 精确清理旧规划文档

- [x] 3.1 当前接入说明可用后，核对并保存三份原文件的 bytes/hash 与 Git commit:path 恢复出处；仅删除 flowkit-next-d04-stable-core-closure-final-reference(1).md、flowkit-next-d05-decoupling-analysis.md、flowkit-next-delivery-change-plan.md，不使用通配删除。
- [x] 3.2 仅补当前 D05 manifest 的简短 bootstrap 历史出处提示，保留 reference 原值及原有事实；核对当前消费者和活动链接可用、历史 Runs/archive/D04 未改，不要求历史引用全文零命中或放宽其他活动 planning input 合同。

## 4. 三类真实验收与交接

- [x] 4.1 从固定实际发行包建立普通独立 target 的安装/接入，保留既有内容，在真实授权和既有初始化边界下完成一次有实际内容的有界 Author Action；保存真实工作、三文件记录及必要证据，不用合成 terminal 冒充执行。
- [x] 4.2 用同一安装的新 CLI 进程读回上述实际 target 的 current/next，核对真实记录和边界；只报告独立进程验收，不称为新 Agent 会话。
- [x] 4.3 由不继承聊天的真实新 Agent 会话仅凭 target 与短入口，自行读取安装、实际 Run、合法边界和对应 Skill，留下真实引用后 STOP；不预给答案、不额外执行 Action。没有实际完成就保持本项未勾、如实交接，不能以 CLI 重启或 fixture 抵扣。
- [x] 4.4 执行适用安装/平台回归、build/typecheck、bounded quality gate 与 OpenSpec 严格校验，必要时按职责拆分超过既有 650 行要求的源码/测试；分别记录真实验收与未完成项，提交独立 review-apply 后 STOP，不声称 Formal Full Test 或自动 Git 操作。
