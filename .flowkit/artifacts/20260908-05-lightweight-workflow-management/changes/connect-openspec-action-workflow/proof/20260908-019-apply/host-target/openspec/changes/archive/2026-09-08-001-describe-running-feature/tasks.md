## 1. 固定功能说明

- [x] 1.1 新建 feature.mjs，仅无参数运行时输出固定 `status: available` 与 LF；运行程序核对 stdout、空 stderr 与退出码 0。
- [x] 1.2 新建 Node 原生测试，调用真实子进程验证精确字节与退出结果；执行 `node --test feature.test.mjs` 并保留实际结果。
