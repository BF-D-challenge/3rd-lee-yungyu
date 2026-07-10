#!/usr/bin/env node
// Build a chunked worklist of (seed,pain,format) combos needing v7 golden cards,
// grouped by category with anchor research attached, ready to embed into a Workflow script.
//
// Usage:
//   node scripts/rollout/build-worklist.mjs --categories ai,saas --chunk 12 --out chunks.json
//   node scripts/rollout/build-worklist.mjs --seeds cafe-tour,bakery-tour --chunk 12 --out chunks.json
//     (for legacy/orig seeds not tied to a research category id, pass --anchors path/to/anchors.json
//      mapping seedId -> {samples:[{n,d,r}]} or omit for a generic pool)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const CHUNK_SIZE = Number(args.chunk || 12);
const outPath = args.out ? path.resolve(process.cwd(), args.out) : path.join(repoRoot, "scratchpad-worklist.json");

const combos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/golden.json"), "utf8"));
const painById = Object.fromEntries(combos.pains.map((p) => [p.id, p]));
const formatById = Object.fromEntries(combos.formats.map((f) => [f.id, f]));
const v7Set = new Set(golden.filter((g) => g.source === "v7").map((g) => `${g.seed}|${g.pain}|${g.format}`));

let researchByCat = {};
if (args.research) {
  researchByCat = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args.research), "utf8"));
}

function findSeedMeta(seedId) {
  for (const t of ["like", "know"]) {
    for (const c of combos.tracks[t].categories) {
      const s = c.seeds.find((s) => s.id === seedId);
      if (s) return { seedLabel: s.label, categoryId: c.id, categoryLabel: c.label, track: t };
    }
  }
  const preset = combos.presetSeeds.find((s) => s.id === seedId);
  if (preset) return { seedLabel: preset.label, categoryId: "_legacy", categoryLabel: "레거시", track: preset.track };
  return { seedLabel: seedId, categoryId: "_legacy", categoryLabel: "레거시", track: "like" };
}

function itemsForSeed(seedId) {
  const allow = combos.allow[seedId];
  const meta = findSeedMeta(seedId);
  const items = [];
  for (const p of allow.pains) {
    for (const f of allow.formats) {
      const key = `${seedId}|${p}|${f}`;
      if (v7Set.has(key)) continue; // already done
      items.push({
        seed: seedId,
        seedLabel: meta.seedLabel,
        track: meta.track,
        categoryId: meta.categoryId,
        categoryLabel: meta.categoryLabel,
        pain: p,
        painLabel: painById[p].label,
        painShort: painById[p].short,
        format: f,
        formatLabel: formatById[f].label,
        formatDesc: formatById[f].desc,
        formatDays: formatById[f].buildDays,
        formatAction: formatById[f].action,
      });
    }
  }
  return items;
}

let targetSeeds = [];
if (args.categories) {
  const catIds = String(args.categories).split(",");
  for (const catId of catIds) {
    for (const t of ["like", "know"]) {
      const cat = combos.tracks[t].categories.find((c) => c.id === catId);
      if (cat) cat.seeds.forEach((s) => targetSeeds.push(s.id));
    }
  }
} else if (args.seeds) {
  targetSeeds = String(args.seeds).split(",");
} else {
  console.error("must pass --categories or --seeds");
  process.exit(1);
}

const GENERIC_ANCHORS = [{ n: "generic", d: "비슷한 문제를 푸는 해외 소형 SaaS/앱", r: 500 }];

const byCat = {};
for (const seedId of targetSeeds) {
  const items = itemsForSeed(seedId);
  if (!items.length) continue;
  const catId = items[0].categoryId;
  (byCat[catId] ||= { items: [], anchors: researchByCat[catId]?.samples?.slice(0, 8).map((s) => ({ n: s.name ?? s.n, d: s.desc ?? s.d, r: s.rev ?? s.r })) || GENERIC_ANCHORS }).items.push(...items);
}

const chunks = [];
for (const [catId, { items, anchors }] of Object.entries(byCat)) {
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push({ categoryId: catId, anchors, items: items.slice(i, i + CHUNK_SIZE) });
  }
}

fs.writeFileSync(outPath, JSON.stringify(chunks));
const totalItems = chunks.reduce((s, c) => s + c.items.length, 0);
console.log(JSON.stringify({ chunks: chunks.length, totalItems, outPath }, null, 2));
