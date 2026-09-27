# WeCanRecall API

Hono server for receipt extraction, Health Canada recall sync, and matching.

```bash
npm ci
npm run api
```

Default: `http://localhost:8787`

## Self-hosted receipt reader

Install [Ollama](https://ollama.com/download) on the machine serving inference, then:

```powershell
ollama pull qwen2.5vl:3b
# Run in a separate terminal if the Ollama desktop application is not serving:
ollama serve
```

Start the API from the repository root in another terminal:

```powershell
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "qwen2.5vl:3b"
npm run api
```

Those values are also the defaults. The API does not automatically load `.env` files.
No OpenAI key is needed, and no paid provider is used as a fallback.
Qwen2.5-VL is a vision model that accepts images; a text-only model is insufficient.
The 3B variant is a starting point for modest hardware, not an accuracy guarantee.
Try a larger compatible vision model only after measuring latency, memory and receipt accuracy.

The API sends receipt images to your configured Ollama server, requests structured JSON,
validates the result and returns products for user review. Names can be corrected before saving.
Only `useDemo: true` or `/receipts/demo` returns samples. Invalid/unreadable results return 422,
an unavailable model returns 503, and concurrent extraction requests return 429.
Each API process permits one extraction at a time and a 120-second model timeout.
Images are limited to roughly 10 MB (14.1 MB HTTP body limit).

After inference, `services/productLookup.ts` enriches checksum-valid printed product
codes through the same cache and request budget as the barcode endpoint. The model
reports `productCode` and `codeType` (`upc`, `ean`, `sku`, or `unknown`); explicit
retailer SKUs are skipped and missing codes require no lookup. Catalog hits return
`name`, `brand`, canonical `upc`, `receiptName`, and `lookupStatus: "found"`.
Other statuses are `not_found`, `unavailable`, `invalid_code`, and `retailer_code`.
Failures retain the printed name; unknown codes become UPCs only on a catalog hit.
Explicit valid UPC/EAN codes remain available for review even on a catalog miss.
Lookups run concurrently and add at most the provider timeout after inference;
the shared 14-request/minute budget limits outbound traffic on large receipts.
Only codes go to Open Food Facts. Receipt images remain with the configured Ollama.

## Hosting

Ollama must run on a machine reachable from the API. A static web host alone cannot serve it.
Keep Ollama private; expose the application API over HTTPS. Hosting and inference compute still
cost resources even though there are no per-token API charges. Add deployment-level request
quotas/access controls before sharing a public endpoint: the per-process concurrency cap is
not a per-user quota. The API's recall JSON files need persistent storage.

For crumpled receipts, test real samples before promising reliability. Folds, glare and missing
text can defeat any reader; review and retake remain necessary. Current live recall ingestion
does not populate UPC/lot identifiers, and sync/matching are manual demo actions.

## Barcode product lookup

`GET /products/barcode/:code` validates a UPC/EAN check digit and queries Open Food Facts
API v3 for name and brand. It returns `{ product: { name, brand }, source: "Open Food Facts" }`,
or `product: null` when missing. Invalid barcodes return 400; provider failures return 503.
No model inference or API key is involved. Only the barcode is sent to the provider.

Requests use an identifying User-Agent, an eight-second timeout, a bounded in-memory
cache (one day for hits, five minutes for misses), and in-flight request deduplication.
The per-process cap is 14 outbound requests/minute; coordinate limits across processes
sharing an IP before scaling. Data is community maintained and food focused. Display
Open Food Facts attribution and retain manual correction. Database license: ODbL.

## Verification

```powershell
npm run test:api
npm run build --workspace=@recalllens/api
```

The unit tests mock the Ollama response and verify transport, validation and failures.
Run the real-model smoke test against the running API and Ollama server:

```powershell
npx tsx scripts/smoke-receipt.ts
```

It uses the included synthetic receipt, checks extracted names/prices, injects the explicitly
labelled demo recall, and checks both affected and unaffected lots. To inspect another receipt:

```powershell
npx tsx scripts/smoke-receipt.ts path/to/receipt.jpg
```

Blank/corrupt images are rejected before inference. A model receipt check rejects other images;
neither this check nor structured JSON guarantees perfect recognition. Inferred brands are
discarded to avoid broadening recall matches with guessed labels.
See [tested flows and limitations](../../docs/receipt-flow-test.md) for measured local results.
