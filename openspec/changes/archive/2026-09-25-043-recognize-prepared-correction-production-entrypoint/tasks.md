## 1. 精确入口合同实现

- [x] 1.1 将 `src/cli/prepared-owner-correction-start.ts` 加入 `PRODUCTION_ROOTS`，运行 `pnpm quality:entropy` 验证当前生产图全部可达。
- [x] 1.2 更新聚焦合成图与断言，覆盖第三个独立入口及其依赖、缺失第三 root、其余不可达模块和 test-only 引用；运行 `node --test tests/unit/quality/production-reachability.test.mjs` 验证。

## 2. 发布入口核对与集成验证

- [x] 2.1 核对三个 revise Skill 的直调路径均为 `dist/cli/prepared-owner-correction-start.js`，运行项目 build 并确认对应构建文件与 `package.json#files` 的发行包含规则一致，记录实际结果。
- [x] 2.2 运行 `pnpm quality:entropy` 与适用聚焦检查，确认新入口被承认且额外不可达源码仍失败；将真实命令、退出状态和限制记录在本次 Apply 证据中。
