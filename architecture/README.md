# Architecture

This directory stores **derived durable Architecture Description JSON** for Flowkit deliveries.

Current Delivery 01 assets:

```text
architecture/20260824-01-foundation-lifecycle-kernel/json/
├─ current.architecture.json
├─ planned.architecture.json
├─ actual.architecture.json
├─ current-to-planned.compare.json
├─ current-to-actual.compare.json
└─ planned-to-actual.compare.json
```

`current / planned / actual` are derived descriptions. The three Compare JSON files are thin, ref-based descriptors; they do not copy either side.

Archify validates/renders these assets but is **not** an architecture truth source. OpenSpec/repository facts remain authoritative. Generated HTML is disposable and excluded from Git via `architecture/.gitignore`.

Accepted `actual` may be used as a continuity input when rematerializing the next Delivery's `current`, but it does not itself become canonical truth.
