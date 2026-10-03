# 两项复审问题的修正交接

Author conclusion: 修正及当前输入验收完成，供独立复审；不声明 Reviewer approved。

Owner 输入：本会话“直接修复这两个问题”。合同与既有实现祖先仍由 `openspec/changes/repair-real-project-execution-and-recovery-gaps/`、原 Apply diff 和两轮 Reviewer report 保存；本次继续直接 OpenSpec / no-Runs。

- P1：首次追加 correction 的历史 Review 仍须证明一致候选；后续新 Review 省略可选 map 可正常读回与续行，相同 correction 请求可只读 replay。三个 verdict 的固定 CLI 回归覆盖 Archive start/checkpoint、两类 revise、Owner 拒绝规则与原三文件保持。冲突、历史来源不足、partial、错误 descriptor及fork仍拒绝。
- P2：最终输入的 Windows/Linux domain 均412/412、0 skip，常规acceptance均7 PASS /1 opt-in或平台skip；所有既有质量检查通过。native Windows + pnpm11实际Archive为1 PASS /0 skip，两轮每轮412项，8条领域命令、2条full-checks及真实exit1反例，归档/finish/独立进程读回成功、source candidate/依赖保持。严格OpenSpec校验通过。

验收中发现基线未改动的 Git fixture 在恢复attributes后普通add复用stat缓存；最小复现保存在 `index-cache-reproduction.json`，基线身份见 `fixture-baseline-identity.json`。仅修正fixture恢复步骤为显式renormalize，保持原raw/index断言；旧失败在 `native/` 及 `native-evidence/fixture-artifacts/` 保留。最终重跑材料在 `final/`，不回用旧PASS。

`final/audit.json` 核对11组Windows命令、9组Linux命令、相同255项输入、6组probe和21条native实际命令，确认原补充Reviewer的43项材料未变。相对补充复审只有2个production文件、3个test文件及Author `verification.md` 变化；没有新依赖、层或Registry。必要代码检查已通过，无需重复未受影响的完整检查。

完整摘要已追加到 Change `verification.md`，保留所有历史章节。未修改历史Run/verdict，未生成正式Run，未修改Proposal/Design/spec/tasks语义，未执行真实仓库Git mutation、安装升级、archive、Formal Full Test或Final。

STOP：后续独立review-apply为单独边界，本次不自动执行。
