#!/usr/bin/env node
// Normalize display names after quality filtering.
//
// This does not rewrite the idea content. It fixes the generated display fields
// so result cards and share previews do not show dense machine-made compounds
// like "이슈순위보고순위탭".

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const combosPath = path.join(repoRoot, "src/data/combos.json");
const goldenPath = path.join(repoRoot, "public/data/golden.json");

const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));

const seedLabels = new Map();
for (const track of ["like", "know"]) {
  for (const category of combos.tracks[track].categories) {
    for (const seed of category.seeds) seedLabels.set(seed.id, seed.label);
  }
}
for (const seed of combos.presetSeeds ?? []) seedLabels.set(seed.id, seed.label);

const painShorts = new Map(combos.pains.map((pain) => [pain.id, pain.short]));
const formatShorts = new Map(combos.formats.map((format) => [format.id, format.short]));
const displayFormatShort = (formatId) => {
  const short = formatShorts.get(formatId) ?? formatId;
  if (formatId === "crud-app" || short === "CRUD") return "관리판";
  return short;
};

const graphemes = (value) => Array.from(String(value ?? ""));
const len = (value) => graphemes(value).length;

function compactSpaces(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function shorten(value, max) {
  const text = compactSpaces(value);
  if (len(text) <= max) return text;
  return graphemes(text).slice(0, max).join("");
}

function readableAppName(card) {
  const current = compactSpaces(card.appName);
  if (current && !isDenseGeneratedName(current) && !/\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b|스트릭/.test(current)) {
    return current;
  }
  const seedLabel = seedLabels.get(card.seed) ?? card.seed;
  const formatShort = displayFormatShort(card.format);
  const full = compactSpaces(`${seedLabel} ${formatShort}`);
  if (len(full) <= 18) return full;
  return compactSpaces(`${shorten(seedLabel, 11)} ${formatShort}`);
}

function isDenseGeneratedName(value) {
  return !/\s/.test(value) && /[가-힣]{9,}/.test(value);
}

function readableTitle(card, appName, index) {
  const current = compactSpaces(card.title);
  const titleNeedsRewrite =
    !current ||
    current === appName ||
    len(current) > 26 ||
    isDenseGeneratedName(current) ||
    /\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b|스트릭/.test(current);
  if (!titleNeedsRewrite && current.includes("—")) return current;

  const painShort = painShorts.get(card.pain) ?? String(card.pain);
  const candidates = [
    `${appName} — ${painShort}`,
    `${shorten(appName, 16)} — ${painShort}`,
    `${shorten(appName, 14)} — ${shorten(painShort, 7)}`,
    `${shorten(appName, 12)} — ${shorten(painShort, 5)}${index % 10}`,
  ];
  return candidates.find((candidate) => len(candidate) <= 26) ?? shorten(candidates.at(-1), 26);
}

const seenTitles = new Set();
const normalized = golden.map((card, index) => {
  const appName = readableAppName(card);
  let title = readableTitle(card, appName, index);
  let guard = 0;
  while (seenTitles.has(title) && guard < 10) {
    title = readableTitle(card, `${appName} ${guard + 1}`, index);
    guard += 1;
  }
  seenTitles.add(title);
  return { ...card, title, appName };
});

fs.writeFileSync(goldenPath, `${JSON.stringify(normalized, null, 2)}\n`);

const dense = normalized.filter((card) => !/\s/.test(card.appName) && /[가-힣]{9,}/.test(card.appName));
console.log(JSON.stringify({
  total: normalized.length,
  denseAppNames: dense.length,
  duplicateTitles: normalized.length - new Set(normalized.map((card) => card.title)).size,
  sample: normalized.slice(0, 8).map((card) => ({ appName: card.appName, title: card.title })),
}, null, 2));
