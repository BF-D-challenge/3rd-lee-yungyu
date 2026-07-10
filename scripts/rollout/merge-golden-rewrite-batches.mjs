#!/usr/bin/env node
// Upsert validated Golden rewrite batches into public/data/golden.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const batchDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");
const batchNames = process.argv.slice(2);

if (!batchNames.length) {
  console.error("usage: node scripts/rollout/merge-golden-rewrite-batches.mjs <batch.json>...");
  process.exit(1);
}

const key = (card) => `${card.seed}|${card.pain}|${card.format}`;
const current = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const byKey = new Map(current.map((card) => [key(card), card]));

let read = 0;
let replaced = 0;
let added = 0;
const duplicateBatchKeys = new Set();
const seenBatchKeys = new Set();

for (const name of batchNames) {
  const cards = JSON.parse(fs.readFileSync(path.join(batchDir, name), "utf8"));
  for (const card of cards) {
    read += 1;
    const cardKey = key(card);
    if (seenBatchKeys.has(cardKey)) duplicateBatchKeys.add(cardKey);
    seenBatchKeys.add(cardKey);
    if (byKey.has(cardKey)) replaced += 1;
    else added += 1;
    byKey.set(cardKey, { ...card, source: card.source ?? "v7" });
  }
}

const merged = [...byKey.values()].sort((a, b) => key(a).localeCompare(key(b)));
fs.writeFileSync(goldenPath, `${JSON.stringify(merged, null, 2)}\n`);

console.log(JSON.stringify({
  before: current.length,
  batchCards: read,
  replaced,
  added,
  after: merged.length,
  duplicateBatchKeys: [...duplicateBatchKeys],
}, null, 2));
