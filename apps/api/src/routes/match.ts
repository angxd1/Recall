import { Hono } from "hono";
import {
  isPotentialProductMatch,
  verifyAgainstRecall,
  type Product,
  type Recall,
} from "@recalllens/shared";
import { recallStore } from "../services/recallStore";

export const match = new Hono();

match.post("/potential", async (c) => {
  const body = await c.req.json<{ products: Product[] }>();
  const recalls = await recallStore.list();
  const matches: Array<{
    productId: string;
    recallId: string;
    matchedFields: string[];
    product: Product;
    recall: Recall;
  }> = [];

  for (const product of body.products ?? []) {
    for (const recall of recalls) {
      const result = isPotentialProductMatch(product, recall);
      if (result.matched) {
        matches.push({
          productId: product.id,
          recallId: recall.id,
          matchedFields: result.fields,
          product,
          recall,
        });
      }
    }
  }

  return c.json({ matches });
});

match.post("/verify", async (c) => {
  const body = await c.req.json<{
    recallId: string;
    ocrText: string;
    lot?: string;
    upc?: string;
  }>();

  const recall = await recallStore.get(body.recallId);
  if (!recall) return c.json({ error: "Recall not found" }, 404);

  const { extractLotFromOcr, extractUpcFromOcr } = await import(
    "@recalllens/shared"
  );
  const lot = body.lot ?? extractLotFromOcr(body.ocrText);
  const upc = body.upc ?? extractUpcFromOcr(body.ocrText);
  const result = verifyAgainstRecall(recall, { lot, upc });

  return c.json({
    ...result,
    observedLot: lot,
    observedUpc: upc,
    recall,
  });
});
