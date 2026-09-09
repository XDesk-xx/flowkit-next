# Delivery Final

Execute an already-authorized `delivery-final` operation from its exact `DeliveryOperationPackage` after complete accepted Delivery prerequisites exist.

## Contract

Guidance 的准备与 exact read 均使用同一 manager 安装来源；相对 path/contentSha256 身份不包含绝对安装根。项目读写、检查 cwd、Git 与证据仍属于 target repositoryRoot；不得回退读取 target 的同名系统 Guidance。

Derive `requiredEvidence` from canonical required Changes and trusted accepted archive/review anchors, plus the complete Full Test source. Bind the finite snapshot into Final operation facts; callers cannot shrink it, substitute self-signed hashes, or treat excluded Run/Memo bytes as dispensable evidence. This is not an evidence Registry or a new persistence service.

1. Treat the package-bound Delivery identity, verified candidate, Full Test execution, completed required Change identities, canonical coordination prestate, content-bound Guidance, and exact `finalize-delivery` Owner authority as fixed input.
2. 从 target 当前 fullTestAttempt 读取完整真实 PASS、必要材料与当前 inputRef，拒绝 caller fullTestOutcome/readFullTest 替换；另核对 empty managed OpenSpec active Change set 和 canonical Delivery coordination。普通 Git candidate 不定义测试有效性；不能用 boolean、摘要或 Run prose 代替来源。
3. Derived execution receives only a defensive package copy and Guidance bytes. It may return bounded `ready` or `correction-required` content; it does not choose a path, patch, Git command, next operation, or authority.
4. On `ready`, the trusted host may update only the fixed canonical Delivery coordination artifact from its exact active/passed/pending prestate to the specified completed closure. Revalidate original bytes before replacement and exact bytes after replacement; preserve fullTestAttempt and non-target bytes.
5. Record the verified → finalized candidate lineage and exact content-bound closure identity only after successful materialization and reread.
6. On invalid input/result, prerequisite drift, repository drift, coordination drift, write failure, or correction-required, fail closed or return the bounded correction STOP without terminal success or automatic correction.
7. STOP after the Delivery Final terminal or correction boundary.

No Architecture outcome, reader, runtime, diagram, or skip proof is a prerequisite. verifiedCandidateRef 承载 Full Test inputRef；finalizedCandidateRef 仍是独立 Git 投影，二者不作同域相等比较。Change closure reader 只负责原 required Change 链，不遍历全部历史，不复制 Full Test outcome。

## Boundaries

MUST NOT:

- discover, rank, route, or choose a Delivery operation;
- create Owner, Reviewer, Verification, lifecycle, next-operation, or Git authority;
- execute actual repository integration, commit, branch, push, PR, merge, tag, or accepted-main discovery;
- write `finalizedCandidateRef` into the manifest and create candidate self-reference;
- create a generic manifest API, schema/hash registry, transaction platform, evidence store, or second Delivery lifecycle;
- use `.agents/skills/**` as product Guidance fallback;
- embed project-specific Delivery bytes, Change identities, or continuation instructions in this Guidance.
