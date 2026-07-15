#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-candidate-deep-audit-shortlist-2026-07-14.jsonl");
const inputs = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const files = process.argv.slice(2);
if (!files.length) throw new Error("Pass card draft JSON files");
const cards = files.flatMap((file) => {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(data.cards)) throw new Error(file + ": missing cards");
  return data.cards;
});
const expected = new Set(inputs.map((row) => row.source_key));
const seen = new Set();
for (const card of cards) {
  if (seen.has(card.source_key)) throw new Error("Duplicate source_key: " + card.source_key);
  seen.add(card.source_key);
  if (!expected.has(card.source_key)) throw new Error("Unexpected source_key: " + card.source_key);
  for (const key of ["payers", "moments", "twists"]) {
    if (!Array.isArray(card[key]) || card[key].length !== 3 || card[key].some((value) => typeof value !== "string" || value.trim().length < 4)) {
      throw new Error(card.source_key + ": " + key + " must contain 3 concrete strings");
    }
    if (new Set(card[key]).size !== 3) throw new Error(card.source_key + ": duplicate " + key);
  }
}
if (cards.length !== inputs.length) throw new Error("Card count " + cards.length + " != shortlist count " + inputs.length);
const byKey = new Map(cards.map((card) => [card.source_key, card]));
const merged = inputs.map((row) => ({ ...row, card_draft: byKey.get(row.source_key) }));
const output = path.join(root, "docs/research/idea-candidate-deep-audit-card-drafts-2026-07-14.jsonl");
fs.writeFileSync(output, merged.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ shortlist: inputs.length, cards: cards.length, output }, null, 2));
