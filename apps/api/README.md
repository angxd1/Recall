# RecallLens API

Hono server for receipt extraction, Health Canada recall sync, and matching.

```bash
npm install
npm run api
```

Default: `http://localhost:8787`

Optional: set `OPENAI_API_KEY` for live receipt OCR. Without it, `/receipts/extract` returns demo items.
