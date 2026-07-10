#!/usr/bin/env node
// Build a rewrite queue for the current golden file.
//
// Unlike build-worklist.mjs, this does not skip source:"v7" cards. The current
// file already has full v7 coverage, but many rows are still template-quality.
//
// Usage:
//   node scripts/rollout/build-rewrite-queue.mjs --seeds running,golf --limit 40 --out rewrite.json
//   node scripts/rollout/build-rewrite-queue.mjs --all --chunk 20 --out rewrite.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    out[key] = val;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const outPath = args.out ? path.resolve(process.cwd(), args.out) : path.join(repoRoot, "rewrite-queue.json");
const limit = args.limit ? Number(args.limit) : Infinity;
const chunkSize = args.chunk ? Number(args.chunk) : 20;

const combos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/golden.json"), "utf8"));

const painById = Object.fromEntries(combos.pains.map((p) => [p.id, p]));
const formatById = Object.fromEntries(combos.formats.map((f) => [f.id, f]));
const goldenByKey = new Map(golden.map((g) => [`${g.seed}|${g.pain}|${g.format}`, g]));

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

let targetSeeds;
if (args.seeds) {
  targetSeeds = String(args.seeds).split(",").filter(Boolean);
} else if (args.all) {
  targetSeeds = Object.keys(combos.allow);
} else {
  console.error("pass --seeds seed1,seed2 or --all");
  process.exit(1);
}

const items = [];
for (const seed of targetSeeds) {
  const allow = combos.allow[seed];
  if (!allow) continue;
  const meta = seedMeta(seed);
  for (const pain of allow.pains) {
    for (const format of allow.formats) {
      const key = `${seed}|${pain}|${format}`;
      const current = goldenByKey.get(key);
      const reasons = smellReasons(current);
      items.push({
        key,
        seed,
        seedLabel: meta.seedLabel,
        track: meta.track,
        categoryId: meta.categoryId,
        categoryLabel: meta.categoryLabel,
        pain,
        painLabel: painById[pain]?.label,
        painShort: painById[pain]?.short,
        format,
        formatLabel: formatById[format]?.label,
        formatDesc: formatById[format]?.desc,
        formatAction: formatById[format]?.action,
        rewriteReasons: reasons,
        current: current ? {
          title: current.title,
          oneliner: current.oneliner,
          target: current.target,
          evidence: current.evidence,
          anchorName: current.anchorName,
        } : null,
      });
    }
  }
}

const sorted = items.sort((a, b) => {
  const ar = a.rewriteReasons.length;
  const br = b.rewriteReasons.length;
  if (br !== ar) return br - ar;
  return a.key.localeCompare(b.key);
}).slice(0, limit);

const chunks = [];
for (let i = 0; i < sorted.length; i += chunkSize) {
  chunks.push({ index: chunks.length + 1, items: sorted.slice(i, i + chunkSize) });
}

fs.writeFileSync(outPath, JSON.stringify({ total: sorted.length, chunkSize, chunks }, null, 2) + "\n");

const reasonCounts = {};
for (const item of items) {
  for (const reason of item.rewriteReasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
}

console.log(JSON.stringify({
  scanned: items.length,
  queued: sorted.length,
  chunks: chunks.length,
  outPath,
  reasonCounts,
}, null, 2));

