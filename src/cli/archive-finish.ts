import { lstat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { observeOpenSpecActiveChanges } from "../domain/openspec-observation.js";
import type { DurableRunRecord } from "../domain/run-result-persistence.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";
import {
  archiveEffectsRoot,
  archiveMaterialRefs,
  observeArchiveEffects,
  readArchivePrestate,
} from "../internal/archive-effects.js";
import type { FinishRequest } from "./action-request.js";
import { readProjectOrdinal } from "./action-readiness.js";
import {
  effectiveRecord,
  runMaterialLocation,
  sha256,
} from "./run-effective-facts.js";
import { assertReviewBinding } from "./review-candidate.js";
import { blocked } from "./action-error.js";

export async function checkArchiveFinish(
  request: FinishRequest,
  installation: ManagerInstallation,
  previous: DurableRunRecord | null,
  group: string,
  markdown: string,
) {
  const repositoryRoot = request.repositoryRoot;
  if (previous === null || previous.context.previousRunId === null)
    blocked(
      "archive-effects-unbound",
      "Archive has no exact Author/Review chain",
      request.runId,
    );
  const review = await effectiveRecord(request, previous);
  const author = await effectiveRecord(
    request,
    (await runMaterialLocation(request, review.context.previousRunId!)).record,
  );
  assertReviewBinding(author, review.result.facts);
  const pre = await readArchivePrestate(request, group, request.runId);
  const refs = await archiveMaterialRefs(
    request,
    archiveEffectsRoot(request, group, request.runId),
  );
  if (
    pre === null ||
    pre.archivePath !== request.result.facts.archivePath ||
    pre.reviewRunId !== previous.context.runId ||
    pre.authorRunId !== author.context.runId ||
    !isDeepStrictEqual(pre.candidate, author.result.facts.artifactHashes) ||
    pre.descriptorSha256 !== sha256(Buffer.from(markdown)) ||
    (await observeArchiveEffects(request, pre)).effect !== "completed" ||
    !isDeepStrictEqual(refs, request.result.facts.archiveMaterialRefs)
  )
    blocked(
      "archive-effects-unbound",
      "Finish must bind exact observed Archive materials",
      request.runId,
    );
  const archivePath = request.result.facts.archivePath;
  const ordinal = request.result.facts.projectOrdinal;
  if (
    typeof archivePath !== "string" ||
    typeof ordinal !== "number" ||
    !Number.isSafeInteger(ordinal) ||
    ordinal < 1 ||
    !new RegExp(
      `^openspec/changes/archive/\\d{4}-\\d{2}-\\d{2}-${String(ordinal).padStart(3, "0")}-${request.changeId}$`,
    ).test(archivePath) ||
    !(
      await lstat(path.join(repositoryRoot, ...archivePath.split("/")))
    ).isDirectory()
  )
    blocked(
      "archive-materialization-invalid",
      "Exact archive materialization is missing",
      request.runId,
    );
  if (ordinal !== (await readProjectOrdinal(request)))
    blocked(
      "archive-ordinal-drift",
      "Archive ordinal differs from coordination",
      request.runId,
    );
  let component = repositoryRoot;
  for (const segment of archivePath.split("/")) {
    component = path.join(component, segment);
    if ((await lstat(component)).isSymbolicLink())
      blocked(
        "archive-materialization-invalid",
        "Archive target is linked",
        request.runId,
      );
  }
  const active = await observeOpenSpecActiveChanges({
    repositoryRoot,
    flowkitHome: request.flowkitHome,
    installation,
  });
  if (active.changeIds.includes(request.changeId))
    blocked(
      "archive-materialization-invalid",
      "OpenSpec Change remains active",
      request.runId,
    );
}
