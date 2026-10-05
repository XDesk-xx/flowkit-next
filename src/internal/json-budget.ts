/** Safe capacity diagnostics only; never includes input or exception contents. */
export interface JsonBudget {
  readonly subject: "request" | "result-facts";
  readonly dimension: "bytes" | "depth" | "nodes";
  readonly limit: number;
  readonly observed: number;
  readonly measurement: "exact" | "lower-bound";
}
