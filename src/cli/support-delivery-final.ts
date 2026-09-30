import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { invokeDeliveryFinalOperation } from "../domain/delivery-final-execution.js";
import type {
  AcceptedCompletionRun,
  ReadDeliveryRequiredEvidence,
} from "../internal/delivery-required-evidence-source.js";
import { readStartProjectId } from "../internal/delivery-start-content.js";
import { fullTestPath } from "../internal/full-test-input.js";
import { readSelectedRunChain } from "./current-run-chain.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";

function completionSource(root: string): ReadDeliveryRequiredEvidence {
  return {
    readChangeClosure: async ({ projectId, deliveryId, changeId }) => {
      if (projectId !== (await readStartProjectId(root)))
        throw new Error("completion-project-mismatch");
      const chain = await readSelectedRunChain({
        repositoryRoot: root,
        deliveryId,
        changeId,
      });
      if (
        chain.kind !== "canonical" ||
        !chain.current ||
        chain.current.context.actionIdentity.actionId !== "archive" ||
        chain.current.context.lifecycleState !== "terminal" ||
        chain.current.result.authorConclusion !== "PASS"
      )
        throw new Error("completion-archive-unavailable");
      const archive = chain.current;
      const review = chain.records.find(
        (record) => record.context.runId === archive.context.previousRunId,
      );
      if (
        !review ||
        review.context.actionIdentity.actionId !== "review-apply" ||
        review.context.lifecycleState !== "terminal" ||
        review.result.reviewerVerdict !== "approved"
      )
        throw new Error("completion-review-unavailable");
      const selected = async (
        runId: string,
      ): Promise<AcceptedCompletionRun> => {
        const prefix = `.flowkit/runs/${deliveryId}/${String(chain.changeStartSequence).padStart(3, "0")}-${changeId}/${runId}`;
        const artifacts = [];
        for (const name of ["action.md", "context.json", "result.json"]) {
          const artifact = `${prefix}/${name}`;
          const bytes = await readFile(await fullTestPath(root, artifact));
          artifacts.push({
            artifact,
            contentSha256: createHash("sha256").update(bytes).digest("hex"),
            bytes: bytes.length,
          });
        }
        return {
          runId,
          changeStartSequence: chain.changeStartSequence,
          sourceRef: `${prefix}/result.json`,
          artifacts,
        };
      };
      return {
        projectId,
        deliveryId,
        changeId,
        archive: await selected(archive.context.runId),
        reviewApply: await selected(review.context.runId),
      };
    },
  };
}

export async function finalizeDelivery(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
): Promise<Record<string, unknown>> {
  const root = request.repositoryRoot as string;
  const deliveryId = request.deliveryId as string;
  try {
    const outcome = await invokeDeliveryFinalOperation(
      root,
      {
        deliveryId,
        ownerAuthority: request.ownerAuthority,
        flowkitHome: request.flowkitHome,
      },
      async () => ({ status: "ready" }),
      completionSource(root),
      installation,
    );
    if (outcome.status === "terminal")
      return {
        status: "completed",
        effect: "confirmed",
        finalizationRef: outcome.record.deliveryFinalizationRef,
        record: outcome.record,
      };
    return {
      status: "incomplete",
      effect: outcome.status === "failed" ? outcome.mutationStatus : "none",
      reason: outcome.reason,
    };
  } catch (error) {
    return {
      status: "incomplete",
      effect: "unknown",
      reason:
        error instanceof Error ? error.message : "delivery-final-unavailable",
    };
  }
}
