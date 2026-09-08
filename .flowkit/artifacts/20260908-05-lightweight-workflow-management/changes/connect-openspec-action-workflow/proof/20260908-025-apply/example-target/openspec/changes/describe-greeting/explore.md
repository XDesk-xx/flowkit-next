# Greeting 输入行为 Explore

Author 已实际读取 src/greeting.mjs，并在 Windows Node 执行本次 inspect.mjs。

观察：函数调用 name.trim() 后插入固定问候；"Ada" 与 " Ada " 均得到 "Hello, Ada!"，空字符串得到 "Hello, !"，null 抛 TypeError。源文件 SHA-256 为 5563b37fd43ad47bae1c3e3cf5dbc3d5665122ff746f8d45c57c0e9c7b327ea3；观测脚本的实际退出码为 0。

本次只核实已有行为，不判断空字符串/null 应如何改变，不修改实现、不产生 Proposal。材料见本 target 的 .flowkit/artifacts/example-delivery/changes/describe-greeting/proof/20260908-001-explore/。

边界：源项目为有界验收种子，以上读取/运行/归纳为本次真实 Author 工作。没有独立 Reviewer 执行，不填写 approved；下一步仅由查询报告 review-explore 并 STOP。
