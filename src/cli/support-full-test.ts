import { lstat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isFormalFullTestAuthorityForDelivery } from "../domain/delivery-operation-execution.js";
import { invokeDeliveryFullTestOperation } from "../domain/delivery-full-test-execution.js";
import { readCurrentDeliveryFullTest } from "../internal/full-test-current.js";
import { readSavedFullTestAttempt } from "../internal/full-test-attempt-readback.js";
import {
  attemptRoot,
  readFullTestCoordination,
  readFullTestJson,
} from "../internal/full-test-storage.js";
import { isPlainRecord } from "../internal/applicable-check-identity.js";
import type { ManagerInstallation } from "../internal/manager-installation.js";

export async function currentFullTest(request: Record<string, unknown>) {
  const root = request.repositoryRoot as string;
  const deliveryId = request.deliveryId as string;
  try {
    const selected = await readFullTestCoordination(root, deliveryId);
    const current = await readCurrentDeliveryFullTest(root, deliveryId);
    return {
      status: "completed",
      effect: "none",
      attemptId: selected.attemptId ?? null,
      current,
    };
  } catch (error) {
    return {
      status: "incomplete",
      effect: "none",
      attemptId: null,
      reason:
        error instanceof Error
          ? error.message
          : "full-test-current-unavailable",
    };
  }
}

export async function runFullTest(
  request: Record<string, unknown>,
  installation: ManagerInstallation,
) {
  const root = request.repositoryRoot as string;
  const deliveryId = request.deliveryId as string;
  const attemptId = request.attemptId as string;
  const expectedCurrentAttemptId = request.expectedCurrentAttemptId as
    string | null;
  const ownerAuthority = request.ownerAuthority;
  if (!isFormalFullTestAuthorityForDelivery(ownerAuthority, deliveryId))
    return {
      status: "incomplete",
      effect: "none",
      reason: "full-test-authority-invalid",
    };
  const relative = attemptRoot(deliveryId, attemptId);
  const directory = path.join(root, ...relative.split("/"));
  try {
    const entry = await lstat(directory).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (entry !== null) {
      if (!entry.isDirectory() || entry.isSymbolicLink())
        return {
          status: "incomplete",
          effect: "unknown",
          reason: "attempt-path-invalid",
        };
      let start;
      try {
        start = await readFullTestJson(root, relative + "/start.json");
      } catch {
        return {
          status: "incomplete",
          effect: "partial",
          attemptId,
          reason: "attempt-start-unconfirmed",
        };
      }
      if (
        !isPlainRecord(start) ||
        start.deliveryId !== deliveryId ||
        start.attemptId !== attemptId ||
        start.expectedCurrentAttemptId !== expectedCurrentAttemptId ||
        !isDeepStrictEqual(start.ownerAuthority, ownerAuthority)
      )
        return {
          status: "incomplete",
          effect: "none",
          attemptId,
          reason: "attempt-request-conflict",
        };
      const selected = await readFullTestCoordination(root, deliveryId);
      const isCurrent = selected.attemptId === attemptId;
      const record = await readFullTestJson(
        root,
        relative + "/result.json",
      ).catch((error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      });
      if (
        record === null ||
        !isPlainRecord(record) ||
        record.attemptId !== attemptId ||
        record.deliveryId !== deliveryId ||
        record.startedAt !== start.startedAt ||
        (record.status !== "passed" && record.status !== "failed")
      )
        return {
          status: "incomplete",
          effect: "partial",
          attemptId,
          isCurrent,
          attemptStatus:
            isCurrent && selected.status === "pending" ? "pending" : "partial",
          reason: "attempt-result-unconfirmed",
        };
      if (isCurrent && selected.status !== record.status)
        return {
          status: "incomplete",
          effect: "partial",
          attemptId,
          isCurrent,
          reason: "attempt-current-status-unconfirmed",
        };
      const current = isCurrent
        ? await readCurrentDeliveryFullTest(root, deliveryId)
        : null;
      if (isCurrent && current?.status !== record.status)
        return {
          status: "incomplete",
          effect: "partial",
          attemptId,
          isCurrent,
          attemptStatus: record.status,
          currentStatus: current?.status,
          reason: "attempt-material-unconfirmed",
        };
      if (!isCurrent) {
        try {
          if (
            (await readSavedFullTestAttempt(root, deliveryId, attemptId)) !==
            record.status
          )
            throw new Error("attempt-status-invalid");
        } catch {
          return {
            status: "incomplete",
            effect: "partial",
            attemptId,
            isCurrent,
            reason: "attempt-material-unconfirmed",
          };
        }
      }
      return {
        status: "completed",
        effect: "readback",
        attemptId,
        isCurrent,
        attemptStatus: record.status,
        currentStatus: current?.status ?? "historical",
      };
    }
    const outcome = await invokeDeliveryFullTestOperation(
      root,
      { deliveryId, ownerAuthority, attemptId, expectedCurrentAttemptId },
      installation,
    );
    if (outcome.status === "terminal")
      return {
        status: "completed",
        effect: "executed",
        attemptId,
        attemptStatus: outcome.verdict,
        record: outcome.record,
      };
    const selected = await readFullTestCoordination(root, deliveryId).catch(
      () => null,
    );
    return {
      status: "incomplete",
      effect: selected?.attemptId === attemptId ? "partial" : "unknown",
      attemptId,
      reason: outcome.reason,
    };
  } catch (error) {
    return {
      status: "incomplete",
      effect: "unknown",
      attemptId,
      reason: error instanceof Error ? error.message : "full-test-unavailable",
    };
  }
}
