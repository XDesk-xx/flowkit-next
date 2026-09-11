# Proof Explore：新项目接入与 Agent 薄入口

## 结论与分类

本 Change 为 Owner 明确纳入 D05 的单个 correct Change：纠正首次使用说明与当前能力之间的接入缺口，并清理旧规划入口。不是新发现的内核故障，不重新打开前六个 archived Changes。

Explore 结论：PASS（有界问题和最小 Proposal 方向已可确定）。这不是 Proposal approved、当前实现验收、真实跨会话 PASS 或 Formal Full Test。

- Delivery：20260908-05-lightweight-workflow-management。
- Change：correct-project-onboarding-and-agent-entry；projectOrdinal 39。
- 本次 Run：20260911-063-explore；物理组 007，独立于 ordinal 和 Run sequence。
- 当前基线：7af7d85788503dafc50ee162b14deaaf679f99cb；只用于本次源码/历史出处定位，不成为新项目安装或 Delivery Start 的 SHA 准入门槛。
- Owner 指令及相关边界见本 Run context.json。D05 仍 independent-bootstrap。

## 真实用例

一个已有代码的新项目接入 Flowkit。新会话只拿到项目位置与项目短入口说明，能够定位已选定的 manager 安装、明确实际 Role、查询当前 target 的最新合法边界，并找到对应安装内 Action Skill。

“根据最新 run，review”不是 flowkit review 命令，也不是按目录最大编号挑 Run。Agent 对照实际 status/next 输出解释用户指令；只有返回的合法 Action 与当前角色/请求匹配时才进入对应 HOW。仅查询下一步不代表授权执行它。

## 关键事实、proof 与决定影响

### E063-01：发行能力存在，首次接入路径未整理

- package.json 已声明 bin=dist/cli/entrypoint.js、manager 自有资产 allowlist 和 Node >=22.20.0；package private=true，不能把 npm 上公开可安装的 latest 当作已经交付事实。
- 当前源码实际 build 成功。npm pack --dry-run --ignore-scripts --json 返回 91 个发行条目，包含 README 和 bin，不含三份根规划文档、src/tests/.agents/.flowkit/openspec 项目历史。
- 这是当前 build 的发行清单检查，不是新安装验收，也不证明依赖安装或包运行完整通过。
- manager-installation.ts 从模块自身定位安装元数据；request.ts 只接受既有 repositoryRoot/flowkitHome 和有限可选选择，不提供自然语言命令、manager-root override 或 init。
- README 开头仍称 D02 完成并列旧固定六项 Full Test，后半却解释 D05 项目配置和 Agent 记录，两类时态混合会误导第一次使用。
- 决定：先提供随固定发行包交付的当前接入说明及小型项目入口模板，不增加 CLI init、不依赖开发 checkout、不要求全局命令覆盖。发行采用 Owner 选定的确切本地包/受控分发包及其运行依赖；包内容校验用于安装选择，不变成 lifecycle authority。

证据：current-build/command.json、package-inventory/command.json、query-observations.json、source-audit.json。

### E063-02：初始化、查询就绪与 Action 就绪必须区分

对仓库 .tmp 下的独立 target 运行当前 build，未触碰 D05 自身生命周期：

1. OpenSpec root 存在而无 active Change：next 返回 idle、decision=null。
2. 显式选择 planned Change：返回 blocked/change-not-active，不能把查询退出 0 当作可执行。
3. 用明确标为合成的 activation fixture：空历史返回 ready-action/explore，未创建 Run、未执行 Action、未复制 Skills，原有示例文件保持。
4. doctor 用真实 exact OpenSpec 1.10.0 检查；只表示它负责的工具/root 诊断，不代表项目完整接入或真实执行已验收。

此外实际执行 exact OpenSpec init .tmp/onboarding-039-init --tools none --no-copilot-cloud --no-animation：生成 OpenSpec config/changes/specs/archive，不生成项目级 AI tool Skills。--no-copilot-cloud 因未选对应工具被上游忽略；文档最小命令无需保留该无效选项。上游显示的 /opsx:propose 提示不能替代 Flowkit 的合法 Action 查询。

决定：接入说明按用途说明最小材料，不做一刀切前置：
- 查询：已有 target、OpenSpec root、已选安装/工具来源和临时请求 JSON。
- 开始 Delivery/Change：另有 target project identity、Owner 选定规划、既有 manifest/activation 与依赖事实；首次 ordinal 按既有 HOW/Owner 初始化边界，不从空目录猜历史、不新增计数服务。
- 执行后：真实 Runs 与必要 artifacts 按既有合同产生，不预填成功记录。
- Full Test：到该节点才要求 target 自己的 full-test.json；不把本仓库九项检查照搬到所有 target，也不绑定 .gitignore。
- 已有 OpenSpec/AGENTS/项目配置仅做明确缺项补充和有界合并，不使用 --force，不覆盖或清理原有内容。接入不自动启动 Delivery 或激活 Change。

证据：query-probe.mjs、query-observations.json、四次命令原始流；openspec-init/command.json。合成 activation 仅证明机制，绝不作为 Owner 授权或真实 Action 证明。

### E063-03：Agent 入口应指路，不再拥有流程

- 已有 canonicalActionGuidancePath 将 exact actionId 定位到 skills/actions/<actionId>/SKILL.md。
- next 的 ready-action 给出 actionId，status.currentRun.role 表示已有 Run 的执行者，不应误当下一 Action 的执行角色。
- 035 archived design 明确：查询 CLI 退出；Agent 依已确定 Action、Role、package/admission 工作；不需要 target 长期 helper。
- 决定：项目入口仅包含 target、明确的安装定位约定、Role/请求边界及随包说明入口。安装路径可由用户按本机实际设置、迁移后更新，不新增持久安装身份/schema。
- 收到 review/revise 简称时只能在查询给出唯一匹配阶段后展开；不把自然语言匹配做成代码路由器或第二套 Policy。未知目标、歧义、blocked、partial、bootstrap-history 或角色不符就报告具体事实并停下，不从聊天补造 legal boundary。
- 接入文档不复制十个 Action 的执行规则。若新增条款确实改变某 Action 的 normative HOW，只修对应 canonical Skill；不建立统一 transitive normative graph 或镜像全部 .agents。
- D05 bootstrap 的 latest Run 与未来产品 canonical Run 明确区分，不能用本次 063 bootstrap 作为新项目 canonical 记录示例。

### E063-04：根目录三份旧规划可以按明确范围退役

精确目标：
- flowkit-next-d04-stable-core-closure-final-reference(1).md
- flowkit-next-d05-decoupling-analysis.md
- flowkit-next-delivery-change-plan.md

只读 git show 核对三者当前 bytes 均存在于基线 checkpoint，可从 Git 找回。所查 src/tests/scripts/skills/config/.agents/README/AGENTS 中没有这三个 exact filename 的当前读取；匹配项为 D04/D05 manifest 的规划出处引用。当前 package 不发行它们；Full Test inputs 也没有这些根文件。

重要区别：Start 的 readStartFacts 确实读取任意本次 planningReference.artifact。不能由上述扫描推导“未来项目所有规划都可以删除”。本轮只退役这三份既有开发规划，不重演已完成 Start，也不改变 Start 的当前规划输入合同。

最小处理方向：
- 当前产品用法归 README、随包接入说明和 OpenSpec；不是把旧长文复制到新永久目录。
- Apply 明确删除三文件，并在本 Change 的清理交接记录每个原路径及可恢复的 Git 出处；不创建 git: URI runtime resolver。
- 旧 Runs、archived Changes 和历史 D04 manifest 不重写；其路径是原执行出处，不伪装为仍存在的活动文件。
- D05 manifest 原 Start reference 保留原出处语义；如需简短说明退役及新接入说明的归属，仅窄改当前 bootstrap 说明，不迁移 schema、不改旧 Owner 决定、不凭空改成新的 Start 来源。
- Apply 验证实际删除后的相关读取/归档/文档链接，不能只用全仓 grep 零命中作为完成要求，也不能要求历史引用全部消失。

证据：source-audit.json（exact source refs、长度/hash、引用位置和 Git 恢复出处）；当前源码读取点 src/internal/delivery-start-content.ts、src/cli/trusted-change-coordination.ts、src/internal/delivery-final-coordination.ts。

## 验收边界：不以模拟补 PASS

三种验证分别命名：
1. 当前实现与安装验收：固定实际发行包，在普通独立 target 保留已有文件，按短说明完成一次真实、有界 Author 工作及 Run 保存。不是只写 terminal JSON，不要求完整 Delivery 或人为 finding。
2. 独立 CLI 进程读回：前一进程退出后，新进程查询真实记录；只能声称进程读取，不称新会话。
3. 真实新会话读取：不继承本次聊天/解题提示，仅凭 target 位置及项目短入口，自行找到安装、实际最新 Run、合法下一边界与正确 Skill，报告依据后 STOP。无需额外执行第二次 Action，也无需真实 Review verdict。

本轮第 3 项 NOT EXECUTED，第 1 项也未执行；现有机制探针全部是 Explore 实验。后续若没有真正独立新会话，必须保留“未执行/待验收”，不能靠子流程换名、合成 Reviewer 或重启 CLI 勾成完成。该限制不妨碍当前边界进入 Proposal，但不能预先宣称最终接入验收已闭合。

## 最小 Proposal 方向与非目标

限定四项：固定包/工具与首次接入说明；项目 Agent 薄入口；README 当前/历史说明分离及真实分层验收；三份根规划退役和相关引用交接。

优先复用 foundation-cli-surface 的安装/独立查询合同、author/reviewer-action-guidance 的角色与 HOW 归属；确需新增可验收的首次接入条款时，在对应 delta 中表达，不重写已接受的 Policy/Run/Action 机制。不因名称 correct 推断必须修改 src；当前 proof 不支持内核重构。

禁止扩张：新 CLI 写命令、自动 Role 切换、自动 Author/Reviewer 循环、自动下一步、Skill/Provider Registry、模型平台、每项目复制系统 Skills/lock/scripts、长期 glue 工程、通用 installer/迁移/清理平台、Archify、全 provider 支持、强制新 SHA/全仓 clean 门槛。

本轮仅创建 scaffold、激活 coordination、写 Explore 与真实 Run/proof。没有 proposal/design/tasks/delta，没有源码/Skill/README 修改，没有删除三个目标文档，没有 Full Test/Final/Git mutation。下一边界是独立 review-explore，STOP。
