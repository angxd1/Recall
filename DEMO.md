# Demo script (45–60 seconds)

## Props checklist

- [ ] Included synthetic receipt at `scripts/fixtures/receipt.png` (3 products including **ABC Granola Bars**), or a printed copy
- [ ] Physical package (or printed label) showing **LOT A1842** (within A1800–A1900)
- [ ] Phone with Expo / development build of WeCanRecall
- [ ] API running on laptop (`npm run api`) reachable from phone (`EXPO_PUBLIC_API_URL` if needed)
- [ ] Ollama serving with `qwen2.5vl:3b` downloaded for real receipt extraction
- [ ] Optional: Health Canada sync once before the demo for “live data” talking point

## Judge walkthrough

1. **Receipt** — Open WeCanRecall → Scan receipt → upload the fixture or photograph the prepared receipt
   (or tap **Use demo receipt** if camera/OCR is flaky)  
   → Review/edit the identified products (3 for the fixture) → Add to My Products

2. **New recall** — Demo controls → **Inject demo recall + match**  
   Home shows **Potential recall detected**

3. **Alert** — Open the alert → ABC Granola Bars, purchased today →  
   copy says package verification required (not yet confirmed)

4. **Verify** — Hand the judge the package → Check Product →  
   enter **A1842** (or tap **Demo: use package lot A1842**). Package-label OCR is not implemented.

5. **Action** — **DEMO RECALL CONFIRMED** → fictional hazard and guidance → lot match.
   The demo is labelled fictional and has no official notice link.

Try A2000 first to demonstrate an unaffected lot. Real Health Canada sync does not yet
provide the lot/UPC identifiers used in this demo. Matching is manually triggered;
background monitoring and notifications are not implemented.

## Receipt barcode lookup

For a receipt with a printed UPC/EAN, review the Open Food Facts product name,
original receipt text and code before saving. **Use receipt name instead** rejects
a wrong catalog result and removes its brand/code. A store SKU or an unsuccessful
lookup keeps the receipt name. The standard fixture has no product codes and still
demonstrates text extraction; catalog coverage is not guaranteed for every product.

## Reset between runs

Demo controls → **Reset inventory**, then reload demo receipt + inject again.
Reset removes local products/matches and resets the API's recall store; use it only
with disposable demo data.
