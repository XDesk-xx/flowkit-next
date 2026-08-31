# Tests

The repository has executable unit/domain, repository-quality and whole-manager acceptance coverage.

```text
tests/unit/domain/   → domain/CLI contract regressions, including D02 trusted coordination and applicable-check execution
tests/unit/quality/  → focused repository-quality fixtures such as production reachability
tests/acceptance/    → detached whole-manager acceptance + Windows compatibility simulation
```

Formal Delivery Full Test uses the frozen six-gate sequence recorded in the Delivery manifest. D02 repository quality commands remain separate bounded capabilities and do not silently expand Formal Full Test into a quality platform.

Windows compatibility simulation is bounded portability evidence and is not a claim of native Windows `cmd.exe` / PowerShell / NTFS coverage.
