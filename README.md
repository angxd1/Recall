# WeCanRecall

Track purchased products and check them against Canada's recall system.

> If something you own becomes unsafe, you should know about it.

**Hackathon MVP:** receipt photo → local Qwen → review/save products → potential recall match → manual lot verification → recall guidance.

## Architecture

| Package | Role |
|---------|------|
| `apps/mobile` | Expo Router app — inventory, alerts, verify, action |
| `apps/api` | Hono API — receipt extract, Health Canada sync, matching |
| `packages/shared` | Types + Stage-1/Stage-2 matching helpers |

Recall source: [Health Canada open JSON](https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json) with a demo seed fallback (`ABC Granola Bars`, lots `A1800–A1900`).

## Quick start

```bash
npm ci              # Node 24 LTS recommended; also builds the shared package
ollama pull qwen2.5vl:3b
# Start the Ollama desktop app, or run ollama serve in a separate terminal.
npm run api          # terminal 1 — http://localhost:8787
npm run mobile -- --web # terminal 2 — http://localhost:8081
```

Optional env (see `.env.example`):

- `OLLAMA_BASE_URL` — self-hosted receipt reader (default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` — vision model (default `qwen2.5vl:3b`); install it with `ollama pull qwen2.5vl:3b`
- `EXPO_PUBLIC_API_URL` — set to your laptop LAN IP when testing on a physical phone

Receipt extraction no longer calls OpenAI. Install and run [Ollama](https://ollama.com/download),
then pull the model above. The API reads environment variables from its process; `.env.example`
is a reference, not an automatically loaded API configuration file. See
[API setup](apps/api/README.md) for PowerShell commands and hosting requirements.
Only explicit demo requests return sample products. Real extraction failures ask for a retry.

Install Node.js 24 LTS (tested with 24.14.0) and Ollama before running these commands.
The model download is approximately 3.2 GB; a GPU improves inference latency.
Do not run a second Ollama server if the desktop app already serves port 11434.
The API health endpoint is [localhost:8787/health](http://localhost:8787/health).
It checks API liveness, not model readiness.

Open **Scan receipt → Upload receipt photo** and select
`scripts/fixtures/receipt.png` to test real extraction. Review the three products and save.
**Use demo receipt** works without Ollama but requires the API.

### Physical phones

Use the same network as the development machine and allow ports 8081 and 8787 through
its firewall. In the terminal starting Expo, set the machine's LAN address:

```powershell
# PowerShell; substitute your machine's LAN IP
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:8787"
npm run mobile
```

```bash
# macOS/Linux
EXPO_PUBLIC_API_URL=http://192.168.1.20:8787 npm run mobile
```

Use an Expo Go version compatible with SDK 57 or a development build. Restart Expo after
changing environment variables. On a phone, localhost refers to the phone, not the API
machine. Browser camera access requires localhost or HTTPS; upload is also available.
All `EXPO_PUBLIC_*` configuration is public: never put secrets there.

### Storage and troubleshooting

- Browser inventory uses IndexedDB, shared across tabs on the same origin. Native apps
  use SQLite. There is no account sync across browsers or devices.
- Old browser SQLite data migrates once into IndexedDB without deleting the original.
  If migration reports a locked file, close older Recall tabs and reload the remaining tab.
  Do not clear browser storage as a workaround: it removes inventory.
- API recall files live in `apps/api/data/` when started with `npm run api`; Git ignores them.
- For stale Metro module/worker errors, stop Expo and run `npm run mobile -- --clear`.
  The Metro worker/WASM configuration is still needed for legacy SQLite migration.
- If the model is unavailable, check `ollama list` and ensure Ollama serves port 11434.
  Only one extraction runs per API process at a time; busy requests can be retried.

[Editable architecture diagram](docs/recalllens-architecture.excalidraw) — open in Excalidraw.

## Demo

See [DEMO.md](./DEMO.md) for the 60-second judge script and props checklist.

```bash
npm run test:match   # verifies Stage-1 + Stage-2 matching for the demo seed
npm run test:receipt # real local Qwen extraction + demo matching (API and Ollama must be running)
```

Additional checks, all from the repository root:

```bash
npm test             # Matching, storage and mocked receipt tests; no servers required
npm run typecheck    # Shared build + API/mobile TypeScript
npm run lint         # Mobile Expo lint
npm run build:web    # Static export to apps/mobile/dist
```

The real-model smoke test injects a fictional recall into the local API store.
See [test results and limitations](docs/receipt-flow-test.md). Contributor/agent guidance
is in [AGENTS.md](AGENTS.md), with additional Expo guidance in apps/mobile/AGENTS.md.

## Barcode lookup

Barcode scans now query [Open Food Facts](https://world.openfoodfacts.org) through the API
to fill in a food product's name and brand. No API key is required. You can also type a
UPC/EAN and choose **Look up product**, then review or correct the name before saving.
Missing products and network failures allow manual name entry. Coverage is community
maintained and primarily food; non-food items may need manual names.

Scanning an existing UPC shows **You already have this product in your list** and blocks
a second entry. UPC-A and zero-prefixed EAN-13 codes count as the same product; camera
UPC-E codes are expanded first. Duplicate prevention is by barcode, not guessed names,
so receipt items without a barcode cannot be reliably deduplicated against scans.

Product metadata is from Open Food Facts under ODbL; attribution is shown in the lookup UI.
The API caches results and limits outbound requests. Public deployments with multiple
API processes must coordinate the provider's per-IP rate limit. See their
[API documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/).

## Current limitations

Recall sync/matching are manual demo actions; background monitoring and notifications
are not implemented. Live recall ingestion does not yet populate lot/UPC identifiers,
so lot confirmation is demonstrated with the labelled fictional recall. Package lot
entry is manual; package-label OCR is not implemented. Receipt recognition can fail
on folded or obscured text; users must review results.

Self-hosting avoids per-token fees but still requires inference hardware and hosting
resources. A static web host alone cannot serve Qwen. See the API README for HTTPS,
private Ollama hosting, persistent storage and request quota requirements.

## Out of scope (intentionally)

Email receipts, pantry AR, vehicles/VIN, household sharing, news feeds, AI-generated safety advice, warranties, expiry tracking, social features.
