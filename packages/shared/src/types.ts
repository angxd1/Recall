export type ProductStatus =
  | "clear"
  | "needs_verification"
  | "confirmed_match"
  | "dismissed";

export type MatchStage = "potential" | "confirmed" | "cleared";

export type RecallSeverity =
  | "stop_using"
  | "action_required"
  | "check_product"
  | "safety_info";

export interface Product {
  id: string;
  name: string;
  brand?: string;
  upc?: string;
  retailer?: string;
  purchasedAt: string;
  status: ProductStatus;
  createdAt: string;
}

export interface RecallIdentifiers {
  upcs?: string[];
  lotCodes?: string[];
  lotRanges?: Array<{ start: string; end: string }>;
  models?: string[];
  serialPatterns?: string[];
}

export interface Recall {
  id: string;
  title: string;
  sourceUrl: string;
  organization: string;
  category: string;
  hazard: string;
  whatToDo: string;
  severity: RecallSeverity;
  identifiers: RecallIdentifiers;
  productNames: string[];
  brands: string[];
  publishedAt?: string;
  isSeed?: boolean;
  rawOfficialText?: string;
}

export interface Match {
  id: string;
  productId: string;
  recallId: string;
  stage: MatchStage;
  matchedFields: string[];
  verifiedLot?: string;
  verifiedUpc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptLineItem {
  name: string;
  brand?: string;
  price?: number;
  quantity?: number;
}

export interface SafetyScore {
  total: number;
  clear: number;
  needsVerification: number;
  confirmedMatch: number;
}

export interface ExtractReceiptResponse {
  retailer?: string;
  purchasedAt?: string;
  items: ReceiptLineItem[];
}
