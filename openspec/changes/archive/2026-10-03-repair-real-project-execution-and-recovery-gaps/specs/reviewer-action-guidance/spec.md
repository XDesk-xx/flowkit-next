## ADDED Requirements

### Requirement: Reviewer HOW preserves exact binding and actual rejected judgment

每个Reviewer HOW SHALL 独立核对真实Author候选及必要raw/Git-filtered identity，在finish显式提交一致reviewedRunId及必要candidate facts。真实rejected SHALL 原样保存为terminal/nextBoundary=null并STOP，不能重标changes-requested或替Owner选择续行。Reviewer-owned缺失binding的correction SHALL 只在收到明确Owner授权且实际独立核对原候选后由Reviewer提交；Author不得代填，correction不能改变verdict或Author production bytes。

#### Scenario: Rejected review remains rejected
- **WHEN** 实际审查结论为rejected
- **THEN** Reviewer SHALL 如实记录并读回terminal与blocked boundary，不伪装可继续判定

#### Scenario: Metadata repair retains independent role responsibility
- **WHEN** Owner授权补齐Reviewer terminal缺失binding
- **THEN** Reviewer SHALL 验证唯一Author/候选与原判定一致后调用fixed correction并STOP，不能修改Author候选或声称新的Verification PASS
