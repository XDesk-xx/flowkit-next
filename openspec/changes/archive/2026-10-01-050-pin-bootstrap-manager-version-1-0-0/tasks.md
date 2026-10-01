## 1. 定版输入

- [x] 1.1 将 `package.json#version` 改为 `1.0.0` 并同步 `docs/onboarding.md` 的 tgz 示例；核对 `private`、bin、依赖、工具 lock 和 `pnpm-lock.yaml` 未发生计划外变化，执行 frozen install。
- [x] 1.2 将 `docs/onboarding.md` 作为精确文件加入 `config/verification/full-test.json#inputs`；以受控文档字节变化验证现有输入读取器会改变 inputRef，且不运行 Formal Full Test。

## 2. 真实候选验收

- [x] 2.1 对定版源码运行适用的格式、检查、构建和回归命令；保存真实退出状态与必要原始流，失败时不记 PASS。
- [x] 2.2 从定版源码执行 `pnpm pack`，保存真实 tgz bytes/SHA-256，核对包内版本、接入示例、入口、依赖、工具 lock 和必要 Skills；逐成员对照 E 留存的 `0.1.0` 包并说明任何额外差异。
- [x] 2.3 在隔离的新目录生产安装实际 tgz，读回安装内元数据、文档与入口可用性；形成归属本次 Apply Run 的证据和明确限制，不切换当前外部 Stable manager。
