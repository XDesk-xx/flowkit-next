import { isExactGitPath } from "../domain/delivery-repository-integration-operation.js";
import { gitBytes, requireGitRoot } from "./git-checkpoint-scope.js";

/** Git attributes are path-specific; a representative filename proves nothing. */
export async function assertManagedEvidenceGitBytes(
  root: string,
  relativePath: string,
): Promise<void> {
  if (
    !isExactGitPath(relativePath) ||
    (!relativePath.startsWith(".flowkit/runs/") &&
      !relativePath.startsWith(".flowkit/artifacts/"))
  ) {
    throw Error(`Managed evidence path invalid: ${relativePath}`);
  }
  await requireGitRoot(root);
  const output = await gitBytes(root, [
    "check-attr",
    "-z",
    "text",
    "filter",
    "working-tree-encoding",
    "ident",
    "--",
    relativePath,
  ]);
  const fields = output.toString("utf8").split("\0");
  if (fields.pop() !== "" || fields.length !== 12) {
    throw Error(`Cannot read Git attributes for ${relativePath}`);
  }
  for (let index = 0; index < fields.length; index += 3) {
    if (fields[index] !== relativePath) {
      throw Error(`Git attributes path mismatch: ${relativePath}`);
    }
  }
  const attributes = new Map([
    [fields[1], fields[2]],
    [fields[4], fields[5]],
    [fields[7], fields[8]],
    [fields[10], fields[11]],
  ]);
  if (
    attributes.get("text") !== "unset" ||
    !["unset", "unspecified"].includes(attributes.get("filter") ?? "") ||
    !["unset", "unspecified"].includes(
      attributes.get("working-tree-encoding") ?? "",
    ) ||
    !["unset", "unspecified"].includes(attributes.get("ident") ?? "")
  ) {
    throw Error(
      "Target " +
        root +
        " needs -text and no Git clean filter/encoding/ident for " +
        relativePath +
        "; actual " +
        JSON.stringify(Object.fromEntries(attributes)),
    );
  }
}
