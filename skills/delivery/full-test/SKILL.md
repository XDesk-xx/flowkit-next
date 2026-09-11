# Delivery Full Test

Execute an already-authorized `delivery-full-test` operation; Verification does not grant correction or Git authority.

## Contract

Guidance 从同一 manager 安装解析并 exact read；项目配置和所有项目写入归 target。通过发行包已有 `invokeDeliveryFullTestOperation(repositoryRoot, {deliveryId, ownerAuthority}, installation)` 调用，不需要 target adapter 或写 CLI。

1. 从 target 固定 `config/verification/full-test.json` 读取 inputs/exclude/environment/checks；checks 显式 program/args/cwd，不接受 caller checks/priorFacts、不从 Git 或 package scripts 推导。
2. 核对配置/实际工具/声明环境与有界文件输入，使用独立 inputRef。被 ignore/untracked 的选中产品仍覆盖；真实 Runs/artifacts、非产品图文和合法管理变化不自动使测试失效。命令须实际遵守范围，父配置不是子进程沙箱。
3. 建立 create-once UUID attempt；先保存并读回 start.json，再窄写并读回 Delivery fullTestAttempt/fullTestStatus，之后才执行。必要开始、命令、stdout/stderr 原始 bytes 与结果保存在 target `.flowkit/artifacts/<delivery>/full-test/<attempt>/`，不保存到 manager 或仓库外，不使用 Standard Action Run。
4. 每次调用按声明顺序真实执行全部检查，不跨尝试 reuse。输出打开/保存失败不得 PASS，partial 原样保留。新失败/中断不选旧 PASS；只读准备不是 durable start。
5. 消费者使用 `readCurrentDeliveryFullTest(repositoryRoot, deliveryId)` 读取当前关联、归属、完整材料与当前输入；不枚举最大目录、不由 caller outcome 替换。必要材料损坏先处理材料问题，不因图文变化盲目重测。
6. 需要修改产品时按正常 Change/revise 权限 STOP；重跑前先用当前 reader 报告已有失败/partial，后续明确授权调用创建新 attempt，不补造旧结果或自动恢复。平台 fixture 可不同但语义义务不削弱。
7. STOP。Full Test 不决定下一 operation，不自动 correction、Final、Git 或 Review。

## Non-goals

无检查 Registry、PASS 缓存平台、日志转存平台、自动恢复/清理或新的 Runtime/Policy/Run schema。普通 Action 的 shared v2/reuse 不受本 operation 改变。
