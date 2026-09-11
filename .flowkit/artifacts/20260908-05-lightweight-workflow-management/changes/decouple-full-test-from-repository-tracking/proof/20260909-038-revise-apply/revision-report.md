# 038 revise-apply 修正交接

## 结果与范围

依据 037-review-apply 的 D05-RA037-001，修正普通 argv 被按文件存在性误识别为工具输入的问题。此为已批准 design §2、tasks 1.3–1.4 范围内的实现缺陷；没有修订 Proposal/design/tasks/specs。

仅修改 src/internal/full-test-tool.ts 与 tests/unit/domain/full-test-revision.test.ts。Node 启动入口与 preload 保持有界资源绑定；识别脚本后停止解释后续参数，inline eval 参数不当作脚本，支持 -- 分隔。非 Node 程序不猜测其参数的文件角色。真正产品/检查输入仍由项目 inputs 声明；不建立通用命令解释器、全量依赖扫描或新配置平台。

035 的工具包内实现漂移与准备失败诊断修复保持；必要工具变化仍使旧 PASS stale，新失败不回退旧 PASS。普通输出生成不升级为测试输入变化。

## 当前实现验证

- regression-before：sandbox spawn EPERM，保留原始结果，不作为产品失败。
- regression-before-native：9 项中原 3 项通过，新增 6 项失败，确认真实回归。
- regression-after：9/9 通过。覆盖新建/覆盖报告、普通 script / -- separator / inline eval；输出生成及后续改写不改变当前结论；旧 035 三项回归同时通过。
- counterexample-01：复制 037 原始 output-probe.mjs 到本轮自有目录原样重跑。两个真实入口均 check passed、exitCode 0、Full Test passed、current passed；files/configRef/inputRef/toolRef 全部保持不变。该脚本名称内的 independent 是原方法字面值；本次由 Author 重跑，不构成新的独立 Review。
- Windows domain 291/291、acceptance 6/6；format、lint/行数、typecheck、build、strict OpenSpec 通过。
- Linux 离线 code-only fixture：当前 lock 安装，9 项项目配置检查全部通过（domain 291、acceptance 6、entropy tests 7）。同一 build API 执行、当前来源读回、清除 .tmp 后读回、独立进程读回均通过。
- Linux 只是普通测试 target 验收，不是 D05 Formal Full Test。未调用候选管理实际 D05，实际 manifest 未修改。

## 材料与连续性

必要材料留本轮 target artifacts。命令记录与 stdout/stderr 为真实当前执行；第一次沙箱限制、修正前失败与修正后成功均保留。Explore 历史不是当前实现证据；036 历史 PASS 不代替本轮验证。

result.json 携带当前 48 个累计 candidate 文件引用、2 个本轮修订引用、036 祖先及 037 findings 来源；没有本轮新增删除。沿用祖先既有删除/迁移信息，不修改历史 Runs。计划和真实 manifest/Skills/.gitattributes 保持祖先 bytes。Owner 决定来源继承 037 result 的相关 sourceRef：独立 bootstrap、004/projectOrdinal36、必要材料留 target、无 Git/正式 Full Test 权限。

下一边界：独立 review-apply。Author 不自审、不自动继续。未执行 Archive、Git 操作或正式 D05 Full Test，STOP。
