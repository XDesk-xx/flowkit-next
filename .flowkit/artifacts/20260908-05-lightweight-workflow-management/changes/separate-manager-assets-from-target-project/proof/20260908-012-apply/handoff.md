# Apply 交接：separate-manager-assets-from-target-project

本轮 Author Apply 消费 011-review-propose 的 approved → apply 与 Owner 指令，沿用独立 bootstrap。当前生产实现、测试与产品 HOW 属于待独立 review-apply 的候选，不代表 Reviewer approved、Delivery Formal Full Test 或 Git authority。

## 需求—实现—当前验证

| 任务 | 当前实现 | 实际验收 |
| --- | --- | --- |
| 1.1 | internal/manager-installation：自身模块定位、自身 name/version，只读 host 描述 | manager-installation 单测；安装 bin 从独立 target cwd 执行；A/B 安装移位 |
| 1.2 | managed-tool-resolution 从 installation.root 读取 lock | resolver 原诊断回归；manager-assets-boundary 缺 lock/runtime；独立 target 无 lock 与同名冲突 |
| 2.1 | Action Guidance 与 single-action 接点显式安装来源 | package/admission/prepare 原语义回归；移位 ref 一致、系统缺失不回退 |
| 2.2 | 四类 Delivery prepare/invoke/exact read 贯通同一 installation | 四类正常执行测试使用独立 manager；四类 Guidance hash/漂移/缺失测试；原 target 写入、Git、候选检查不变 |
| 3.1–3.2 | OpenSpec 工具来源与 cwd 分离，CLI 安装入口注入，JSON request 不增加字段 | actual OpenSpec 1.10.0；installed status/doctor、合法 selected Run、冲突 target、额外字段拒绝、missing runtime 下 next 可用 |
| 4.1 | files allowlist 与 clean production build/prepack | 75 个包文件/41 个生产模块；旧 dist 探针被 prepack 清除；发行包与实际安装逐文件比较；运行依赖只需 yaml |
| 4.2 | README/AGENTS 与必要产品 HOW 明确三根归属 | 静态引用可达；bootstrap/vendor 原文件未修改；未新增 Skill schema |
| 5.1–5.2 | 实际包 manager A 与移位 B；target 为临时独立项目 | 包声明 bin；合法产品 Run 由既有 helper 真实执行/持久化；历史证据与测试配置 bytes 保持原样，manager 不接收项目历史 |
| 5.3–5.4 | 当前候选的分平台验证、质量检查及真实 Run | summary.json 绑定最终命令结果、当前文件 identity 和原始日志；结束于 review-apply |

## 证据边界与失败处理

- 008 Explore 是历史实验，009/011 是已接受审查依据；当前 PASS 只来自本轮命令，不用历史 PASS 替代。
- stdout/stderr 原样保留。沙箱 EPERM 重试、安装 fixture 失败、Linux metadata 缺失和修正均保留，最终适用 attempt 由 summary.json 指定。
- Windows fixture 修正：依赖用 manager 的模块解析获取实际位置，不假定嵌套布局；已安装包检查 emitted JS，不要求 src；doctor 使用自己的请求形状；status 缺 runtime 的现有公共错误是 openspec-integration-failed，doctor 则提供 missing-runtime 细分类。
- Linux fixture 修正：保持已有 pnpm runtime 图而不展平依赖；补齐隔离 policy metadata 后在 network none 下重新安装；domain 测试本身读取历史/bootstrap，故复制这些 fixture 到测试工作区，不放进发行包或独立 target。
- package.json 允许 pnpm pack 的常规序列化/元数据归一化；安装字节严格对照实际包，name/version/engines/dependencies/bin/files 对照当前源码声明。其余包文件逐字节对照当前输出/静态源文件。
- skill-creator quick_validate：四个修改的 Action Skill 与 OpenSpec tool Skill 有效。四个 Delivery Guidance 的原有形式不符合该通用 Agent Skill validator（Start 使用 summary，其余无 YAML frontmatter）；保留原形式，未借本次 HOW 修改新增 schema。产品 domain 校验和安装静态引用审计为当前适用验证。

## 范围与继续边界

src 最大文件 624 行。为保持 650 行 gate，仅拆出 Integration ref 推导到独立 internal 文件；不压行、不改 gate。

未修改 Proposal/design/delta specs、canonical specs、旧 Runs、bootstrap Skills、历史 Delivery 或 runtime 版本。manifest 中本 Change active/projectOrdinal 34 是 008 已有状态；继续保留。未实现后续 Full Test 范围/存储配置、Start Git 放松、Final 简化、新宿主或 Archify。

必要 proof 位于本 Change 的项目内 .flowkit/artifacts；包和安装工作区位于可丢弃 .tmp，Linux 容器工作区随容器删除。复现使用当前源码、包 files/prepack、现有 exact runtime 与保留命令，不要求永久保留完整依赖或源码快照。

下一边界：由独立 Reviewer 执行 review-apply。Author 不自审，不自动 archive、commit、push 或执行下一 Action。STOP。
