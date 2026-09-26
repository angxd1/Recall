import type { Product, Recall, RecallSeverity } from "./types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 2);
}

/** Stage-1 fuzzy match: product name/brand against recall product strings. */
export function isPotentialProductMatch(
  product: Pick<Product, "name" | "brand" | "upc">,
  recall: Pick<Recall, "productNames" | "brands" | "identifiers" | "title">
): { matched: boolean; fields: string[] } {
  const fields: string[] = [];

  if (product.upc && recall.identifiers.upcs?.includes(product.upc)) {
    fields.push("upc");
  }

  const productTokens = new Set([
    ...tokens(product.name),
    ...(product.brand ? tokens(product.brand) : []),
  ]);

  const recallTexts = [
    recall.title,
    ...recall.productNames,
    ...recall.brands,
  ].map(normalize);

  for (const text of recallTexts) {
    const recallTokens = tokens(text);
    const overlap = recallTokens.filter((t) => productTokens.has(t));
    // Require at least 2 overlapping significant tokens, or one distinctive brand+product hit
    if (overlap.length >= 2) {
      fields.push("name");
      break;
    }
    if (
      product.brand &&
      normalize(product.brand).length > 2 &&
      text.includes(normalize(product.brand)) &&
      overlap.length >= 1
    ) {
      fields.push("brand");
      break;
    }
  }

  // Direct substring for demo reliability (e.g. "ABC Granola Bars")
  const productKey = normalize(
    [product.brand, product.name].filter(Boolean).join(" ")
  );
  for (const text of recallTexts) {
    if (
      productKey.length >= 6 &&
      (text.includes(productKey) || productKey.includes(text))
    ) {
      if (!fields.includes("name")) fields.push("name");
    }
  }

  return { matched: fields.length > 0, fields: [...new Set(fields)] };
}

/** Compare alphanumeric lot codes for range inclusion (e.g. A1800–A1900). */
export function isLotInRange(
  lot: string,
  range: { start: string; end: string }
): boolean {
  const normalizeLot = (v: string) => v.replace(/\s+/g, "").toUpperCase();
  const lotN = normalizeLot(lot);
  const start = normalizeLot(range.start);
  const end = normalizeLot(range.end);

  // Same alphabetic prefix + numeric compare when possible
  const parse = (v: string) => {
    const m = v.match(/^([A-Z]*)(\d+)([A-Z]*)$/i);
    if (!m) return null;
    return { prefix: m[1].toUpperCase(), num: parseInt(m[2], 10), suffix: m[3].toUpperCase() };
  };

  const l = parse(lotN);
  const s = parse(start);
  const e = parse(end);
  if (l && s && e && l.prefix === s.prefix && l.prefix === e.prefix) {
    return l.num >= s.num && l.num <= e.num;
  }

  // Lexicographic fallback
  return lotN >= start && lotN <= end;
}

export function extractLotFromOcr(text: string): string | null {
  const patterns = [
    /(?:LOT|LOT\s*#|LOT\s*NO\.?|L\.?O\.?T\.?)\s*[:#]?\s*([A-Z0-9\-]+)/i,
    /\b([A-Z]\d{3,6})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].toUpperCase();
  }
  return null;
}

export function extractUpcFromOcr(text: string): string | null {
  const digits = text.replace(/\D/g, " ");
  const m = digits.match(/\b(\d{12,14})\b/);
  return m?.[1] ?? null;
}

export function verifyAgainstRecall(
  recall: Pick<Recall, "identifiers">,
  observed: { lot?: string | null; upc?: string | null }
): { confirmed: boolean; matchedFields: string[]; verifiedLot?: string; verifiedUpc?: string } {
  const matchedFields: string[] = [];
  let verifiedLot: string | undefined;
  let verifiedUpc: string | undefined;

  if (observed.upc && recall.identifiers.upcs?.length) {
    if (recall.identifiers.upcs.includes(observed.upc)) {
      matchedFields.push("upc");
      verifiedUpc = observed.upc;
    }
  }

  if (observed.lot) {
    const lot = observed.lot.toUpperCase();
    if (recall.identifiers.lotCodes?.some((c) => c.toUpperCase() === lot)) {
      matchedFields.push("lot");
      verifiedLot = lot;
    } else if (
      recall.identifiers.lotRanges?.some((r) => isLotInRange(lot, r))
    ) {
      matchedFields.push("lot");
      verifiedLot = lot;
    }
  }

  // Confirmed if lot matches when lots are specified; or UPC when only UPCs
  const needsLot =
    (recall.identifiers.lotCodes?.length ?? 0) > 0 ||
    (recall.identifiers.lotRanges?.length ?? 0) > 0;
  const confirmed = needsLot
    ? matchedFields.includes("lot")
    : matchedFields.length > 0;

  return { confirmed, matchedFields, verifiedLot, verifiedUpc };
}

export function mapOfficialSeverity(
  recallClass?: string | null,
  hazardText?: string | null
): RecallSeverity {
  const cls = (recallClass ?? "").toLowerCase();
  const hazard = (hazardText ?? "").toLowerCase();

  if (
    cls.includes("class i") ||
    cls.includes("class 1") ||
    cls.includes("type i") ||
    hazard.includes("do not consume") ||
    hazard.includes("stop using") ||
    hazard.includes("serious")
  ) {
    return "stop_using";
  }
  if (cls.includes("class ii") || cls.includes("class 2") || cls.includes("type ii")) {
    return "action_required";
  }
  if (
    hazard.includes("check") ||
    hazard.includes("verify") ||
    hazard.includes("inspect")
  ) {
    return "check_product";
  }
  return "action_required";
}

export function computeSafetyScore(
  products: Array<{ status: Product["status"] }>
): {
  total: number;
  clear: number;
  needsVerification: number;
  confirmedMatch: number;
} {
  return {
    total: products.length,
    clear: products.filter((p) => p.status === "clear" || p.status === "dismissed")
      .length,
    needsVerification: products.filter((p) => p.status === "needs_verification")
      .length,
    confirmedMatch: products.filter((p) => p.status === "confirmed_match").length,
  };
}

/** Demo seed: ABC Granola Bars, lots A1800–A1900 */
export const DEMO_SEED_RECALL: Recall = {
  id: "seed-abc-granola-bars",
  title: "ABC Granola Bars recalled due to possible Salmonella contamination",
  sourceUrl: "https://recalls-rappels.canada.ca/en/alert-recall/demo-abc-granola-bars",
  organization: "Canadian Food Inspection Agency",
  category: "Food",
  hazard: "Possible Salmonella contamination.",
  whatToDo:
    "Do not consume the product. Dispose of it or return it according to the official recall instructions.",
  severity: "stop_using",
  identifiers: {
    upcs: ["060410046234"],
    lotRanges: [{ start: "A1800", end: "A1900" }],
  },
  productNames: ["ABC Granola Bars", "Granola Bars"],
  brands: ["ABC"],
  publishedAt: new Date().toISOString(),
  isSeed: true,
  rawOfficialText:
    "The Canadian Food Inspection Agency (CFIA) is warning the public not to consume the ABC Granola Bars products described below due to possible Salmonella contamination.",
};

export const DEMO_RECEIPT_ITEMS = [
  { name: "Cheerios", brand: "General Mills", price: 5.97 },
  { name: "Tide Pods", brand: "Tide", price: 18.99 },
  { name: "Ninja Blender", brand: "Ninja", price: 129.99 },
  { name: "Dove Shampoo", brand: "Dove", price: 8.49 },
  { name: "ABC Granola Bars", brand: "ABC", price: 4.99 },
  { name: "Heinz Ketchup", brand: "Heinz", price: 3.49 },
];
