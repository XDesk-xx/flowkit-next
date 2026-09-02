# Action — Apply

```text
delivery: 20260831-03-action-guidance-bounded-agent-execution
change: correct-archive-handoff-and-cross-platform-verification-discipline
role: author
action: apply
base: 39ef634bc7680af0494d4d918adf58e338601a83
projectOrdinal: 025
changeStartSequence: 061
run: 20260902-075-apply
physicalRunGroup: 006
input: 20260902-074-review-propose APPROVED
```

Applied only the 074-approved bounded corrective contract using the independent bootstrap Apply discipline.

The candidate now provides package-bound atomic Action preparation inside the existing single-Action invocation seam: newly prepared state is staged until exact Run context, canonical Guidance resolution, exact ActionPackage formation and read-only preparation succeed; blocked/failed preparation does not leak a newly staged `prepared` Action, while an already-prepared exact Action keeps existing retry semantics. Preparation and execution consume the same exact ActionPackage identity.

Author product/bootstrap Guidance converges archive readiness/correction, materially-required uncommitted continuation, and proportional proof-Explore concept/mutation-order HOW without adding a new Action/state/Policy transition/PreparationPackage/Run/Result/control plane.

The two former Windows-only proof gaps are closed using the approved detached-Linux semantic simulations:

```text
unreadable Guidance
→ real low-privilege EACCES
→ exact production resolver
→ fail closed

Git executable mode
→ core.filemode=false
→ git update-index --chmod=+x/-x
→ identical bytes / 100644↔100755
→ candidateRef changes
```

Native Windows/`icacls` mechanics are not claimed. The separate symlink host-capability guard remains unchanged.

Verification: focused 62/62 PASS; full domain 178/178 PASS with 0 skipped; typecheck/build/lint/format/forbidden-artifact PASS; Dependency Health 59 modules / 219 dependencies / 0 violations; Entropy 25/25; OpenSpec all 18/18 strict PASS; `git diff --check` PASS. Dependency resolution inputs are unchanged from the exact base, so the detached dependency snapshot was reused without install/relink/repair.

STOP at `review-apply`.
