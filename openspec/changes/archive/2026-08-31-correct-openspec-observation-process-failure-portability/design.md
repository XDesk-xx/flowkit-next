## Context

见 `proposal.md`。当前 `src/domain/openspec-observation.ts` 已经采用以下实际 precedence：child `error` 或 close 时 `code === null || signal !== null` → `openspec-process-failed`；否则 numeric close 进入 JSON parsing，然后才区分 formal non-zero outcome 与 success shape。问题来自 boundary test 使用 child self-`SIGKILL` 作为 universal abnormal-close fixture：Node 22.23.2 Linux 暴露 `code=null/signal=SIGKILL`，而 Windows exact implementation 可暴露 `code=1/signal=null/stdout=""`，因此同一 hidden OS cause 在两个 host 上并不形成相同 observable close tuple。

## Goals / Non-Goals

**Goals:**

- 让 canonical spec 与 production 已有的 host-observable precedence 一致。
- 以 deterministic portable tests 分别证明 host-observable abnormal outcome、numeric malformed output、valid JSON non-zero formal outcome 三类行为。
- 尽量保持 production behavior、public API、diagnostic taxonomy 和 architecture 不变。

**Non-Goals:**

- 不根据 Windows、exit code `1`、empty stdout 或 stderr 推断 hidden termination cause。
- 不把所有 non-zero/empty output 重分类为 process failure。
- 不新增 diagnostic kind、dependency、process supervisor、runtime abstraction 或 generic child-process framework。
- 不修改 managed-tool resolution、OpenSpec lifecycle、Applicable Checks 或其他 D02 capability。

## Decisions

### 1. Formal contract 使用 host-observable child-process facts，而不是 hidden OS cause

Process-failure contract 只依赖 `spawn/error`、`code=null`、`signal!=null`。Numeric close 已形成时，required machine output parsing 保持下一层判定。

**Rationale:** exact Windows/Linux proof 已证明 hidden self-termination cause 不能从现有 Node close tuple 跨平台恢复；任何 OS/exit-code heuristic 都会把不可观察事实升级成 Flowkit truth。

**Alternative considered:** `win32 && code===1` 或 `non-zero && stdout empty` → process failure。拒绝，因为普通 program exit 可能产生同样 observable tuple，分类会失真。

### 2. 保持 production classification behavior，不做 heuristic broadening

当前 `invokeManagedOpenSpec` 的 externally observable precedence 与修订 spec 一致，因此默认不改变 public behavior。Apply 仅允许为 deterministic testing 抽取当前 inline close classification 为一个内部纯 helper / seam；该 seam MUST NOT 从 `src/domain/index.ts` 暴露，也 MUST NOT 新增 runtime state 或 abstraction layer。

**Rationale:** Reviewer 已确认 production broadening 未被 proof；最小 correction 应修正 contract/test portability，而不是改变已正确的 observable behavior。

**Alternative considered:** 完全不触碰 production source，只删除 self-SIGKILL assertion。拒绝，因为仍需要跨平台 deterministic proof 明确覆盖 `code=null` / `signal!=null` 的 process-failure branch；纯内部 helper 是最小可验证 seam。

### 3. 将 self-SIGKILL universal assertion 拆成两类 portable proof

Boundary tests SHALL 直接覆盖：

```text
host-observable abnormal close
(code=null OR signal!=null)
→ openspec-process-failed
```

以及通过真实 child numeric close fixture 覆盖：

```text
numeric exit + invalid/empty required stdout
→ malformed-machine-output
```

既有 valid JSON + numeric non-zero fixture 继续证明：

```text
→ openspec-formal-outcome
```

self-`SIGKILL` MAY 作为 platform-specific exploratory evidence 留在 Explore 历史，但 MUST NOT 继续作为 universal repository contract assertion。

### 4. 不引入 platform branching

测试和 production 都不增加 `process.platform === "win32"` 分支来决定 diagnostic。相同 observable tuple 在所有 host 上得到相同 classification。

**Rationale:** 这是本 correction 的 portable contract；平台只是产生 tuple 的环境，不是 Flowkit classification input。

## Risks / Trade-offs

- **[Risk] Internal testability seam 被误认为新的 public process abstraction** → helper 保持 module-internal/非 `domain/index` public export，仅表达现有 close tuple classification，不接管 spawn、buffer、timeout 或 supervision。
- **[Risk] Hidden forceful termination 在 Windows 被 numeric malformed-output 分类** → 这是当前 Node observation seam 的真实可观察边界；spec 明确禁止从不可观察 OS cause 反推另一个 diagnostic。
- **[Trade-off] 不再 universal assert self-SIGKILL == process-failure** → 换取跨平台 deterministic contract proof，同时保留 Linux/Windows exact proof 于 Explore 历史。

## Migration Plan

1. 最小更新 `openspec-thin-integration` canonical requirement through this delta。
2. 若 deterministic test 需要，将现有 close tuple 判定抽成内部纯 helper，不改变 public API 或 behavior。
3. 替换 non-portable universal self-SIGKILL test，新增/保留三类 portable classification coverage。
4. 在 Linux 与可用 Windows 环境验证 focused boundary tests；再运行完整 domain suite、typecheck、quality gates、build 与 strict OpenSpec validation。
5. 无 data migration、dependency/package/lock migration 或 architecture migration。
