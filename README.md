# RecallLens

Passive safety layer between products you buy and Canada's recall system.

**Hackathon MVP:** receipt → My Products → potential recall match → camera lot verification → official action guidance.

## Monorepo

```
apps/mobile   Expo Router app (dev client recommended for camera)
apps/api      Hono API — receipt extract, Health Canada sync, matching
packages/shared  Shared types + matching helpers
```

## Quick start

```bash
npm install
npm run shared:build
npm run api          # terminal 1 — http://localhost:8787
npm run mobile       # terminal 2 — Expo
```

Optional: `OPENAI_API_KEY` for live receipt vision. Without it, receipt extract returns demo items.

Set `EXPO_PUBLIC_API_URL` if the phone cannot reach `localhost:8787` (use your machine LAN IP).

## Demo script

1. Scan receipt (or tap Load demo receipt)
2. Inject demo recall from Demo screen
3. Open potential match → Check Product
4. Point camera at package lot (or enter `A1842`)
5. See RECALL CONFIRMED + official actions
