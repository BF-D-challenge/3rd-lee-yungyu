#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const input = option("--input", "docs/research/idea-next-batch-060-card-drafts-2026-07-14.jsonl");
const rows = fs.readFileSync(path.join(root, input), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const patterns = [[0, 0, 0], [1, 1, 2], [2, 2, 1]];
const axis = (item) => typeof item === "string" ? { value: item, detail: "" } : item;
const outputRows = rows.flatMap((row) => patterns.map(([payerIndex, momentIndex, twistIndex], patternIndex) => {
  const payer = axis(row.card_draft.payers[payerIndex]);
  const moment = axis(row.card_draft.moments[momentIndex]);
  const twist = axis(row.card_draft.twists[twistIndex]);
  return {
    id: `next-stress-${row.source_key.replace(/[^a-zA-Z0-9]+/g, "-")}-${patternIndex}`,
    source_key: row.source_key,
    source_name: row.name,
    source_url: row.url,
    source_five_sentences: row.five_sentences,
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
    smallest_build: twist.smallestBuild ?? `${row.five_sentences.input} → ${row.five_sentences.process} → ${row.five_sentences.immediate_result}`,
  };
}));
const output = option("--output", "docs/research/idea-next-batch-060-stress-input-2026-07-14.jsonl");
fs.writeFileSync(path.join(root, output), outputRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: rows.length, rows: outputRows.length, output }, null, 2));
