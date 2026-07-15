#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const draft = fs.readFileSync(path.join(root, "docs/research/idea-candidate-deep-audit-card-drafts-2026-07-14.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const stress = fs.readFileSync(path.join(root, "docs/research/idea-candidate-stress-audit-results-2026-07-14.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const grouped = new Map();
for (const row of stress) {
  const item = grouped.get(row.source_key) ?? { pass: 0, review: 0, fail: 0 };
  item[row.audit.status] += 1;
  grouped.set(row.source_key, item);
}
const selected = new Set([...grouped.entries()].filter(([, result]) => result.pass === 3).map(([key]) => key));
const patterns = [[0,0,0],[1,1,1],[2,2,2],[0,1,2],[1,2,0],[2,0,1],[0,2,1],[1,0,2],[2,1,0]];
const rows = draft.filter((row) => selected.has(row.source_key)).flatMap((row) => patterns.map(([payerIndex, momentIndex, twistIndex], rotation) => ({
  id: "latin-" + row.source_key.replace(/[^a-zA-Z0-9]+/g, "-") + "-" + rotation,
  source_key: row.source_key,
  name: row.name,
  source_url: row.url,
  source_five_sentences: row.five_sentences,
  rotation,
  payer_index: payerIndex,
  moment_index: momentIndex,
  twist_index: twistIndex,
  payer: row.card_draft.payers[payerIndex],
  moment: row.card_draft.moments[momentIndex],
  twist: row.card_draft.twists[twistIndex],
  smallest_build: row.five_sentences.input + " → " + row.five_sentences.process + " → " + row.five_sentences.immediate_result,
})));
const output = path.join(root, "docs/research/idea-candidate-latin-shortlist-input-2026-07-14.jsonl");
fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ selectedCandidates: selected.size, latinRows: rows.length, output }, null, 2));
