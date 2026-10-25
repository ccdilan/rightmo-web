import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedBody } from "../../lib/request-body.ts";
function request(chunks) {
  return new Request("https://rightmo.test", {
    method: "POST",
    duplex: "half",
    body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks)
          controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    }),
  });
}
test("bounded reader accepts a body at the limit", async () => {
  assert.equal(
    new TextDecoder().decode(await readBoundedBody(request(["ab", "cd"]), 4)),
    "abcd",
  );
});
test("bounded reader rejects oversized chunked bodies without content-length", async () => {
  await assert.rejects(readBoundedBody(request(["abc", "def"]), 5), RangeError);
});
test("bounded reader rejects an oversized declared body before reading it", async () => {
  const body = new Request("https://rightmo.test", {
    method: "POST",
    body: "hello",
    headers: { "content-length": "100" },
  });
  await assert.rejects(readBoundedBody(body, 5), RangeError);
});
