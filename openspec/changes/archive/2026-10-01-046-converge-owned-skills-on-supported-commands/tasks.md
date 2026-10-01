## 1. 固定当前发行资产与命令对应关系

- [x] 1.1 逐一核对十个 `skills/actions/<actionId>/SKILL.md`、四类 Delivery Skill 与有效 references、自有 OpenSpec Tool Skill、README/`src/README.md`/onboarding、CLI help/示例及 AGENTS 当前入口，记录每项保留/修正/退役及对应已发行命令；以实际文件清单和 `src/cli/*request.ts` 字段对照验证无遗漏。
- [x] 1.2 核对 `.agents/skills/**` 当前 bootstrap 消费与生产 `src/**` 不读取该面，确定本 Change 不替换其来源；以调用方搜索和当前外部 Stable manager 身份读回验证。

## 2. 收敛 Action 与 proof 生产 HOW

- [x] 2.1 对确有差异的十个 Action Skill 作最小修订，保留 Author/Reviewer 各自实质标准和每次 STOP；对照 `action start/finish`、`proof inspect` 的实际请求字段与候选 CLI 帮助验证当前路径不要求内部模块、callback 或临时生命周期程序。
- [x] 2.2 在生产者 HOW 与有效示例中写明本 Run 正式 proof 目录的完整 `proofRefs` 声明、bytes/SHA 核对、无材料时空数组，以及后继 handoff 可按需选择已声明引用；用“三个文件只列一个”的反例和无新材料例验证文字不会混淆两种集合。

## 3. 收敛 Delivery、Git 与接入 HOW

- [x] 3.1 将 Delivery Start、Full Test、Final Skill 的默认机械调用映射到 `project init`、`delivery start`、`delivery full-test current`/`delivery full-test`、`delivery final`，保留 Owner、attempt、当前关联、原始流、确认与 partial 语义；逐项用 parser 字段及固定命令结果形状核对数据示例。
- [x] 3.2 将 repository integration Skill 及有效 `host-call.md` 的默认动态导入和 callback 指导映射到 `git checkpoint/push/integrate` 的授权、可见目标、部分成功和外部接受交接；核对 `git-host.mjs` 的三个真实导出与 reference 消费者，仅在无有效消费者后退役旧 reference，并验证当前正常 HOW 不依赖旧宿主调用。
- [x] 3.3 对自有 OpenSpec Tool Skill、README/`src/README.md`/onboarding、CLI help/示例、AGENTS 当前入口及直接冲突的现行 spec 做有界收敛；对照真实安装、OpenSpec 1.10.0 与候选 CLI 命令目录核对，不改写历史段落、vendor 或 bootstrap 指引。

## 4. 发行与角色验收

- [x] 4.1 对当前有效资产做语义 stale scan，确认正常节点不再指向旧内部模块、callback、临时 start/finish 程序或“CLI 只读”限制；对有历史/引用用途的命中逐条分类并验证没有把旧流程藏入新 reference。
- [x] 4.2 用同一候选构建与发行包核对帮助、精确请求、blocked/partial/confirmed 返回及独立角色从 onboarding 定位安装、合法边界、对应 Skill、单次操作和 STOP；保存真实检查结果，确认没有自我管理 D07、没有 Reviewer/Verification/Git 权限混淆。
