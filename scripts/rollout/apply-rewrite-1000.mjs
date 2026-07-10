#!/usr/bin/env node
// Apply the four validated rewrite lane outputs to public/data/golden.json.
// Refuses to write unless all 1,000 existing keys are present exactly once.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const baseDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");
const goldenPath = path.join(repoRoot, "public/data/golden.json");

const lanes = [
  ["B", "001-250"],
  ["C", "251-500"],
  ["D", "501-750"],
  ["E", "751-1000"],
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

const dryRun = process.argv.includes("--dry-run");
const golden = readJson(goldenPath);
const existingKeys = golden.map(key);
const existingKeySet = new Set(existingKeys);

if (existingKeys.length !== 1000 || existingKeySet.size !== 1000) {
  throw new Error(`expected 1,000 unique existing keys, got ${existingKeys.length}/${existingKeySet.size}`);
}

const rewritten = [];
for (const [lane, range] of lanes) {
  const outputPath = path.join(baseDir, "outputs", `lane-${lane}-${range}.json`);
  if (!fs.existsSync(outputPath)) throw new Error(`missing output: ${outputPath}`);
  const cards = readJson(outputPath);
  if (!Array.isArray(cards) || cards.length !== 250) {
    throw new Error(`lane ${lane} must contain 250 cards`);
  }
  rewritten.push(...cards);
}

const rewrittenKeys = rewritten.map(key);
const rewrittenKeySet = new Set(rewrittenKeys);
if (rewritten.length !== 1000 || rewrittenKeySet.size !== 1000) {
  throw new Error(`expected 1,000 unique rewritten keys, got ${rewritten.length}/${rewrittenKeySet.size}`);
}

const missing = existingKeys.filter((k) => !rewrittenKeySet.has(k));
const extra = rewrittenKeys.filter((k) => !existingKeySet.has(k));
if (missing.length || extra.length) {
  throw new Error(JSON.stringify({ missing: missing.slice(0, 10), extra: extra.slice(0, 10) }, null, 2));
}

const byKey = new Map(rewritten.map((card) => [key(card), card]));
const nextGolden = golden.map((card) => byKey.get(key(card)));

const report = {
  ok: true,
  dryRun,
  total: nextGolden.length,
  lanes: lanes.map(([lane, range]) => ({ lane, range, count: 250 })),
  output: "public/data/golden.json",
};

if (!dryRun) {
  const backupPath = path.join(baseDir, `golden-before-rewrite-1000-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(golden, null, 2) + "\n");
  fs.writeFileSync(goldenPath, JSON.stringify(nextGolden, null, 2) + "\n");
  report.backupPath = path.relative(repoRoot, backupPath);
}

console.log(JSON.stringify(report, null, 2));
