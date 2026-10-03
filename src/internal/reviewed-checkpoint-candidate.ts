import { isDeepStrictEqual } from "node:util";
import { readdir } from "node:fs/promises";
import path from "node:path";
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
    const tipReview =
      chain.tip.context.actionIdentity.actionId === "archive"
        ? chain.records.find(
            (record) =>
              record.context.runId === chain.tip.context.previousRunId,
          )
        : chain.tip;
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
    const review =
      archive === null
        ? chain.tip
        : chain.records.find(
            (record) => record.context.runId === archive.context.previousRunId,
          );
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
      for (const [relative, hash] of Object.entries(hashes)) {
        if (typeof hash !== "string") throw Error("Invalid candidate hash");
        await expect(relative, hash);
      }
      continue;
    }
    if (
      archive.context.lifecycleState !== "terminal" ||
      archive.result.authorConclusion !== "PASS"
    )
      throw Error("Archive is not accepted terminal PASS");
    const group = chain.runRoot.split("/").at(-1)!;
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
) {
  for (const [relative, hash] of expected) {
    const bytes = await tree.read(relative);
    if ((bytes === null ? null : sha256(bytes)) !== hash)
      throw Error(`Candidate index/blob drift: ${relative}`);
  }
}
