#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const full = readJsonl("docs/research/idea-candidate-full-audit-results-2026-07-14.jsonl");
const drafts = readJsonl("docs/research/idea-candidate-deep-audit-card-drafts-2026-07-14.jsonl");
const stats = new Map();
for (const row of full) {
  const item = stats.get(row.source_key) ?? { pass: 0, review: 0, fail: 0 };
  item[row.audit.status] += 1;
  stats.set(row.source_key, item);
}
const keys = [...stats.entries()]
  .filter(([, item]) => item.fail === 0 && item.review > 0)
  .map(([key]) => key);
const selected = new Set(keys);
const rotations = [
  [0, 0, 0], [0, 1, 1], [0, 2, 2],
  [1, 0, 1], [1, 1, 2], [1, 2, 0],
  [2, 0, 2], [2, 1, 0], [2, 2, 1],
  [0, 0, 1], [0, 1, 2], [0, 2, 0],
  [1, 0, 2], [1, 1, 0], [1, 2, 1],
  [2, 0, 0], [2, 1, 1], [2, 2, 2],
];
const rows = [];
for (const source of drafts.filter((row) => selected.has(row.source_key))) {
  for (let index = 0; index < rotations.length; index += 1) {
    const [payerIndex, momentIndex, twistIndex] = rotations[index];
    rows.push({
      id: `rerun-${source.source_key.replace(/[^a-zA-Z0-9]+/g, "-")}-${index}`,
      source_key: source.source_key,
      name: source.name,
      source_url: source.url,
      source_five_sentences: source.five_sentences,
      rotation: index,
      payer_index: payerIndex,
      moment_index: momentIndex,
      twist_index: twistIndex,
      payer: source.card_draft.payers[payerIndex],
      moment: source.card_draft.moments[momentIndex],
      twist: source.card_draft.twists[twistIndex],
      smallest_build: `${source.five_sentences.input} → ${source.five_sentences.process} → ${source.five_sentences.immediate_result}`,
    });
  }
}
const output = path.join(root, "docs/research/idea-candidate-review-rerun-input-2026-07-14.jsonl");
fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ keys, candidates: keys.length, rows: rows.length, output }, null, 2));
