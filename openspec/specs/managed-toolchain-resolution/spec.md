# managed-toolchain-resolution Specification

## Purpose

Define deterministic, fail-closed resolution of the exact OpenSpec runtime managed by Flowkit from repository-tracked identity and `FLOWKIT_HOME`, while keeping independent user tools and host runtime compatibility outside managed-tool authority.

## Requirements

### Requirement: Managed tool identity is closed and repository-defined

系统 SHALL 仅支持 managed tool id `openspec`，由 repository-tracked contract 定义 expected package、exact version、相对 FLOWKIT_HOME 的 runtime location 与 entrypoint；不支持 `archify`，不增加其他工具或 Registry。本 Change 不改变管理资产所在根目录的现行合同。

#### Scenario: Supported managed tool is requested
- **WHEN** caller 请求 `openspec`
- **THEN** 系统 SHALL 只从 repository-tracked managed-tool contract 解析 expected identity

#### Scenario: Unsupported managed tool is requested
- **WHEN** caller 请求 `archify` 或其他非 openspec id
- **THEN** 系统 SHALL 返回既有 unsupported-managed-tool diagnostic，不尝试 runtime 发现、安装或调用

### Requirement: Resolution is confined to FLOWKIT_HOME without PATH fallback
The system SHALL resolve a requested managed runtime beneath the expected `FLOWKIT_HOME/tools/<tool>/<version>` location using current-host path semantics. The system MUST reject malformed, traversing, or escaping runtime locations and MUST NOT silently fall back to PATH, global installations, or another runtime location.

#### Scenario: Valid runtime exists under FLOWKIT_HOME
- **WHEN** the requested tool's configured runtime root resolves beneath the expected `FLOWKIT_HOME/tools/<tool>/<version>` location
- **THEN** the system continues validation using that exact runtime root

#### Scenario: PATH contains a conflicting executable
- **WHEN** PATH contains a same-named executable with a different identity and the managed runtime under `FLOWKIT_HOME` is valid
- **THEN** the system resolves the managed runtime under `FLOWKIT_HOME` and ignores the PATH executable

#### Scenario: Runtime root escapes FLOWKIT_HOME
- **WHEN** configured runtime-root material traverses or resolves outside the expected managed-tool location under `FLOWKIT_HOME`
- **THEN** the system fails closed with a deterministic invalid-runtime-root diagnostic

### Requirement: Resolved package identity and entrypoint are validated exactly

返回成功前，系统 SHALL 验证 expected package name/exact version，且 entrypoint 是 runtime root 内的文件；mismatch、missing runtime/entrypoint 或路径逃逸 SHALL fail closed，不回退 PATH/global。

#### Scenario: Exact OpenSpec identity is present
- **WHEN** runtime 为 `@fission-ai/openspec`、`1.10.0`，entrypoint 在受控 root 内有效
- **THEN** 系统 SHALL 返回 tool id/version/runtime root/entrypoint 的 exact identity

#### Scenario: Exact Archify identity is present
- **WHEN** 外部仍有 exact Archify 2.15.0 安装，caller 请求 managed id `archify`
- **THEN** 系统 SHALL 返回 unsupported-managed-tool，不读取其 package/entrypoint；安装存在不恢复旧受支持身份

#### Scenario: Package identity does not match
- **WHEN** package name 或 version 不匹配
- **THEN** 系统 SHALL 返回 package-identity-mismatch diagnostic

#### Scenario: Entrypoint is missing or escapes the runtime root
- **WHEN** entrypoint 缺失、非文件或逃逸受控 runtime root
- **THEN** 系统 SHALL 返回对应 entrypoint/runtime-root diagnostic

### Requirement: Managed tools are resolved on demand

系统 SHALL 仅解析当前请求的受支持工具；其他独立用户工具的存在、缺失或损坏 SHALL 不影响 OpenSpec 解析，不遍历或校验其安装。

#### Scenario: OpenSpec is requested while Archify is absent
- **WHEN** OpenSpec 在 FLOWKIT_HOME 下有效，Archify 缺失
- **THEN** OpenSpec 解析 SHALL 成功，不要求 Archify 配置或 runtime

#### Scenario: Independent Archify installation is invalid
- **WHEN** OpenSpec 有效，用户独立 Archify 安装损坏或版本不同
- **THEN** 系统 SHALL 不读取该安装，OpenSpec 解析不受影响

#### Scenario: Archify is requested while OpenSpec is absent
- **WHEN** caller 请求 `archify` 且 OpenSpec 缺失
- **THEN** 系统 SHALL 先以 unsupported-managed-tool 拒绝，不解析任何 runtime，不因 Archify 安装存在而成功

### Requirement: Resolver failures use a closed deterministic diagnostic catalog
The system SHALL classify managed-tool resolution failures using a small closed diagnostic catalog sufficient to distinguish unsupported tool, invalid lock/configuration, missing `FLOWKIT_HOME`, invalid runtime root, missing runtime, package identity mismatch, and missing entrypoint conditions. Resolver diagnostics MUST NOT be interpreted as Verification, Reviewer, Owner-authority, Run, or Policy facts.

#### Scenario: Required environment state is absent
- **WHEN** `FLOWKIT_HOME` is unavailable for a managed-tool resolution request
- **THEN** the system fails closed with the deterministic missing-flowkit-home diagnostic

#### Scenario: Managed runtime is absent
- **WHEN** the expected runtime location does not exist
- **THEN** the system fails closed with the deterministic missing-runtime diagnostic

### Requirement: Host runtime and package manager are not managed-tool identities
The system SHALL keep Node host compatibility and repository package-manager identity outside the managed-tool resolver contract. Exact Node `22.23.2` MUST NOT become managed-tool authority merely because it is used as a reproducible development or detached fixture, and pnpm MUST NOT become a managed runtime resolution target in this capability.

#### Scenario: Compatible host Node differs from the fixture patch
- **WHEN** Flowkit runs on a Node version allowed by the repository host-runtime compatibility declaration but different from `22.23.2`
- **THEN** managed-tool resolution does not reject that host solely because its Node patch differs from the fixture

#### Scenario: Managed-tool resolution is requested
- **WHEN** the resolver is asked for a supported managed tool
- **THEN** it does not resolve or validate pnpm as part of that request

### Requirement: Resolution does not install or invoke managed tools
A successful resolution SHALL return only validated managed-tool identity and location facts. This capability MUST NOT install, download, update, invoke, or interpret lifecycle output from OpenSpec or Archify.

#### Scenario: Managed tool resolves successfully
- **WHEN** all identity and location checks pass
- **THEN** the system returns the validated resolved identity without invoking the tool

### Requirement: Artifact hashes remain provenance rather than live runtime attestation
Repository-tracked managed-tool artifact hashes MAY be retained as provenance or restore metadata, but runtime resolution MUST NOT require availability of source/runtime archives or whole-directory cryptographic attestation of the unpacked runtime.

#### Scenario: Runtime is valid but source archive is unavailable
- **WHEN** a managed runtime has the expected package identity and entrypoint under `FLOWKIT_HOME` but its original archive is not present locally
- **THEN** runtime resolution may succeed without archive re-hashing

### Requirement: Product distribution does not require or ship Archify assets

活动 toolchain、产品发行资产与 HOW SHALL 不携带或要求 Archify 专属 runtime、tool Skill、vendor Skill 或 Delivery adapter。系统 SHALL 保留现有 OpenSpec 工具/通用进程能力与 FLOWKIT_HOME/tools 边界；SHALL NOT 自动卸载、更新或删除外部用户安装或改写历史 provenance。

#### Scenario: Use the product with only OpenSpec installed
- **WHEN** 仅配置/安装所需 exact OpenSpec，且其他现行产品依赖满足
- **THEN** 产品 SHALL 不为加载/诊断或执行现有 Delivery 路径要求 Archify 专属资产

#### Scenario: Preserve independently installed tooling
- **WHEN** 更新后的产品不再携带 Archify 资产
- **THEN** 用户独立安装的 runtime/Skill SHALL 保持原样，不触发卸载或版本迁移
