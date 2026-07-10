#!/usr/bin/env node
// Restore rewritten cards whose pairs existed in a previous allowlist backup.
//
// This is intentionally conservative: each restored card adds exactly its
// seed/pain/format pair to the current allow entry and then upserts the Golden.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const combosPath = path.join(repoRoot, "src/data/combos.json");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const batchDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");

const backupArg = process.argv[2];
const batchNames = process.argv.slice(3);
if (!backupArg || !batchNames.length) {
  console.error("usage: node scripts/rollout/restore-golden-rewrite-batches.mjs <combos-backup.json> <batch.json>...");
  process.exit(1);
}

const currentCombos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const backupCombos = JSON.parse(fs.readFileSync(path.isAbsolute(backupArg) ? backupArg : path.join(batchDir, backupArg), "utf8"));
const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));

const key = (card) => `${card.seed}|${card.pain}|${card.format}`;
const byKey = new Map(golden.map((card) => [key(card), card]));

function pairAllowed(allow, card) {
  if (!allow) return false;
  if (Array.isArray(allow.pairs) && allow.pairs.length) {
    return allow.pairs.some((pair) => pair.pain === card.pain && pair.format === card.format);
  }
  return allow.pains?.includes(card.pain) && allow.formats?.includes(card.format);
}

function ensureCurrentAllow(card) {
  const entry = currentCombos.allow[card.seed] ?? { pains: [], formats: [], pairs: [] };
  const pairs = Array.isArray(entry.pairs) ? entry.pairs : [];
  if (!pairs.some((pair) => pair.pain === card.pain && pair.format === card.format)) {
    pairs.push({ pain: card.pain, format: card.format });
  }
  entry.pains = [...new Set([...(entry.pains ?? []), card.pain])].sort((a, b) => a - b);
  entry.formats = [...new Set([...(entry.formats ?? []), card.format])].sort();
  entry.pairs = pairs.sort((a, b) => a.pain - b.pain || a.format.localeCompare(b.format));
  currentCombos.allow[card.seed] = entry;
}

let read = 0;
let restored = 0;
const skipped = [];

for (const name of batchNames) {
  const cards = JSON.parse(fs.readFileSync(path.join(batchDir, name), "utf8"));
  for (const card of cards) {
    read += 1;
    const backupAllow = backupCombos.allow?.[card.seed];
    if (!pairAllowed(backupAllow, card)) {
      skipped.push({ key: key(card), reason: "not-in-backup-allow" });
      continue;
    }
    ensureCurrentAllow(card);
    byKey.set(key(card), { ...card, source: card.source ?? "v7" });
    restored += 1;
  }
}

currentCombos.version = Number(currentCombos.version ?? 0) + 1;
const mergedGolden = [...byKey.values()].sort((a, b) => key(a).localeCompare(key(b)));

fs.writeFileSync(combosPath, `${JSON.stringify(currentCombos, null, 2)}\n`);
fs.writeFileSync(goldenPath, `${JSON.stringify(mergedGolden, null, 2)}\n`);

console.log(JSON.stringify({
  read,
  restored,
  skipped,
  goldenTotal: mergedGolden.length,
  allowSeeds: Object.keys(currentCombos.allow).length,
}, null, 2));
