import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import type { Product } from "@recalllens/shared";
import { db } from "../apps/mobile/lib/db.web";

async function main() {
  const product = (id: string): Product => ({
    id, name: id, status: "clear", purchasedAt: "2026-09-26", createdAt: "2026-09-26",
  });
  assert.deepEqual(await db.listProducts(), []);
  await Promise.all(Array.from({ length: 20 }, (_, i) => db.insertProducts([product(String(i))])));
  assert.equal((await db.listProducts()).length, 20, "Concurrent saves must not lose products");
  await db.updateProductStatus("1", "confirmed_match");
  assert.equal((await db.listProducts()).find((p) => p.id === "1")?.status, "confirmed_match");
  const match = {
    id: "match", productId: "1", recallId: "recall", stage: "confirmed" as const,
    matchedFields: ["name"], verifiedLot: "A1842", createdAt: "2026-09-26", updatedAt: "2026-09-26",
  };
  await db.upsertMatch(match);
  assert.deepEqual(await db.getMatch("match"), match);
  assert.equal(await db.getMatch("missing"), null);
  await assert.rejects(db.insertProducts([
    product("must-rollback"),
    { ...product("bad"), name: (() => {}) as unknown as string },
  ]));
  assert.equal((await db.listProducts()).length, 20, "Failed receipt save must roll back all its products");
  await db.clearProducts();
  assert.deepEqual(await db.listProducts(), []);
  assert.deepEqual(await db.listMatches(), []);
  assert.deepEqual(await db.listRecalls(), []);
  await db.insertProducts([product("after-reset")]);
  assert.equal((await db.listProducts()).length, 1);
  console.log("Storage checks passed: concurrent writes, status, match persistence, atomic rollback, reset.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
