#!/usr/bin/env node
// Apply safe systemic QA fixes to the rewritten 1,000-card golden file.
// Scope: remove raw English anchor tails, fix common Korean particle glitches,
// and reduce repeated frontStory emotion boilerplate.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const baseDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");

const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));

const hopeEmotions = [
  "오늘은 기준이 보일 것 같아 기대함",
  "쌓인 판단을 줄일 수 있을 것 같음",
  "이번엔 덜 헤맬 것 같아 마음이 놓임",
  "자료를 펼치며 금방 끝낼 수 있길 바람",
  "처음엔 정리할 수 있을 것 같아 안심함",
];

const stuckEmotions = [
  "어느 쪽을 믿어야 할지 흐려짐",
  "방금 본 기준도 다시 의심됨",
  "다음 행동을 정하지 못해 멈칫함",
  "말로 설명하려니 기준이 흩어짐",
  "혼자 판단하기엔 근거가 부족해짐",
];

const lateEmotions = [
  "다음에도 같은 설명을 반복할까 답답함",
  "놓친 근거가 있을까 계속 신경 쓰임",
  "공유 직전에 다시 확인하느라 지침",
  "결정이 늦어져 다음 일이 밀리는 느낌",
  "기록 없이 넘기면 또 헷갈릴 것 같음",
];

const replacements = [
  [/문의을/g, "문의를"],
  [/금액를/g, "금액을"],
  [/후보를 오늘 처리/g, "후보를 오늘 안에 처리"],
  [/항목을 오늘 처리/g, "항목을 오늘 안에 처리"],
  [/자료을/g, "자료를"],
  [/메모을/g, "메모를"],
  [/목록을 오늘 처리/g, "목록을 오늘 안에 처리"],
  [/입력, /g, "입력하고 "],
];

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function amountFrom(card) {
  const source = [card.evidence, card.anchorDetail].filter(Boolean).join(" ");
  const match = source.match(/약\s*[\d,]+\s*만원/);
  return match?.[0] ?? "약 0만원";
}

function cleanText(value) {
  if (typeof value !== "string") return value;
  let next = value;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

function walkText(value) {
  if (Array.isArray(value)) return value.map(walkText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walkText(v)]));
  }
  return cleanText(value);
}

let changed = 0;
const samples = [];

const next = cards.map((raw, index) => {
  const before = JSON.stringify(raw);
  let card = walkText(raw);

  const amount = amountFrom(card);
  if (card.anchorName && card.anchorDetail && /— .{20,}/.test(card.anchorDetail)) {
    card.anchorDetail = `${card.anchorName}: 비슷한 사용 흐름에 돈을 내는 해외 사례, 월매출 ${amount}.`;
  }

  if (card.frontStory?.timeline?.length === 3) {
    const first = card.frontStory.timeline[0];
    const second = card.frontStory.timeline[1];
    const third = card.frontStory.timeline[2];
    if (/이번엔 빨리 끝날 것 같음|이번엔 빨리 끝낼 수 있을 듯함/.test(first.emo ?? "")) {
      first.emo = hopeEmotions[index % hopeEmotions.length];
    }
    if (/기준이 흔들려 손이 멈춤|무엇부터 볼지 흐려짐/.test(second.emo ?? "")) {
      second.emo = stuckEmotions[index % stuckEmotions.length];
    }
    if (/놓친 게 있을까 계속 불안함|다음에도 같은 일이 반복될까 답답함/.test(third.emo ?? "")) {
      third.emo = lateEmotions[index % lateEmotions.length];
    }
  }

  if (JSON.stringify(card) !== before) {
    changed++;
    if (samples.length < 10) samples.push({ index: index + 1, key: key(card), title: card.title });
  }
  return card;
});

const backupPath = path.join(baseDir, `golden-before-systemic-qa-${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(cards, null, 2) + "\n");
fs.writeFileSync(goldenPath, JSON.stringify(next, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  changed,
  total: next.length,
  backupPath: path.relative(repoRoot, backupPath),
  samples,
}, null, 2));
