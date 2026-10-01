export class ActionCommandError extends Error {
  constructor(
    readonly kind: string,
    readonly effect: string,
    readonly runId: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ActionCommandError";
  }
}

export function blocked(
  kind: string,
  message: string,
  runId: string | null = null,
): never {
  throw new ActionCommandError(kind, "blocked", runId, message);
}
