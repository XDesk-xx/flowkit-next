# Tests

The Foundation repository has executable unit/domain and whole-manager acceptance coverage.

```text
tests/unit/domain/   → domain/CLI contract regressions
tests/acceptance/    → detached whole-manager acceptance + Windows compatibility simulation
```

Formal Delivery Full Test uses the frozen gate sequence recorded in the Delivery manifest. Windows compatibility simulation is bounded portability evidence and is not a claim of native Windows `cmd.exe` / PowerShell / NTFS coverage.
