import assert from "node:assert/strict";
import { readFile, writeFile, realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const managerRoot = await realpath(process.cwd());
const root = await realpath(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply/example-target");
const domain = await import(pathToFileURL(path.join(managerRoot, "dist/domain/index.js")));
const { loadManagerInstallation } = await import(pathToFileURL(path.join(managerRoot, "dist/internal/manager-installation.js")));
const { resolveActionContext } = await import(pathToFileURL(path.join(managerRoot, "dist/cli/action-context.js")));
const installation = loadManagerInstallation();
const request = { repositoryRoot: root, flowkitHome: "C:/Users/xuser/.flowkit" };
const resolved = await resolveActionContext(request, installation);
assert.equal(resolved.selected.history.current, null);
const identity = { deliveryId: "example-delivery", changeId: "describe-greeting", actionId: "explore" };
const decision = domain.evaluatePolicyAndNextBoundary({ ...identity, actionId: undefined });
// Use only the existing closed PolicyFacts shape, not an inferred Action boundary.
const ready = domain.evaluatePolicyAndNextBoundary({
  deliveryId: identity.deliveryId, changeId: identity.changeId, changeState: "active",
  currentAction: null, terminalRunContext: null, terminalResult: null,
});
assert.deepEqual(ready, { kind: "ready-action", actionId: "explore" });
assert.equal(decision.kind, "blocked"); // malformed input cannot grant authority
const markdown = await readFile(path.join(managerRoot, "skills/actions/explore/SKILL.md"), "utf8");
const source = [...markdown.matchAll(/```js\r?\n(\/\/ agent-[\s\S]*?)```/g)].map(m => m[1]).join("\n");
const how = await import("data:text/javascript;base64," + Buffer.from(source + "\nexport {startRecord};").toString("base64"));
const occurrence = { date: "20260908", sequence: 1, actionId: "explore" };
const context = { runId: domain.formatRunOccurrenceId(occurrence), occurrence, actionIdentity: identity,
  role: "author", lifecycleState: "prepared", ownerAuthority: null, previousRunId: null };
const current = domain.transitionCurrentAction(null, { type: "prepare", identity });
const guidance = await domain.resolveActionGuidanceRef(installation, "explore");
const held = await how.startRecord(domain, { repositoryRoot: root, deliveryId: identity.deliveryId,
  changeId: identity.changeId, changeStartSequence: 1, occurrence }, current, context, guidance, true);
// Bounded verification transcript only; not an installed helper or current-state database.
await writeFile(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply/example-held.json", JSON.stringify(held, null, 2) + "\n", { flag: "wx" });
await writeFile(".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/connect-openspec-action-workflow/proof/20260908-025-apply/example-request.json", JSON.stringify(request, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ started: held.directory, actionId: identity.actionId, managerRoot }));
