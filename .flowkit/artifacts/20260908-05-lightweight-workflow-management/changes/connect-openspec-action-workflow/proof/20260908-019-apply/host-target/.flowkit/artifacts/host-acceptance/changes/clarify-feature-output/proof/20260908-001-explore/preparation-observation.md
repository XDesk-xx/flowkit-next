# Preparation observation

这是宿主对前次工具返回的文字观察，非原始 stdout/stderr。

旧安装 prepare 后，宿主发送 ready 但省略 reason，收到 invalid-host-frame / stage preparation / runId 20260908-001-explore / persistence none。工具 PTY/PowerShell 会话报告 exit_code 1，未单独捕获 Node 子进程退出码；无独立 stderr 或 stack。该 invocation 未进入 execute。随后按明确单次重试授权使用新安装 manager-02，新 prepare 的 Guide hash 已验证，ready 加 reason:null 后收到 execute。
