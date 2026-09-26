# RecallLens

Passive safety layer between products you buy and Canada's recall system.

> If something you own becomes unsafe, you should know about it.

**Hackathon MVP:** receipt → My Products → potential recall match → camera lot verification → official action guidance.

## Architecture

| Package | Role |
|---------|------|
| `apps/mobile` | Expo Router app — inventory, alerts, verify, action |
| `apps/api` | Hono API — receipt extract, Health Canada sync, matching |
| `packages/shared` | Types + Stage-1/Stage-2 matching helpers |

Recall source: [Health Canada open JSON](https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json) with a demo seed fallback (`ABC Granola Bars`, lots `A1800–A1900`).

## Quick start

```bash
npm install
npm run api          # terminal 1 — http://localhost:8787
npm run mobile       # terminal 2 — Expo
```

Optional env (see `.env.example`):

- `OPENAI_API_KEY` — live receipt vision; without it, extract returns demo items
- `EXPO_PUBLIC_API_URL` — set to your laptop LAN IP when testing on a physical phone

## Demo

See [DEMO.md](./DEMO.md) for the 60-second judge script and props checklist.

```bash
npm run test:match   # verifies Stage-1 + Stage-2 matching for the demo seed
```

## Out of scope (intentionally)

Email receipts, pantry AR, vehicles/VIN, household sharing, news feeds, AI-generated safety advice, warranties, expiry tracking, social features.
