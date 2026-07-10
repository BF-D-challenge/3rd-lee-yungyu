#!/usr/bin/env node
// Polish residual QA smells after the 1,000-card rewrite.
// Scope: concrete text smells only. Do not change seed/pain/format keys.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const backupDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");

const onelinerFixes = new Map([
  [
    "design-tools-idea-to-ui|30|crud-app",
    "컴포넌트 수정 때마다 화면을 다시 그리는 디자이너에게 재작업 기준을 남기는 운영판",
  ],
  [
    "youtube|77|digest-bot",
    "요리 영상을 멈춘 학습자에게 리뷰 대신 다음 행동만 남기는 요약 알림",
  ],
  [
    "social-media-unfollow-tracker|32|digest-bot",
    "팔로워 수가 흔들린 밤, 가짜 가입과 진짜 참여를 나눠주는 요약 알림",
  ],
  [
    "live-commerce|59|landing-waitlist",
    "방송 한 시간 전 예약자가 안 들어올 때, 노쇼 확인을 먼저 받는 예약 페이지",
  ],
  [
    "community-comment-widget|32|chrome-ext",
    "댓글이 몰린 밤, 가짜 가입과 진짜 참여를 현재 페이지 옆에서 나누는 버튼",
  ],
]);

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function amountFrom(card) {
  const source = [card.evidence, card.anchorDetail].filter(Boolean).join(" ");
  return source.match(/약\s*[\d,]+\s*만원/)?.[0] ?? "약 0만원";
}

function cleanAnchorDetail(card) {
  if (!card.anchorDetail) return false;
  if (!/[A-Za-z][A-Za-z\s.,'-]{50,}/.test(card.anchorDetail)) return false;
  card.anchorDetail = `${card.anchorName}: 비슷한 사용 흐름에 돈을 내는 해외 사례, 월매출 ${amountFrom(card)}.`;
  return true;
}

function polishDigestBot(card) {
  let changed = false;
  if (card.evidence?.includes("새 변화만 골라 요약 알림으로 보내는 방식을 제품화한 해외 사례가 매달")) {
    card.evidence = `${card.anchorName}처럼 새로 확인할 항목을 따로 골라 알려주는 작은 도구도 매달 ${amountFrom(card)} 규모의 매출 신호가 있어요.`;
    changed = true;
  }
  if (card.oneliner?.includes("변화만 세 줄로 보내는 알림봇")) {
    card.oneliner = card.oneliner.replace("변화만 세 줄로 보내는 알림봇", "새로 봐야 할 항목만 추려 보내는 알림봇");
    changed = true;
  }
  if (card.buildPrompt?.includes("새로 들어온 내용만 모아 세 줄 요약으로 보여주는 알림 화면")) {
    card.buildPrompt = card.buildPrompt.replace(
      "새로 들어온 내용만 모아 세 줄 요약으로 보여주는 알림 화면",
      "새로 확인할 항목과 놓치면 안 되는 이유를 나눠 보여주는 알림 화면",
    );
    changed = true;
  }
  if (card.differentiationAxis?.outputShape?.startsWith("변화 알림봇 - ")) {
    const subject = card.differentiationAxis.outputShape.replace("변화 알림봇 - ", "");
    card.differentiationAxis.outputShape = `${subject} 우선 알림봇`;
    changed = true;
  }
  if (card.differentiationAxis?.anchorMechanism === "새 변화만 골라 요약 알림으로 보내는 방식") {
    card.differentiationAxis.anchorMechanism = "새로 확인할 항목과 이유를 분리해 알림";
    changed = true;
  }
  return changed;
}

const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
let changed = 0;
const samples = [];

for (const card of cards) {
  const before = JSON.stringify(card);
  const k = key(card);

  if (onelinerFixes.has(k)) {
    card.oneliner = onelinerFixes.get(k);
  }
  cleanAnchorDetail(card);
  polishDigestBot(card);

  if (JSON.stringify(card) !== before) {
    changed++;
    if (samples.length < 12) samples.push({ key: k, title: card.title, oneliner: card.oneliner });
  }
}

const backupPath = path.join(backupDir, `golden-before-qa-polish-${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(JSON.parse(fs.readFileSync(goldenPath, "utf8")), null, 2) + "\n");
fs.writeFileSync(goldenPath, JSON.stringify(cards, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  changed,
  total: cards.length,
  backupPath: path.relative(repoRoot, backupPath),
  samples,
}, null, 2));
