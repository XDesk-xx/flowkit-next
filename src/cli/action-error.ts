import type { JsonBudget } from "../internal/json-budget.js";

export class ActionCommandError extends Error {
  constructor(
    readonly kind: string,
    readonly effect: string,
    readonly runId: string | null,
    message: string,
    readonly budget?: JsonBudget,
  ) {
    super(message);
    this.name = "ActionCommandError";
  }
}

export function blocked(
  kind: string,
  message: string,
  runId: string | null = null,
  budget?: JsonBudget,
): never {
  throw new ActionCommandError(kind, "blocked", runId, message, budget);
}
