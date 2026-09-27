import Constants from "expo-constants";
import type {
  ExtractReceiptResponse,
  Product,
  Recall,
} from "@recalllens/shared";

const hostUri =
  Constants.expoConfig?.hostUri ??
  Constants.experienceUrl?.replace(/^exp:\/\//, "") ??
  "";

function defaultApiBase(): string {
  // Expo may supply a complete http:// or exp:// URL, not just host:port.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }
  if (hostUri) {
    try {
      const url = new URL(hostUri.includes("://") ? hostUri : `http://${hostUri}`);
      return `http://${url.hostname}:8787`;
    } catch {
      // Fall back for SSR or an unavailable Expo development host.
    }
  }
  return "http://localhost:8787";
}

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || defaultApiBase();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "The request could not be completed. Please try again.");
  }
  return res.json() as Promise<T>;
}

export const api = {
  lookupBarcode: (code: string) => request<{
    product: { name: string; brand?: string } | null;
    source: "Open Food Facts";
  }>(`/products/barcode/${encodeURIComponent(code)}`),
  health: () => request<{ ok: boolean }>("/health"),

  extractReceipt: (body: { imageBase64?: string; useDemo?: boolean }) =>
    request<ExtractReceiptResponse>("/receipts/extract", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  demoReceipt: () => request<ExtractReceiptResponse>("/receipts/demo"),

  syncRecalls: () =>
    request<{
      ok: boolean;
      imported: number;
      total: number;
      source: string;
    }>("/recalls/sync", { method: "POST" }),

  listRecalls: () =>
    request<{ recalls: Recall[]; count: number; lastSyncedAt: string | null }>(
      "/recalls"
    ),

  injectDemoRecall: () =>
    request<{ recall: Recall; message: string }>("/demo/inject-recall", {
      method: "POST",
    }),

  resetRecalls: () =>
    request<{ ok: boolean }>("/demo/reset-recalls", { method: "POST" }),

  findPotentialMatches: (products: Product[]) =>
    request<{
      matches: Array<{
        productId: string;
        recallId: string;
        matchedFields: string[];
        product: Product;
        recall: Recall;
      }>;
    }>("/match/potential", {
      method: "POST",
      body: JSON.stringify({ products }),
    }),

  verifyMatch: (body: {
    recallId: string;
    ocrText: string;
    lot?: string;
    upc?: string;
  }) =>
    request<{
      confirmed: boolean;
      matchedFields: string[];
      verifiedLot?: string;
      verifiedUpc?: string;
      observedLot?: string | null;
      observedUpc?: string | null;
      recall: Recall;
    }>("/match/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
