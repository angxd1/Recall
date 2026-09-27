import type { Match, Product, ProductStatus, Recall } from "@recalllens/shared";
import { barcodeKey } from "@recalllens/shared";

const stores = ["products", "matches", "recalls", "meta"];
let connection: Promise<IDBDatabase> | undefined;
let ready: Promise<IDBDatabase> | undefined;

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("Storage transaction was cancelled."));
    transaction.onerror = () => reject(transaction.error);
  });
}

function open(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("recalllens", 1);
      opening.onupgradeneeded = () => {
        for (const name of stores) opening.result.createObjectStore(name, { keyPath: "id" });
      };
      opening.onsuccess = () => {
        const database = opening.result;
        database.onversionchange = () => {
          database.close();
          connection = undefined;
          ready = undefined;
        };
        resolve(database);
      };
      opening.onerror = () => reject(opening.error);
    }).catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

async function migrate(database: IDBDatabase): Promise<void> {
  const marker = await request(database.transaction("meta").objectStore("meta").get("sqlite-migrated"));
  if (marker) return;

  let legacyExists = false;
  if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
    const root = await navigator.storage.getDirectory();
    try {
      await root.getDirectoryHandle("expo-sqlite");
      legacyExists = true;
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") throw error;
    }
  }

  let products: Product[] = [];
  let matches: Match[] = [];
  let recalls: Recall[] = [];
  if (legacyExists) {
    try {
      // Only load SQLite for this one-time copy. The original files remain intact.
      const { db: legacy } = await import("./sqlite-db");
      [products, matches, recalls] = await Promise.all([
        legacy.listProducts(), legacy.listMatches(), legacy.listRecalls(),
      ]);
    } catch (error) {
      throw new Error(
        "Your saved inventory needs a one-time storage upgrade. Close other Recall tabs, then reload this page. Your saved data has not been deleted.",
        { cause: error }
      );
    }
  }
  const transaction = database.transaction(stores, "readwrite");
  const done = completed(transaction);
  for (const product of products) transaction.objectStore("products").put(product);
  for (const match of matches) transaction.objectStore("matches").put(match);
  for (const recall of recalls) transaction.objectStore("recalls").put(recall);
  transaction.objectStore("meta").put({ id: "sqlite-migrated" });
  await done;
}

async function getDb(): Promise<IDBDatabase> {
  if (!ready) {
    ready = (async () => {
      const database = await open();
      // Serialize the migration across tabs; later tabs never open the SQLite worker.
      if (typeof navigator !== "undefined" && navigator.locks) {
        await navigator.locks.request("recalllens-storage-migration", () => migrate(database));
      } else {
        await migrate(database);
      }
      return database;
    })().catch((error) => {
      ready = undefined;
      throw error;
    });
  }
  return ready;
}

async function all<T>(store: string): Promise<T[]> {
  const database = await getDb();
  return request(database.transaction(store).objectStore(store).getAll());
}

async function get<T>(store: string, id: string): Promise<T | null> {
  const database = await getDb();
  return (await request(database.transaction(store).objectStore(store).get(id))) ?? null;
}

async function write(names: string[], action: (transaction: IDBTransaction) => void): Promise<void> {
  const database = await getDb();
  const transaction = database.transaction(names, "readwrite");
  const done = completed(transaction);
  try {
    action(transaction);
  } catch (error) {
    transaction.abort();
    await done.catch(() => {});
    throw error;
  }
  await done;
}

export const db = {
  async insertBarcodeProduct(product: Product): Promise<Product | null> {
    const key = barcodeKey(product.upc ?? "");
    if (!key) throw new Error("Enter a valid UPC or EAN barcode.");
    let existing: Product | null = null;
    await write(["products"], (tx) => {
      const store = tx.objectStore("products");
      const reading = store.getAll();
      reading.onsuccess = () => {
        existing = (reading.result as Product[]).find((p) => barcodeKey(p.upc ?? "") === key) ?? null;
        if (!existing) store.add(product);
      };
    });
    return existing;
  },
  async listProducts(): Promise<Product[]> {
    return (await all<Product>("products")).sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  },
  insertProducts(products: Product[]): Promise<void> {
    return write(["products"], (tx) => {
      for (const product of products) tx.objectStore("products").put(product);
    });
  },
  updateProductStatus(id: string, status: ProductStatus): Promise<void> {
    return write(["products"], (tx) => {
      const store = tx.objectStore("products");
      const reading = store.get(id);
      reading.onsuccess = () => {
        if (reading.result) store.put({ ...reading.result, status });
      };
    });
  },
  clearProducts(): Promise<void> {
    return write(["products", "matches", "recalls"], (tx) => {
      for (const name of ["products", "matches", "recalls"]) tx.objectStore(name).clear();
    });
  },
  upsertRecall(recall: Recall): Promise<void> {
    return write(["recalls"], (tx) => { tx.objectStore("recalls").put(recall); });
  },
  replaceRecalls(recalls: Recall[]): Promise<void> {
    return write(["recalls"], (tx) => {
      const store = tx.objectStore("recalls");
      store.clear();
      for (const recall of recalls) store.put(recall);
    });
  },
  getRecall(id: string): Promise<Recall | null> { return get("recalls", id); },
  listRecalls(): Promise<Recall[]> { return all("recalls"); },
  upsertMatch(match: Match): Promise<void> {
    return write(["matches"], (tx) => { tx.objectStore("matches").put(match); });
  },
  async listMatches(): Promise<Match[]> {
    return (await all<Match>("matches")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  getMatch(id: string): Promise<Match | null> { return get("matches", id); },
};

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
