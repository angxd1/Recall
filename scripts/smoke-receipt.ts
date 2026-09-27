import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const base = process.env.RECEIPT_TEST_API_URL ?? "http://localhost:8787";
  const image = process.argv[2] ?? path.join(__dirname, "fixtures/receipt.png");
  const start = Date.now();
  async function post(route: string, body: unknown) {
    const response = await fetch(base + route, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(150_000),
    });
    const data = await response.json();
    assert.equal(response.status, 200, `${route}: ${JSON.stringify(data)}`);
    return data;
  }
  const result = await post("/receipts/extract", { imageBase64: (await readFile(image)).toString("base64") });
  console.log(JSON.stringify({ image, seconds: (Date.now() - start) / 1000, ...result }, null, 2));
  // Public image arguments exercise OCR only; the default synthetic fixture also
  // verifies exact product extraction and the explicitly labelled demo recall.
  if (process.argv[2]) return;
  assert.equal(result.items.length, 3, "Expected three products, excluding totals/tax");
  for (const [name, price] of [["ABC Granola Bars", 4.99], ["Tide Pods", 18.99], ["Whole Milk", 5.49]] as const) {
    assert.ok(result.items.some((item: { name: string; price: number }) =>
      item.name.toLowerCase().includes(name.toLowerCase()) && item.price === price), `Missing ${name}`);
  }
  await post("/demo/inject-recall", {});
  const products = result.items.map((item: { name: string; brand?: string }, index: number) => ({
    id: `receipt-smoke-${index}`, ...item, status: "clear", purchasedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  }));
  const matches = await post("/match/potential", { products });
  const hit = matches.matches.find((m: { recallId: string }) => m.recallId === "seed-abc-granola-bars");
  assert.ok(hit, "Extracted granola must match the demo recall");
  const confirmed = await post("/match/verify", { recallId: hit.recallId, ocrText: "LOT A1842", lot: "A1842" });
  assert.equal(confirmed.confirmed, true);
  const outside = await post("/match/verify", { recallId: hit.recallId, ocrText: "LOT A2000", lot: "A2000" });
  assert.equal(outside.confirmed, false);
  console.log("PASS: real model extraction → potential recall → matching/nonmatching lot verification");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
