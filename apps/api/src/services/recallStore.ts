import fs from "fs/promises";
import path from "path";
import {
  DEMO_SEED_RECALL,
  extractRecallIdentifiers,
  mapOfficialSeverity,
  type Recall,
} from "@recalllens/shared";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "recalls.json");
const HC_URL =
  "https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json";
const RECENT_NOTICE_LIMIT = 2000;

type StoreShape = {
  recalls: Recall[];
  lastSyncedAt?: string;
};

async function ensureStore(): Promise<StoreShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreShape;
  } catch {
    const initial: StoreShape = { recalls: [] };
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeHcItem(item: Record<string, unknown>, index: number): Recall | null {
  const title = pickString(item, [
    "Title",
    "title",
    "TITLE",
    "Recall title",
    "alert_title",
  ]);
  if (!title) return null;

  const id =
    pickString(item, ["URL", "url", "Recall number", "recall_number", "id"]) ||
    `hc-${index}`;

  const sourceUrl =
    pickString(item, ["URL", "url", "Link"]) ||
    "https://recalls-rappels.canada.ca/en";

  const organization = pickString(item, [
    "Organization",
    "organization",
    "Department",
  ]) || "Health Canada";

  const category = pickString(item, ["Category", "category", "Type"]) || "General";
  const hazard =
    pickString(item, [
      "Issue",
      "issue",
      "Hazard",
      "hazard",
      "Reason",
      "Summary",
    ]) || "See official recall notice.";

  const whatToDo =
    pickString(item, [
      "What you should do",
      "What to do",
      "what_to_do",
      "Audience",
      "Corrective actions",
    ]) || "Follow the instructions in the official recall notice.";

  const recallClass = pickString(item, ["Recall class", "Class", "recall_class"]);
  const product = pickString(item, ["Product", "product", "Product name"]);
  const brand = pickString(item, ["Brand name", "Brand", "brand"]);
  const publishedAt = pickString(item, ["Last updated", "Date", "date", "Published"]);
  const identifiers = extractRecallIdentifiers(
    [title, product, brand, hazard, whatToDo].filter(Boolean).join("\n")
  );

  return {
    id: id.slice(0, 200),
    title,
    sourceUrl,
    organization,
    category,
    hazard,
    whatToDo,
    severity: mapOfficialSeverity(recallClass, hazard),
    identifiers,
    productNames: product ? [product] : [title],
    brands: brand ? [brand] : [],
    publishedAt: publishedAt || undefined,
    isSeed: false,
    rawOfficialText: hazard,
  };
}

function publishedTime(row: Record<string, unknown>): number {
  const raw = pickString(row, ["Last updated", "Date", "date", "Published"]);
  const time = Date.parse(raw);
  return Number.isNaN(time) ? 0 : time;
}

export const recallStore = {
  async list(): Promise<Recall[]> {
    const store = await ensureStore();
    return store.recalls;
  },

  async lastSyncedAt(): Promise<string | null> {
    const store = await ensureStore();
    return store.lastSyncedAt ?? null;
  },

  async get(id: string): Promise<Recall | undefined> {
    const store = await ensureStore();
    return store.recalls.find((r) => r.id === id);
  },

  async upsert(recall: Recall): Promise<Recall> {
    const store = await ensureStore();
    const idx = store.recalls.findIndex((r) => r.id === recall.id);
    if (idx >= 0) store.recalls[idx] = recall;
    else store.recalls.unshift(recall);
    await writeStore(store);
    return recall;
  },

  async reset(): Promise<void> {
    await writeStore({ recalls: [] });
  },

  async syncFromHealthCanada(): Promise<{
    ok: boolean;
    imported: number;
    total: number;
    source: "live" | "cache" | "seed";
    error?: string;
  }> {
    const store = await ensureStore();
    try {
      const res = await fetch(HC_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HC fetch failed: ${res.status}`);
      const data = (await res.json()) as unknown;

      let rows: Record<string, unknown>[] = [];
      if (Array.isArray(data)) rows = data as Record<string, unknown>[];
      else if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
          if (Array.isArray(obj[key])) {
            rows = obj[key] as Record<string, unknown>[];
            break;
          }
        }
      }

      rows.sort((a, b) => publishedTime(b) - publishedTime(a));
      const slice = rows.slice(0, RECENT_NOTICE_LIMIT);
      const normalized = slice
        .map((row, i) => normalizeHcItem(row, i))
        .filter((r): r is Recall => r !== null);

      // Preserve seed recalls
      const seeds = store.recalls.filter((r) => r.isSeed);
      const byId = new Map<string, Recall>();
      for (const r of normalized) byId.set(r.id, r);
      for (const s of seeds) byId.set(s.id, s);

      store.recalls = Array.from(byId.values());
      store.lastSyncedAt = new Date().toISOString();
      await writeStore(store);

      // Also write a cache snapshot for offline fallback
      await fs.writeFile(
        path.join(DATA_DIR, "hc-cache.json"),
        JSON.stringify({ cachedAt: store.lastSyncedAt, recalls: normalized })
      );

      return {
        ok: true,
        imported: normalized.length,
        total: store.recalls.length,
        source: "live",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Try cache
      try {
        const cacheRaw = await fs.readFile(
          path.join(DATA_DIR, "hc-cache.json"),
          "utf8"
        );
        const cache = JSON.parse(cacheRaw) as { recalls: Recall[]; cachedAt?: string };
        const seeds = store.recalls.filter((r) => r.isSeed);
        store.recalls = [...seeds, ...cache.recalls];
        if (cache.cachedAt) store.lastSyncedAt = cache.cachedAt;
        await writeStore(store);
        return {
          ok: true,
          imported: cache.recalls.length,
          total: store.recalls.length,
          source: "cache",
          error: message,
        };
      } catch {
        // Ensure seed exists so demo never dies
        if (!store.recalls.some((r) => r.isSeed)) {
          store.recalls = [DEMO_SEED_RECALL];
          await writeStore(store);
        }
        return {
          ok: false,
          imported: 0,
          total: store.recalls.length,
          source: "seed",
          error: message,
        };
      }
    }
  },
};
