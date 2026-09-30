## 1. 固定命令与开始前置

- [x] 1.1 在发行 CLI 中加入封闭的 `action start/finish`、`proof inspect` 解析与 `--input <file|->` 数据入口；仅 correction 接受受信宿主提供的 exact Owner fact，命令测试验证未知命令、重复 key、冲突 target、错误 Owner scope 和可执行/内部 authority 字段被拒绝。
- [x] 1.2 复用可信 coordination/OpenSpec/唯一链/Policy 解析，按 exact Action 和 Role 生成受控 occurrence；用集成测试验证错目标、错 Role/Action、断链、竞争 successor 与 caller 自填编号在写前拒绝。
- [x] 1.3 按 design 中全部 Standard Action 分组表将机器可判前置接到 package-bound readiness，保留 Agent/Reviewer 内容判断，复用 `startCanonicalActionRun()` 的当前安装 Guidance；用 archive 候选漂移、convergence dry-run/适用检查失败、completion-transition 阻断与 Reviewer 不自动 approved 的负例，以及 D06 伪造 Guidance 回归验证边界。
- [x] 1.4 在新开始记录中保存 `formatVersion: 1`、`commandOrigin`、受控 sequence、package 与 prepared context，create-once/读回后才报 `started`；用写入故障测试证明未写、写后未确认与业务开始顺序。

## 2. 跨进程接续与结果

- [x] 2.1 实现仅接受新格式开始记录的有界 finish 读取与重建，核对原 bytes、地址、前序、开始时绑定的 Owner fact、Guidance、Policy/package；用独立 CLI 进程测试完成 start→finish，并验证 conversation sourceRef 无需重读、finish 换 fact、旧未知 partial、损坏、漂移与安装路径变化的界限。
- [x] 2.2 将必要 proof 的归属、regular/readable、bytes/SHA-256、Git 原始字节检查复用于 `proof inspect` 和 finish；用好/坏材料测试验证 helper 不认定业务 PASS、finish 不信任 helper 旧输出。
- [x] 2.3 复用 exact Result admission 与 prepared/terminal transition，在首次 machine 文件写入前对拟存结果运行既有 Policy outcome/boundary 与 canonical Run-chain 可读性预检，写后读回唯一 canonical chain 与 Policy；用 `review-propose approved` + 错误 `nextBoundary=archive`、Author `FAIL` + null、Reviewer `rejected` + null、未知 verdict、prepared null 槽、archive 可信 completed facts、`context.json` 后写入失败及链读回失败验证不伪造完成；`rejected` 必须写前拒绝并保留已开始 partial。
- [x] 2.4 在完整记录重发时只读确认 exact 同值，冲突值和 partial 重发拒绝；用重复请求与并发 successor 测试验证不覆盖、不重做业务、不选取竞争 tip。
- [x] 2.5 将已支持的 prepared Owner correction 接入同一 start/finish，以现有 `OwnerAuthorityFact` 从受信宿主接收 conversation `sourceRef` 并在 start descriptor/package/context 绑定，核对真实 `revise-action` authority 与唯一后继；用 D06 correction 回归验证跨进程 finish、旧 Run/proof 原字节不变及无授权时写前拒绝。

## 3. 消费者与发行验证

- [x] 3.1 更新与 A 直接冲突的 Action HOW、CLI 帮助、README/接入示例为固定命令，保留实质角色与 proof 规则；Review HOW 明示 `rejected` 仍可作为真实判断，但本 Change 的固定 finish 不持久化该 verdict，必须报告未完成而不改写结论；用文档/包内容检查确认该限制、发行资产与无临时生命周期源码的正常路径。
- [x] 3.2 在独立 target 和同一候选 build 中执行一次真实 Author Action 的两进程开始/结束及第三进程 status/next 读回；记录命令、实际结果和限制，确认未把合成 Review 或旧 Explore proof 当本次实现验收。
- [x] 3.3 运行适用类型、测试、build、生产可达性、Git bytes 与 strict OpenSpec 检查；记录实际 PASS/FAIL、环境限制与候选身份，确认未触碰 B/C/F、Full Test、Git 或本 Delivery 的 Stable manager。
