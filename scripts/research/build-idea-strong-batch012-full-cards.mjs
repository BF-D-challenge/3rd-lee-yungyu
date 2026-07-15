#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const originalCards = readJsonl("docs/research/idea-strong-mechanism-batch-012-latin-card-drafts-2026-07-15.jsonl");
const originalLatin = readJsonl("docs/research/idea-strong-mechanism-batch-012-latin-results-2026-07-15.jsonl");
const passingKeys = [...new Set(originalLatin.map((row) => row.source_key))].filter((key) => {
  const sourceRows = originalLatin.filter((row) => row.source_key === key);
  return sourceRows.length === 9 && sourceRows.every((row) => row.audit.status === "pass");
});
const cards = originalCards.filter((row) => passingKeys.includes(row.source_key));
const latinRows = originalLatin.filter((row) => passingKeys.includes(row.source_key));
if (cards.length !== 1) throw new Error(`Expected 1 Full card, got ${cards.length}`);
if (latinRows.length !== cards.length * 9) throw new Error(`Expected ${cards.length * 9} Latin rows, got ${latinRows.length}`);

const cardsOutput = "docs/research/idea-strong-mechanism-batch-012-full-card-drafts-2026-07-15.jsonl";
const latinOutput = "docs/research/idea-strong-mechanism-batch-012-full-latin-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, cardsOutput), cards.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, latinOutput), latinRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ passingKeys, cards: cards.length, latinRows: latinRows.length, cardsOutput, latinOutput }, null, 2));
