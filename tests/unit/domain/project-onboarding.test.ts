import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const document = await readFile(path.join(root, "docs/onboarding.md"), "utf8");

test("onboarding is an exact distribution asset reachable from README", async () => {
  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  const readme = await readFile(path.join(root, "README.md"), "utf8");
  assert(pkg.files.includes("docs/onboarding.md"));
  assert(!pkg.files.includes("docs/"));
  assert.match(readme, /\]\(docs\/onboarding\.md\)/);
  // Check literal package paths in the guide, not historical repository files.
  const refs = [...document.matchAll(/`(skills\/[^`<>]+\/SKILL\.md)`/g)];
  assert(refs.length > 0);
  for (const [, relative] of refs) {
    assert((await stat(path.join(root, relative))).isFile(), relative);
    assert(pkg.files.some((prefix: string) => relative.startsWith(prefix)));
  }
});

test("short entry is extractable without carrying state or Action machinery", () => {
  const blocks = [...document.matchAll(/```markdown\n([\s\S]*?)\n```/g)];
  assert.equal(blocks.length, 1);
  const entry = blocks[0][1];
  assert(entry.startsWith("<!-- flowkit-entry:start -->"));
  assert(entry.endsWith("<!-- flowkit-entry:end -->"));
  for (const field of [
    "target",
    "manager",
    "FLOWKIT_HOME",
    "Role",
    "status/next",
  ])
    assert(entry.includes(field));
  assert.match(entry, /skills\/actions\/<actionId>\/SKILL\.md/);
  assert(!/currentRunId|changeStartSequence|owner:[a-f0-9]{64}/.test(entry));
  assert(!/import |writeFile|invoke.*Action/.test(entry));
});

test("installation examples use package-owned bin and disposable query input", () => {
  assert.match(document, /--omit=dev --no-audit --no-fund \$packageFile/);
  assert.match(document, /\$metadata\.bin\.flowkit/);
  assert.match(document, /repositoryRoot = \$target; flowkitHome = \$toolHome/);
  for (const command of ["doctor", "status", "next"])
    assert(document.includes(`node $cli ${command} --input $requestFile`));
  assert.match(document, /init --tools none/);
});
