## 1. 安装根与工具来源

- [x] 1.1 建立 design 所述内部安装定位/只读描述，从自身模块位置与 package 元数据取得 manager 来源；用不同 cwd、target 同名 package、安装移位及缺元数据 fixture 验证，不增加 CLI root override 或 target commit 前置。
- [x] 1.2 将 managed tool resolver 的 lock 来源改为 manager 安装，保留 FLOWKIT_HOME exact runtime 及原诊断；验证 target 无 lock/冲突 lock、missing runtime、package mismatch、entrypoint confinement，不依赖 PATH 或安装源归档。

## 2. Guidance 与项目事实分根

- [x] 2.1 将 Action Guidance resolver 与 single-action 调用接点接入 manager 来源，保留 relative path/content identity、准备顺序和包绑定；以分根 fixture 验证同名 target 不接管、缺系统 Guidance 不 fallback、移位引用不变及非工具路径不查 OpenSpec。
- [x] 2.2 迁移 Delivery Guidance resolve/exact read，并贯通 Start、Full Test、Final、Integration 的 prepare/invoke；以四类定向测试确认两次读取同源、内容漂移仍拒绝，项目 I/O/Git/检查 cwd 仍为 target，其他 operation 合同不变。

## 3. OpenSpec 与 CLI 接入

- [x] 3.1 分离 OpenSpec observation 的工具来源和 target cwd，保留两种只读观察与 process/root 诊断；用真实 exact OpenSpec 1.10.0 对无 Flowkit lock/Skills/scripts 的独立 target 验证 list/status 及错误根拒绝。
- [x] 3.2 从 CLI 安装入口注入系统来源，保留 request/result 及 status/next/doctor 集合；验证 target 同名资产无影响、额外 root override 字段仍被拒绝、next 不新增 runtime 前置，合法 selected Run/coordination 的状态读取仍正确。

## 4. 最小发行与活动指导

- [x] 4.1 配置最小发行 files 与必要静态资产闭包，从干净 production build 生成实际包；核对包清单不含开发 `.agents`、目标历史、旧 dist 遗留、测试工作区或 executable runtime，运行依赖无需 target devDependencies。
- [x] 4.2 同步 README、AGENTS 与受影响产品 HOW 的 manager/target/FLOWKIT_HOME 路径和安装身份说明；逐项核对必要静态引用可从安装解析，历史文件和独立 bootstrap Skills 未修改，不夹带 Full Test/宿主/Git 后续功能。

## 5. 当前候选集成验收与交接

- [x] 5.1 从实际包建立 production-only manager A 安装，运行 package-declared bin 的 doctor/status 访问独立 target；提供由既有 fixture/helper 形成的合法产品 selected Run/coordination，核对实际输出而非合成成功 JSON，不用 bootstrap Runs 冒充产品记录。
- [x] 5.2 将同一运行安装置于 manager B，验证同 target 结果及 Guidance identity 不变；用合法隔离写入用例确认项目内容只落在 target，既有历史/测试配置不迁移，manager 不接收项目历史，覆盖同名冲突与必要 runtime 缺失。
- [x] 5.3 执行适用 domain/acceptance、typecheck/build、format/lint、dependency-health/entropy 检查；保持 src 650 行 gate，按需要拆分，分别保存 Windows native 与 Linux x64 detached 安装/回归的真实命令及结果，不把本轮验收称为 Delivery Formal Full Test。
- [x] 5.4 核对需求—实现—当前验收对应关系和未改的后续 Change 边界，将必要材料保存到本 Change `.flowkit/artifacts/` 并完成真实 Apply Run 交接；历史 proof 仅作依据，不代替当前 PASS，原始日志不执行源码文本 gate，停止于独立 review-apply。
