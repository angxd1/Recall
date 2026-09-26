import { Hono } from "hono";

export const health = new Hono();

health.get("/", (c) =>
  c.json({ ok: true, service: "recalllens-api", ts: new Date().toISOString() })
);
