import { Hono } from "hono";
import type { Recall } from "@recalllens/shared";
import { recallStore } from "../services/recallStore";

export const recalls = new Hono();

recalls.get("/", async (c) => {
  const items = await recallStore.list();
  const lastSyncedAt = await recallStore.lastSyncedAt();
  return c.json({ recalls: items, count: items.length, lastSyncedAt });
});

recalls.get("/:id", async (c) => {
  const recall = await recallStore.get(c.req.param("id"));
  if (!recall) return c.json({ error: "Not found" }, 404);
  return c.json({ recall });
});

recalls.post("/sync", async (c) => {
  const result = await recallStore.syncFromHealthCanada();
  return c.json(result);
});

recalls.post("/", async (c) => {
  const body = (await c.req.json()) as Recall;
  const saved = await recallStore.upsert(body);
  return c.json({ recall: saved }, 201);
});
