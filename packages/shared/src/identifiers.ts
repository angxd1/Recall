import { barcodeKey } from "./barcode";
import type { RecallIdentifiers } from "./types";

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Pull lot, UPC, and model values when a notice writes them in plain text. */
export function extractRecallIdentifiers(text: string): RecallIdentifiers {
  const upcs: string[] = [];
  for (const match of text.matchAll(/\bUPCs?\b[^A-Za-z0-9]{0,16}(\d[\d\s-]{6,22}\d)/gi)) {
    const digits = match[1].replace(/\D/g, "");
    if (barcodeKey(digits)) upcs.push(digits);
  }

  const models: string[] = [];
  for (const match of text.matchAll(
    /\bmodels?\b\s*(?:number|no\.?|#)?\s*[:#]?\s*([A-Z]*\d[A-Z0-9-]{1,24})/gi
  )) {
    models.push(match[1].toUpperCase());
  }

  const lotCodes: string[] = [];
  const lotRanges: Array<{ start: string; end: string }> = [];
  for (const match of text.matchAll(
    /\blots?\b(?:\s*(?:numbers?|codes?|no\.?|#))?\s*[:#]?\s*([^\n.;]{0,80})/gi
  )) {
    const chunk = match[1];
    const range = chunk.match(
      /\b([A-Z]{0,3}\d{2,8}[A-Z]{0,2})\s*(?:–|-|to)\s*([A-Z]{0,3}\d{2,8}[A-Z]{0,2})\b/i
    );
    if (range) {
      lotRanges.push({ start: range[1].toUpperCase(), end: range[2].toUpperCase() });
      continue;
    }
    const code = chunk.match(/\b([A-Z]{1,3}\d{2,8}|\d{4,8})\b/);
    if (code) lotCodes.push(code[1].toUpperCase());
  }

  return {
    upcs: unique(upcs),
    lotCodes: unique(lotCodes),
    lotRanges,
    models: unique(models),
  };
}
