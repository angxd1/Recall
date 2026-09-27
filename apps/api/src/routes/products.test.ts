import test from "node:test";
import assert from "node:assert/strict";
import { products } from "./products";
import { barcodeKey, expandUpce } from "@recalllens/shared";

test("barcode lookup and normalization", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  assert.equal(barcodeKey("036000291452"), barcodeKey("0036000291452"));
  assert.equal(barcodeKey("036000291453"), null);
  assert.equal(expandUpce("01234558"), "012345000058");
  assert.equal(expandUpce("04252614"), "042100005264");
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.match(String(url), /0036000291452/);
    assert.match(String((init?.headers as Record<string, string>)["User-Agent"]), /WeCanRecall/);
    return Response.json({ product: { product_name_en: "Test product", brands: "Test brand" } });
  };
  assert.equal((await products.request("/barcode/not-a-upc")).status, 400);
  assert.equal(calls, 0);
  const found = await products.request("/barcode/036000291452");
  assert.deepEqual(await found.json(), { product: { name: "Test product", brand: "Test brand" }, source: "Open Food Facts" });
  await products.request("/barcode/0036000291452");
  assert.equal(calls, 1, "Equivalent barcodes share cache");
  globalThis.fetch = async () => new Response("", { status: 404 });
  const missing = await products.request("/barcode/3017620422003");
  assert.deepEqual(await missing.json(), { product: null, source: "Open Food Facts" });
  globalThis.fetch = async () => { throw new Error("offline"); };
  assert.equal((await products.request("/barcode/7613034626844")).status, 503);
  globalThis.fetch = async () => Response.json({ product: { product_name: 42 } });
  assert.equal((await products.request("/barcode/7613034626844")).status, 503);
});
