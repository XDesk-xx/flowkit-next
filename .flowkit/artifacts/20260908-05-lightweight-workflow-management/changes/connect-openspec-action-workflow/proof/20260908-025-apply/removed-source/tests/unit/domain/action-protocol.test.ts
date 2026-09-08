import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";
import { jsonLineActionTransport } from "../../../src/cli/action-protocol.js";

function fixture() {
  const input = new PassThrough();
  const output = new PassThrough();
  const protocol = jsonLineActionTransport(input, output);
  return { input, output, protocol };
}
test("JSONL supports split buffers and emits exact prepare then execute", async () => {
  const f = fixture();
  try {
    const response = f.protocol.exchange(
      { kind: "prepare" },
      "prepared",
      "run",
    );
    assert.equal(f.output.read().toString(), '{"kind":"prepare"}\n');
    f.input.write('{"kind":"prepared","runId":"run",');
    f.input.write('"outcome":"ready","reason":null}\n');
    assert.equal((await response).outcome, "ready");
    const result = f.protocol.exchange({ kind: "execute" }, "result", "run");
    f.input.write('{"kind":"result","runId":"run","result":{}}\n');
    assert.deepEqual((await result).result, {});
    f.protocol.assertClean();
  } finally {
    f.protocol.close();
  }
});
for (const text of [
  "garbage\n",
  "{}\n",
  '{"kind":"result","runId":"run","result":{}}\n',
  '{"kind":"prepared","runId":"wrong","outcome":"ready","reason":null}\n',
  '{"kind":"prepared","runId":"run","outcome":"blocked","reason":null}\n',
  "x".repeat(131073),
]) {
  test(`protocol rejects invalid input ${text.slice(0, 24)}`, async () => {
    const f = fixture();
    try {
      const response = f.protocol.exchange({}, "prepared", "run");
      f.input.write(text);
      await assert.rejects(response);
    } finally {
      f.protocol.close();
    }
  });
}
test("EOF rejects pending response and duplicate frames reject before completion", async () => {
  const f = fixture();
  const pending = f.protocol.exchange({}, "prepared", "run");
  f.input.end();
  await assert.rejects(pending, /host-eof/);
  f.protocol.close();
  const second = fixture();
  try {
    const response = second.protocol.exchange({}, "prepared", "run");
    const ready =
      '{"kind":"prepared","runId":"run","outcome":"ready","reason":null}\n';
    second.input.write(ready + ready);
    await response;
    assert.throws(() => second.protocol.assertClean(), /unexpected-host-frame/);
  } finally {
    second.protocol.close();
  }
});
