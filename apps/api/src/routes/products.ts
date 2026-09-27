import { Hono } from "hono";
import { barcodeKey } from "@recalllens/shared";
import { lookupProduct } from "../services/productLookup";

export const products = new Hono();
products.get("/barcode/:code", async (c) => {
  const key = barcodeKey(c.req.param("code"));
  if (!key || /^0+$/.test(key)) return c.json({ error: "Enter a valid UPC or EAN barcode, including its check digit." }, 400);
  try { return c.json(await lookupProduct(key)); }
  catch {
    return c.json({ error: "Product lookup is unavailable or busy. Try again, or enter the name manually." }, 503);
  }
});
