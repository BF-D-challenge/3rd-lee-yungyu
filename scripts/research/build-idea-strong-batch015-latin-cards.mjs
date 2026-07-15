#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const cards = readJsonl("docs/research/idea-strong-mechanism-batch-015-card-drafts-raw-2026-07-15.jsonl");
const stress = readJsonl("docs/research/idea-strong-mechanism-batch-015-stress-results-2026-07-15.jsonl");
const passingKeys = [...new Set(stress.map((row) => row.source_key))].filter((key) => {
  const rows = stress.filter((row) => row.source_key === key);
  return rows.length === 3 && rows.every((row) => row.audit.status === "pass");
});
const selectedCards = cards.filter((row) => passingKeys.includes(row.source_key));
const selectedStress = stress.filter((row) => passingKeys.includes(row.source_key));
if (selectedCards.length !== 2) throw new Error(`Expected 2 Latin cards, got ${selectedCards.length}`);
if (selectedStress.length !== selectedCards.length * 3) throw new Error(`Expected ${selectedCards.length * 3} stress rows, got ${selectedStress.length}`);

const cardsOutput = "docs/research/idea-strong-mechanism-batch-015-latin-card-drafts-2026-07-15.jsonl";
const stressOutput = "docs/research/idea-strong-mechanism-batch-015-latin-stress-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, cardsOutput), selectedCards.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, stressOutput), selectedStress.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ passingKeys, cards: selectedCards.length, stressRows: selectedStress.length, cardsOutput, stressOutput }, null, 2));
