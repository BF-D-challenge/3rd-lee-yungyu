#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const stress = read(option("--stress", "docs/research/idea-next-batch-060-stress-results-2026-07-14.jsonl"));
const cards = new Map(read(option("--cards", "docs/research/idea-next-batch-060-card-drafts-2026-07-14.jsonl")).map((row) => [row.source_key, row]));
const axis = (item) => typeof item === "string" ? { value: item, detail: "" } : item;
const stats = new Map();
for (const row of stress) {
  const item = stats.get(row.source_key) ?? { pass: 0, review: 0, fail: 0 };
  item[row.audit.status] += 1;
  stats.set(row.source_key, item);
}
const keys = [...stats.entries()].filter(([, item]) => item.pass === 3).map(([key]) => key);
const rows = [];
for (const key of keys) {
  const card = cards.get(key);
  for (let payerIndex = 0; payerIndex < 3; payerIndex += 1) {
    for (let momentIndex = 0; momentIndex < 3; momentIndex += 1) {
      const twistIndex = (payerIndex + momentIndex) % 3;
      const payer = axis(card.card_draft.payers[payerIndex]);
      const moment = axis(card.card_draft.moments[momentIndex]);
      const twist = axis(card.card_draft.twists[twistIndex]);
      rows.push({
        id: `next-latin-${key.replace(/[^a-zA-Z0-9]+/g, "-")}-${payerIndex}${momentIndex}${twistIndex}`,
        source_key: key,
        source_name: card.name,
        source_url: card.url,
        source_five_sentences: card.five_sentences,
        payer_index: payerIndex,
        moment_index: momentIndex,
        twist_index: twistIndex,
        payer: payer.value,
        payer_detail: payer.detail,
        moment: moment.value,
        moment_detail: moment.detail,
        twist: twist.value,
        twist_detail: twist.detail,
        result_title: twist.resultTitle ?? twist.value,
        smallest_build: twist.smallestBuild ?? `${card.five_sentences.input} → ${card.five_sentences.process} → ${card.five_sentences.immediate_result}`,
      });
    }
  }
}
const output = option("--output", "docs/research/idea-next-batch-060-latin-input-2026-07-14.jsonl");
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: keys.length, rows: rows.length, keys, output }, null, 2));
