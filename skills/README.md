# Skills

Canonical project Skill root.

```text
skills/
├─ actions/       # project-owned Action execution guidance
├─ engineering/   # project-owned engineering methods
├─ tools/         # project-owned adapters to exact managed tools
└─ vendors/       # accepted upstream Skill source material distributed by this repository
```

Rules:

- Skills are Git-tracked source assets.
- `.agents/skills`, `.codex/skills`, and user-home Skill directories are not canonical.
- Vendor Skills are copied into this tree and pinned by `UPSTREAM.json`.
- CLI/runtime binaries are not stored here and are not committed to Git.
- Policy decides WHAT Action is legal; Skills only improve HOW that already-decided Action is executed.
