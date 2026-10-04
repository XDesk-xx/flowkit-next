## MODIFIED Requirements

### Requirement: Reviewer HOW preserves exact binding and actual rejected judgment
每个Reviewer HOW SHALL 独立核对真实Author候选、其raw身份、必要proof及包含相关stage-0 indexBasis的受支持Git projection，再在finish显式提交一致reviewedRunId及必要candidate facts。核对必须解释普通staging的索引敏感语义，不能只复跑无索引hash预测。当前index仍为绑定输入或已为满足既有mode/path合同的预期输出时可继续核对；其他相关变化不得重算绑定后冒称旧候选。raw!=blob仅来自可证明的Git EOL存储规则时不自动视为内容变化，已有CRLF index的合法auto identity也不构成错误。真实raw漂移、规则变动、未知filter或原始证据被转换仍须拒绝。Reviewer不得normalize Author文件、以当前index推断历史已审身份，或将Git投影等价当成所有Verification均可复用。

Reviewer SHALL 核对普通 add 与 clean 的区别；原 index blob bytes 等于 raw 而 clean/EOL 内容不同时属于成功候选前置 unsupported，不能仅凭显式 text 或当前 stat 不同批准 LF 预期。仅 touch 对照仍拒绝，不修改 Author 文件/时间戳、执行 add 试算或回填预期；已核实输出按既有输出合同独立核对。

真实rejected SHALL 原样保存terminal/nextBoundary=null并STOP，不重标changes-requested或替Owner选择续行。Reviewer-owned缺失binding的correction仅在明确Owner授权且实际独立核对原候选后由Reviewer提交；Author不得代填，correction不得改变verdict、Author bytes或追认旧candidateGit。Archive重试失败链不创造新Review approved。

#### Scenario: Rejected review remains rejected
- **WHEN** 实际审查结论为rejected
- **THEN** Reviewer SHALL 如实记录并读回terminal与blocked boundary，不伪装可继续判定

#### Scenario: Metadata repair retains independent role responsibility
- **WHEN** Owner授权补齐Reviewer terminal缺失binding
- **THEN** Reviewer SHALL 验证唯一Author/候选与原判定一致后调用fixed correction并STOP，不修改Author候选或声称新Verification PASS

#### Scenario: A reviewed CRLF file can have an LF Git blob
- **WHEN** Author已保存raw与合法Git EOL projection，实际raw和规则均未漂移
- **THEN** Reviewer SHALL 审查同一真实候选，不因预期blob使用LF就强制修改工作区或制造finding

#### Scenario: Existing CRLF index is independently accounted for
- **WHEN** Author保存了auto模式下既有CRLF索引依据和当前raw的identity blob，输入仍匹配或预期结果已合法暂存
- **THEN** Reviewer SHALL 核对该索引依赖与实际raw，而不因无索引命令给出LF就否定合法绑定；错误或缺失的索引依据仍须拒绝

#### Scenario: Explicit text cannot bypass an unsupported cache branch
- **WHEN** 候选 raw 等于旧 CRLF index 而显式 text 的 clean 为 LF，无论 stat 未变或仅时间戳改变
- **THEN** Reviewer SHALL 拒绝将该 LF 预测视为受支持候选，不重标为 identity 或操作 Author 文件来制造通过
