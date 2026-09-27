/** Canonical GTIN for comparing UPC-A with its zero-prefixed EAN-13 representation. */
export function barcodeKey(value: string): string | null {
  const code = value.replace(/[\s-]/g, "");
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return null;
  let sum = 0;
  for (let i = code.length - 2, weight = 3; i >= 0; i--, weight = 4 - weight) {
    sum += Number(code[i]) * weight;
  }
  if ((10 - sum % 10) % 10 !== Number(code.at(-1))) return null;
  return code.padStart(14, "0");
}

/** Expand a scanner-identified UPC-E; never interpret an ordinary EAN-8 as UPC-E. */
export function expandUpce(code: string): string | null {
  if (!/^[01][0-9]{7}$/.test(code)) return null;
  const [system, a, b, c, d, e, mode, check] = code;
  const body = Number(mode) <= 2 ? `${a}${b}${mode}0000${c}${d}${e}`
    : mode === "3" ? `${a}${b}${c}00000${d}${e}`
    : mode === "4" ? `${a}${b}${c}${d}00000${e}`
    : `${a}${b}${c}${d}${e}0000${mode}`;
  const expanded = system + body + check;
  return barcodeKey(expanded) ? expanded : null;
}
