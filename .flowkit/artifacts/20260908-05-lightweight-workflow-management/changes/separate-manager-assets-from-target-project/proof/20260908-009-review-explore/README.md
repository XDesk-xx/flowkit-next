# 009 Reviewer bounded proof

对应 `008-explore` 的独立 review-explore。方法为 `audit.mjs`，实际成功输出见 `attempt-02/summary.json`。

执行：

```text
node .flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/separate-manager-assets-from-target-project/proof/20260908-009-review-explore/audit.mjs attempt-02
```

摘要绑定 54 个当前输入引用及本次原始命令/输出/fixture bytes。核查了 Author Explore/Run/manifest/proof、来源源码和前一 Change archive 映射；未执行 Author 的 finish.mjs，未改写其结果。

独立 fixture 使用惰性文本 Guidance，不读取或执行产品同名 Reviewer Skill。复现 bare-target failure、target collision、资产移位、exact Delivery read 和 missing-runtime；真实外部 OpenSpec 1.10.0 在 bare target 返回精确 root。collision 独立于 bare target，避免后写的碰撞文件混淆 OpenSpec 调用输入。

Author 26/26 定向测试是已核对的历史原始输出，本 Reviewer 没有再次执行。分根组合实验不是安装包/CLI end-to-end 或 Linux acceptance，不执行候选生命周期或 Formal Full Test。

## 失败与恢复

- 方法落盘前，工具调用构造模板中的 FLOWKIT_HOME 插值被误求值，返回 `ReferenceError: FLOWKIT_HOME is not defined`；该调用未执行文件写入或实验。改为字面量拼接后生成脚本。
- 实际 `attempt-01` 在启动只读 Git 子进程时被沙箱以 EPERM 阻止；原始命令、stdout/stderr 与 failure.json 保留，不当成通过。
- 同一 audit.mjs 获准在沙箱外以新目录 `attempt-02` 成功执行；没有修改产品、校验目标或第一次输出来获得成功。

必要证据在本目录长期保存；原始日志不套用源码文本格式 gate。审核结论在对应三文件 Run 内，不由 proof PASS 自动产生。
