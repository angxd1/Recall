import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  DEMO_RECEIPT_ITEMS,
  type ExtractReceiptResponse,
} from "@recalllens/shared";
import { extractReceiptFromImage, ReceiptExtractionError } from "../services/receiptExtract";

export const receipts = new Hono();

receipts.use("/extract", bodyLimit({ maxSize: 14_100_000 }));
receipts.onError((error, c) => {
  if (error instanceof ReceiptExtractionError) return c.json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return c.json({ error: "Invalid receipt request." }, 400);
  return c.json({ error: "Receipt extraction failed." }, 500);
});

receipts.post("/extract", async (c) => {
  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await c.req.json<{ useDemo?: boolean; imageBase64?: string }>();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return c.json({ error: "Provide a receipt request object." }, 400);
    }
    if (body.useDemo === true) {
      const response: ExtractReceiptResponse = {
        retailer: "Walmart",
        purchasedAt: new Date().toISOString(),
        items: DEMO_RECEIPT_ITEMS,
      };
      return c.json(response);
    }
    if (typeof body.imageBase64 === "string" && body.imageBase64) {
      const result = await extractReceiptFromImage(body.imageBase64);
      return c.json(result);
    }
    return c.json({ error: "imageBase64 or useDemo required" }, 400);
  }

  // Multipart fallback
  try {
    const form = await c.req.parseBody();
    const file = form["image"];
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const buf = Buffer.from(await file.arrayBuffer());
      const result = await extractReceiptFromImage(buf.toString("base64"));
      return c.json(result);
    }
  } catch (error) {
    if (error instanceof ReceiptExtractionError) throw error;
    // fall through
  }

  return c.json({ error: "Provide image or useDemo" }, 400);
});

receipts.get("/demo", (c) =>
  c.json({
    retailer: "Walmart",
    purchasedAt: new Date().toISOString(),
    items: DEMO_RECEIPT_ITEMS,
  } satisfies ExtractReceiptResponse)
);
