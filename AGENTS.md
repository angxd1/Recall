# Repository guidance

## Layout and setup

RecallLens is an npm-workspaces TypeScript MVP. Use npm from the repository root,
Node 24 LTS (tested with 24.14.0), and commit package-lock.json when dependencies change.
Run npm ci; postinstall builds packages/shared. Rebuild shared after editing its source.

- apps/mobile: Expo SDK 57 / Expo Router app for native and web. Read its AGENTS.md
  before editing; it includes Expo documentation and dependency-install requirements.
- apps/api: Hono server, port 8787; tsx watch in development.
- packages/shared: types, potential matching and deterministic lot/UPC verification.
- scripts: smoke tests and synthetic receipt fixture.
- docs: editable Excalidraw overview and measured test results.

README.md is the local setup source of truth. Run Ollama with qwen2.5vl:3b,
npm run api and npm run mobile -- --web. API /health checks liveness, not model readiness.
The API reads process environment variables and does not automatically load .env.
EXPO_PUBLIC_API_URL belongs to the Expo process; use a LAN address for physical phones.

## Behavior to preserve

- Real receipt extraction uses self-hosted Ollama. Never silently substitute sample
  products or add a paid provider fallback on failure.
- Treat model output as untrusted. Preserve image/output validation, request limits,
  timeout, concurrency protection and editable review before saving.
- Potential matches are not confirmed recalls. Keep lot verification deterministic,
  and show source recall instructions rather than model-generated safety advice.
- Label fictional seed recalls visibly as demo data.
- Live lot/UPC enrichment, background monitoring, notifications and package-label OCR
  are not implemented. Do not imply otherwise in documentation or UI.

## Persistence

Metro resolves lib/db.web.ts for browsers (IndexedDB), and lib/db.ts for native
(reexports sqlite-db.ts). Preserve the shared interface. Browser migration copies old
SQLite products, recalls and matches atomically, guarded by a Web Lock and persistent
marker. Never delete legacy data or mark failed migration successful.
SQLite browser workers hold exclusive OPFS handles; do not restore ordinary browser
storage to SQLite or create separate inventory databases per tab.

Custom Metro configuration preserves worker chunks, WASM and isolation headers for
legacy migration. Verify development bundling and web export before changing it.
Let Expo handle workspace/nested dependency resolution.

API recall files use process.cwd()/data; npm run api sets cwd to apps/api.
Do not commit runtime data, uploads, model weights, .env files, node_modules, dist,
or .expo files. Do not reset user inventory while debugging. Keep fixtures synthetic
or explicitly licensed. There is no authentication or cross-device inventory sync.

## Validation and documentation

- npm test: deterministic matching, browser storage and mocked receipt tests.
- npm run typecheck: shared build plus API/mobile TypeScript.
- npm run lint: Expo lint.
- npm run build:web: static export and serializer regression check.
- npm run test:receipt: real Ollama integration; requires API/model and injects the
  fictional demo recall into local API storage.

Run relevant checks before finishing code changes. For storage changes also check
multiple tabs, reload persistence and existing data preservation. For receipt changes
exercise upload, review/edit, save and matching/nonmatching demo lots. Distinguish
mocked tests from real inference and physical-device tests in reports.

Update README.md, apps/api/README.md, DEMO.md and .env.example when setup or behavior
changes. Keep the architecture diagram simple: photo → Qwen → review/save → recall
check → lot verification → guidance, with Health Canada supplying recall data.
