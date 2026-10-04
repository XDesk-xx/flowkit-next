import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const root = await mkdtemp(path.join(tmpdir(), "flowkit-revise-apply-"));
const packagePath = path.resolve(".tmp/revise-apply-linux-20261004/package/flowkit-next-1.0.0.tgz");
await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "revision-install-fixture", private: true, type: "module", dependencies: { "flowkit-next": `file:${packagePath.replaceAll("\\", "/")}` } }, null, 2) + "\n");
await writeFile(path.join(root, "pnpm-workspace.yaml"), "packages: []\noverrides:\n  yaml: 2.9.0\n");
await writeFile(path.join(import.meta.dirname, "detached-root.json"), JSON.stringify({ root, packagePath, purpose: "isolated candidate verification; stable manager unchanged", packageIgnoreScriptsEnvironment: { npm_config_ignore_scripts: "true" } }, null, 2) + "\n");
console.log(root);
