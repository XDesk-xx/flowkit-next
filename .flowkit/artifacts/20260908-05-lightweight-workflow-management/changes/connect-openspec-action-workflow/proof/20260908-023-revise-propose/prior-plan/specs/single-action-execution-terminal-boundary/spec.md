## ADDED Requirements

### Requirement: A supported interactive host executes one exact Action through the runnable CLI

系统 SHALL 支持一个既有交互式 Agent/终端宿主通过 `flowkit action --input <path>` 的同一存活进程完成 JSON Lines 往返：接收 exact ActionPackage/HOW 的 preparation 请求，回交 ready/blocked；ready 后接收同一 package 的 execution 请求，完成实际工作并回交一次结构化 Result。宿主 SHALL 不必实现 callback 或创建 Run。准备往返 SHALL 是同一次 invocation 的内部步骤，不成为新 Action/审批/STOP。stdout SHALL 为协议、stderr 为诊断，不混入任意工具输出。不得启动模型 API、Provider 调度或自动角色循环。

#### Scenario: A host completes one Action
- **WHEN** 宿主按同一 package 完成只读准备和真实执行并回交合法结果
- **THEN** 系统 SHALL 只接纳该次 Result，并在持久化读回后报告一次完成及 STOP

#### Scenario: Preparation blocks without mutation
- **WHEN** package-bound preparation blocked
- **THEN** SHALL 保留进入前 current，不派发工作、不创建独立 preparation Run，不暗中执行另一个 Action

#### Scenario: Malformed or missing response never means success
- **WHEN** 宿主 EOF、缺失回交、越序/额外帧或回交身份不匹配
- **THEN** 系统 SHALL 拒绝并报告阶段与实际保存情况，不假造 completed 或自动重试

### Requirement: Host invocation reports completion only after evidence admission and durable readback

宿主入口 SHALL 依次完成合法目标核对、exact package/preparation、受控 occurrence 占用、真实 execution、必要 proof 保存校验、exact Result admission、最终 context/result 写入和读回，之后才报告 terminal。结果中的 continuation SHALL 与既有 Policy 对本次完成事实的判断一致；领域失败/changes-requested SHALL 可作为真实 terminal 结论，不等于 transport 成功伪装测试 PASS。入口 SHALL NOT 将内存 terminal 返回当作 durable completion。

#### Scenario: Result is admitted but persistence fails
- **WHEN** 内存 admission 成功但必要写入/读回失败
- **THEN** 入口 SHALL 报告失败和已有副作用，不发 terminal 成功，不自动回滚项目修改

#### Scenario: Necessary proof is missing
- **WHEN** 宿主声称完成但声明必要 proof 不可读、损坏或归属不匹配
- **THEN** SHALL 不接纳其成功，不借旧 proof 或文字说明替代

#### Scenario: Reported next boundary conflicts with existing Policy
- **WHEN** 回交 Result 声称跳过独立 Review 或不合法的 next
- **THEN** SHALL 拒绝其 admission，保留失败事实，不复制另一套 lifecycle table

### Requirement: Actual host acceptance includes independent review and cross-session continuation

该接入 SHALL 通过实际受支持交互宿主推进两个隔离 target Changes 的真实 OpenSpec Action 链，包含一次真实 revise 与独立 Reviewer 工作；重新开启会话后 SHALL 无需提供 Run 序号续接。callback 单元测试、回显进程、合成 Reviewer approved 或 transport proof SHALL NOT 替代该验收。独立 Reviewer SHALL 保持自己的 Role 和写入边界。

#### Scenario: Two Changes continue across sessions
- **WHEN** 使用实际安装 CLI、exact OpenSpec 和真实 Author/Reviewer 完成两 Change 链及一轮 revise
- **THEN** 每次 invocation SHALL 产生对应三文件，跨会话按正式事实继续，无自动 Role 切换、自动下一步或每步 commit

#### Scenario: Only a simulated executor has passed
- **WHEN** 仅有 callback/协议 fixture 或人工编造 verdict
- **THEN** 验收 SHALL 标为未完成，不声称真实宿主接入 PASS
