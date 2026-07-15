#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);

const originalCards = readJsonl("docs/research/idea-strong-mechanism-batch-012-card-drafts-raw-2026-07-15.jsonl");
const originalStress = readJsonl("docs/research/idea-strong-mechanism-batch-012-stress-results-2026-07-15.jsonl");
const sourceKeys = [...new Set(originalStress.map((row) => row.source_key))];
const passingKeys = sourceKeys.filter((key) => {
  const sourceRows = originalStress.filter((row) => row.source_key === key);
  return sourceRows.length === 3 && sourceRows.every((row) => row.audit.status === "pass");
});
const cards = originalCards.filter((row) => passingKeys.includes(row.source_key));
const stressRows = originalStress.filter((row) => passingKeys.includes(row.source_key));
if (cards.length !== passingKeys.length) throw new Error(`Missing card: ${cards.length}/${passingKeys.length}`);
if (cards.length !== 3) throw new Error(`Expected 3 Latin cards, got ${cards.length}`);
if (stressRows.length !== cards.length * 3) throw new Error(`Expected ${cards.length * 3} stress rows, got ${stressRows.length}`);

const output = "docs/research/idea-strong-mechanism-batch-012-latin-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), cards.map((row) => JSON.stringify(row)).join("\n") + "\n");
const stressOutput = "docs/research/idea-strong-mechanism-batch-012-latin-stress-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, stressOutput), stressRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ passingKeys, cards: cards.length, stressRows: stressRows.length, output, stressOutput }, null, 2));
