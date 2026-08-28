# managed-toolchain-resolution Specification

## Purpose
Define deterministic, fail-closed resolution of the exact OpenSpec and Archify runtimes managed by Flowkit from repository-tracked identity and `FLOWKIT_HOME`, while keeping host runtime compatibility outside managed-tool authority.

## Requirements

### Requirement: Managed tool identity is closed and repository-defined
The system SHALL support managed runtime resolution for exactly `openspec` and `archify`. For each supported tool, repository-tracked managed-tool identity SHALL provide the expected package identity, exact managed-tool version, runtime location relative to `FLOWKIT_HOME`, and entrypoint needed to identify the runtime.

#### Scenario: Supported managed tool is requested
- **WHEN** the caller requests `openspec` or `archify`
- **THEN** the system resolves expected identity only from the repository-tracked managed-tool contract

#### Scenario: Unsupported managed tool is requested
- **WHEN** the caller requests a tool id outside `openspec` and `archify`
- **THEN** the system fails closed with the deterministic unsupported-managed-tool diagnostic

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
Before returning success, the system SHALL verify that the resolved runtime exposes the expected package name and exact managed-tool version and that the declared entrypoint exists as a file beneath the resolved runtime root. Any mismatch, missing runtime, missing entrypoint, or escaping entrypoint MUST fail closed.

#### Scenario: Exact OpenSpec identity is present
- **WHEN** the resolved OpenSpec runtime reports package `@fission-ai/openspec`, version `1.10.0`, and contains its declared entrypoint beneath the runtime root
- **THEN** the system returns a resolved OpenSpec identity containing its tool id, version, runtime root, and entrypoint

#### Scenario: Exact Archify identity is present
- **WHEN** the resolved Archify runtime reports package `archify`, version `2.15.0`, and contains its declared entrypoint beneath the runtime root
- **THEN** the system returns a resolved Archify identity containing its tool id, version, runtime root, and entrypoint

#### Scenario: Package identity does not match
- **WHEN** the resolved runtime package name or version differs from the expected managed-tool identity
- **THEN** the system fails closed with a deterministic package-identity-mismatch diagnostic

#### Scenario: Entrypoint is missing or escapes the runtime root
- **WHEN** the declared entrypoint is absent, not a file, or resolves outside the validated runtime root
- **THEN** the system fails closed with the applicable deterministic entrypoint/runtime-root diagnostic

### Requirement: Managed tools are resolved on demand
The system SHALL resolve only the managed tool requested by the caller. Absence or invalidity of another managed tool SHALL NOT prevent successful resolution of the requested tool.

#### Scenario: OpenSpec is requested while Archify is absent
- **WHEN** OpenSpec is valid under `FLOWKIT_HOME` and Archify is absent
- **THEN** OpenSpec resolution succeeds without requiring Archify

#### Scenario: Archify is requested while OpenSpec is absent
- **WHEN** Archify is valid under `FLOWKIT_HOME` and OpenSpec is absent
- **THEN** Archify resolution succeeds without requiring OpenSpec

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
