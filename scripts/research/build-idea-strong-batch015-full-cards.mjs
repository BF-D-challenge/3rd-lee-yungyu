#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const cards = readJsonl("docs/research/idea-strong-mechanism-batch-015-latin-card-drafts-2026-07-15.jsonl");
const latin = readJsonl("docs/research/idea-strong-mechanism-batch-015-latin-results-2026-07-15.jsonl");
const passingKeys = [...new Set(latin.map((row) => row.source_key))].filter((key) => {
  const rows = latin.filter((row) => row.source_key === key);
  return rows.length === 9 && rows.every((row) => row.audit.status === "pass");
});
const selectedCards = cards.filter((row) => passingKeys.includes(row.source_key));
const selectedLatin = latin.filter((row) => passingKeys.includes(row.source_key));
if (selectedCards.length !== 1) throw new Error(`Expected 1 Full card, got ${selectedCards.length}`);
if (selectedLatin.length !== 9) throw new Error(`Expected 9 Latin rows, got ${selectedLatin.length}`);

const cardsOutput = "docs/research/idea-strong-mechanism-batch-015-full-card-drafts-2026-07-15.jsonl";
const latinOutput = "docs/research/idea-strong-mechanism-batch-015-full-latin-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, cardsOutput), selectedCards.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, latinOutput), selectedLatin.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ passingKeys, cards: selectedCards.length, latinRows: selectedLatin.length, cardsOutput, latinOutput }, null, 2));
