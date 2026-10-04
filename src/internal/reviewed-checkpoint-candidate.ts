import { isDeepStrictEqual } from "node:util";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { archiveReviewSource } from "../cli/current-run-chain.js";
import { candidateGitProjection } from "./candidate-git-bytes.js";
import {
  isCandidateGit,
  type CandidateGitFile,
} from "./candidate-git-facts.js";
import {
  archiveJson,
  archiveV2Refs,
  readArchiveV2,
  readArchiveV2Projection,
} from "./archive-effects-v2.js";
import type { DurableRunRecord } from "../domain/run-result-persistence.js";
import { assertReviewBinding } from "../cli/review-candidate.js";
import {
  controlledBytes,
  readEffectiveRun,
  sha256,
} from "../cli/run-effective-facts.js";
import { readCandidateRunChain } from "./git-index-run-chain.js";
import type { CheckpointCandidateTree } from "./checkpoint-candidate-tree.js";
import {
  archiveEffectsRoot,
  archiveMaterialRefs,
  readArchivePrestate,
} from "./archive-effects.js";

export interface ReviewedCheckpointTarget {
  readonly deliveryId: string;
  readonly changeId: string;
}

/** Expected bytes are accumulated so the actual index and final commit can be checked independently. */
export async function reviewedCheckpointCandidate(
  root: string,
  tree: CheckpointCandidateTree,
  selected: ReviewedCheckpointTarget | null,
  changedPaths: readonly string[],
) {
  const expected = new Map<string, string | null>();
  const targets = new Map<string, ReviewedCheckpointTarget>();
  if (selected !== null)
    targets.set(`${selected.deliveryId}/${selected.changeId}`, selected);
  for (const relative of changedPaths) {
    const match =
      /^\.flowkit\/artifacts\/([^/]+)\/changes\/(\d{3,}-(.+))\/corrections\/[^/]+\/correction\.json$/.exec(
        relative,
      );
    if (match)
      targets.set(`${match[1]}/${match[3]}`, {
        deliveryId: match[1],
        changeId: match[3],
      });
  }
  async function expect(relative: string, hash: string | null) {
    if (expected.has(relative) && expected.get(relative) !== hash)
      throw Error(`Conflicting candidate identity: ${relative}`);
    const bytes = await tree.read(relative);
    if ((bytes === null ? null : sha256(bytes)) !== hash)
      throw Error(
        `Candidate tree identity mismatch or missing evidence: ${relative}`,
      );
    expected.set(relative, hash);
  }
  async function expectProjected(
    relative: string,
    hash: string,
    identity?: CandidateGitFile,
  ) {
    if (!identity) {
      await expect(relative, hash);
      return;
    }
    const raw = await controlledBytes(root, relative);
    if (
      sha256(raw) !== hash ||
      identity.rawSha256 !== hash ||
      tree.entries.get(relative)?.objectId !== identity.blobOid
    )
      throw Error(`Reviewed raw/Git identity drift: ${relative}`);
    const bytes =
      identity.conversion === "identity"
        ? raw
        : Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"));
    await expect(relative, sha256(bytes));
  }
  for (const target of targets.values()) {
    const prefix = `.flowkit/runs/${target.deliveryId}/`;
    const present = [...tree.entries.keys()].some(
      (relative) =>
        relative.startsWith(prefix) &&
        relative.split("/")[3]?.endsWith(`-${target.changeId}`),
    );
    if (!present) {
      const groups = await readdir(
        path.join(root, ".flowkit/runs", target.deliveryId),
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      if (
        groups.some(
          (group) =>
            group === target.changeId || group.endsWith(`-${target.changeId}`),
        )
      )
        throw Error("Linked candidate Run missing from candidate tree");
      if (
        changedPaths.some(
          (relative) =>
            relative.startsWith(`.flowkit/artifacts/${target.deliveryId}/`) &&
            relative.includes("/corrections/"),
        )
      )
        throw Error("Correction candidate Run unavailable");
      // Ordinary checkpoints without a linked Run do not fabricate Reviewer receipts.
      continue;
    }
    const chain = await readCandidateRunChain(
      root,
      target.deliveryId,
      target.changeId,
      tree,
    );
    const evidenceTarget = { repositoryRoot: root, flowkitHome: "", ...target };
    for (const [relative, bytes] of chain.bytesByPath) {
      if (!(await controlledBytes(root, relative)).equals(bytes))
        throw Error(
          `Candidate immutable Run differs from worktree: ${relative}`,
        );
      await expect(relative, sha256(bytes));
    }
    const views = new Map<string, DurableRunRecord>();
    const predecessor =
      chain.tip.context.actionIdentity.actionId === "archive"
        ? chain.records.find(
            (record) =>
              record.context.runId === chain.tip.context.previousRunId,
          )
        : chain.tip;
    const tipReview =
      chain.tip.context.actionIdentity.actionId === "archive" && predecessor
        ? archiveReviewSource(chain.records, predecessor).review
        : predecessor;
    const required = new Set<string>();
    if (tipReview?.context.actionIdentity.actionId === "review-apply") {
      required.add(tipReview.context.runId);
      if (tipReview.context.previousRunId)
        required.add(tipReview.context.previousRunId);
    }
    const correctionPrefix = `.flowkit/artifacts/${target.deliveryId}/changes/${chain.runRoot.split("/").at(-1)!}/corrections/`;
    for (const relative of changedPaths)
      if (
        relative.startsWith(correctionPrefix) &&
        relative.endsWith("/correction.json")
      )
        required.add(relative.slice(correctionPrefix.length).split("/")[0]);
    for (const runId of required)
      if (!chain.records.some((record) => record.context.runId === runId))
        throw Error(
          `Correction candidate has no immutable original Run: ${runId}`,
        );
    for (const record of chain.records.filter((record) =>
      required.has(record.context.runId),
    )) {
      const view = await readEffectiveRun(evidenceTarget, record.context.runId);
      views.set(record.context.runId, {
        ...view.original,
        result: { ...view.original.result, facts: view.effectiveFacts },
      });
      if (view.correctionRef !== null) {
        await expect(
          view.correctionRef,
          sha256(await controlledBytes(root, view.correctionRef)),
        );
        const correction = JSON.parse(
          (await controlledBytes(root, view.correctionRef)).toString("utf8"),
        ) as { candidateEvidenceRef: string | null };
        if (correction.candidateEvidenceRef !== null)
          await expect(
            correction.candidateEvidenceRef,
            sha256(
              await controlledBytes(root, correction.candidateEvidenceRef),
            ),
          );
      }
    }
    const archive =
      chain.tip.context.actionIdentity.actionId === "archive"
        ? chain.tip
        : null;
    const reviewParent =
      archive === null
        ? chain.tip
        : chain.records.find(
            (record) => record.context.runId === archive.context.previousRunId,
          );
    const review =
      archive !== null && reviewParent
        ? archiveReviewSource(chain.records, reviewParent).review
        : reviewParent;
    if (
      review?.context.actionIdentity.actionId !== "review-apply" ||
      review.context.lifecycleState !== "terminal" ||
      review.result.reviewerVerdict !== "approved"
    ) {
      if (selected === null) {
        for (const record of views.values()) {
          const view = await readEffectiveRun(
            evidenceTarget,
            record.context.runId,
          );
          if (record.context.role !== "author" || view.correctionRef === null)
            continue;
          const hashes = view.effectiveFacts.artifactHashes as Record<
            string,
            string
          >;
          for (const [relative, hash] of Object.entries(hashes))
            await expect(relative, hash);
        }
        continue;
      }
      throw Error("Checkpoint has no exact accepted review-apply candidate");
    }
    const author = views.get(review.context.previousRunId ?? "") ?? null;
    const effectiveReview = views.get(review.context.runId)!;
    assertReviewBinding(author, effectiveReview.result.facts);
    const hashes = author?.result.facts.artifactHashes;
    if (
      typeof hashes !== "object" ||
      hashes === null ||
      Array.isArray(hashes) ||
      !Object.keys(hashes).length
    )
      throw Error("Reviewed candidate hashes unavailable");
    if (archive === null) {
      const projection = isCandidateGit(author?.result.facts.candidateGit)
        ? author.result.facts.candidateGit
        : undefined;
      if (projection) await candidateGitProjection(root, hashes, projection);
      for (const [relative, hash] of Object.entries(hashes)) {
        if (typeof hash !== "string") throw Error("Invalid candidate hash");
        await expectProjected(relative, hash, projection?.files[relative]);
      }
      continue;
    }
    if (
      archive.context.lifecycleState !== "terminal" ||
      archive.result.authorConclusion !== "PASS"
    )
      throw Error("Archive is not accepted terminal PASS");
    const group = chain.runRoot.split("/").at(-1)!;
    const storedPre = await archiveJson(
      evidenceTarget,
      `${archiveEffectsRoot(evidenceTarget, group, archive.context.runId)}/prestate.json`,
    );
    if (storedPre?.formatVersion === 2) {
      const pre = await readArchiveV2(
        evidenceTarget,
        group,
        archive.context.runId,
      );
      if (
        !pre ||
        pre.reviewRunId !== review.context.runId ||
        pre.authorRunId !== author?.context.runId ||
        !isDeepStrictEqual(pre.candidate, hashes) ||
        pre.archivePath !== archive.result.facts.archivePath ||
        pre.descriptorSha256 !==
          sha256(
            chain.bytesByPath.get(
              `${chain.runRoot}/${archive.context.runId}/action.md`,
            )!,
          )
      )
        throw Error("Archive v2 candidate binding invalid");
      const refs = await archiveV2Refs(
        evidenceTarget,
        group,
        archive.context.runId,
      );
      if (!isDeepStrictEqual(refs, archive.result.facts.archiveMaterialRefs))
        throw Error("Archive v2 material binding invalid");
      for (const ref of refs) await expect(ref.path, ref.sha256);
      const projection = await readArchiveV2Projection(
        evidenceTarget,
        group,
        archive.context.runId,
      );
      const afterHashes = Object.fromEntries(
        Object.entries(projection.files).map(([file, item]) => [
          file,
          item.rawSha256,
        ]),
      );
      await candidateGitProjection(root, afterHashes, projection);
      const observation = await archiveJson(
        evidenceTarget,
        `${archiveEffectsRoot(evidenceTarget, group, archive.context.runId)}/openspec-observed.json`,
      );
      const expectedAfter: Record<string, string> = {
        [pre.coordination.path]: pre.coordination.afterSha256,
      };
      for (const [suffix, hash] of Object.entries(pre.sourceFiles))
        expectedAfter[`${pre.archivePath}/${suffix}`] = hash;
      for (const [file, hash] of Object.entries(observation.specsAfter))
        if (hash !== null) expectedAfter[file] = hash as string;
      if (!isDeepStrictEqual(afterHashes, expectedAfter))
        throw Error("Archive destination projection set mismatch");
      const moved = [...tree.entries.keys()]
        .filter((file) => file.startsWith(pre.archivePath + "/"))
        .map((file) => file.slice(pre.archivePath.length + 1))
        .sort();
      if (
        !isDeepStrictEqual(moved, Object.keys(pre.sourceFiles).sort()) ||
        [...tree.entries.keys()].some((file) =>
          [pre.sourcePath, pre.defaultPath].some(
            (prefix) => file === prefix || file.startsWith(prefix + "/"),
          ),
        )
      )
        throw Error("Archive v2 migration set invalid");
      for (const suffix of Object.keys(pre.sourceFiles))
        await expect(`${pre.sourcePath}/${suffix}`, null);
      for (const [file, hash] of Object.entries(observation.specsAfter))
        if (hash === null) await expect(file, null);
      for (const [file, hash] of Object.entries(expectedAfter))
        await expectProjected(file, hash, projection.files[file]);
      const originalValue: unknown = author?.result.facts.candidateGit;
      const originalProjection = isCandidateGit(originalValue)
        ? originalValue
        : undefined;
      const unchanged: Record<string, string> = {};
      for (const [file, hash] of Object.entries(hashes)) {
        if (typeof hash !== "string") throw Error("Invalid reviewed raw hash");
        if (file.startsWith(pre.sourcePath + "/")) {
          if (pre.sourceFiles[file.slice(pre.sourcePath.length + 1)] !== hash)
            throw Error("Archive source identity mismatch");
        } else if (Object.hasOwn(pre.specsBefore, file)) {
          if (pre.specsBefore[file] !== hash)
            throw Error("Archive canonical before identity mismatch");
        } else if (file === pre.coordination.path) {
          if (pre.coordination.beforeSha256 !== hash)
            throw Error("Archive coordination before mismatch");
        } else unchanged[file] = hash;
      }
      if (originalProjection && Object.keys(unchanged).length) {
        const binding = {
          ...originalProjection,
          files: Object.fromEntries(
            Object.keys(unchanged).map((file) => [
              file,
              originalProjection.files[file],
            ]),
          ),
        };
        await candidateGitProjection(root, unchanged, binding);
      }
      for (const [file, hash] of Object.entries(unchanged))
        await expectProjected(file, hash, originalProjection?.files[file]);
      continue;
    }
    const pre = await readArchivePrestate(
      evidenceTarget,
      group,
      archive.context.runId,
    );
    if (
      pre === null ||
      pre.reviewRunId !== review.context.runId ||
      pre.authorRunId !== author?.context.runId ||
      !isDeepStrictEqual(pre.candidate, hashes) ||
      pre.archivePath !== archive.result.facts.archivePath ||
      pre.descriptorSha256 !==
        sha256(
          chain.bytesByPath.get(
            `${chain.runRoot}/${archive.context.runId}/action.md`,
          )!,
        )
    )
      throw Error("Accepted Archive transformation binding invalid");
    const refs = await archiveMaterialRefs(
      evidenceTarget,
      archiveEffectsRoot(evidenceTarget, group, archive.context.runId),
    );
    if (!isDeepStrictEqual(refs, archive.result.facts.archiveMaterialRefs))
      throw Error("Archive Result material references mismatch");
    for (const ref of refs) await expect(ref.path, ref.sha256);
    const actualMoved = [...tree.entries.keys()]
      .filter((relative) => relative.startsWith(pre.archivePath + "/"))
      .map((relative) => relative.slice(pre.archivePath.length + 1))
      .sort();
    if (
      !isDeepStrictEqual(actualMoved, Object.keys(pre.sourceFiles).sort()) ||
      [...tree.entries.keys()].some(
        (relative) =>
          relative.startsWith(pre.sourcePath + "/") ||
          relative.startsWith(pre.defaultPath + "/"),
      )
    )
      throw Error("Archive migration suffix set or old paths invalid");
    for (const [suffix, hash] of Object.entries(pre.sourceFiles)) {
      await expect(`${pre.archivePath}/${suffix}`, hash);
      await expect(`${pre.sourcePath}/${suffix}`, null);
    }
    for (const [relative, hash] of Object.entries(pre.specsAfter))
      await expect(relative, hash);
    await expect(pre.coordination.path, pre.coordination.afterSha256);
    for (const [relative, hash] of Object.entries(hashes)) {
      if (typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash))
        throw Error("Invalid reviewed candidate identity");
      if (relative.startsWith(pre.sourcePath + "/")) {
        if (pre.sourceFiles[relative.slice(pre.sourcePath.length + 1)] !== hash)
          throw Error("Reviewed migration source identity mismatch");
      } else if (Object.hasOwn(pre.specsBefore, relative)) {
        if (pre.specsBefore[relative] !== hash)
          throw Error("Reviewed spec prestate mismatch");
      } else if (relative === pre.coordination.path) {
        if (pre.coordination.beforeSha256 !== hash)
          throw Error("Reviewed coordination prestate mismatch");
      } else await expect(relative, hash);
    }
  }
  return expected;
}

export async function verifyExpectedCandidateTree(
  tree: CheckpointCandidateTree,
  expected: ReadonlyMap<string, string | null>,
  entries?: CheckpointCandidateTree["entries"],
) {
  for (const [relative, hash] of expected) {
    const bytes = await tree.read(relative);
    if ((bytes === null ? null : sha256(bytes)) !== hash)
      throw Error(`Candidate index/blob drift: ${relative}`);
    if (
      entries &&
      tree.entries.get(relative)?.mode !== entries.get(relative)?.mode
    )
      throw Error(`Candidate index/blob mode drift: ${relative}`);
  }
}
