#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const ledgerPath = path.join(repoRoot, "docs/research/idea-source-final-ledger.jsonl");
const outputPath = path.join(repoRoot, "docs/research/idea-candidate-gate-input-2026-07-14.jsonl");

const rows = fs.readFileSync(ledgerPath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse)
  .filter((row) => row.decision === "Candidate" && row.review_state === "finalized");

const gateRows = rows.map((row, index) => ({
  id: "candidate-gate-" + String(index + 1).padStart(4, "0") + "-" + row.key.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 72),
  source_key: row.key,
  name: row.name,
  url: row.url,
  category: row.category,
  source_text: row.source_text,
  five_sentences: row.five_sentences,
  decision_reason: row.decision_reason,
  market_signal: row.market_signal,
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, gateRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: rows.length, outputPath }, null, 2));
