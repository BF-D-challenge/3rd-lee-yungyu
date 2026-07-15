#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const initialCards = readJsonl("docs/research/idea-strong-mechanism-batch-011-card-drafts-2026-07-15.jsonl");
const retryCards = readJsonl("docs/research/idea-strong-mechanism-batch-011-retry-card-drafts-2026-07-15.jsonl");
const initialStress = readJsonl("docs/research/idea-strong-mechanism-batch-011-stress-results-2026-07-15.jsonl");
const retryStress = readJsonl("docs/research/idea-strong-mechanism-batch-011-retry-stress-results-2026-07-15.jsonl");
const directKeys = new Set(["trustmrr:pdf-translator", "trustmrr:chromapick-chrome-extension", "trustmrr:apirealtest"]);
const retryKey = "trustmrr:docuaudit";

const cards = [
  ...initialCards.filter((row) => directKeys.has(row.source_key)),
  ...retryCards.filter((row) => row.source_key === retryKey),
];
const stress = [
  ...initialStress.filter((row) => directKeys.has(row.source_key)),
  ...retryStress.filter((row) => row.source_key === retryKey),
];
if (cards.length !== 4) throw new Error(`Expected 4 cards, got ${cards.length}`);
if (stress.length !== 12 || stress.some((row) => row.audit.status !== "pass")) {
  throw new Error("Latin survivors must have exactly 12 pass rows");
}

const cardsOutput = "docs/research/idea-strong-mechanism-batch-011-latin-card-drafts-2026-07-15.jsonl";
const stressOutput = "docs/research/idea-strong-mechanism-batch-011-latin-stress-results-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, cardsOutput), cards.map((row) => JSON.stringify(row)).join("\n") + "\n");
fs.writeFileSync(path.join(root, stressOutput), stress.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: cards.length, stressRows: stress.length, cardsOutput, stressOutput }, null, 2));
