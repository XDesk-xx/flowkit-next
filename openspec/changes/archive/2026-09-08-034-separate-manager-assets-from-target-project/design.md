## Context

问题与范围见 `proposal.md`。`009-review-explore` 已批准 `008-explore` 的分根边界，无阻断 finding；实验不是安装后的产品验收。该 Change 跨 resolver、CLI、Action/Delivery 调用和发行，因此需要 design。

当前 `repositoryRoot` 同时被用于系统 lock/Guidance 与项目 cwd。Run persistence、coordination、Git、项目内容读取中的同名参数却确实属于 target，不能机械全仓替换。

## Goals / Non-Goals

目标是一个可独立安装的 manager，使用自己的静态资产管理任意满足现行 OpenSpec/项目输入合同的 target。只改根归属和必要安装内容，不新增发现或管理服务。

不新增宿主接入、自动 current、Full Test 配置/结果协议、Start 去 Git 前置、Final 简化或 Git 执行。四个 Delivery operation 仅改 Guidance 来源，不改变其 candidate/check/evidence/authority 语义。不存在“为了移位顺手取消其余 gate”的任务，也不把安装检查变成每个操作的全局准入。

## Decisions

### 安装入口拥有 manager 根，项目请求只拥有 target

采用一个小型内部安装定位模块，根据自身模块 URL 的固定 package 布局定位安装根；源文件和编译布局分别为 `src/internal/`、`dist/internal/`，都能相对定位 package 根。使用当前 host path/realpath 处理实际安装位置，不从 cwd 或 target 向上搜索 package。

内部只读安装描述包含 canonical root 及自身 `package.json` 的 name/version；它是位置与安装标识，不是签名、内容认证或生命周期权威。缺失/无效安装元数据准确报告安装错误，不使用 target package 补齐。无需新增数据库、随机 installation id、整包 SHA、签名或 Registry。

生产入口从自身安装建立描述并传给直接消费者；库默认入口同样从自己的安装解析。测试可在 trusted host 层显式传入 fixture 安装描述，不把测试 seam 暴露为 CLI JSON 的 `managerRoot` 或任意资产路径。TypeScript 类型不是跨进程安全边界；可信来源由 host 调用链承担。

备选“沿用 target root，缺什么复制什么”会保留已证明的耦合；备选“从 cwd/环境扫描多个安装”增加歧义。两者均不采用。CLI 继续接受既有 `repositoryRoot`/`flowkitHome` 等字段，machine result 和 command catalog 不为分根增加新层。

### 路径归属一览

| 读取/执行对象 | 根 | 接入方式 |
| --- | --- | --- |
| `config/tools/toolchain.lock.json` | manager 安装 | managed resolver 接受安装来源，不把 target 当 lock 根 |
| `skills/actions/<action>/SKILL.md` | manager 安装 | fixed path + content hash，single Action 传递同一安装来源 |
| 四种 Delivery Guidance 及 exact read | manager 安装 | prepare 与 invoke/read 显式复用同一安装来源 |
| OpenSpec entrypoint | `FLOWKIT_HOME/tools` | 保留 exact package/version/entrypoint 与 confinement |
| OpenSpec child cwd / root 比对 | target | 保留两种只读观察和原诊断，不经过 shell |
| Run、coordination、项目 artifact、Git/测试 cwd | target | 既有参数及写入路径保持，不能随 manager 参数一起替换 |

低层解析接口移除含混的“repositoryRoot 就是任意资产根”语义，统一接受 trusted 安装描述；现有域入口仍显式持有 target，需要系统资产时再传安装来源。选择追加明确的 host-owned 参数/选项，不修改 persisted package/Run/Result schema。所有实际调用点同步迁移，不保留从 target fallback 的旧重载。

### Guidance 在准备与实际消费之间保持同一归属

`GuidanceRef` 继续仅保存固定相对 path 与 content SHA-256；该 path 解释为 manager-relative，不保存绝对安装路径。相同内容移位不改变引用；bytes 改变继续触发已有身份/内容不匹配规则。

Action 的 resolver、single-action package-bound prepare/execution 使用同一安装来源；不改变 staged/prepared/terminal、Result admission 或 callback 次数。Delivery 的 Start、Full Test、Final、Integration 的 prepare 与 exact read 都接入同一来源，不能让 preparation 查 manager、execution 又查 target。

操作执行中不支持热切换 manager 安装；正常升级由后续调用加载新安装，旧 package 所绑内容不同则按原语义拒绝。无需跨版本缓存、历史 Guidance 服务或重写旧 Run。对已有相对引用的历史记录，保持原 bytes 与已保存的内容身份，不用新安装替它宣称当时实际 HOW。

### 工具依赖按实际用途检查

OpenSpec observation 先使用 manager lock 解析工具，再以 target cwd 执行及检查返回 root。doctor 仍有 `openspec-runtime`、`openspec-root` 两项诊断；status 仍读取 selected Run 与 OpenSpec；不调用工具的 Guidance/next 路径不新增 OpenSpec preflight。

保留现有 missing-lock/runtime、package mismatch、entrypoint、process 与 root-mismatch 分类，不添加安装源 tgz 重验、全 runtime hash 或 target lock 要求。安装定位可读取必要 package 元数据，但不在每个入口遍历全部 Skills、历史、工具和 target 文件。

### 最小发行包与真实安装验收

沿用现有 package/bin 与包管理器分发方式。增加明确 `files` allowlist：生产 `dist`、系统 `skills/actions`、`skills/delivery`、`skills/tools/openspec`、它们实际引用的 OpenSpec vendor/reference 资产，以及 `config/tools/toolchain.lock.json`；package 元数据、README/license 依包分发常规处理。运行依赖仍由 `dependencies` 声明并安装，不把 node_modules/runtime 打入包，也不要求 target 安装 manager 的 devDependencies。

Apply 逐一核对本次保留 Guidance 的静态引用：管理 HOW/工具说明相对 manager，项目 OpenSpec/源码/日志示例相对 target。只补发行必需资产及根说明，不构建通用 Markdown 依赖图或 Runtime Skill loader。若某个产品 HOW 错把 target 的 Flowkit scripts 当系统工具，收敛其资产定位说明，但不提前实现后续 Full Test 项目配置协议。

从干净 build 输出生成实际包，隔离安装到 manager A，提供正常 production dependencies 后启动包声明的 bin。验证产物不依赖源码 checkout、tsx、开发脚本，也不含旧 ignored dist 遗留。将同一运行安装放到 manager B 后访问同一 target；不向 target 安装或复制 manager。无需公开发布 npm、生成全局安装器或改动用户现有安装。

### 活动指导与历史边界

更新 README、AGENTS 的当前安装/使用关系，不再要求普通项目以上一 Delivery commit 定义 manager。保留 D01–D04 的历史描述和 D05 独立 bootstrap 事实；不回写 archive、Run、旧 manifest 或 Owner 决定，不让本次 candidate 中途接管 D05。

对应产品 HOW 仅调整 manager/target/FLOWKIT_HOME 的实际路径说明与错误处理；`.agents/skills/**` 保持独立，不借本 Change 同步成产品 HOW。无需修改 Skill schema 或 Action/Runtime/Policy/Run schema。

managed-toolchain-resolution 的当前 Purpose 中 “repository-tracked identity” 在 archive 同步时明确为 manager-owned installed contract，避免根归属歧义；其余未受影响的 Purpose/requirements 不改。本轮 Propose 不提前修改 canonical specs。

## 验收与溯源

| 验收 | 合同/依据 | Apply 最小验证 |
| --- | --- | --- |
| 无 target lock/Skills/scripts 也能工作 | Explore bare-target、Owner D05 分根目标；tool/CLI delta | 实际安装 bin 的 doctor + status；status fixture 用既有工具创建合法 selected Run/coordination，不把 bootstrap Run 冒充产品 Run |
| 同名 target 资产不能接管 | Explore collision；Action/Delivery/tool delta | 冲突 lock/package/Guidance fixture；检查实际解析来源，缺 manager entry 不回退 |
| 准备/读取与 target 写入一致 | Explore 直接消费者闭包；Delivery delta | 覆盖四种 operation 的 prepare/read；实际允许写入的隔离用例只写 target，manager 不产生项目历史 |
| 移位不改变项目归属 | Explore relocation；CLI delta | manager A/B 实际安装，同 target 结果一致；target 测试配置及已有历史 bytes 不变 |
| 工具只在需要时检查 | tool/observation delta及原 resolver 合同 | 缺 OpenSpec 的 doctor/status 返回原诊断；非工具路径可用；真实 OpenSpec 1.10.0 返回 exact target root |
| 发行完整且精简 | Explore安装边界；CLI distribution delta | 实际包清单/静态必要引用可达/production-only安装运行，不含开发历史或外部 runtime |
| 旧语义不被分根破坏 | 原 Action/Run/Role/content contracts | 定向 root/Guidance/CLI/operation 回归及适用现行质量检查，Windows native 与 Linux x64 detached 结果分别报告 |

`008` 原始实验是当时反例；`009` approved 才是本计划采用的已接受依据；当前实现验收必须由 Apply against current candidate 产生。此处不把 26 个旧测试 PASS 当作新实现证据，也不要求后续每一步重读全部旧 proof。

必要执行材料沿用 target `.flowkit/artifacts/`，只保存支持结论的必要内容；临时安装/构建工作区可在 `.tmp`，但其删除不能使验收仅剩不可读路径。保留必要包清单、命令、实际结果与运行输入说明，不保留全量依赖/完整源码快照。原始日志不套源码格式 gate；本 Change 不设计新的证据存储、清理或 Git attributes 平台。

## Risks / Trade-offs

- [只改 resolver 遗漏执行读取] → 显式覆盖四 operation 的 prepare/read 与 single Action 接点，其他 target I/O 不动。
- [开发仓库可运行、安装包缺文件] → 用实际包的 production-only 安装运行，不以复制整仓或 source imports 代替验收。
- [移位被 mistaken 为新项目/新测试输入] → manager identity 不持久化为 target candidate 字段；不修改现有 Full Test 范围算法，完整测试解耦仍留后续 Change。
- [旧调用者把 target 传作资产根] → 作为明确的低层 breaking change 统一迁移调用/fixtures，CLI request 保持；不做隐式兼容猜测。
- [源码文件超过 gate] → 保持 650 行，只因实际职责/超限拆分，不压行、不放宽规则、不扩到原始日志。

## Migration Plan

在本 Change 内先完成分根接口和调用闭包，再完成安装包/适用验收与活动指导。原 target 的同名文件可以保留，但不再被系统资产解析使用；不自动删除用户文件或迁移 target 历史。外部 runtime 不安装、不升级、不卸载。

未满足安装验收不宣布此 Change 完成；实现修正按正常 revise 边界处理。已安装版本的切换由正常用户部署决定，不增加自动升级/回滚平台。当前 Propose/Review 不发布、安装或执行 Git。
