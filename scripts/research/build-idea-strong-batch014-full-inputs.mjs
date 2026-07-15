#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const initialCards = readJsonl("docs/research/idea-strong-mechanism-batch-014-card-drafts-2026-07-15.jsonl");
const retryCards = readJsonl("docs/research/idea-strong-mechanism-batch-014-beesecure-retry-card-drafts-2026-07-15.jsonl");
const initialLatin = readJsonl("docs/research/idea-strong-mechanism-batch-014-latin-results-2026-07-15.jsonl");
const retryLatin = readJsonl("docs/research/idea-strong-mechanism-batch-014-beesecure-retry-latin-results-2026-07-15.jsonl");
const directKeys = new Set([
  "trustmrr:webtoapp-no-code-app-converter",
  "trustmrr:scrapestudio-co",
  "trustmrr:lightspeed-run",
]);
const retryKey = "trustmrr:beesecure";

const cards = [
  ...initialCards.filter((row) => directKeys.has(row.source_key)),
  ...retryCards.filter((row) => row.source_key === retryKey),
];
const latin = [
  ...initialLatin.filter((row) => directKeys.has(row.source_key)),
  ...retryLatin.filter((row) => row.source_key === retryKey),
];
if (cards.length !== 4) throw new Error(`Expected 4 cards, got ${cards.length}`);
if (latin.length !== 36 || latin.some((row) => row.audit.status !== "pass")) {
  throw new Error("Full survivors must have exactly 36 pass Latin rows");
}

const cardsOutput = "docs/research/idea-strong-mechanism-batch-014-full-card-drafts-2026-07-15.jsonl";
const latinOutput = "docs/research/idea-strong-mechanism-batch-014-full-latin-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, cardsOutput), cards.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, latinOutput), latin.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: cards.length, latinRows: latin.length, cardsOutput, latinOutput }, null, 2));
