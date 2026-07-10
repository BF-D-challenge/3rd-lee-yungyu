#!/usr/bin/env node
// Build four rewrite input batches from the exact current 1,000-card golden file.
// This intentionally reads public/data/golden.json instead of expanding
// combos.allow, because allow may contain more pairs than the selected top 1,000.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const outDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000/inputs");

const combos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/golden.json"), "utf8"));

const painById = Object.fromEntries(combos.pains.map((p) => [p.id, p]));
const formatById = Object.fromEntries(combos.formats.map((f) => [f.id, f]));

function seedMeta(seedId) {
  for (const [trackId, track] of Object.entries(combos.tracks)) {
    for (const category of track.categories) {
      const seed = category.seeds.find((s) => s.id === seedId);
      if (seed) {
        return {
          track: trackId,
          categoryId: category.id,
          categoryLabel: category.label,
          seedLabel: seed.label,
        };
      }
    }
  }
  const preset = combos.presetSeeds.find((s) => s.id === seedId);
  if (preset) {
    return {
      track: preset.track ?? "like",
      categoryId: "_preset",
      categoryLabel: "preset",
      seedLabel: preset.label,
    };
  }
  return {
    track: "like",
    categoryId: "_unknown",
    categoryLabel: "unknown",
    seedLabel: seedId,
  };
}

function smellReasons(card) {
  const text = [
    card?.title,
    card?.oneliner,
    card?.target,
    card?.evidence,
    card?.todayAction,
    card?.buildPrompt,
    ...(card?.mvp ?? []),
  ].filter(Boolean).join(" ");

  const reasons = [];
  if (/개 뒤지다|식은땀|바로 정리돼 안심/.test(text)) reasons.push("template-scene");
  if (/하다가 .*에 막히는 사람/.test(card?.target ?? "")) reasons.push("generic-target");
  if (/문제를 푸는 비슷한 해외 앱/.test(card?.evidence ?? "")) reasons.push("generic-evidence");
  if (/내용을 제목, 설명, 메모로 입력|항목을 이름, 상태, 메모로 입력|상황을 묻는 객관식 질문 4개/.test(card?.buildPrompt ?? "")) reasons.push("generic-build-prompt");
  if (!card?.anchorName || !card?.anchorDetail || !card?.evidenceType) reasons.push("missing-anchor-meta");
  if (/\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b|스트릭/.test(text)) reasons.push("banned-term");
  return reasons;
}

const lanes = [
  { id: "B", file: "lane-B-001-250.input.json", start: 0, end: 250 },
  { id: "C", file: "lane-C-251-500.input.json", start: 250, end: 500 },
  { id: "D", file: "lane-D-501-750.input.json", start: 500, end: 750 },
  { id: "E", file: "lane-E-751-1000.input.json", start: 750, end: 1000 },
];

fs.mkdirSync(outDir, { recursive: true });

const keySeen = new Set();
const enriched = golden.map((card, index) => {
  const key = `${card.seed}|${card.pain}|${card.format}`;
  if (keySeen.has(key)) throw new Error(`duplicate golden key: ${key}`);
  keySeen.add(key);
  const meta = seedMeta(card.seed);
  return {
    index: index + 1,
    key,
    seed: card.seed,
    seedLabel: meta.seedLabel,
    track: meta.track,
    categoryId: meta.categoryId,
    categoryLabel: meta.categoryLabel,
    pain: card.pain,
    painLabel: painById[card.pain]?.label,
    painShort: painById[card.pain]?.short,
    format: card.format,
    formatLabel: formatById[card.format]?.label,
    formatDesc: formatById[card.format]?.desc,
    formatAction: formatById[card.format]?.action,
    rewriteReasons: smellReasons(card),
    current: card,
  };
});

const summaries = [];
for (const lane of lanes) {
  const items = enriched.slice(lane.start, lane.end);
  const reasonCounts = {};
  for (const item of items) {
    for (const reason of item.rewriteReasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  }
  const payload = {
    lane: lane.id,
    range: `${lane.start + 1}-${lane.end}`,
    total: items.length,
    outputPath: `scripts/rollout/manual-batches/rewrite-1000/outputs/lane-${lane.id}-${String(lane.start + 1).padStart(3, "0")}-${lane.end}.json`,
    rules: {
      mustRewriteAllCards: true,
      preserveKeys: ["seed", "pain", "format", "evidenceType", "anchorName", "anchorDetail"],
      requiredNewFields: ["needSource", "psychologyPrinciple", "whyItMatters", "differentiationAxis"],
      hardNo: ["N개 뒤지다", "식은땀", "{seed} 하다가 {pain}에 막히는 사람", "스트릭", "generic tracker", "generic checklist"],
    },
    items,
  };
  fs.writeFileSync(path.join(outDir, lane.file), JSON.stringify(payload, null, 2) + "\n");
  summaries.push({
    lane: lane.id,
    range: payload.range,
    inputPath: `scripts/rollout/manual-batches/rewrite-1000/inputs/${lane.file}`,
    outputPath: payload.outputPath,
    total: items.length,
    reasonCounts,
  });
}

fs.writeFileSync(
  path.join(outDir, "summary.json"),
  JSON.stringify({ total: golden.length, lanes: summaries }, null, 2) + "\n",
);

console.log(JSON.stringify({ total: golden.length, outDir, lanes: summaries }, null, 2));
