import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { recalls } from "./routes/recalls";
import { receipts } from "./routes/receipts";
import { demo } from "./routes/demo";
import { match } from "./routes/match";
import { health } from "./routes/health";
import { products } from "./routes/products";
import { recallStore } from "./services/recallStore";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.route("/health", health);
app.route("/products", products);
app.route("/recalls", recalls);
app.route("/receipts", receipts);
app.route("/demo", demo);
app.route("/match", match);

const port = Number(process.env.PORT ?? 8787);
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function watchRecalls() {
  void recallStore.syncFromHealthCanada().then((result) => {
    console.log(
      `Recall sync ${result.source}: ${result.imported} notices` +
        (result.error ? ` (${result.error})` : "")
    );
  });
}

watchRecalls();
const recallTimer = setInterval(watchRecalls, SIX_HOURS_MS);
recallTimer.unref?.();

console.log(`WeCanRecall API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
