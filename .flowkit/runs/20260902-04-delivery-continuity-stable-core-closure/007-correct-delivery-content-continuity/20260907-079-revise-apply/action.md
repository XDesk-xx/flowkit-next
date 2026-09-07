# Revise Apply 079 — 闭合 078 的三个残留实现缺口

Owner 请求：`根据最新 run，revise-apply`。输入为 `20260907-078-review-apply`，批准计划仍为 `20260907-074-review-propose`；Change `correct-delivery-content-continuity`，`projectOrdinal: 32`。

结论：078 保留的 3 项 finding 已在原批准合同内完成最小实现修正，Author 结论为 `PASS`，交回独立 `review-apply`。076/078 已闭合的 4 项 finding 保持闭合。本轮未修改 Proposal、design、delta specs 或 tasks，未执行 Formal Delivery Full Test、archive 或项目 Git 操作。

## 修正结果

1. `D04-RA007-002`：Start validation source 现在必须提供实际 `outcome.json` bytes。实现按合同核对 `status: passed`、六项完整且唯一的要求检查、每项固定 tool、`exitCode: 0`、exact input refs 与 exact output artifact；真实失败、缺项、错输入、错输出或未绑定 bytes 均 fail closed。测试通过真实 Node 子进程产生成功与失败结果，不以裸 `PASS` 或 metadata 代替执行结论。
2. `D04-RA007-003`：Final 的每个必要 Run 现在携带自身 sourceRef、context/result hash 与 guidanceRef，并复用现有 Run address、`formActionPackage` 和 `admitActionResult` 做 canonical admission。两个 closure anchor 仍绑定当前 Change，但 previous chain 可按每个 Run 自身受控 identity/address 跨 Change；链必须完整且所有提供 Run 都被消费。非法 verdict slot 被拒，真实 admission 后持久化的 dependency Change Run 可被合法链接。
3. `D04-RA007-006`：requiredEvidence source revalidation 先重新派生合法 evidence，再比较双方的固定语义 clone；对象属性插入顺序不再影响重验，数组顺序及值/bytes 变化仍会被拒。重排后的 Final evidence 已贯通 Repository Integration preparation。

## 最小性与文件 gate

- 仅修改 2 个实现文件、5 个既有测试/fixture，并新增 3 个窄测试 fixture/test 文件；没有新增 Registry、统一 proof/evidence 平台、Runtime/Policy/Run schema 或自动 lifecycle。
- Proposal、design、7 份 delta specs 与 tasks 未修改；tasks 仍为 35/35。
- 所有本轮受影响代码和测试文件均不超过 650 行；最大为 `tests/unit/domain/delivery-repository-integration-accepted-object.test.ts`，646 行。

## 实际验证

- 聚焦 6 个测试文件：39/39 PASS，0 fail，0 skip。
- Native Windows domain：266/266 PASS，0 fail，0 skip；tracked/untracked ACL read-denial 均真实 PASS。
- Native Windows acceptance：5/5 PASS，0 fail，0 skip。
- Linux x64 glibc 2.36：Node 22.23.2、uid/gid 1000、`--network none`、repository readonly 输入并复制到临时 worktree、无 Windows `node_modules`；build PASS，domain 266/266 PASS，acceptance 5/5 PASS。Acceptance 使用只读 `FLOWKIT_HOME/tools` exact OpenSpec 1.10.0 与 Archify 2.15.0。
- `pnpm typecheck`、`pnpm build`、`pnpm quality:gate`、`pnpm quality:dependency-health`、`pnpm test:entropy`、`pnpm quality:entropy`、`git diff --check HEAD` 全部 PASS；dependency health 为 96 modules / 477 dependencies，production reachability 为 45/45。
- exact managed OpenSpec `1.10.0`：当前 Change strict PASS；`--all --strict` 为 23/23 PASS。该结果只证明 OpenSpec 结构。

## 交接与 STOP

下一边界是独立 `review-apply`，仅为正常 review matrix handoff，不代表已完成 review、archive、Formal Delivery Full Test 或 Delivery checkpoint。079 不创建 Reviewer、Verification、Owner 或 Git authority，不自动执行下一 Action。

STOP。
