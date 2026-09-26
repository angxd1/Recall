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
  // Expo LAN host without port → API on 8787
  const host = hostUri.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:8787`;
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
    const text = await res.text();
    throw new Error(`${res.status} ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
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
    request<{ recalls: Recall[]; count: number }>("/recalls"),

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
