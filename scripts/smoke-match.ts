import assert from "node:assert/strict";
import {
  DEMO_SEED_RECALL,
  extractLotFromOcr,
  isPotentialProductMatch,
  verifyAgainstRecall,
} from "../packages/shared/src/index";

const product = {
  name: "ABC Granola Bars",
  brand: "ABC",
  upc: undefined as string | undefined,
};

const potential = isPotentialProductMatch(product, DEMO_SEED_RECALL);
assert.equal(potential.matched, true, "Stage-1 should match ABC Granola Bars");

const lot = extractLotFromOcr("LOT A1842 BEST BEFORE 2026-11-01");
assert.equal(lot, "A1842");

const confirmed = verifyAgainstRecall(DEMO_SEED_RECALL, { lot: "A1842", upc: null });
assert.equal(confirmed.confirmed, true, "A1842 should confirm against A1800–A1900");

const cleared = verifyAgainstRecall(DEMO_SEED_RECALL, { lot: "A2001", upc: null });
assert.equal(cleared.confirmed, false, "A2001 should not confirm");

console.log("smoke-match: ok");
