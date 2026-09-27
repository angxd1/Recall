import * as SQLite from "expo-sqlite";
import type { Match, Product, ProductStatus, Recall } from "@recalllens/shared";
import { barcodeKey } from "@recalllens/shared";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("recalllens.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          brand TEXT,
          upc TEXT,
          retailer TEXT,
          purchased_at TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recalls (
          id TEXT PRIMARY KEY NOT NULL,
          json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY NOT NULL,
          product_id TEXT NOT NULL,
          recall_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          matched_fields TEXT NOT NULL,
          verified_lot TEXT,
          verified_upc TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      return db;
    })().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    brand: row.brand ? String(row.brand) : undefined,
    upc: row.upc ? String(row.upc) : undefined,
    retailer: row.retailer ? String(row.retailer) : undefined,
    purchasedAt: String(row.purchased_at),
    status: String(row.status) as ProductStatus,
    createdAt: String(row.created_at),
  };
}

export const db = {
  async insertBarcodeProduct(product: Product): Promise<Product | null> {
    const key = barcodeKey(product.upc ?? "");
    if (!key) throw new Error("Enter a valid UPC or EAN barcode.");
    const database = await getDb();
    let existing: Product | null = null;
    await database.withExclusiveTransactionAsync(async (tx) => {
      const rows = await tx.getAllAsync<Record<string, unknown>>("SELECT * FROM products WHERE upc IS NOT NULL");
      existing = rows.map(rowToProduct).find((p) => barcodeKey(p.upc ?? "") === key) ?? null;
      if (!existing) {
        await tx.runAsync(
          "INSERT INTO products (id, name, brand, upc, retailer, purchased_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [product.id, product.name, product.brand ?? null, product.upc!, product.retailer ?? null,
            product.purchasedAt, product.status, product.createdAt]
        );
      }
    });
    return existing;
  },
  async listProducts(): Promise<Product[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM products ORDER BY purchased_at DESC"
    );
    return rows.map(rowToProduct);
  },

  async insertProducts(products: Product[]): Promise<void> {
    const database = await getDb();
    await database.withTransactionAsync(async () => {
      for (const p of products) {
        await database.runAsync(
          `INSERT OR REPLACE INTO products
           (id, name, brand, upc, retailer, purchased_at, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name,
            p.brand ?? null,
            p.upc ?? null,
            p.retailer ?? null,
            p.purchasedAt,
            p.status,
            p.createdAt,
          ]
        );
      }
    });
  },

  async updateProductStatus(id: string, status: ProductStatus): Promise<void> {
    const database = await getDb();
    await database.runAsync("UPDATE products SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
  },

  async clearProducts(): Promise<void> {
    const database = await getDb();
    await database.execAsync(
      "DELETE FROM products; DELETE FROM matches; DELETE FROM recalls;"
    );
  },

  async upsertRecall(recall: Recall): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      "INSERT OR REPLACE INTO recalls (id, json) VALUES (?, ?)",
      [recall.id, JSON.stringify(recall)]
    );
  },

  async replaceRecalls(recalls: Recall[]): Promise<void> {
    const database = await getDb();
    await database.withTransactionAsync(async () => {
      await database.runAsync("DELETE FROM recalls");
      for (const recall of recalls) {
        await database.runAsync(
          "INSERT OR REPLACE INTO recalls (id, json) VALUES (?, ?)",
          [recall.id, JSON.stringify(recall)]
        );
      }
    });
  },

  async getRecall(id: string): Promise<Recall | null> {
    const database = await getDb();
    const row = await database.getFirstAsync<{ json: string }>(
      "SELECT json FROM recalls WHERE id = ?",
      [id]
    );
    return row ? (JSON.parse(row.json) as Recall) : null;
  },

  async listRecalls(): Promise<Recall[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<{ json: string }>(
      "SELECT json FROM recalls"
    );
    return rows.map((r) => JSON.parse(r.json) as Recall);
  },

  async upsertMatch(match: Match): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      `INSERT OR REPLACE INTO matches
       (id, product_id, recall_id, stage, matched_fields, verified_lot, verified_upc, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        match.id,
        match.productId,
        match.recallId,
        match.stage,
        JSON.stringify(match.matchedFields),
        match.verifiedLot ?? null,
        match.verifiedUpc ?? null,
        match.createdAt,
        match.updatedAt,
      ]
    );
  },

  async listMatches(): Promise<Match[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM matches ORDER BY updated_at DESC"
    );
    return rows.map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      recallId: String(row.recall_id),
      stage: String(row.stage) as Match["stage"],
      matchedFields: JSON.parse(String(row.matched_fields)) as string[],
      verifiedLot: row.verified_lot ? String(row.verified_lot) : undefined,
      verifiedUpc: row.verified_upc ? String(row.verified_upc) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  },

  async getMatch(id: string): Promise<Match | null> {
    const matches = await this.listMatches();
    return matches.find((m) => m.id === id) ?? null;
  },
};

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
