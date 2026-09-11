# 040 revise-apply 修正交接

## 结论与最小范围

根据 039-review-apply 的 D05-RA039-001，在既有 approved design §1–2 / tasks 1.1、1.3 内修复 Node 带值选项造成工具入口漏绑的问题。没有改 Proposal/design/tasks/specs、Skill、实际 Delivery manifest、.gitattributes 或历史 Run。

只修改 src/internal/full-test-tool.ts（144 行）和 tests/unit/domain/full-test-revision.test.ts（396 行）。仍为同一 helper，不新增配置字段、Registry、通用 CLI/依赖解析平台或另一个 Change。

## 修正方式

Node 启动参数按明确的有界形式处理：
- --conditions / -C / --input-type 的选项值被消费，不作为入口文件。
- eval/print、preload、-- 分隔与普通脚本 argv 的边界保持；选项后的真实入口及包内实现仍绑定。
- 明确支持的无值选项保持，包括项目使用的 --test 和既有 --version/-v。
- 未支持的选项、缺值或无法解析的入口在准备阶段报告 FULL_TEST_NODE_ARGUMENTS_UNSUPPORTED（带 checks[index].resources 阶段），不静默生成不完整 toolRef、不启动 attempt，不回显参数内容。
- 普通脚本后参数不再由工具读取器解释；测试 glob 沿用已有项目 inputs 边界，显式测试文件仍保留资源绑定。不是全 Node CLI 语法支持或第三方命令沙箱。

## 本轮真实证据

1. probe-before 原样重跑 Reviewer 方法：只改工具后 inputRef/checkRef 未变、旧 reader passed，但新执行 failed，复现成立。脚本退出0只是采集完成，不是条件正确。
2. probe-after 同方法：inputRef/checkRef 改变，旧 reader stale，新失败 reader failed。四类具体准备失败诊断保持。
3. regression-after：14/14，覆盖条件参数分离/等号/短名、包内实现变化、后续 preload、同名条件文件不参与资源、输出参数不参与输入、8 种不可靠形式无 attempt 且不泄漏参数。
4. 第一次整体 domain-01 / linux-01 失败：已有 --version 被遗漏；补回明确无值形式，未改旧测试，原始材料全部保留。
5. 最终 Windows domain-02：296/296，acceptance-01：6/6。typecheck/format/lint/build/strict OpenSpec 通过；最后 --version/-v 补充后的完整代码 gate 和 build 也由 linux-02 当前配置执行验证。
6. Linux linux-02：离线当前 lock 安装，9 项配置检查全部 passed；domain 296、acceptance 6、entropy tests 7，跨进程当前结果和清除 .tmp 后读回均 passed。

Linux 为普通 code-only target 的实现验收，不是 D05 Formal Full Test；不由 candidate 管理实际 D05。原方法名称中的 independent 不表示 Author 本轮自审；独立 verdict 仍由下一 Reviewer 给出。

## 交接与 STOP

必要材料保留当前 target artifacts。result.json 保存当前 48 个累计 candidate 文件引用、本轮 2 个修订引用、精确 038 祖先/039 findings/原计划来源；没有本轮新增删除，继承既有移除来源，不重写历史。Explore 与旧 PASS 不是本轮验收。

Owner 决定沿 039 result 的真实 sourceRef 交接：D05 independent-bootstrap、004/projectOrdinal36、必要材料留 target，不修改历史，不执行 Git 或正式 D05 Full Test。

下一边界：独立 review-apply。未执行 Review、Archive、Git mutation 或正式 D05 Full Test。STOP。
