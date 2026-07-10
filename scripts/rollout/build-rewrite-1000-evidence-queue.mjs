#!/usr/bin/env node
// Build an evidence-strengthening queue for rewritten cards whose needSource is inferred.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const combosPath = path.join(repoRoot, "src/data/combos.json");
const outJson = path.join(repoRoot, "docs/dev/experiments/card-quality/qa/rewrite-1000-evidence-queue.json");
const outMd = path.join(repoRoot, "docs/dev/experiments/card-quality/qa/rewrite-1000-evidence-queue.md");

const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const painById = Object.fromEntries(combos.pains.map((p) => [p.id, p]));
const formatById = Object.fromEntries(combos.formats.map((f) => [f.id, f]));

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function seedMeta(seedId) {
  for (const [trackId, track] of Object.entries(combos.tracks)) {
    for (const category of track.categories) {
      const seed = category.seeds.find((s) => s.id === seedId);
      if (seed) return { track: trackId, categoryId: category.id, categoryLabel: category.label, seedLabel: seed.label };
    }
  }
  const preset = combos.presetSeeds.find((s) => s.id === seedId);
  if (preset) return { track: preset.track ?? "like", categoryId: "_preset", categoryLabel: "preset", seedLabel: preset.label };
  return { track: "_unknown", categoryId: "_unknown", categoryLabel: "unknown", seedLabel: seedId };
}

function actionFor(card) {
  const text = [card.evidence, card.anchorDetail, card.whyItMatters].filter(Boolean).join(" ");
  if (/비슷한 사용 흐름|좁은 문제를 푸는 도구/.test(text)) {
    return "anchor-fit-review";
  }
  if (/해외 사례|매출 신호/.test(text)) {
    return "source-strengthen";
  }
  return "manual-research";
}

const items = cards
  .map((card, index) => ({ card, index: index + 1, meta: seedMeta(card.seed) }))
  .filter(({ card }) => card.needSource === "inferred")
  .map(({ card, index, meta }) => ({
    index,
    key: key(card),
    seed: card.seed,
    seedLabel: meta.seedLabel,
    categoryId: meta.categoryId,
    categoryLabel: meta.categoryLabel,
    pain: card.pain,
    painLabel: painById[card.pain]?.label ?? String(card.pain),
    format: card.format,
    formatLabel: formatById[card.format]?.label ?? card.format,
    title: card.title,
    oneliner: card.oneliner,
    evidence: card.evidence,
    anchorName: card.anchorName,
    anchorDetail: card.anchorDetail,
    psychologyPrinciple: card.psychologyPrinciple,
    whyItMatters: card.whyItMatters,
    suggestedAction: actionFor(card),
    decisionOptions: ["upgrade-to-adjacent", "upgrade-to-external", "keep-inferred", "replace-anchor", "drop-candidate"],
  }));

const byAction = {};
const byCategory = {};
const byFormat = {};
for (const item of items) {
  byAction[item.suggestedAction] = (byAction[item.suggestedAction] ?? 0) + 1;
  byCategory[item.categoryLabel] = (byCategory[item.categoryLabel] ?? 0) + 1;
  byFormat[item.formatLabel] = (byFormat[item.formatLabel] ?? 0) + 1;
}

const summary = {
  total: items.length,
  byAction: Object.fromEntries(Object.entries(byAction).sort((a, b) => b[1] - a[1])),
  byCategory: Object.fromEntries(Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 20)),
  byFormat: Object.fromEntries(Object.entries(byFormat).sort((a, b) => b[1] - a[1])),
  items,
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2) + "\n");

const lines = [];
lines.push("# 1,000개 재작성 카드 근거 보강 큐");
lines.push("");
lines.push(`생성 기준: needSource가 \`inferred\`인 카드 ${items.length}개`);
lines.push("");
lines.push("## 요약");
lines.push("");
lines.push(`- 전체: ${items.length}개`);
for (const [action, count] of Object.entries(summary.byAction)) {
  lines.push(`- ${action}: ${count}개`);
}
lines.push("");
lines.push("## 우선순위 샘플 30개");
lines.push("");
lines.push("| index | key | title | action | 이유 |");
lines.push("|---:|---|---|---|---|");
for (const item of items.slice(0, 30)) {
  const why = item.suggestedAction === "anchor-fit-review"
    ? "앵커가 실제 니즈 근거라기보다 사용 흐름 유사성으로만 붙어 있음"
    : "근거 출처를 더 구체화해야 함";
  lines.push(`| ${item.index} | \`${item.key}\` | ${item.title} | ${item.suggestedAction} | ${why} |`);
}
lines.push("");
lines.push("## 처리 기준");
lines.push("");
lines.push("- `upgrade-to-adjacent`: 비슷한 시장/사용 흐름 근거가 충분하면 승격");
lines.push("- `upgrade-to-external`: 외부 리뷰, 커뮤니티 글, 검색량 등 독립 근거가 있으면 승격");
lines.push("- `keep-inferred`: 근거는 약하지만 아이디어 자체가 보존 가치 있으면 유지");
lines.push("- `replace-anchor`: 앵커가 아이디어와 맞지 않으면 교체");
lines.push("- `drop-candidate`: 근거와 아이디어가 모두 약하면 1,000개 후보에서 교체 검토");

fs.writeFileSync(outMd, lines.join("\n") + "\n");

console.log(JSON.stringify({
  ok: true,
  total: items.length,
  outJson: path.relative(repoRoot, outJson),
  outMd: path.relative(repoRoot, outMd),
  byAction: summary.byAction,
}, null, 2));
