#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const originalCards = readJsonl("docs/research/idea-strong-mechanism-batch-009-card-drafts-2026-07-15.jsonl");
const originalStress = readJsonl("docs/research/idea-strong-mechanism-batch-009-stress-results-2026-07-15.jsonl");
const retryCards = readJsonl("docs/research/idea-strong-mechanism-batch-009-retry-card-drafts-2026-07-15.jsonl");
const retryStress = readJsonl("docs/research/idea-strong-mechanism-batch-009-retry-stress-results-2026-07-15.jsonl");

const passingKeys = (rows) => [...new Set(rows.map((row) => row.source_key))].filter((key) => {
  const sourceRows = rows.filter((row) => row.source_key === key);
  return sourceRows.length === 3 && sourceRows.every((row) => row.audit.status === "pass");
});
const originalPassing = passingKeys(originalStress);
const retryPassing = passingKeys(retryStress);
const retryByKey = new Map(retryCards.map((row) => [row.source_key, row]));
const cards = [
  ...originalCards.filter((row) => originalPassing.includes(row.source_key)),
  ...retryPassing.filter((key) => !originalPassing.includes(key)).map((key) => retryByKey.get(key)),
];
if (cards.some((row) => !row)) throw new Error("Missing retry card");
if (cards.length !== 6) throw new Error(`Expected 6 Latin cards, got ${cards.length}`);

const output = "docs/research/idea-strong-mechanism-batch-009-latin-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), cards.map((row) => JSON.stringify(row)).join("\n") + "\n");
const stressOutput = "docs/research/idea-strong-mechanism-batch-009-latin-stress-results-2026-07-15.jsonl";
const stressRows = [
  ...originalStress.filter((row) => originalPassing.includes(row.source_key)),
  ...retryStress.filter((row) => retryPassing.includes(row.source_key) && !originalPassing.includes(row.source_key)),
];
fs.writeFileSync(path.join(root, stressOutput), stressRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ originalPassing, retryPassing, cards: cards.length, stressRows: stressRows.length, output, stressOutput }, null, 2));
