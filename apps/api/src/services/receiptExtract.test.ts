import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { receipts } from "../routes/receipts";

const imageBase64 = readFileSync(path.join(__dirname, "../../../../scripts/fixtures/receipt.png")).toString("base64");
const post = (body: unknown) => receipts.request("/extract", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const answer = (content: string) => {
  try { content = JSON.stringify({ isReceipt: true, ...JSON.parse(content) }); } catch { /* Test malformed JSON unchanged. */ }
  return new Response(JSON.stringify({ message: { content } }));
};

test("self-hosted receipt extraction", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  await t.test("sends the image to Ollama and validates structured products", async () => {
    globalThis.fetch = async (url, options) => {
      assert.match(String(url), /\/api\/chat$/);
      assert.doesNotMatch(String(url), /openai/);
      const body = JSON.parse(String(options?.body));
      assert.equal(body.stream, false);
      assert.equal(body.messages[1].images[0], imageBase64);
      assert.equal(body.format.type, "object");
      // Model-guessed brands must not broaden recall matching.
      return answer(JSON.stringify({ retailer: "Test store", items: [{ name: "Milk", brand: "N/A", price: 4.5 }] }));
    };
    const response = await post({ imageBase64: `data:image/png;base64,${imageBase64}` });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { retailer: "Test store", items: [{ name: "Milk", price: 4.5 }] });
  });

  await t.test("rejects invalid input without contacting inference", async () => {
    globalThis.fetch = async () => { throw new Error("must not fetch"); };
    for (const input of [123, "invalid!", Buffer.from("not an image").toString("base64")]) {
      assert.equal((await post({ imageBase64: input })).status, 400);
    }
    assert.equal((await post(null)).status, 400);
  });

  await t.test("unreadable or invalid output never becomes demo inventory", async () => {
    for (const output of ["not JSON", '{"isReceipt":false,"items":[{"name":"Fake"}]}', '{"items":[]}', '{"items":[{"name":""}]}', '{"items":[{"name":"Milk","price":-5}]}']) {
      globalThis.fetch = async () => answer(output);
      const response = await post({ imageBase64 });
      assert.equal(response.status, 422);
      assert.ok((await response.json()).error);
    }
  });

  await t.test("blank and corrupt images never reach the model", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return answer('{"items":[{"name":"Invented"}]}'); };
    const blank = await sharp({ create: { width: 100, height: 100, channels: 3, background: "white" } }).png().toBuffer();
    assert.equal((await post({ imageBase64: blank.toString("base64") })).status, 422);
    assert.equal((await post({ imageBase64: Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString("base64") })).status, 400);
    assert.equal(calls, 0);
  });

  await t.test("unavailable model and network failures return actionable errors", async () => {
    globalThis.fetch = async () => new Response("missing model", { status: 404 });
    assert.equal((await post({ imageBase64 })).status, 503);
    globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
    assert.equal((await post({ imageBase64 })).status, 503);
  });

  await t.test("concurrent requests are bounded and the slot is released", async () => {
    let finish!: (response: Response) => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => { started = resolve; });
    globalThis.fetch = () => new Promise<Response>((resolve) => { finish = resolve; started(); });
    const first = post({ imageBase64 });
    await ready;
    assert.equal((await post({ imageBase64 })).status, 429);
    finish(answer('{"items":[{"name":"Milk"}]}'));
    assert.equal((await first).status, 200);
    globalThis.fetch = async () => answer('{"items":[{"name":"Bread"}]}');
    assert.equal((await post({ imageBase64 })).status, 200);
  });

  await t.test("demo data requires explicit demo mode", async () => {
    globalThis.fetch = async () => { throw new Error("must not fetch"); };
    const response = await post({ useDemo: true });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).items.length, 6);
    assert.equal((await post({ useDemo: "yes" })).status, 400);
  });
});
