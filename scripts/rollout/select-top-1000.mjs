#!/usr/bin/env node
// Select the top N seed/pain/format combinations and shrink runtime data to them.
//
// This intentionally selects explicit pairs, not seed-level pains x formats
// rectangles. The selected pairs are written to combos.allow[seed].pairs.
//
// Usage:
//   node scripts/rollout/select-top-1000.mjs --target 1000 --write
//   node scripts/rollout/select-top-1000.mjs --target 1000

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
const TARGET = Number(args.target || 1000);
const WRITE = Boolean(args.write);
const MAX_PER_SEED = Number(args.maxPerSeed || 6);
const SEED_FLOOR = Number(args.seedFloor || 2);

const combosPath = path.join(repoRoot, "src/data/combos.json");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));

const painById = Object.fromEntries(combos.pains.map((p) => [p.id, p]));
const formatById = Object.fromEntries(combos.formats.map((f) => [f.id, f]));
const goldenByKey = new Map(golden.map((g) => [`${g.seed}|${g.pain}|${g.format}`, g]));
const validPainIds = new Set(combos.pains.map((p) => p.id));
const validFormatIds = new Set(combos.formats.map((f) => f.id));

const genericPains = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
const formatPriority = {
  "share-link": 100,
  "vote-card": 95,
  "calc-tool": 90,
  curation: 86,
  dashboard: 82,
  "template-gen": 78,
  chatbot: 72,
  "digest-bot": 70,
  "chrome-ext": 65,
  "crud-app": 60,
  "landing-waitlist": 58,
  "streak-tracker": 55,
};

const trackFormatBonus = {
  like: {
    "share-link": 24,
    "vote-card": 22,
    curation: 20,
    "streak-tracker": 12,
    "calc-tool": 10,
    chatbot: 6,
    dashboard: 0,
    "digest-bot": -8,
    "chrome-ext": -10,
    "crud-app": -12,
  },
  know: {
    dashboard: 24,
    "calc-tool": 22,
    "template-gen": 20,
    "digest-bot": 18,
    "crud-app": 14,
    "chrome-ext": 12,
    "share-link": 6,
    curation: 4,
    chatbot: 2,
    "vote-card": -4,
    "streak-tracker": -14,
  },
};

function seedMeta(seedId) {
  for (const [track, trackData] of Object.entries(combos.tracks)) {
    for (const category of trackData.categories) {
      const seed = category.seeds.find((s) => s.id === seedId);
      if (seed) return { track, categoryId: category.id, categoryLabel: category.label, seedLabel: seed.label };
    }
  }
  const preset = combos.presetSeeds.find((s) => s.id === seedId);
  if (preset) return { track: preset.track || "like", categoryId: "_preset", categoryLabel: "preset", seedLabel: preset.label };
  return { track: "like", categoryId: "_unknown", categoryLabel: "unknown", seedLabel: seedId };
}

function validationErrors(card) {
  const errs = [];
  if (!card) return ["missing"];
  if (!validPainIds.has(card.pain)) errs.push("bad-pain");
  if (!validFormatIds.has(card.format)) errs.push("bad-format");
  if (!card.title || card.title.length > 26) errs.push("title");
  if (!card.oneliner || card.oneliner.length > 70) errs.push("oneliner");
  if (!card.target || card.target.length > 50) errs.push("target");
  if (!Array.isArray(card.mvp) || card.mvp.length !== 4 || card.mvp.some((m) => !m || m.length > 22) || new Set(card.mvp).size !== 4) errs.push("mvp");
  if (!card.evidence || !/약\s*[\d,]+\s*만원/.test(card.evidence) || card.evidence.includes("$")) errs.push("evidence");
  if (!card.todayAction || !card.todayAction.startsWith("오늘 반나절")) errs.push("today");
  if (!card.buildPrompt) errs.push("prompt");
  if (!card.appName) errs.push("app");
  if (!card.anchorName) errs.push("anchorName");
  if (!card.anchorDetail) errs.push("anchorDetail");
  if (card.evidenceType !== "revenue" && card.evidenceType !== "usage") errs.push("evidenceType");
  const allText = [card.title, card.oneliner, card.target, ...(card.mvp || []), card.todayAction, card.buildPrompt].join(" ");
  if (/\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b|스트릭/.test(allText)) errs.push("blacklist");
  if (!card.frontStory || !Array.isArray(card.frontStory.timeline) || card.frontStory.timeline.length !== 3 || card.frontStory.timeline.filter((t) => t.pain).length < 2 || !card.frontStory.persona) errs.push("story");
  return errs;
}

function smellReasons(card) {
  const text = [card?.title, card?.oneliner, card?.target, card?.evidence, card?.todayAction, card?.buildPrompt, ...(card?.mvp ?? [])].filter(Boolean).join(" ");
  const reasons = [];
  if (/개 뒤지다|식은땀|바로 정리돼 안심/.test(text)) reasons.push("template-scene");
  if (/하다가 .*에 막히는 사람/.test(card?.target ?? "")) reasons.push("generic-target");
  if (/문제를 푸는 비슷한 해외 앱/.test(card?.evidence ?? "")) reasons.push("generic-evidence");
  if (/내용을 제목, 설명, 메모로 입력|항목을 이름, 상태, 메모로 입력|상황을 묻는 객관식 질문 4개/.test(card?.buildPrompt ?? "")) reasons.push("generic-build-prompt");
  return reasons;
}

function painSpecificity(painId) {
  const pain = painById[painId];
  if (!pain) return -100;
  const detail = (pain.label?.length || 0) + (pain.short?.length || 0);
  const directVoice = /요$|못|민망|불안|걱정|포기|지쳐|헷갈|무섭|부담|놓치|망친/.test(pain.label) ? 28 : 0;
  return (genericPains.has(painId) ? -12 : 34) + Math.min(detail, 80) + directVoice;
}

function painFormatFit(painId, formatId) {
  const pain = `${painById[painId]?.label || ""} ${painById[painId]?.short || ""}`;
  if (/선택|비교|골라|후보|추천/.test(pain)) {
    return { "calc-tool": 26, curation: 24, "vote-card": 22, dashboard: 14, "share-link": 8 }[formatId] ?? -8;
  }
  if (/동기|지속|끊기|포기|성과|진행/.test(pain)) {
    return { "streak-tracker": 26, dashboard: 20, "vote-card": 16, "share-link": 12, "calc-tool": 8 }[formatId] ?? -8;
  }
  if (/반복|수동|템플릿|체크|누락|관리|정리/.test(pain)) {
    return { "template-gen": 24, dashboard: 22, "digest-bot": 20, "crud-app": 18, "share-link": 12 }[formatId] ?? -6;
  }
  if (/물어|민망|공유|자랑|피드백|같이|친구|모임/.test(pain)) {
    return { "share-link": 26, "vote-card": 24, curation: 14, chatbot: 10 }[formatId] ?? -8;
  }
  if (/안전|위험|비용|가격|수익|정산|계산/.test(pain)) {
    return { "calc-tool": 28, dashboard: 22, "share-link": 12, curation: 10 }[formatId] ?? -8;
  }
  return 0;
}

function scoreCandidate(seed, pain, format, card) {
  const meta = seedMeta(seed);
  const smells = smellReasons(card);
  let score = 0;
  score += painSpecificity(pain);
  score += formatPriority[format] ?? 50;
  score += trackFormatBonus[meta.track]?.[format] ?? 0;
  score += painFormatFit(pain, format);
  score += card.source === "v7" ? 8 : 0;
  score += card.anchorName && !/^(S|P|generic)$/i.test(card.anchorName) ? 18 : 0;
  score += /약\s*[\d,]+\s*만원/.test(card.evidence || "") ? 12 : 0;
  score -= smells.includes("template-scene") ? 55 : 0;
  score -= smells.includes("generic-target") ? 26 : 0;
  score -= smells.includes("generic-evidence") ? 24 : 0;
  score -= smells.includes("generic-build-prompt") ? 18 : 0;
  return { score, meta, smells };
}

const candidates = [];
for (const [seed, allow] of Object.entries(combos.allow)) {
  for (const pain of allow.pains) {
    for (const format of allow.formats) {
      const card = goldenByKey.get(`${seed}|${pain}|${format}`);
      const errors = validationErrors(card);
      if (errors.length) continue;
      const scored = scoreCandidate(seed, pain, format, card);
      candidates.push({ seed, pain, format, key: `${seed}|${pain}|${format}`, card, ...scored });
    }
  }
}

candidates.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

const selected = [];
const selectedKeys = new Set();
const titleSeen = new Set();
const seedCounts = new Map();

function tryAdd(c) {
  if (selected.length >= TARGET) return false;
  if (selectedKeys.has(c.key) || titleSeen.has(c.card.title)) return false;
  const count = seedCounts.get(c.seed) ?? 0;
  if (count >= MAX_PER_SEED) return false;
  selected.push(c);
  selectedKeys.add(c.key);
  titleSeen.add(c.card.title);
  seedCounts.set(c.seed, count + 1);
  return true;
}

for (const seed of Object.keys(combos.allow)) {
  const perSeed = candidates.filter((c) => c.seed === seed).slice(0, SEED_FLOOR);
  for (const candidate of perSeed) tryAdd(candidate);
}

for (const candidate of candidates) tryAdd(candidate);

if (selected.length !== TARGET) {
  console.error(JSON.stringify({ error: `selected ${selected.length}, target ${TARGET}`, candidates: candidates.length }, null, 2));
  process.exit(1);
}

const selectedBySeed = {};
for (const item of selected) {
  const entry = selectedBySeed[item.seed] ??= { pains: new Set(), formats: new Set(), pairs: [] };
  entry.pains.add(item.pain);
  entry.formats.add(item.format);
  entry.pairs.push({ pain: item.pain, format: item.format });
}

const nextAllow = {};
for (const seed of Object.keys(combos.allow)) {
  const entry = selectedBySeed[seed];
  if (!entry) continue;
  nextAllow[seed] = {
    pains: [...entry.pains],
    formats: [...entry.formats],
    pairs: entry.pairs.sort((a, b) => a.pain - b.pain || a.format.localeCompare(b.format)),
  };
}

const nextCombos = { ...combos, version: (combos.version || 1) + 1, allow: nextAllow };
const nextGolden = selected.map((c) => c.card);

const categoryCounts = {};
const seedCountValues = {};
const smellCounts = {};
for (const item of selected) {
  categoryCounts[item.meta.categoryId] = (categoryCounts[item.meta.categoryId] ?? 0) + 1;
  seedCountValues[item.seed] = (seedCountValues[item.seed] ?? 0) + 1;
  for (const smell of item.smells) smellCounts[smell] = (smellCounts[smell] ?? 0) + 1;
}

const summary = {
  target: TARGET,
  selected: selected.length,
  seedCount: Object.keys(nextAllow).length,
  minScore: selected.at(-1)?.score,
  maxScore: selected[0]?.score,
  maxPerSeed: MAX_PER_SEED,
  seedFloor: SEED_FLOOR,
  top10: selected.slice(0, 10).map((c) => ({ key: c.key, score: c.score, title: c.card.title })),
  bottom10: selected.slice(-10).map((c) => ({ key: c.key, score: c.score, title: c.card.title })),
  smellCounts,
  largestSeeds: Object.entries(seedCountValues).sort((a, b) => b[1] - a[1]).slice(0, 12),
  largestCategories: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 12),
};

if (WRITE) {
  fs.writeFileSync(combosPath, JSON.stringify(nextCombos, null, 2) + "\n");
  fs.writeFileSync(goldenPath, JSON.stringify(nextGolden, null, 2) + "\n");
  fs.writeFileSync(path.join(repoRoot, "docs/dev/experiments/card-quality/top-1000-selection-summary.json"), JSON.stringify(summary, null, 2) + "\n");
}

console.log(JSON.stringify({ ...summary, wrote: WRITE }, null, 2));

