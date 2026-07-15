#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const input = option("--input", "docs/research/idea-next-batch-060-input-2026-07-14.jsonl");
const output = option("--output", "docs/research/idea-next-batch-060-card-drafts-2026-07-14.jsonl");
const rows = fs.readFileSync(path.join(root, input), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const files = process.argv.slice(2).filter((arg) => !arg.startsWith("--") && arg !== input && arg !== output);
const cards = files.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")).cards ?? []);
const expected = new Set(rows.map((row) => row.source_key));
const seen = new Set();
const validText = (value, minLength = 4) => typeof value === "string" && value.trim().length >= minLength;
for (const card of cards) {
  if (!expected.has(card.source_key)) throw new Error(`Unexpected source_key: ${card.source_key}`);
  if (seen.has(card.source_key)) throw new Error(`Duplicate source_key: ${card.source_key}`);
  seen.add(card.source_key);
  for (const key of ["payers", "moments"]) {
    if (!Array.isArray(card[key]) || card[key].length !== 3) throw new Error(`${card.source_key}: invalid ${key}`);
    if (card[key].some((item) => !item || typeof item !== "object" || !validText(item.value) || !validText(item.detail, 8))) throw new Error(`${card.source_key}: invalid ${key} item`);
    if (new Set(card[key].map((item) => item.value.trim())).size !== 3) throw new Error(`${card.source_key}: duplicate ${key}`);
  }
  if (!Array.isArray(card.twists) || card.twists.length !== 3) throw new Error(`${card.source_key}: invalid twists`);
  if (card.twists.some((item) => !item || typeof item !== "object" || !validText(item.value) || !validText(item.detail, 8) || !validText(item.resultTitle) || !validText(item.smallestBuild, 12))) throw new Error(`${card.source_key}: invalid twist item`);
  if (new Set(card.twists.map((item) => item.value.trim())).size !== 3 || new Set(card.twists.map((item) => item.resultTitle.trim())).size !== 3) throw new Error(`${card.source_key}: duplicate twists`);
}
if (seen.size !== rows.length) throw new Error(`Card count ${seen.size} != batch ${rows.length}`);
const byKey = new Map(cards.map((card) => [card.source_key, card]));
const merged = rows.map((row) => ({ ...row, card_draft: byKey.get(row.source_key) }));
fs.writeFileSync(path.join(root, output), merged.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ batch: rows.length, cards: cards.length, output }, null, 2));
