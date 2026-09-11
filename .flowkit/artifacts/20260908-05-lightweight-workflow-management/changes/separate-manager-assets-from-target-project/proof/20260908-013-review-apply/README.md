# 013 review-apply 独立证据

审查对象为 `012-apply`，合同来源为 `011-review-propose approved`，本目录不是产品 Verification Registry，也不改变固定三文件 Run。

## 复核结果

- `audit.mjs` 的 `attempt-02/summary.json` 记录真实复核：185 个 exact refs、58 个当前候选文件、已批准计划保留（tasks 仅勾选完成）、17 个 Author 最终适用检查的退出结果。
- 在新建隔离输出目录编译当前源码；实际 tgz 中的 41 个生产模块与干净编译输出一致，75 个包文件与现存安装逐字节一致；package 元数据仅按已批准语义字段比对包管理器规范化结果。静态资产作 opaque bytes 校验，不把 candidate Reviewer HOW 用作本次审查指导。
- 独立重跑 typecheck、18 个相关 domain 文件（131 tests / 131 pass / 0 fail / 0 skipped）、6 项 installed Windows acceptance 和 diff-check。实际安装验收显式记录 `FLOWKIT_ACCEPTANCE_INSTALLATION` 与 `FLOWKIT_HOME`，使用包声明 bin，而非源码 CLI。
- Author 保留的 Linux x64 / glibc 2.36 / Node 22.23.2 证据为 262 domain + 6 installed acceptance PASS；已核对其命令、脚本、hash 绑定、offline/frozen dependency graph 和 `--network none` 执行边界，本次没有重新运行 Linux 全套。

## 适用性与边界

包/安装路径及新建编译目录是可丢弃工作区；持久材料保留源候选清单、包清单与 hashes、复核方法、明确命令/环境、实际 stdout/stderr/结果。删除工作区不抹去执行结果，后续可按所绑源码与依赖重新构建；旧 PASS 不自动适用于新输入。

独立 Skill 要求不消费 candidate `skills/actions/review-apply/SKILL.md` 作为 HOW，因此没有执行会读取它作为产品指导测试对象的 `reviewer-action-guidance.test.ts`；Author 全套结果和本次有界独立验证分别报告，不冒称 Reviewer 重跑全部 domain。

启动语法错误保存在 `startup-01.txt`；沙箱 EPERM 保存在 `attempt-01/startup-failure.json`。依调试 Skill 定位并修正 Reviewer 自有脚本、重跑相同检查，没有修正或归咎 Author 实现。最终有效复核是 attempt-02，不覆盖失败记录。

仅 Reviewer Run/proof 有持久写入；测试产生的隔离临时 fixture 不属于 Author 项目数据。未改生产/测试/计划/历史 Run、未执行真实仓库 Git mutation、未执行下一 Action。approved 不等于 Formal Delivery Full Test、Archive 或 Owner/Git authority。
