import type { ManagerInstallation } from "../internal/manager-installation.js";
import { activateChange } from "./support-change-activate.js";
import { archiveChange } from "./support-change-archive.js";
import { finalizeDelivery } from "./support-delivery-final.js";
import { startDelivery } from "./support-delivery-start.js";
import { currentFullTest, runFullTest } from "./support-full-test.js";
import { executeOrdinaryGit } from "./support-git.js";
import { integrateRepository } from "./support-git-integrate.js";
import { executeMemoCommand } from "./support-memo.js";
import { initializeProject } from "./support-project.js";
import type { SupportCommand } from "./support-request.js";

export async function executeSupportCommand(
  command: SupportCommand,
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  let result: Record<string, unknown>;
  switch (command) {
    case "project init":
      result = await initializeProject(request, installation);
      break;
    case "delivery start":
      result = await startDelivery(request, installation);
      break;
    case "change activate":
      result = await activateChange(request, installation);
      break;
    case "change archive":
      result = await archiveChange(request, installation);
      break;
    case "memo list":
    case "memo get":
    case "memo create":
    case "memo promote":
    case "memo dismiss":
      result = await executeMemoCommand(command, request);
      break;
    case "delivery full-test":
      result = await runFullTest(request, installation);
      break;
    case "delivery full-test current":
      result = await currentFullTest(request);
      break;
    case "delivery final":
      result = await finalizeDelivery(request, installation);
      break;
    case "git checkpoint":
    case "git push":
      result = await executeOrdinaryGit(command, request, installation);
      break;
    case "git integrate":
      result = await integrateRepository(request);
      break;
  }
  return {
    command,
    target: {
      repositoryRoot: request.repositoryRoot,
      ...(request.deliveryId ? { deliveryId: request.deliveryId } : {}),
      ...(request.changeId ? { changeId: request.changeId } : {}),
    },
    ...result,
  };
}
