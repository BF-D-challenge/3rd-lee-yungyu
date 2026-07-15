#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const draft = fs.readFileSync(path.join(root, "docs/research/idea-candidate-deep-audit-card-drafts-2026-07-14.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const latin = fs.readFileSync(path.join(root, "docs/research/idea-candidate-latin-shortlist-results-2026-07-14.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const grouped = new Map();
for (const row of latin) {
  const item = grouped.get(row.source_key) ?? { pass: 0, review: 0, fail: 0 };
  item[row.audit.status] += 1;
  grouped.set(row.source_key, item);
}
const selected = new Set([...grouped.entries()].filter(([, result]) => result.pass === 9).map(([key]) => key));
const rows = draft.filter((row) => selected.has(row.source_key)).flatMap((row) => {
  const result = [];
  for (let payerIndex = 0; payerIndex < 3; payerIndex += 1) {
    for (let momentIndex = 0; momentIndex < 3; momentIndex += 1) {
      for (let twistIndex = 0; twistIndex < 3; twistIndex += 1) {
        const rotation = payerIndex * 9 + momentIndex * 3 + twistIndex;
        result.push({
          id: "full-" + row.source_key.replace(/[^a-zA-Z0-9]+/g, "-") + "-" + rotation,
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
        });
      }
    }
  }
  return result;
});
const output = path.join(root, "docs/research/idea-candidate-full-audit-input-2026-07-14.jsonl");
fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ selectedCandidates: selected.size, fullRows: rows.length, output }, null, 2));
