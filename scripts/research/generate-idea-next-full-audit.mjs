#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name, fallback = null) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const readJsonl = (file) => fs.readFileSync(path.resolve(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const cardsPath = option("--cards");
const latinPath = option("--latin");
const outputPath = option("--output");
if (!cardsPath || !latinPath || !outputPath) throw new Error("Usage: --cards <merged cards JSONL> --latin <Latin results JSONL> --output <full input JSONL>");

const cards = readJsonl(cardsPath);
const latin = readJsonl(latinPath);
const axis = (item) => typeof item === "string" ? { value: item, detail: "" } : item;
const stats = new Map();
for (const row of latin) {
  const item = stats.get(row.source_key) ?? { pass: 0, review: 0, fail: 0 };
  item[row.audit?.status] += 1;
  stats.set(row.source_key, item);
}
const selected = new Set([...stats.entries()].filter(([, item]) => item.pass === 9 && item.review === 0 && item.fail === 0).map(([key]) => key));
const rows = [];
for (const card of cards) {
  if (!selected.has(card.source_key)) continue;
  for (let payerIndex = 0; payerIndex < 3; payerIndex += 1) {
    for (let momentIndex = 0; momentIndex < 3; momentIndex += 1) {
      for (let twistIndex = 0; twistIndex < 3; twistIndex += 1) {
        const payer = axis(card.card_draft.payers[payerIndex]);
        const moment = axis(card.card_draft.moments[momentIndex]);
        const twist = axis(card.card_draft.twists[twistIndex]);
        rows.push({
          id: `next-full-${card.source_key.replace(/[^a-zA-Z0-9]+/g, "-")}-${payerIndex}${momentIndex}${twistIndex}`,
          source_key: card.source_key,
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
}
fs.mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true });
fs.writeFileSync(path.resolve(root, outputPath), rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""));
console.log(JSON.stringify({ selectedCandidates: selected.size, fullRows: rows.length, output: outputPath }, null, 2));
