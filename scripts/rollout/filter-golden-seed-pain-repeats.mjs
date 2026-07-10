#!/usr/bin/env node
// Reduce cards that share the same seed+pain and only differ by format.
//
// This is intentionally conservative. It does not claim that multiple formats
// are always bad; it removes them only for groups that are most likely to feel
// repetitive in repeated draws.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const combosPath = path.join(repoRoot, "src/data/combos.json");
const reportPath = path.join(
  repoRoot,
  "docs/dev/experiments/card-quality/qa/seed-pain-repeat-filter-latest.json",
);

const write = process.argv.includes("--write");
const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));

const forcedKeys = new Set([
  "performance-marketing|60",
  "mobile-apps-niche-ai-scoring|10",
  "mobile-apps-utility-bundle-strategy|10",
  "productivity-inbox-declutter|10",
  "real-estate-auction-rights-check|10",
  "iot-hardware-bluetooth-tracker|10",
  "iot-hardware-charger-cable|10",
  "no-code-notion-site|10",
  "diary-deco|10",
  "iot-hardware-diy-project|13",
  "utilities-prompt-drawer|15",
]);

const formatRank = {
  "calc-tool": 9,
  dashboard: 8,
  curation: 7,
  "template-gen": 6,
  "vote-card": 5,
  "digest-bot": 4,
  "crud-app": 3,
  chatbot: 2,
  "landing-waitlist": 1,
  "chrome-ext": 0,
};

const needSourceRank = {
  direct: 4,
  adjacent: 3,
  external: 2,
  inferred: 0,
};

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function seedPainKey(card) {
  return `${card.seed}|${card.pain}`;
}

function score(card) {
  let value = 0;
  value += (needSourceRank[card.needSource] ?? 1) * 100;
  value += (formatRank[card.format] ?? 0) * 10;
  if (card.evidenceType === "revenue") value += 5;
  if (/월매출|매달/.test(card.evidence ?? "")) value += 3;
  if (/투표카드|후보집|현황판|계산|점검|초안|알림/.test(card.title ?? "")) value += 2;
  if (String(card.evidence ?? "").length > 95) value -= 1;
  return value;
}

function pruneAllow(kept) {
  const bySeed = new Map();
  for (const card of kept) {
    if (!bySeed.has(card.seed)) bySeed.set(card.seed, []);
    bySeed.get(card.seed).push({ pain: card.pain, format: card.format });
  }

  const nextAllow = {};
  for (const [seed, pairs] of [...bySeed.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const uniquePairs = [
      ...new Map(pairs.map((pair) => [`${pair.pain}|${pair.format}`, pair])).values(),
    ].sort((a, b) => a.pain - b.pain || a.format.localeCompare(b.format));
    nextAllow[seed] = {
      pains: [...new Set(uniquePairs.map((pair) => pair.pain))].sort((a, b) => a - b),
      formats: [...new Set(uniquePairs.map((pair) => pair.format))].sort(),
      pairs: uniquePairs,
    };
  }
  return nextAllow;
}

const groups = new Map();
for (const card of cards) {
  const groupKey = seedPainKey(card);
  if (!groups.has(groupKey)) groups.set(groupKey, []);
  groups.get(groupKey).push(card);
}

const kept = [];
const removed = [];

for (const [groupKey, groupCards] of groups) {
  const shouldCollapse = groupCards.length >= 3 || forcedKeys.has(groupKey);
  if (!shouldCollapse) {
    kept.push(...groupCards);
    continue;
  }
  const ranked = [...groupCards].sort((a, b) => score(b) - score(a) || key(a).localeCompare(key(b)));
  kept.push(ranked[0]);
  for (const card of ranked.slice(1)) {
    removed.push({
      groupKey,
      removedKey: key(card),
      removedTitle: card.title,
      keptKey: key(ranked[0]),
      keptTitle: ranked[0].title,
      reason: groupCards.length >= 3 ? "three-plus-same-seed-pain" : "qa-repeat-risk",
    });
  }
}

const sortedKept = kept.sort((a, b) => key(a).localeCompare(key(b)));
const nextCombos = {
  ...combos,
  version: Number(combos.version ?? 0) + (write ? 1 : 0),
  allow: pruneAllow(sortedKept),
};

const report = {
  write,
  before: cards.length,
  after: sortedKept.length,
  removedCount: removed.length,
  collapsedGroups: [...new Set(removed.map((entry) => entry.groupKey))].length,
  removed,
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (write) {
  fs.writeFileSync(goldenPath, `${JSON.stringify(sortedKept, null, 2)}\n`);
  fs.writeFileSync(combosPath, `${JSON.stringify(nextCombos, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
