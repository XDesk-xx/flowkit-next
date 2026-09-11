# 025 Apply 交接

## 结论与边界

本轮消费 024-review-propose approved（其审核对象为 023-revise-propose），落实 021/022 已收敛边界。CLI 仅 status/next/doctor；Agent 使用既有 package/Guidance、Role、admission、transition 与 create-once 文件工具记录一个 Action。未添加产品写命令、宿主协议、进程锁、服务或 target 永久 helper。

D05 本轮仍为 independent-bootstrap。example-target 中的 canonical Run 仅为批准任务 5.1 的普通测试项目实作，不是 candidate 自我管理 D05。019 缺 Result 仍保持缺失，不补造成完成。

## 修改与保留

- 保留/收敛 target 与 exact OpenSpec root、trusted coordination、唯一 previousRunId 链；prepared 不再依赖协议键，损坏/partial 不当作空历史，terminal FAIL 不回退旧 PASS。
- 撤出 5 个旧协议专属源文件及 5 个专属测试，exact 路径及可恢复原始 bytes 见 baseline.json / removed-source；历史材料未删除。
- complete-record writer 失败保留已写部分，既有拒绝目录/唯一序号/round-trip 不变；不是任意 partial 完成器。
- 产品十个 HOW 提供分段记录与材料检查示例；bootstrap 十个 HOW 独立说明开始、未完成和相关 Owner 决定。单个 HOW 不委托公共规范图，产品不消费 bootstrap。
- 四条通用 raw-stream attributes 沿用并经当前回归验证；无逐 Change 例外，无 .gitignore/Full Test 联动。
- README/AGENTS 与 manifest 描述同步。相对本轮 baseline，manifest 仅第 22、63、70 行变化，id/state/ordinal/依赖/Owner facts/其他 Change 不变。scope-verification.json 已校验 36 个保护文件。

## 当前候选验收

Windows 原生 domain 最终 280/280，安装/分根 acceptance 6/6；Linux x64 glibc 2.36 / Node 22.23.2 离线 domain 280/280、acceptance 6/6，零 skip。Linux 独立安装依赖，不复用 Windows node_modules；最后追加的“无关旧 proof 不扫描”用例在 Windows 完整 domain 再验证，Linux 此前已覆盖同一生产读取实现。

typecheck/build、format:check、lint、dependency-health、entropy 43/43、entropy 自测 7/7、禁止产物、git diff --check、OpenSpec 1.10.0 strict validate 均通过。受影响 source/tests 20 文件，最大 595 行，限值 650 包含空行与注释。未调整 gate 或压行。

首次格式化/类型/构建的 sandbox spawn EPERM 记录保留；在限制外重跑成功。安装测试旧错误对象断言未包含新迁移说明，已按实际错误更新并重跑 6/6；lint 的无用 catch 已去掉并回归保存语义。失败原始输出不删除。

真实示例顺序：example-start → example-work → Author explore.md → example-finish → 独立 example-status/example-next。源 seed 是测试项目，读取、四种输入观察、报告和记录为本次实际 Author 工作；不是合成 approved。next 返回 review-explore，没有执行 Review。HOW 注入测试明确为合成，验证开始保存失败不做业务写入、之后失败保留 partial、重复完成不覆盖、Role/材料错误及 prepared/FAIL 区分。

必要材料在各自 target artifacts 内；checkProof 核对实际文件归属、真实路径、regular/readable、Buffer size/hash。实际例子接纳前比对观测退出状态和报告结论；hash 不证明独立审查。查询不扫描 proof，旧无材料键 Run 可读；相关消费仍应复核其确需引用，而非默认依赖全部历史。

## 相关 Owner 决定

来源为本轮 context.json 的 ownerSourceRef 与其指向的用户输入、021/022、023/024 链：

- CLI 读取/报告，Agent 执行/记录；不引入替代回交协议。
- 停止固定双 Change/finding 演练；一个有界真实工作示例足够，不要求第二套安装。
- 必要材料保留 target artifacts，.tmp 可丢弃；不清理历史，不外置必要唯一副本。
- D05 独立 bootstrap；普通 Action 不增加 Owner 审批，独立 Reviewer 仍保留。
- 本轮只 Apply；没有 Full Test、Archive、Git 或自动下一 Action 权限。

## 后续

交独立 review-apply，核对累计未提交候选与本轮精确删除列表；不要仅看新加文件而遗漏 019 延续的修改。reviewerVerdict 未填写，Author PASS 不代表 Review approved 或 Delivery Full Test。STOP。
