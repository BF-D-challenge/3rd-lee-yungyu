#!/usr/bin/env node
// Upsert v7 golden cards into public/data/golden.json.
// Usage: node scripts/rollout/upsert-golden.mjs <cards.json>
// <cards.json> = array of Golden-shaped objects (seed/pain/format/... /source:"v7")
//
// golden.json lives under public/ (not src/data/combos.json) so it ships as a
// runtime-fetched static asset instead of bloating the client JS bundle — see
// src/lib/golden-store.ts. src/data/combos.json stays small (tracks/pains/
// formats/allow/...) and is still safe to import statically.

import fs from "node:fs";

const cardsPath = process.argv[2];
if (!cardsPath) {
  console.error("usage: node scripts/rollout/upsert-golden.mjs <cards.json>");
  process.exit(1);
}

const combosPath = new URL("../../src/data/combos.json", import.meta.url);
const goldenPath = new URL("../../public/data/golden.json", import.meta.url);
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

const validPainIds = new Set(combos.pains.map((p) => p.id));
const validFormatIds = new Set(combos.formats.map((f) => f.id));
const validSeedIds = new Set(Object.keys(combos.allow));

const key = (c) => `${c.seed}|${c.pain}|${c.format}`;
const existingByKey = new Map(golden.map((g, i) => [key(g), i]));

let inserted = 0;
let updated = 0;
let rejected = [];

for (const card of cards) {
  if (!validSeedIds.has(card.seed) || !validPainIds.has(card.pain) || !validFormatIds.has(card.format)) {
    rejected.push({ reason: "invalid seed/pain/format", key: key(card) });
    continue;
  }
  const allow = combos.allow[card.seed];
  const pairAllowed = Array.isArray(allow.pairs) && allow.pairs.length
    ? allow.pairs.some((pair) => pair.pain === card.pain && pair.format === card.format)
    : allow.pains.includes(card.pain) && allow.formats.includes(card.format);
  if (!pairAllowed) {
    rejected.push({ reason: "combo not in allow[]", key: key(card) });
    continue;
  }
  card.source = "v7";
  const k = key(card);
  if (existingByKey.has(k)) {
    golden[existingByKey.get(k)] = card;
    updated++;
  } else {
    existingByKey.set(k, golden.length);
    golden.push(card);
    inserted++;
  }
}

fs.writeFileSync(goldenPath, JSON.stringify(golden, null, 2) + "\n");

console.log(JSON.stringify({ inserted, updated, rejectedCount: rejected.length, totalGolden: golden.length, v7Count: golden.filter((g) => g.source === "v7").length }, null, 2));
if (rejected.length) {
  console.log("rejected samples:", rejected.slice(0, 10));
}
