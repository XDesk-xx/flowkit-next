import type { DeliveryFinalOperationFacts } from "../../../src/domain/index.js";

const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";

export function finalFacts(): DeliveryFinalOperationFacts {
  const artifacts = ["action.md", "context.json", "result.json"].map(
    (artifact, index) => ({
      artifact: `runs/${artifact}`,
      contentSha256: String(index + 6).repeat(64),
      bytes: 10,
    }),
  );
  return {
    verifiedCandidateRef: `full-test-input:sha256:${"1".repeat(64)}`,
    fullTestExecutionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
    coordinationPrestateRef: {
      artifact: `openspec/delivery-groups/${deliveryId}.yaml`,
      contentSha256: "5".repeat(64),
      bytes: 123,
    },
    completedRequiredChangeIds: ["change-one", "change-two"],
    requiredEvidence: {
      projectId: "flowkit-next",
      deliveryId,
      changeClosures: ["change-one", "change-two"].map((changeId, index) => ({
        changeId,
        archiveRunId: `2026090${index + 1}-001-archive`,
        reviewApplyRunId: `2026090${index + 1}-002-review-apply`,
        runs: [
          { runId: `2026090${index + 1}-001-archive`, artifacts },
          { runId: `2026090${index + 1}-002-review-apply`, artifacts },
        ],
      })),
      fullTest: {
        executionRef: `full-test-execution:sha256:${"2".repeat(64)}`,
        sourceRef: "test:full",
        artifacts: [artifacts[0]],
      },
    },
  };
}
