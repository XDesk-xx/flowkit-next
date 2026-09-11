# 028 Review Apply

结论：`approved`。审查对象为 `027-revise-apply` 的累计候选，依据 `024-review-propose` 批准计划和 `026-review-apply`；不是 Formal Full Test 或 Delivery 完成。

## Finding 闭合

- **D05-RA026-001 — closed**：canonical group 以数值前缀后的完整 ChangeId 匹配，bootstrap 仍 exact identity。独立探针确认无当前历史、多个后缀重叠 Change、数字开头的合法 Change 均选择正确；当前目标的非法前缀、重复、混合、partial 仍 fail closed。生产修订仅涉及原匹配表达式，未迁移历史。
- **D05-RA026-002 — closed**：HOW 的 currentForExecution 复用 exact same prepared；null/不同 terminal 走既有 transition，其他 prepared target 拒绝。独立执行 Explore 示例完成“prepared 失败 → 明确新执行 → 新 occurrence/package → terminal/查询”，旧三文件 Buffer 不变，重复 occurrence 拒绝；内核 duplicate prepare 仍拒绝。
- AGENTS 已撤出旧 action 命令表述。检查当前正文及累计 diff，不将无法取得的旧全文假定为只有一个 exact 字符串变化。

## 范围与验证

- 当前步骤：修订后独立 Review，不实施修改。无新增阻断 finding。
- 最小性：本轮 15 文件修订对应两个 finding、HOW 测试接点和直接说明；没有新协议、公共 API、Registry、生命周期或恢复平台。
- `scope drift: NONE`。56 个累计候选文件中 41 个与 025 相同；67 个历史/计划/内核/manifest 等受保护文件核对不变。批准计划保留，019 仍无 Result，不补造历史。
- 本轮核对 209 个必要精确引用；10 项既有删除仍缺席且备份 hash 对应。22 个 source/test 文件最大 595 行，650 gate 未放宽。
- Reviewer 独立执行：7 文件 23/23 定向测试，9 组有对照的探针观察，exact OpenSpec 1.10.0 strict 和 git diff --check 通过。
- Author 当前 13 项命令的元数据、原始流与声明一致；Windows/Linux domain 284、acceptance 6 的通过记录已核对，未由 Reviewer 重跑完整平台套件。
- 独立 Skill 禁止候选同阶段 HOW 自证，因此未读取其执行说明、未执行候选 review-apply HOW 或全 HOW 测试循环。独立探针执行的是 Explore 示例；其余九个非当前阶段示例的修正函数一致性已核对。Author 全十个 HOW 测试仅作为验证材料，不代替本次独立 verdict。

## 方法限制与证据保留

`attempt-01` 的 sandbox spawn EPERM 保留；获准后 `attempt-02` 中 Reviewer 探针错误地多传顶层 actionId，Policy 正确拒绝。原脚本/流保留，probe-v2 增加该错误输入的拒绝对照并使用正确字段，`attempt-03` 五项命令全部 exit 0。

首版引用审计误将 AGENTS 修订假设为可通过单字符串反向替换恢复全部旧 bytes，断言失败已另存；第二版改为检查可证实的当前正文、累计 diff、当前身份及其他受保护对象，不声称未验证的 exact 单行 delta。未修改 Author 文件或豁免产品测试。审计脚本首次工具编排因模板插值错误未开始执行，修正编排后才创建脚本。

原始输出、失败记录、修正方法和 audit.json 都在本 Run 的 proof 中；不覆盖历史证据。必要材料长期保留不等于旧 PASS 自动适用。

## 交接

本次 approved 对应既有后续 `archive` 交接；未执行 Archive、Formal Full Test、Delivery Final 或 Git，不产生新的 Owner authority。D05 仍 independent-bootstrap，candidate 没有接管实际仓库生命周期。

Reviewer 只写本次三文件 Run 和自身 proof；保存后 STOP。
