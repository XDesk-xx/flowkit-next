# Apply 075 — 修复 Delivery 内容连续性

## 输入与权限边界

Owner 请求：`根据最新 run，apply change`。输入为已批准的 `20260907-074-review-propose`，目标 Change 为 `correct-delivery-content-continuity`，`projectOrdinal: 32`。

本轮只执行已批准 Proposal/tasks 的 Author Apply：修改产品实现、测试、当前 D04 prospective Guidance/manifest 表述及 Owner 指定的阶段 HOW。未执行 archive/spec sync、Formal Delivery Full Test、Delivery Final、Repository Integration 或任何 Git add/commit/push。

Owner 已明确授权的材料边界继续有效：此前原始 Explore proof 移至 `.tmp` 且不长期保留，不属于 Author 越权；交接只携带会影响后续判断的决定，不复制全部聊天。历史 Explore proof 仅是实验/决策依据，不作为本轮实现 PASS。

## 实现结果

- applicable-check 使用共享 v2 record、UTF-8 byte comparator、candidate/check domain；worktree 与 exact SHA-1 object reader 共用投影，确认删除无 record，exact Memo 内容与 Runs 隔离，异常类型、unmerged、SHA-256 repository 与读失败 fail closed。
- Start terminal 形成绑定 project/Delivery/base/planning、固定四槽实际输出、post-output candidate 与 validation 来源的 `contentCompletion`；无 checkpoint 时 `fixedPointCommit: null` 且不调用 Git callback，授权 checkpoint 分支重验真实 parent/count/clean/content。
- Final 不再接收 caller 自签 `requiredEvidence`；可信读取接缝提供实际 Run/外部材料 bytes，产品代码校验 Run address/context/result/linkage/role/verdict 并计算 hash/bytes。Integration 在 accepted Git object 重新读取 project 与必需 Run 三件套。
- Integration 增加 closed `checkpointOperation` 的 `create-new` / `reuse-existing`；复用已存在 checkpoint 不产生第二 commit，accepted object 用产品 v2 projection 与必要证据取代通用 tree equality。
- Start/Full Test/Architecture/Final/Integration Guidance、D04 prospective 两处表述及 bootstrap/product 八个阶段 HOW 已按批准计划收敛；未新增 Registry、proof store、Runtime/Policy/Run schema。
- 按 Owner 行数要求拆分测试职责；本轮全部修改/新增 TypeScript 文件均不超过 650 行。

## 当前实现验收证据

- Native Windows：`pnpm test:domain` 为 257/257 PASS；`pnpm test:acceptance` 为 5/5 PASS；tracked/untracked ACL read-denial 均真实 PASS，无 skip。
- Linux x64 glibc 2.36：`linux/amd64`、Node 22.23.2、pnpm 11.22.0、`--network none`；首次 root 执行因 root 可读取 chmod(000) 而真实失败，改用 uid/gid 1000 的 `node` 用户重跑同一 domain/acceptance 命令后 exit 0，无弱化断言或 skip。
- `pnpm typecheck`、`pnpm build`、`pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm test:entropy`、`pnpm quality:entropy`、`git diff --check` 全部 PASS。
- exact managed OpenSpec `1.10.0`：当前 Change strict PASS；`--all --strict` 为 23/23 PASS。该结果只证明 OpenSpec 结构。
- tasks 35/35 完成；Formal Delivery Full Test 未执行，历史 proof 未冒充当前实现 PASS。

## 交接与 STOP

本轮下一边界为独立 `review-apply`。旧 Run、archived Change、Memo 与用户已有未跟踪材料未被改写；只新增本 Apply Run。STOP，不自动 review、archive、Full Test 或 Git 操作。
