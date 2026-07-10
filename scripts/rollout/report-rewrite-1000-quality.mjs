#!/usr/bin/env node
// Heuristic QA report for the rewritten 1,000-card golden file.
// This does not replace human review; it selects a second-pass queue.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const outPath = path.join(repoRoot, "docs/dev/experiments/card-quality/qa/rewrite-1000-quality-report.json");

const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));

const genericPatterns = [
  ["samey-front-hope", /이번엔 빨리 끝날 것 같음|이번엔 빨리 끝낼 수 있을 듯함/],
  ["samey-front-stuck", /기준이 흔들려 손이 멈춤|무엇부터 볼지 흐려짐|놓친 게 있을까 계속 불안함/],
  ["samey-build-flow", /흐름을 넣고 .*바로 공유할 수 있게 구성해줘/],
  ["generic-first-screen", /첫 화면을 만들 수 있어요/],
  ["mechanism-vague", /현재 화면 옆 즉시 판별|새 변화만 골라 요약 알림|목록 수정과 공유 흐름/],
  ["awkward-object-particle", /금액를|문의을|자료을|메모을|목록을 오늘 처리|후보를 오늘 처리|항목을 오늘 처리/],
  ["too-many-inferred", /^inferred$/],
];

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function text(card) {
  return [
    card.title,
    card.oneliner,
    card.target,
    ...(card.mvp ?? []),
    card.evidence,
    card.todayAction,
    card.buildPrompt,
    card.anchorDetail,
    card.frontStory?.persona,
    ...(card.frontStory?.timeline ?? []).flatMap((t) => [t.t, t.act, t.emo]),
    card.needSource,
    card.psychologyPrinciple,
    card.whyItMatters,
    ...(card.differentiationAxis ? Object.values(card.differentiationAxis) : []),
  ].filter(Boolean).join(" ");
}

function reasons(card) {
  const all = text(card);
  const found = [];
  for (const [name, pattern] of genericPatterns) {
    const target = name === "too-many-inferred" ? String(card.needSource ?? "") : all;
    if (pattern.test(target)) found.push(name);
  }
  if (card.oneliner && card.oneliner.length >= 66) found.push("near-oneliner-limit");
  if (card.title && card.title.length >= 24) found.push("near-title-limit");
  if (card.anchorDetail && /— .{80,}/.test(card.anchorDetail)) found.push("raw-anchor-copy");
  if (card.anchorDetail && /[A-Za-z][A-Za-z\s.,'-]{50,}/.test(card.anchorDetail)) found.push("english-anchor-copy");
  if (card.evidence && /공개 수치도 약/.test(card.evidence)) found.push("samey-evidence-phrase");
  if (card.buildPrompt && card.buildPrompt.length > 180) found.push("long-build-prompt");
  return found;
}

const items = cards.map((card, index) => {
  const r = reasons(card);
  return {
    index: index + 1,
    key: key(card),
    seed: card.seed,
    pain: card.pain,
    format: card.format,
    title: card.title,
    oneliner: card.oneliner,
    needSource: card.needSource,
    reasons: r,
    score: r.length,
  };
});

const reasonCounts = {};
for (const item of items) {
  for (const reason of item.reasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
}

const secondPass = items
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score || a.index - b.index)
  .slice(0, 250);

const summary = {
  total: cards.length,
  reviewCandidates: items.filter((item) => item.score > 0).length,
  secondPassCount: secondPass.length,
  reasonCounts: Object.fromEntries(Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])),
  secondPass,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n");

console.log(JSON.stringify({
  total: summary.total,
  reviewCandidates: summary.reviewCandidates,
  secondPassCount: summary.secondPassCount,
  reasonCounts: summary.reasonCounts,
  outPath: path.relative(repoRoot, outPath),
}, null, 2));
