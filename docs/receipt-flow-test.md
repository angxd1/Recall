# Receipt flow verification

Tested on September 26, 2026, on Windows with an NVIDIA RTX 3060 Ti (8 GB VRAM).
Installed Ollama 0.34.4 and `qwen2.5vl:3b` through the official distribution.
The model is approximately 3.2 GB on disk and used about 2.9 GB GPU memory in this run.
No paid model API was called.

## Actual inference

| Image | Result | Time |
|---|---|---|
| Included synthetic receipt | All 3 expected product names/prices; excluded tax and total | 3.2 seconds warm; first cold run about 10 seconds |
| Public SROIE receipt 000 | Modelling clay line and 9.00 price read | 2.3 seconds |
| Public SROIE receipt 001 | Both purchase lines and 10.00 / 55.90 prices read | 2.6 seconds |
| Blank image | HTTP 422; rejected before inference | Passed |
| App icon (not a receipt) | HTTP 422; no products returned | Passed |

Public samples were downloaded for local testing from the
[SROIE project](https://github.com/zzzDavid/ICDAR-2019-SROIE/tree/master/data/img)
(`000.jpg` and `001.jpg`). They contain faint print and receipt layout noise.
They are not a representative crumpled-receipt benchmark. No accuracy percentage is claimed.

## Browser flow

On `http://localhost:8081`, uploaded the synthetic image through the app's file picker.
The real model returned three editable products. Saved them into browser storage, navigated
away, and confirmed they loaded again. Injected the labelled demo recall and obtained one
potential match for ABC Granola Bars. Entered A2000 and observed a nonmatch. Entered A1842
and reached the confirmed action screen. Reloaded to verify persistent match state.
The demo is explicitly fictional and has no fake official-notice link.

Also fetched the live Health Canada feed successfully (400 records), ran the API/mobile
TypeScript checks, all eight receipt tests, existing matching smoke test, lint and web export.
Live Health Canada lot/UPC enrichment is not implemented; lot-confirmation testing uses
the demo recall with known identifiers. A successful feed download does not mean every live
recall can be confirmed. Physical-device camera capture was not tested; image upload exercises
the same extraction/save pipeline.

## Problems found and fixed

- Web API address incorrectly became `http://http:8787`; URL parsing now handles complete URLs.
- Added image upload alongside camera capture; editable product inputs keep focus while typing.
- The model guessed brand labels. Those labels are discarded; product-name transcription remains.
- The model invented products for a blank image. Blank/corrupt image validation and a model
  receipt check now reject the tested negative images.
- Demo recall guidance looked official. The screens now identify it as fictional.
- Screen data loading now ignores stale requests; missing verification records show a message
  instead of an indefinite spinner. Existing lint errors were resolved.

The test inventory contains three synthetic products and one fictional confirmed recall.
Severely folded/obscured receipts still require representative testing and human review.
Matching/sync are currently manual demo actions, not background monitoring or push notifications.

## Browser storage regression

Browser storage now uses IndexedDB; native apps retain SQLite. A one-time migration copies
products, recalls and matches from the old SQLite database in one transaction, leaving the
original files intact. A Web Lock serializes migration across tabs. If an old tab still
owns the SQLite file, the app shows recovery instructions instead of an unhandled error.

Verified three simultaneous Chrome tabs after reload, preserving six existing products.
Verified two in-app browser tabs, preserving three products and the confirmed demo recall.
The confirmed action screen still loads after reload. Storage smoke checks cover concurrent
writes, status updates, saved match fields, rollback of a failed receipt save and reset:
`npm run test:storage`.

## Barcode lookup and duplicates (September 27)

The live Open Food Facts lookup for 0034000077977 returned KitKat. In the browser,
typed that barcode, chose Look up product, verified the editable KitKat name, and saved it.
Entering the equivalent UPC-A 034000077977 then displayed the already-in-your-list
message. Existing receipt products and the confirmed demo match were preserved.
This checks the lookup/save flow through manual barcode entry, not physical camera capture.

Automated checks cover invalid check digits, UPC/EAN normalization, UPC-E expansion,
provider lookup/cache, not-found responses and provider failures. IndexedDB tests
also verify concurrent equivalent barcode saves produce only one product and that a
repeat scan preserves the existing recall status.

## Receipt product-code enrichment (September 27)

On Windows with Ollama 0.34.4 and Qwen2.5-VL 3B, a synthetic receipt containing
`NUTELLA SPRD`, EAN `3017620422003`, and a milk line labeled `SKU 12345` exercised
real image extraction and live Open Food Facts lookup. The first API check took
12.6 seconds and returned Nutella / Nutella, Ferrero, preserved `NUTELLA SPRD`,
and retained the canonical UPC/EAN. The milk line kept its printed name and was
identified as a retailer code. No retailer catalog mapping is implemented.

The Codex browser upload flow at `127.0.0.1:8081` showed the original name, source,
and code. Rejecting the match removed its brand/code and restored the receipt text.
An empty edited name disabled saving. A second upload saved the accepted catalog
product and an edited milk name; both survived reload. Entering the same EAN on
the barcode screen identified Nutella as already saved, verifying code persistence.
This used a separate browser origin from the user's localhost inventory.

The original three-item fixture also passed real extraction and affected/unaffected
demo lot verification. Prompt guidance preserves prices alongside codes, and model
placeholders such as `unknown` are treated as absent codes. Automated tests cover
shared cache/deduplication, invalid checksums, explicit SKUs, missing/null codes,
provider misses, malformed responses, network/timeout failures and request limits.
Typecheck, lint and web export passed. Physical camera capture was not tested.
