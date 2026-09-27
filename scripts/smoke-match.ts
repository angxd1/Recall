import assert from "node:assert/strict";
import {
  DEMO_SEED_RECALL,
  extractLotFromOcr,
  extractRecallIdentifiers,
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

const generic = isPotentialProductMatch(
  { name: "Frozen Berries", brand: undefined, upc: undefined },
  {
    ...DEMO_SEED_RECALL,
    title: "Frozen strawberries recalled over possible contamination",
    productNames: ["Frozen Strawberries"],
    brands: [],
  }
);
assert.equal(generic.matched, false, "Generic grocery words must not match");

const oneWord = isPotentialProductMatch(
  { name: "Cheerios", brand: undefined, upc: undefined },
  {
    ...DEMO_SEED_RECALL,
    title: "Cheerios recalled over possible contamination",
    productNames: ["Cheerios"],
    brands: [],
    identifiers: {},
  }
);
assert.equal(oneWord.matched, false, "A single product word must not match");

const byUpc = isPotentialProductMatch(
  { name: "Something else", brand: undefined, upc: "060410046234" },
  DEMO_SEED_RECALL
);
assert.equal(byUpc.matched, true, "A saved UPC should match the recall UPC");
assert.deepEqual(byUpc.fields, ["upc"]);

const wrongUpc = isPotentialProductMatch(
  { name: "ABC Granola Bars", brand: "ABC", upc: "036000291452" },
  DEMO_SEED_RECALL
);
assert.equal(wrongUpc.matched, false, "A different UPC must not fall back to the product name");

const parsed = extractRecallIdentifiers(
  "Model WD1357. Affected lots A1800-A1900. UPC 060410046234."
);
assert.deepEqual(parsed.models, ["WD1357"]);
assert.deepEqual(parsed.lotRanges, [{ start: "A1800", end: "A1900" }]);
assert.deepEqual(parsed.upcs, ["060410046234"]);
const prose = extractRecallIdentifiers(
  "Do not assume your product is affected solely because the lot number appears in the table."
);
assert.deepEqual(prose.lotCodes, []);
assert.deepEqual(prose.lotRanges, []);

const lot = extractLotFromOcr("LOT A1842 BEST BEFORE 2026-11-01");
assert.equal(lot, "A1842");

const confirmed = verifyAgainstRecall(DEMO_SEED_RECALL, { lot: "A1842", upc: null });
assert.equal(confirmed.confirmed, true, "A1842 should confirm against A1800–A1900");

const cleared = verifyAgainstRecall(DEMO_SEED_RECALL, { lot: "A2001", upc: null });
assert.equal(cleared.confirmed, false, "A2001 should not confirm");

console.log("smoke-match: ok");
