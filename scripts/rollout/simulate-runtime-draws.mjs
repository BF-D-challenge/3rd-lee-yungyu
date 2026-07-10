#!/usr/bin/env node
// Fast runtime draw simulation for the filtered golden/allow data.
// It catches the main product risk: a removed seed reappearing through fallback
// seed pools or a selected seed without a matching golden card.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    out[key] = val;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const runs = Number(args.runs ?? 500);
const combos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/golden.json"), "utf8"));

const allowedSeeds = new Set(Object.keys(combos.allow));
const goldenByKey = new Map(golden.map((card) => [`${card.seed}|${card.pain}|${card.format}`, card]));
const runtimeSeeds = [];
for (const [track, trackData] of Object.entries(combos.tracks)) {
  for (const category of trackData.categories) {
    for (const seed of category.seeds) {
      if (allowedSeeds.has(seed.id)) runtimeSeeds.push({ ...seed, track, category: category.id });
    }
  }
}

function pick(xs) {
  return xs[Math.floor(Math.random() * xs.length)];
}

const failures = [];
const seenSeeds = new Map();
const seenFormats = new Map();
const seenNeedSources = new Map();

for (let i = 0; i < runs; i += 1) {
  const seed = pick(runtimeSeeds);
  if (!seed) {
    failures.push({ run: i, reason: "no-runtime-seed" });
    continue;
  }
  const allow = combos.allow[seed.id];
  if (!allow) {
    failures.push({ run: i, reason: "seed-without-allow", seed: seed.id });
    continue;
  }
  const pair = pick(allow.pairs ?? allow.pains.flatMap((pain) => allow.formats.map((format) => ({ pain, format }))));
  const card = goldenByKey.get(`${seed.id}|${pair.pain}|${pair.format}`);
  if (!card) {
    failures.push({ run: i, reason: "pair-without-golden", seed: seed.id, pair });
    continue;
  }
  if (card.needSource === "inferred") {
    failures.push({ run: i, reason: "inferred-card", key: `${card.seed}|${card.pain}|${card.format}` });
  }
  seenSeeds.set(seed.id, (seenSeeds.get(seed.id) ?? 0) + 1);
  seenFormats.set(card.format, (seenFormats.get(card.format) ?? 0) + 1);
  seenNeedSources.set(card.needSource, (seenNeedSources.get(card.needSource) ?? 0) + 1);
}

const summary = {
  ok: failures.length === 0,
  runs,
  golden: golden.length,
  allowSeeds: allowedSeeds.size,
  runtimeSeeds: runtimeSeeds.length,
  uniqueSeenSeeds: seenSeeds.size,
  seenNeedSources: Object.fromEntries([...seenNeedSources.entries()].sort((a, b) => b[1] - a[1])),
  topSeenFormats: Object.fromEntries([...seenFormats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)),
  topSeenSeeds: Object.fromEntries([...seenSeeds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)),
  failureCount: failures.length,
  failures: failures.slice(0, 20),
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exit(1);
