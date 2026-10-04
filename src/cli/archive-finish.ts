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
import {
  archiveJson,
  archiveV2Refs,
  observeArchiveV2,
  readArchiveV2,
  readArchiveV2Projection,
} from "../internal/archive-effects-v2.js";
import { archiveReviewSource } from "./current-run-chain.js";
import { candidateGitProjection } from "../internal/candidate-git-bytes.js";

export async function checkArchiveFinish(
  request: FinishRequest,
  installation: ManagerInstallation,
  previous: DurableRunRecord | null,
  group: string,
  markdown: string,
  records: readonly DurableRunRecord[] = [],
  version?: 2,
) {
  if (version === 2) {
    if (!previous)
      blocked(
        "archive-effects-unbound",
        "Archive predecessor missing",
        request.runId,
      );
    const source = archiveReviewSource(records, previous);
    const review = await effectiveRecord(request, source.review);
    const author = await effectiveRecord(request, source.author);
    assertReviewBinding(author, review.result.facts);
    const pre = await readArchiveV2(request, group, request.runId);
    const relative = archiveEffectsRoot(request, group, request.runId);
    const refs = await archiveV2Refs(request, group, request.runId);
    if (
      !pre ||
      pre.descriptorSha256 !== sha256(Buffer.from(markdown)) ||
      pre.reviewRunId !== review.context.runId ||
      pre.authorRunId !== author.context.runId ||
      !isDeepStrictEqual(pre.candidate, author.result.facts.artifactHashes) ||
      !isDeepStrictEqual(refs, request.result.facts.archiveMaterialRefs)
    )
      blocked(
        "archive-effects-unbound",
        "Archive v2 exact materials mismatch",
        request.runId,
      );
    const observed = await observeArchiveV2(request, group, pre).catch(
      () => null,
    );
    const outcome = request.result.facts.archiveOutcome as
      { kind?: string; effect?: string } | undefined;
    if (outcome?.kind === "completed") {
      if (
        observed?.effect !== "completed" ||
        pre.archivePath !== request.result.facts.archivePath ||
        request.result.facts.projectOrdinal !==
          (await readProjectOrdinal(request))
      )
        blocked(
          "archive-materialization-invalid",
          "Completed Archive facts missing",
          request.runId,
        );
      const projection = await readArchiveV2Projection(
        request,
        group,
        request.runId,
      );
      const hashes = Object.fromEntries(
        Object.entries(projection.files).map(([file, value]) => [
          file,
          value.rawSha256,
        ]),
      );
      const expectedHashes: Record<string, string> = {
        [pre.coordination.path]: pre.coordination.afterSha256,
      };
      for (const [suffix, hash] of Object.entries(pre.sourceFiles))
        expectedHashes[`${pre.archivePath}/${suffix}`] = hash;
      for (const [file, hash] of Object.entries(observed.actual.specs))
        if (hash !== null) expectedHashes[file] = hash;
      if (!isDeepStrictEqual(hashes, expectedHashes))
        blocked(
          "archive-effects-unbound",
          "Archive projection path set mismatch",
          request.runId,
        );
      await candidateGitProjection(request.repositoryRoot, hashes, projection);
      for (const [name, expected] of Object.entries({
        "rename-observed": {
          runId: request.runId,
          archivePath: pre.archivePath,
          sourceFiles: pre.sourceFiles,
        },
        "coordination-observed": {
          runId: request.runId,
          path: pre.coordination.path,
          beforeSha256: pre.coordination.beforeSha256,
          afterSha256: pre.coordination.afterSha256,
        },
      }))
        if (
          !isDeepStrictEqual(
            await archiveJson(request, `${relative}/${name}.json`),
            expected,
          )
        )
          blocked(
            "archive-effects-unbound",
            "Archive completion observation mismatch",
            request.runId,
          );
    } else if (outcome?.kind === "failed") {
      if (observed?.effect !== "failed" || outcome.effect !== "no-mutation")
        blocked(
          "archive-effects-unbound",
          "Safe Archive failure is not proven",
          request.runId,
        );
    } else if (outcome?.kind === "partial") {
      const failure = await archiveJson(request, `${relative}/failure.json`);
      if (
        !failure ||
        failure.runId !== request.runId ||
        failure.descriptorSha256 !== pre.descriptorSha256 ||
        (observed?.effect === "completed" &&
          (await archiveJson(request, `${relative}/git-projection.json`)) !==
            null) ||
        observed?.effect === "failed"
      )
        blocked(
          "archive-effects-unbound",
          "Archive partial effect is not proven",
          request.runId,
        );
    } else
      blocked(
        "archive-effects-unbound",
        "Archive v2 outcome required",
        request.runId,
      );
    return;
  }
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
