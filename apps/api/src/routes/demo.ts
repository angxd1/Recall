import { Hono } from "hono";
import { DEMO_SEED_RECALL } from "@recalllens/shared";
import { recallStore } from "../services/recallStore";

export const demo = new Hono();

/** Inject the seed recall used for the hackathon demo. */
demo.post("/inject-recall", async (c) => {
  const recall = await recallStore.upsert({
    ...DEMO_SEED_RECALL,
    publishedAt: new Date().toISOString(),
  });
  return c.json({ recall, message: "Demo recall injected" });
});

demo.post("/reset-recalls", async (c) => {
  await recallStore.reset();
  return c.json({ ok: true });
});
