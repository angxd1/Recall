import type { Match, Product, Recall } from "@recalllens/shared";
import { isPotentialProductMatch } from "@recalllens/shared";

import { api } from "@/lib/api";
import { db, newId } from "@/lib/db";

/**
 * Run Stage-1 matching locally (and optionally via API).
 * Updates product status to needs_verification for new potential matches.
 */
export async function runPotentialMatching(
  products: Product[],
  recalls: Recall[]
): Promise<Match[]> {
  const existing = await db.listMatches();
  const created: Match[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    for (const recall of recalls) {
      const result = isPotentialProductMatch(product, recall);
      if (!result.matched) continue;

      const already = existing.find(
        (m) =>
          m.productId === product.id &&
          m.recallId === recall.id &&
          m.stage !== "cleared"
      );
      if (already) continue;

      const match: Match = {
        id: newId("match"),
        productId: product.id,
        recallId: recall.id,
        stage: "potential",
        matchedFields: result.fields,
        createdAt: now,
        updatedAt: now,
      };
      await db.upsertMatch(match);
      await db.updateProductStatus(product.id, "needs_verification");
      created.push(match);
    }
  }

  return created;
}

/** Pull the cached Health Canada notices, then compare them to owned products. */
export async function checkRecalls(): Promise<{ lastCheckedAt: string | null }> {
  let lastCheckedAt: string | null = null;
  try {
    const listed = await api.listRecalls();
    lastCheckedAt = listed.lastSyncedAt;
    for (const recall of listed.recalls) {
      await db.upsertRecall(recall);
    }
  } catch {
    lastCheckedAt = null;
  }
  await syncAndMatch();
  return { lastCheckedAt };
}

/** Prefer server matching when online; fall back to local. */
export async function syncAndMatch(): Promise<{
  matchesCreated: number;
  source: "api" | "local";
}> {
  const products = await db.listProducts();
  let recalls = await db.listRecalls();

  try {
    const remote = await api.findPotentialMatches(products);
    const now = new Date().toISOString();
    let created = 0;
    const existing = await db.listMatches();

    for (const hit of remote.matches) {
      await db.upsertRecall(hit.recall);
      const already = existing.find(
        (m) =>
          m.productId === hit.productId &&
          m.recallId === hit.recallId &&
          m.stage !== "cleared"
      );
      if (already) continue;
      const match: Match = {
        id: newId("match"),
        productId: hit.productId,
        recallId: hit.recallId,
        stage: "potential",
        matchedFields: hit.matchedFields,
        createdAt: now,
        updatedAt: now,
      };
      await db.upsertMatch(match);
      await db.updateProductStatus(hit.productId, "needs_verification");
      created += 1;
    }
    return { matchesCreated: created, source: "api" };
  } catch {
    if (recalls.length === 0) {
      // ensure we at least try local store
      recalls = await db.listRecalls();
    }
    const local = await runPotentialMatching(products, recalls);
    return { matchesCreated: local.length, source: "local" };
  }
}
