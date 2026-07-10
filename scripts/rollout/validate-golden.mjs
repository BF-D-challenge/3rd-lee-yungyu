#!/usr/bin/env node
// Deterministic v7 golden-card validator — same rules used in the ai+saas pilot batch.
// Usage: node scripts/rollout/validate-golden.mjs <cards.json>
// <cards.json> = array of Golden-shaped card objects to check (does NOT need source:"v7" set yet)
// Exits 0 and prints {ok:true} if ALL cards pass; otherwise prints per-card violations and exits 1.

import fs from "node:fs";

const cardsPath = process.argv[2];
if (!cardsPath) {
  console.error("usage: node scripts/rollout/validate-golden.mjs <cards.json>");
  process.exit(1);
}

const combosPath = new URL("../../src/data/combos.json", import.meta.url);
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

const validPainIds = new Set(combos.pains.map((p) => p.id));
const validFormatIds = new Set(combos.formats.map((f) => f.id));
const blockedSeeds = new Set([
  "entertainment-face-swap-meme",
  "fintech-market-prediction-confidence",
  "fintech-auto-trade-rule-manage",
  "fintech-watchlist-news-scatter",
  "real-estate-auction-rights-check",
  "legal-freelance-contract",
  "real-estate-apt-price-tracker",
  "design-tools-chat-mockup",
  "sales-cold-email-outreach",
]);
const amountPattern = /약\s*(?:[\d,]+\s*만원|[\d,]+\s*억(?:원|\s*[\d,]+\s*만원))/;

function validateCard(card) {
  const errs = [];
  if (!card) return ["card missing"];
  if (!combos.allow[card.seed]) {
    errs.push(`unknown seed "${card.seed}"`);
  } else if (blockedSeeds.has(card.seed)) {
    errs.push(`blocked risky seed "${card.seed}"`);
  } else {
    const allow = combos.allow[card.seed];
    const pairAllowed = Array.isArray(allow.pairs) && allow.pairs.length
      ? allow.pairs.some((pair) => pair.pain === card.pain && pair.format === card.format)
      : allow.pains.includes(card.pain) && allow.formats.includes(card.format);
    if (!pairAllowed) {
      errs.push(`(seed,pain,format) not in allow[${card.seed}]`);
    }
  }
  if (!validPainIds.has(card.pain)) errs.push(`invalid pain id ${card.pain}`);
  if (!validFormatIds.has(card.format)) errs.push(`invalid format id "${card.format}"`);

  if (!card.title || card.title.length > 26) errs.push("title missing or >26 chars");
  if (!card.oneliner || card.oneliner.length > 70) errs.push("oneliner missing or >70 chars");
  if (!card.target || card.target.length > 50) errs.push("target missing or >50 chars");
  if (!Array.isArray(card.mvp) || card.mvp.length !== 4) {
    errs.push("mvp must have exactly 4 items");
  } else {
    if (card.mvp.some((m) => !m || m.length > 22)) errs.push("mvp item >22 chars");
    if (new Set(card.mvp).size !== 4) errs.push("mvp items must be distinct");
  }
  if (!card.evidence || !amountPattern.test(card.evidence)) {
    errs.push('evidence must contain amount like "약 N만원" or "약 N억 N만원"');
  }
  if (card.evidence && card.evidence.includes("$")) errs.push("evidence must not contain $ sign");
  if (!card.todayAction || !card.todayAction.startsWith("오늘 반나절")) {
    errs.push('todayAction must start with "오늘 반나절"');
  }
  if (!card.buildPrompt) errs.push("buildPrompt empty");
  if (!card.appName) errs.push("appName empty");
  if (!card.anchorName) errs.push("anchorName empty");
  if (!card.anchorDetail) errs.push("anchorDetail empty");
  if (isGenericKoreanAnchor(card.anchorName)) errs.push("anchorName looks like generic Korean category, not a source");
  if (card.evidenceType !== "revenue" && card.evidenceType !== "usage") errs.push('evidenceType must be "revenue" or "usage"');

  const blacklist = /\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b|스트릭/;
  const allText = [
    card.title,
    card.oneliner,
    card.target,
    ...(card.mvp || []),
    card.evidence,
    card.todayAction,
    card.buildPrompt,
    card.anchorDetail,
    card.whyItMatters,
    card.frontStory?.persona,
    ...(card.frontStory?.timeline ?? []).flatMap((step) => [step.t, step.act, step.emo]),
  ].join(" ");
  if (hasRawLargeManwonAmount(allText)) errs.push("large manwon amount must be formatted as 억원");
  if (maxEokAmount(allText) >= 50) errs.push("mega-scale anchor is too broad for current rollout");
  if (/선택 마비|가짜 가입 못 걸러|CORS 에러 못 읽음|복붙|아무데나|커피당번 답 대충옴|하루 어기면 다 포기|얼굴 합성|매수판단|주가예측|자동매매|투자 토론|매수·관망|위험체크|경매 입문|경매질문|계약검토|수정 요청할 조항|첫 수량 추천|매수 판단|후기처럼 보이는 채팅|스팸함 직행|재발송 순서|상품등록 노가다|AI가 노드 헛짓|첫방 카드|주의열|처음 딥워크|첫 슬롯|가게랜딩|Notion tool|앞 위로 톤|위로 톤과|두개|세개|네개|후보 링크 저장 화면|태그 붙이기 버튼|묶음 링크 공유|후보 묶음 데모|관리판 데모|피드백 받기 전에 지침/.test(allText)) {
    errs.push("awkward visible Korean phrase");
  }
  if (blacklist.test(allText)) errs.push("contains blacklisted abbreviation or 스트릭");

  if (!card.frontStory || !Array.isArray(card.frontStory.timeline) || card.frontStory.timeline.length !== 3) {
    errs.push("frontStory.timeline must have exactly 3 steps");
  } else {
    if (card.frontStory.timeline.filter((t) => t.pain).length < 1) errs.push("frontStory needs >=1 pain:true step");
    if (!card.frontStory.persona) errs.push("frontStory.persona empty");
  }
  return errs;
}

function isGenericKoreanAnchor(anchorName) {
  const name = String(anchorName ?? "").trim();
  if (!name) return false;
  return /^[가-힣\s]+$/.test(name) && /(도구|현황판|알림봇|점검표|점검판|계산기|보관함|목록|템플릿|카드|관리판|비교표|질문표)$/.test(name);
}

function hasRawLargeManwonAmount(text) {
  for (const match of String(text ?? "").matchAll(/약\s*([\d,]+)\s*만원/g)) {
    const manwon = Number(match[1].replaceAll(",", ""));
    if (Number.isFinite(manwon) && manwon >= 10000) return true;
  }
  return false;
}

function maxEokAmount(text) {
  let max = 0;
  for (const match of String(text ?? "").matchAll(/약\s*([\d,]+)\s*억원/g)) {
    const eok = Number(match[1].replaceAll(",", ""));
    if (Number.isFinite(eok)) max = Math.max(max, eok);
  }
  return max;
}

const results = cards.map((card, i) => ({ index: i, seed: card?.seed, pain: card?.pain, format: card?.format, errors: validateCard(card) }));
const failed = results.filter((r) => r.errors.length > 0);

// duplicate oneliner/title check across the whole input batch
const onelineSeen = new Map();
const titleSeen = new Map();
cards.forEach((c, i) => {
  if (c?.oneliner) {
    if (onelineSeen.has(c.oneliner)) failed.push({ index: i, seed: c.seed, errors: [`duplicate oneliner (also at index ${onelineSeen.get(c.oneliner)})`] });
    else onelineSeen.set(c.oneliner, i);
  }
  if (c?.title) {
    if (titleSeen.has(c.title)) failed.push({ index: i, seed: c.seed, errors: [`duplicate title (also at index ${titleSeen.get(c.title)})`] });
    else titleSeen.set(c.title, i);
  }
});

if (failed.length === 0) {
  console.log(JSON.stringify({ ok: true, total: cards.length }, null, 2));
  process.exit(0);
} else {
  console.log(JSON.stringify({ ok: false, total: cards.length, failedCount: failed.length, failed }, null, 2));
  process.exit(1);
}
