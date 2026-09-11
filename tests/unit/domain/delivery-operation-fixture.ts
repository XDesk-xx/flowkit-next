import type { DeliveryFinalOperationFacts } from "../../../src/domain/index.js";
const deliveryId = "20260902-04-delivery-continuity-stable-core-closure";
export function finalFacts(): DeliveryFinalOperationFacts {
  return {
    projectId: "flowkit-next",
    fullTestAttempt: "12345678-1234-4123-8123-123456789abc",
    verifiedCandidateRef: "full-test-input:sha256:" + "1".repeat(64),
    fullTestExecutionRef: "full-test-execution:sha256:" + "2".repeat(64),
    coordinationPrestateRef: {
      artifact: "openspec/delivery-groups/" + deliveryId + ".yaml",
      contentSha256: "5".repeat(64),
      bytes: 123,
    },
    completedRequiredChangeIds: ["change-one", "change-two"],
    changeCompletions: ["change-one", "change-two"].map((changeId, index) => {
      const archiveRunId = "2026090" + (index + 1) + "-002-archive";
      const reviewApplyRunId = "2026090" + (index + 1) + "-001-review-apply";
      const root =
        ".flowkit/runs/" + deliveryId + "/00" + (index + 1) + "-" + changeId;
      return {
        changeId,
        archiveRunId,
        reviewApplyRunId,
        archiveResultRef: {
          artifact: root + "/" + archiveRunId + "/result.json",
          contentSha256: "6".repeat(64),
          bytes: 10,
        },
        reviewResultRef: {
          artifact: root + "/" + reviewApplyRunId + "/result.json",
          contentSha256: "7".repeat(64),
          bytes: 10,
        },
      };
    }),
  };
}
