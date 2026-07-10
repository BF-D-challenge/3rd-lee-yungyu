#!/usr/bin/env node
// Variety and repetition audit for golden cards.
//
// Schema validators catch malformed cards. This audit catches a different risk:
// the set can still feel repetitive if titles, app names, timelines, formats, or
// source categories collapse into the same few shapes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const cardsPath = path.resolve(repoRoot, args.cards ?? "public/data/golden.json");
const combosPath = path.resolve(repoRoot, args.combos ?? "src/data/combos.json");
const label = String(args.label ?? "current");
const failOnIssues = Boolean(args.strict);

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));

const seedMeta = new Map();
for (const [track, trackData] of Object.entries(combos.tracks ?? {})) {
  for (const category of trackData.categories ?? []) {
    for (const seed of category.seeds ?? []) {
      seedMeta.set(seed.id, {
        track,
        categoryId: category.id,
        categoryLabel: category.label,
        seedLabel: seed.label,
      });
    }
  }
}
for (const seed of combos.presetSeeds ?? []) {
  if (!seedMeta.has(seed.id)) {
    seedMeta.set(seed.id, {
      track: seed.track ?? "preset",
      categoryId: seed.category ?? "preset",
      categoryLabel: seed.category ?? "preset",
      seedLabel: seed.label,
    });
  }
}

function inc(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function top(map, limit = 20, ascending = false) {
  return [...map.entries()]
    .sort((a, b) => ascending ? a[1] - b[1] : b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function duplicateBy(fn) {
  const groups = new Map();
  for (const card of cards) {
    const key = fn(card);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(`${card.seed}|${card.pain}|${card.format}`);
  }
  return [...groups.entries()]
    .filter(([, keys]) => keys.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([value, keys]) => ({ value, count: keys.length, keys }));
}

function timelineSignature(card) {
  return (card.frontStory?.timeline ?? [])
    .map((step) => `${step.t ?? ""}:${step.act ?? ""}`.trim())
    .join(" / ")
    .slice(0, 56);
}

const byCategory = new Map();
const byFormat = new Map();
const byNeedSource = new Map();
const byPrinciple = new Map();
const byOutputShape = new Map();
const byEmotionalResolution = new Map();

for (const card of cards) {
  const meta = seedMeta.get(card.seed);
  inc(byCategory, meta?.categoryLabel ?? meta?.categoryId ?? "unknown");
  inc(byFormat, card.format ?? "unknown");
  inc(byNeedSource, card.needSource ?? "unknown");
  inc(byPrinciple, card.psychologyPrinciple ?? "unknown");
  inc(byOutputShape, card.differentiationAxis?.outputShape ?? "unknown");
  inc(byEmotionalResolution, card.differentiationAxis?.emotionalResolution ?? "unknown");
}

const duplicateTitles = duplicateBy((card) => card.title);
const duplicateApps = duplicateBy((card) => card.appName);
const repeatedTimelineStarts = duplicateBy(timelineSignature);
const denseAppNames = cards
  .filter((card) => card.appName && !/\s/.test(card.appName) && /[가-힣]{9,}/.test(card.appName))
  .map((card) => ({
    key: `${card.seed}|${card.pain}|${card.format}`,
    appName: card.appName,
  }));

const maxCategoryShare = cards.length ? top(byCategory, 1)[0]?.count / cards.length : 0;
const maxFormatShare = cards.length ? top(byFormat, 1)[0]?.count / cards.length : 0;
const issues = [
  duplicateTitles.length ? "duplicate-title" : null,
  duplicateApps.length ? "duplicate-app-name" : null,
  repeatedTimelineStarts.length ? "repeated-frontstory-start" : null,
  denseAppNames.length ? "dense-app-name" : null,
  maxCategoryShare > 0.14 ? "category-concentration" : null,
  maxFormatShare > 0.28 ? "format-concentration" : null,
].filter(Boolean);

const result = {
  ok: issues.length === 0,
  label,
  total: cards.length,
  issues,
  concentration: {
    maxCategoryShare: Number(maxCategoryShare.toFixed(3)),
    maxFormatShare: Number(maxFormatShare.toFixed(3)),
  },
  categoryTop: top(byCategory, 24),
  categoryLow: top(byCategory, 24, true),
  format: top(byFormat, 20),
  needSource: top(byNeedSource, 10),
  psychologyTop: top(byPrinciple, 20),
  outputShapeTop: top(byOutputShape, 20),
  emotionalResolutionTop: top(byEmotionalResolution, 20),
  duplicateTitles,
  duplicateApps,
  repeatedTimelineStarts,
  denseAppNames,
};

console.log(JSON.stringify(result, null, 2));
process.exit(failOnIssues && !result.ok ? 1 : 0);
