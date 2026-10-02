## Why

MenDi 的已确认 Explore Result 在 `artifactHashes` 中保留了真实 `explore.md` 的唯一路径和正确 SHA，却没有 `exploreArtifact` / `exploreSha256`。manager 曾在 `action finish` 接受该终态 Result，到 `review-explore` 才拒绝，导致不可改写的 Run 无法继续审查。

## What Changes

- 对既有成功 Explore / Revise Explore Result，允许 `review-explore` 在两个专用字段均缺失时，从 `artifactHashes` 严格解析唯一、属于当前语义 Change 的 Explore 路径及 SHA，并重新核对文件；不改写原 Result。
- 对今后成功的 Explore / Revise Explore，`action finish` 在首次写入终态机器文件前要求两个专用字段完整、路径精确、SHA 与当前普通文件字节一致。`artifactHashes` 不替代新 Result 的专用字段。
- 为兼容读取、歧义/漂移拒绝及新 Result 写入前拒绝增加有界回归测试；保留 Role、Policy、Proof、Run create-once 与独立 Reviewer 边界。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `stable-action-command-execution`: 补齐成功 Explore Result 的写入前产物身份校验，以及已确认历史 Result 在 Review 前的严格兼容读取。

## Impact

影响固定 Action CLI 的 Explore finish / Review Explore readiness、现有 artifact hash 校验复用、对应测试和该 capability 的规格。MenDi 当前 Run 与产物保持原字节；此 Change 不自动更新固定安装、不自动发起 MenDi Review，也不处理仓库里另行存在的 Delivery Run 序号改动。独立 Reviewer 已批准本 Change 的有界 Explore，未生成 canonical Reviewer Run。
