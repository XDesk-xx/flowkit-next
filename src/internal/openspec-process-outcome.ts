export function classifyManagedOpenSpecClose(
  code: number | null,
  signal: NodeJS.Signals | null,
): "openspec-process-failed" | { readonly exitCode: number } {
  if (code === null || signal !== null) {
    return "openspec-process-failed";
  }
  return Object.freeze({ exitCode: code });
}
