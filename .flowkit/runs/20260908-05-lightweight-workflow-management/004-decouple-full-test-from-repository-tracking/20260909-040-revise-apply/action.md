# revise-apply

Author 根据 Owner “根据最新run，revise”执行 039-review-apply 指定的 revise-apply。
当前 Change decouple-full-test-from-repository-tracking，004/projectOrdinal36。
仅修复 D05-RA039-001：有界区分 Node 选项、值、入口/preload 与普通 argv；不能可靠识别则准备阶段明确拒绝。保留已验证输出、工具漂移、诊断行为。
完成真实验证、保存并读回三文件 Run，交独立 review-apply 后 STOP。不改计划、历史、Skill；不执行 Git、Archive 或正式 D05 Full Test。
