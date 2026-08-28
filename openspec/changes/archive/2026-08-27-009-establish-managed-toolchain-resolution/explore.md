# Explore — establish-managed-toolchain-resolution

## 1. Owner goal and bounded problem

当前 Delivery 已完成 Foundation Core、Policy、Memo，并取消了错误的 mutation declaration subsystem。这个 Change 只解决 external managed tool resolution：

> Flowkit candidate 必须从 repository-tracked toolchain contract 与 caller-provided `FLOWKIT_HOME` 确定地解析 **OpenSpec 1.10.0** 与 **Archify 2.15.0**，验证它实际命中的 external runtime identity，并在缺失、漂移或不一致时 fail closed；不得因为本机 PATH 上碰巧存在某个同名 CLI 就静默使用。

Owner 已明确校准一个关键边界：

```text
OpenSpec / Archify
→ Flowkit-managed external tools
→ exact identity is appropriate

Node
→ host runtime
→ compatibility requirement, NOT exact patch identity
```

因此当前 Change 不是“固定整台机器的 Node/pnpm/OpenSpec/Archify 版本”，而是：

```text
host runtime compatibility
        │
        │  separate concern
        ▼
Flowkit process
        │
        ├─ requested managed tool = openspec
        │      ↓
        │   toolchain.lock + FLOWKIT_HOME
        │      ↓
        │   exact OpenSpec 1.10.0 runtime
        │
        └─ requested managed tool = archify
               ↓
            toolchain.lock + FLOWKIT_HOME
               ↓
            exact Archify 2.15.0 runtime
```

最小真实消费者是后续 `establish-openspec-thin-integration` 与需要 Archify 的 architecture validation；本 Change 不执行 OpenSpec lifecycle，也不让 Archify 成为 truth。

---

## 2. Existing facts that constrain the design

### 2.1 Delivery truth already scopes exact identity to OpenSpec / Archify

Current Delivery scope/acceptance explicitly says:

```text
exact managed OpenSpec 1.10.0 / Archify 2.15.0 toolchain resolution
```

and:

```text
Managed OpenSpec 1.10.0 and Archify 2.15.0
resolve from exact external identities without silent PATH fallback.
```

The Change goal itself is equally narrow:

```text
read toolchain.lock
resolve FLOWKIT_HOME
identify OpenSpec / Archify runtime exactly
fail closed
```

Therefore expanding this Change into exact host Node pinning would contradict the already-authorized Delivery boundary rather than satisfy it.

### 2.2 Node already has a compatibility truth outside the managed-tool lock

Current `package.json` states:

```json
{
  "engines": {
    "node": ">=22.20.0"
  }
}
```

while `.node-version` contains `22.23.2` and the detached proof fixture also uses Node `22.23.2`.

Decision:

```text
package.json.engines.node
→ host compatibility contract

.node-version / detached node-22.23.2 runtime
→ reproducible development / proof fixture
→ NOT canonical exact runtime requirement
```

The fact that this Explore uses Node 22.23.2 to reproduce the environment does not authorize the product contract to require exactly 22.23.2.

### 2.3 pnpm is not a managed runtime consumer target

Current `package.json` already states:

```text
packageManager = pnpm@11.22.0
```

That is the repository package-manager pin. The managed runtime resolver does not need to resolve a pnpm executable in order to supply OpenSpec/Archify to later Flowkit integration.

The current `toolchain.lock.json` duplicates exact Node and pnpm values from initialization. For the formal managed-runtime contract, those duplicate fields SHOULD NOT become resolver authority:

```text
Node compatibility
→ package.json engines

pnpm package-manager identity
→ package.json packageManager

managed external executable identity
→ config/tools/toolchain.lock.json
   ├─ openspec
   └─ archify
```

Because no candidate resolver has yet consumed this pre-contract initialization lock, Proposal may correct the lock shape in-place without creating a legacy compatibility subsystem.

### 2.4 Executable runtimes are external by design

Repository rules already require:

```text
Git repository
→ Skills + manifests/contracts

FLOWKIT_HOME/tools/**
→ executable OpenSpec / Archify runtimes
```

and forbid committing runtime binaries, `node_modules`, pnpm store or platform runtime archives.

Therefore this Change must resolve an already-restored runtime. It must not own installation, download, unpack, upgrade or cache management.

---

## 3. Proof — the existing managed identities are real and reproducible

The current lock declares:

```text
OpenSpec 1.10.0
runtime artifact sha256 = fefcf1b7d1e38cf06a3279c6245170dcb0d261d8d6c8ead3f3096b41f4b971fc
skill source sha256      = 8085b07b4bafbdc09fceedbcb4ccd04c800c488d8588754d97946b462e142b51

Archify 2.15.0
runtime artifact sha256 = 156f0d3cd6ba11706344683e3d94e6b6b44b5732bd3c8c81b75c267c3f5d04c4
source artifact sha256  = 31dc88060d046476eaad31d354fed1869e7b8f6fc21fa245d5589f771477de43
```

Focused artifact proof against the supplied external packages produced exact matches for all four hashes.

The restored runtimes also expose the expected package identities and entrypoints:

```text
OpenSpec
package name = @fission-ai/openspec
version      = 1.10.0
entrypoint   = bin/openspec.js

Archify
package name = archify
version      = 2.15.0
entrypoint   = bin/archify.mjs
```

Both entrypoints execute successfully under the detached Node 22.23.2 fixture.

This establishes that the current lock has enough concrete external identity material to anchor a resolver. It does NOT establish that the candidate should install or hash an unpacked directory at runtime.

---

## 4. Proof — FLOWKIT_HOME resolution can ignore PATH completely

A controlled proof constructed this external layout:

```text
FLOWKIT_HOME/
└─ tools/
   ├─ openspec/1.10.0/
   │  ├─ package.json
   │  └─ bin/openspec.js
   └─ archify/2.15.0/
      ├─ package.json
      └─ bin/archify.mjs
```

The proof then placed a fake `openspec` executable earlier on PATH that reports:

```text
9.9.9
```

while direct resolution from the lock + `FLOWKIT_HOME` still reported:

```text
OpenSpec 1.10.0
Archify  2.15.0
```

Decision:

```text
PATH
→ never a fallback source for managed tool resolution

FLOWKIT_HOME + repository lock
→ sole runtime location authority for these managed tools
```

The resolver should return an entrypoint path; later integration may invoke that exact path using the current host Node process/runtime contract. This Change itself does not own tool invocation.

---

## 5. Proof — minimum fail-closed checks are sufficient

A non-production resolver prototype exercised the bounded identity checks.

### Success case

For each requested tool:

```text
read exact lock entry
→ expand only ${FLOWKIT_HOME}
→ locate expected runtime root
→ read package.json
→ verify exact package name + version
→ verify declared entrypoint exists
→ return resolved identity
```

Both OpenSpec and Archify passed.

### Failure cases

The same prototype rejected:

```text
missing FLOWKIT_HOME/runtime root
→ fail closed

OpenSpec package version changed 1.10.0 → 1.9.0
→ fail closed

Archify declared entrypoint removed
→ fail closed
```

No PATH lookup was needed in any branch.

These proofs establish the minimum runtime identity boundary. They do NOT justify a generic filesystem sandbox, installer, package manager, runtime downloader, cryptographic directory attestation system or tool registry.

---

## 6. Minimum managed-tool contract

The Proposal should remain closed to the two managed tools required by this Delivery:

```ts
type ManagedToolId = "openspec" | "archify";
```

Conceptually, one resolved result only needs to carry facts needed by the next integration layer:

```ts
interface ResolvedManagedTool {
  readonly tool: ManagedToolId;
  readonly version: string;
  readonly runtimeRoot: string;
  readonly entrypoint: string;
}
```

The exact final TypeScript names remain Proposal/design work, but the semantic invariants are already bounded:

1. only `openspec` and `archify` are accepted in this Change;
2. expected version comes from the repository-tracked managed-tool lock;
3. `FLOWKIT_HOME` is explicit input/environment state and must resolve to a usable external root;
4. runtime location is derived from the managed lock, never from PATH discovery;
5. installed `package.json` package name and version must exactly match the expected tool identity;
6. the declared entrypoint must exist as a file under the resolved runtime root;
7. any malformed/missing/mismatching fact fails closed with deterministic diagnostics;
8. success returns identity/location facts only; it does not execute the tool or infer lifecycle authority.

The resolver should be **on-demand per requested tool**, not a global startup rule that requires every managed tool to exist for every Action. Existing repository guidance already states that a missing exact runtime blocks when the current work actually requires that tool.

This avoids an unnecessary failure mode such as requiring Archify for an Action that only needs OpenSpec.

---

## 7. Lock and documentation correction required by the formal contract

The pre-OpenSpec initialization material currently describes an “exact toolchain identity” containing:

```text
Node 22.23.2
pnpm 11.22.0
OpenSpec 1.10.0
Archify 2.15.0
```

That was useful for deterministic bootstrap, but it is too broad as the ongoing managed-runtime contract.

Proposal direction:

```text
config/tools/toolchain.lock.json
→ managed external tool identity only
→ OpenSpec / Archify exact identity

package.json.engines.node
→ host runtime compatibility

package.json.packageManager
→ repository package manager identity

.node-version
→ pinned developer/detached fixture MAY remain
```

`AGENTS.md` must stop telling future agents that exact Node patch identity is required for managed resolution. `FOUNDATION-INIT.md` may preserve Node 22.23.2 as the historical initialization snapshot, but should not be interpreted as overriding the current package engine compatibility contract.

Derived Archify current/planned views also still display Node/pnpm together with OpenSpec/Archify as one exact lock. Because Archify is non-authoritative, these should be synchronized after the formal Change is implemented; they are evidence of the old bootstrap picture, not a reason to keep the incorrect contract.

No legacy lock parser/migration layer is required: there is no existing candidate managed-tool resolver to preserve.

---

## 8. Runtime artifact hashes — retain provenance, do not overclaim live attestation

The existing lock contains runtime/source artifact SHA-256 values and the supplied artifacts match them exactly.

Those hashes are useful as restore/transfer provenance, but the runtime resolver normally sees an already-unpacked `FLOWKIT_HOME/tools/**` tree and the source archives may not exist on the target machine.

Therefore this Change should not silently turn into an installer or whole-directory attestation subsystem.

Minimum boundary:

```text
lock artifact hashes
→ durable expected package provenance / diagnostics

runtime resolution
→ exact configured root
→ exact package name/version
→ expected entrypoint exists
```

A future environment/bootstrap capability may verify archive hashes during restore. That is outside the current resolver's real use case.

---

## 9. Diagnostics must be machine-stable but not a new evidence platform

Runtime resolution needs deterministic failure information because later OpenSpec/CLI integration must be able to STOP rather than guess.

Minimum diagnostic categories are conceptually:

```text
invalid-lock
missing-flowkit-home
invalid-runtime-root
missing-runtime
package-identity-mismatch
missing-entrypoint
unsupported-managed-tool
```

The Proposal may choose exact literals, but they should form a closed small catalog rather than free-form success/failure inference.

Diagnostics are ordinary resolver output/errors. They are NOT:

```text
Verification verdict
Reviewer verdict
Owner authority
Run evidence registry
Policy decision
```

---

## 10. Cross-platform boundary

The Delivery ultimately requires Windows Native and Linux x64 detached acceptance, but this Change should not implement a generic cross-platform path abstraction beyond what the real resolver needs.

Required principle:

```text
FLOWKIT_HOME
→ current host filesystem path
→ resolved with current host path semantics
```

The lock should express a relative managed-tool layout under `FLOWKIT_HOME`, not a platform-specific absolute path committed to Git.

Platform acceptance remains owned by the later `validate-foundation-manager-cross-platform` Change. This Explore only establishes that the contract does not encode the detached Linux absolute path or exact Node 22.23.2 as universal truth.

---

## 11. Explicit non-goals

This Change MUST NOT become any of the following:

```text
Node installer / Node version manager
exact Node patch lock
pnpm installer
package dependency installer
OpenSpec lifecycle adapter
Archify lifecycle authority
PATH/global CLI discovery
runtime auto-download / auto-upgrade
latest-version discovery
managed-tool plugin registry
arbitrary third-party tool registry
whole-directory cryptographic attestation
FLOWKIT_HOME bootstrap/restore orchestration
cross-platform acceptance suite
CLI surface
Git checkpoint capability
```

The next OpenSpec integration Change consumes the resolver; it must not be pulled into this Change.

---

## 12. Proposal-ready boundary

### Problem statement

Flowkit currently has repository-tracked exact OpenSpec/Archify identities and external runtime layout conventions, but no candidate domain/integration boundary that deterministically resolves and validates the required managed runtime from `FLOWKIT_HOME`. Existing bootstrap docs also overstate the exact Node fixture as part of the same managed identity.

### Durable facts

- Managed tools for this Delivery are exactly OpenSpec `1.10.0` and Archify `2.15.0`.
- Their supplied runtime/source artifact hashes match the current lock.
- Their restored package names, versions and entrypoints are observable and valid.
- PATH discovery is unnecessary and creates an avoidable ambiguity.
- Node is a host runtime with compatibility truth already expressed as `package.json.engines.node >=22.20.0`.
- Node `22.23.2` remains a valid deterministic detached/developer fixture, not an exact universal requirement.
- pnpm identity already exists in `package.json.packageManager`; it is not a managed runtime target consumed by this resolver.

### Required invariants

- Resolve requested OpenSpec/Archify only from the repository lock + explicit `FLOWKIT_HOME`.
- Validate exact installed package name/version and entrypoint presence.
- Never silently fall back to PATH/global tools.
- Fail closed with deterministic diagnostics on malformed/missing/mismatching required facts.
- Resolve on demand per managed tool; do not require unrelated tools globally.
- Keep Node compatibility separate from managed tool exact identity.
- Do not install, download, upgrade, invoke or interpret the resolved tool in this Change.

### Remaining limitations / deferred concerns

- archive/hash verification during environment restore;
- generic host runtime doctor beyond the existing Node engine declaration;
- execution/invocation of OpenSpec or Archify;
- Windows/Linux whole-manager acceptance;
- additional managed tools beyond OpenSpec/Archify.

### Minimum Proposal direction

Create one narrow managed-tool resolution capability that:

1. formalizes a lock containing exact OpenSpec/Archify managed identities;
2. resolves only those tools under `FLOWKIT_HOME`;
3. validates exact package/version/entrypoint identity;
4. returns a small resolved identity or closed diagnostic failure;
5. corrects repository guidance so exact Node 22.23.2 is treated as fixture/bootstrap evidence rather than managed runtime authority;
6. leaves invocation to the later OpenSpec/CLI integration Changes.

## Explore conclusion

```text
PASS
```

The real use case is bounded, the host-vs-managed distinction is resolved, PATH-fallback ambiguity is disproved as unnecessary, and the minimum fail-closed identity checks are demonstrated without expanding into environment management.

Next boundary:

```text
review-explore
```
