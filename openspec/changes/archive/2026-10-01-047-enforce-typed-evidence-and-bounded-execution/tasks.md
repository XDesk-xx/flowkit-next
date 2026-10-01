## 1. 本 Run proof 闭合集

- [x] 1.1 在固定 `action finish` 写 `context.json`/`result.json` 之前枚举本 Run 正式 proof 目录，并与 `proofRefs` 双向唯一匹配；用三个真实文件只声明一个、空引用但有文件、全部完整声明的 CLI 测试验证。
- [x] 1.2 复用文件/摘要/Git 原始字节检查并拒绝链接、非普通文件、逃逸、重复、缺失、失效摘要、不可读及不支持的目录结构；测试失败时只保留原有 `action.md` 和材料、没有 terminal 机器文件。
- [x] 1.3 验证无目录配显式空引用可 finish、空目录或引用缺失不被默许，并验证后继 Action 可按需读取历史已声明 proof 子集且不重扫历史目录。

## 2. 普通 checkpoint 的有界精确暂存

- [x] 2.1 在既有 Git checkpoint 宿主中将已验证、排序去重的 exact operation 路径以 NUL pathspec stdin 传给单次 `git add`，保持 literal、编码与路径安全校验；用足以超过 Windows argv 上限的隔离 Git fixture 验证全部目标暂存及 commit 对象范围。
- [x] 2.2 保持写前/提交前的 Owner 来源、分支/HEAD、工作树/index、无范围外 staged 和 managed evidence 字节复核；用范围外 staged、来源/index 漂移与路径变化测试验证拒绝且不夹带其他文件。
- [x] 2.3 对 stage 部分成功、Git 响应丢失和 commit 响应不确定读回 index/HEAD/对象并交接已确认效果；故障注入测试验证不清空 index、不自动重试或 push、不把未知状态报告为 completed。

## 3. 自有执行源码与证据用途

- [x] 3.1 按 design.md 决策 3 实现当前工作树递归源码发现、确切排除根与七项路径加 SHA-256 遗留例外；用未跟踪的 `scripts/`、`skills/`、根目录和新自有目录 helper、改动一项遗留 JS 的负例，以及受检 TS/构建 JS 的正例验证，不读取 Git 基线或把 `node:test` 套件当 fixture。
- [x] 3.2 将本 Change 新增或实质修改的自有运行逻辑放入受检 TS 根，并使适用测试受检查；实际运行 `typecheck`、格式/lint、构建及相关行为测试，记录每项命令结果，保持 `quality:gate` 的既有轻量组成。
- [x] 3.3 更新固定命令 HOW 与证据用途说明，让标准生命周期只需发行数据命令；核对 HOW 无 `-e/-c`、stdin 程序或 `.tmp`/proof 脚本的正常执行依赖，必要正式实验脚本在生产 Run 的 `proofRefs` 中按原字节和具体用途声明，并用文档/Run 示例读回验证。

## 4. 可选宿主权限与交接

- [x] 4.1 在发行接入说明分别给出选定安装的只读、受控记录、项目检查和 Git/网络窄权限示例；只对实际支持可见 target 的固定命令给出项目绑定示例，明确 Foundation `status/next/doctor` 无此 argv 能力；文档检查确认没有裸解释器、全部子命令或其他 target 的通配放行。
- [x] 4.2 若宿主支持交互式规则试验，验证精确匹配及不同安装/命令/target 和冲突 JSON 的反例；若不可执行，明确记录该项未验证，并通过适用固定入口的数据校验测试证明可见 target 冲突会拒绝。
- [x] 4.3 运行适用平台与打包/安装回归，复核新增原始 proof 的完整声明及 OpenSpec 规格对应关系；记录实际 PASS/FAIL/未验证边界，交给独立 `review-apply`，不宣称 Formal Full Test 或 Git checkpoint。
