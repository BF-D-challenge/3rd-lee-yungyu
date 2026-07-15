#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const originalCards = readJsonl("docs/research/idea-strong-mechanism-batch-009-latin-card-drafts-2026-07-15.jsonl");
const originalLatin = readJsonl("docs/research/idea-strong-mechanism-batch-009-latin-results-2026-07-15.jsonl");
const retryCards = readJsonl("docs/research/idea-strong-mechanism-batch-009-latin-axis-retry-card-drafts-2026-07-15.jsonl");
const retryLatin = readJsonl("docs/research/idea-strong-mechanism-batch-009-latin-axis-retry-latin-results-2026-07-15.jsonl");
const passingKeys = (rows) => [...new Set(rows.map((row) => row.source_key))].filter((key) => {
  const sourceRows = rows.filter((row) => row.source_key === key);
  return sourceRows.length === 9 && sourceRows.every((row) => row.audit.status === "pass");
});
const originalPassing = passingKeys(originalLatin);
const retryPassing = passingKeys(retryLatin);
const cardByKey = new Map([...originalCards, ...retryCards].map((row) => [row.source_key, row]));
const keys = [...new Set([...originalPassing, ...retryPassing])];
const cards = keys.map((key) => cardByKey.get(key));
if (cards.some((row) => !row)) throw new Error("Missing Full card");
if (cards.length !== 4) throw new Error(`Expected 4 Full cards, got ${cards.length}`);
const latinRows = [
  ...originalLatin.filter((row) => originalPassing.includes(row.source_key)),
  ...retryLatin.filter((row) => retryPassing.includes(row.source_key) && !originalPassing.includes(row.source_key)),
];
const cardsOutput = "docs/research/idea-strong-mechanism-batch-009-full-card-drafts-2026-07-15.jsonl";
const latinOutput = "docs/research/idea-strong-mechanism-batch-009-full-latin-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, cardsOutput), cards.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, latinOutput), latinRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ originalPassing, retryPassing, cards: cards.length, latinRows: latinRows.length, cardsOutput, latinOutput }, null, 2));
