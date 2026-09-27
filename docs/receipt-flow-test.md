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
