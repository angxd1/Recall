import { Hono } from "hono";
import {
  DEMO_RECEIPT_ITEMS,
  type ExtractReceiptResponse,
} from "@recalllens/shared";
import { extractReceiptFromImage } from "../services/receiptExtract";

export const receipts = new Hono();

receipts.post("/extract", async (c) => {
  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await c.req.json<{ useDemo?: boolean; imageBase64?: string }>();
    if (body.useDemo) {
      const response: ExtractReceiptResponse = {
        retailer: "Walmart",
        purchasedAt: new Date().toISOString(),
        items: DEMO_RECEIPT_ITEMS,
      };
      return c.json(response);
    }
    if (body.imageBase64) {
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
  } catch {
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
