#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const draft = fs.readFileSync(path.join(root, "docs/research/idea-candidate-deep-audit-card-drafts-2026-07-14.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const patterns = [[0, 0, 0], [1, 1, 2], [2, 2, 1]];
const rows = draft.flatMap((row) => patterns.map(([payerIndex, momentIndex, twistIndex], patternIndex) => ({
  id: "stress-" + row.source_key.replace(/[^a-zA-Z0-9]+/g, "-") + "-" + patternIndex,
  source_key: row.source_key,
  name: row.name,
  source_url: row.url,
  source_five_sentences: row.five_sentences,
  payer_index: payerIndex,
  moment_index: momentIndex,
  twist_index: twistIndex,
  payer: row.card_draft.payers[payerIndex],
  moment: row.card_draft.moments[momentIndex],
  twist: row.card_draft.twists[twistIndex],
  smallest_build: row.five_sentences.input + " → " + row.five_sentences.process + " → " + row.five_sentences.immediate_result,
})));
const output = path.join(root, "docs/research/idea-candidate-stress-audit-input-2026-07-14.jsonl");
fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: draft.length, stressRows: rows.length, output }, null, 2));
