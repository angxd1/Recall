import { Hono } from "hono";
import { barcodeKey } from "@recalllens/shared";
import { z } from "zod";

const productSchema = z.object({
  product: z.object({
    product_name: z.string().optional(),
    product_name_en: z.string().optional(),
    brands: z.string().optional(),
  }).optional(),
});
type Lookup = { product: { name: string; brand?: string } | null; source: "Open Food Facts" };
const cache = new Map<string, { value: Lookup; expires: number }>();
const pending = new Map<string, Promise<Lookup>>();
let requests: number[] = [];

async function lookup(code: string): Promise<Lookup> {
  const now = Date.now();
  const cached = cache.get(code);
  if (cached && cached.expires > now) return cached.value;
  if (pending.has(code)) return pending.get(code)!;
  requests = requests.filter((time) => time > now - 60_000);
  // Stay below the provider's product-read limit, including cache misses.
  if (requests.length >= 14) throw new Error("busy");
  requests.push(now);
  const task = (async () => {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${code}?fields=product_name,product_name_en,brands`,
      { headers: { "User-Agent": "WeCanRecall/0.1 (https://github.com/angxd1/WeCanRecall)" },
        signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok && response.status !== 404) throw new Error("unavailable");
    const parsed = response.status === 404 ? {} : productSchema.parse(await response.json());
    const name = (parsed.product?.product_name_en || parsed.product?.product_name)?.trim();
    const value: Lookup = {
      product: name ? { name: name.slice(0, 300), brand: parsed.product?.brands?.trim().slice(0, 200) || undefined } : null,
      source: "Open Food Facts",
    };
    if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
    cache.set(code, { value, expires: now + (name ? 86_400_000 : 300_000) });
    return value;
  })();
  pending.set(code, task);
  try { return await task; } finally { pending.delete(code); }
}

export const products = new Hono();
products.get("/barcode/:code", async (c) => {
  const key = barcodeKey(c.req.param("code"));
  if (!key) return c.json({ error: "Enter a valid UPC or EAN barcode, including its check digit." }, 400);
  // OFF uses EAN-13 for UPC-A; preserve EAN-8 and nonzero GTIN-14.
  const code = key.startsWith("000000") ? key.slice(6) : key.startsWith("0") ? key.slice(1) : key;
  try { return c.json(await lookup(code)); }
  catch {
    return c.json({ error: "Product lookup is unavailable or busy. Try again, or enter the name manually." }, 503);
  }
});
