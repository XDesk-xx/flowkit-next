import assert from "node:assert/strict";
import path from "node:path";
import { tap } from "node:test/reporters";

// Preserve TAP and record the actual source files whose tests completed.
export default async function* report(source: Parameters<typeof tap>[0]) {
  async function* annotated(): Parameters<typeof tap>[0] {
    for await (const event of source) {
      yield event;
      if (event.type === "test:pass" && event.data.file?.endsWith(".test.ts"))
        yield {
          type: "test:diagnostic",
          data: {
            level: "info",
            nesting: 0,
            message: `domain-file ${JSON.stringify(path.basename(event.data.file))}`,
          },
        };
    }
  }
  yield* tap(annotated());
}

export function assertDomainFiles(
  stdout: readonly string[],
  expected: readonly string[],
) {
  const files = new Set<string>();
  for (const text of stdout)
    for (const match of text.matchAll(/^# domain-file (.+)$/gm))
      files.add(JSON.parse(match[1]));
  assert.deepEqual(
    [...files].sort(),
    [...expected].sort(),
    "Every current domain test file must execute",
  );
}
