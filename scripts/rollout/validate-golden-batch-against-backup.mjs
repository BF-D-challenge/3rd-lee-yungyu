#!/usr/bin/env node
// Validate a rewrite batch against a backup allowlist.
//
// Use this for expansion batches after src/data/combos.json has been narrowed.
// It validates the Golden shape with the current metadata tables, but checks
// seed/pain/format membership against a provided backup combos.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const batchPath = process.argv[2];
const backupPath = process.argv[3] ?? path.join(
  repoRoot,
  "scripts/rollout/manual-batches/rewrite-1000/combos-before-human-fit-1783625815568.json",
);

if (!batchPath) {
  console.error("usage: node scripts/rollout/validate-golden-batch-against-backup.mjs <batch.json> [backup-combos.json]");
  process.exit(1);
}

const currentCombos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const backupCombos = JSON.parse(fs.readFileSync(path.isAbsolute(backupPath) ? backupPath : path.join(repoRoot, backupPath), "utf8"));
const cards = JSON.parse(fs.readFileSync(path.isAbsolute(batchPath) ? batchPath : path.join(repoRoot, batchPath), "utf8"));

const validPainIds = new Set(currentCombos.pains.map((pain) => pain.id));
const validFormatIds = new Set(currentCombos.formats.map((format) => format.id));
const amountPattern = /약\s*(?:[\d,]+\s*만원|[\d,]+\s*억(?:원|\s*[\d,]+\s*만원))/;
const badPattern =
  /축구|전술|football|출처을|주제을|메시지을|문구을|공고을|자세을|서비스을|오류을|소재을|컴포넌트을|리드을|후보을|근거을|키워드을|경비을|신호을|신호 신호|투표카드으로|공유링크으로|문안틀으로|진단툴으로|진단기으로|대시보드으로|관리표으로|크루장가|취준생가|지원자관리.*발주|후보 후보|결과 카드 저장 결과|샘플 5개|DevSuite|AppGrowKit|월매출 약 68만원|매달 약 68만원|반복 해결이에요|오늘 처리하려고 열어봄|기준이 없어 손이 멈춤|다시 사람 기억에 기대려 함|공유 직전에 다시 확인하느라 지침|단계을|성공배|초안사람결|대시보 —|반응 버튼 열기|띄우기 확인|결과 이미지 저장|후보 카드 만들기부터 결과 이미지 저장|도메인 규칙 저장 결과/i;

const visibleText = (card) =>
  [
    card.appName,
    card.title,
    card.oneliner,
    card.target,
    ...(card.mvp ?? []),
    card.evidence,
    card.todayAction,
    card.buildPrompt,
    card.frontStory?.persona,
    ...(card.frontStory?.timeline ?? []).flatMap((step) => [step.t, step.act, step.emo]),
  ].filter(Boolean).join(" ");

function pairAllowed(allow, card) {
  if (!allow) return false;
  if (Array.isArray(allow.pairs) && allow.pairs.length) {
    return allow.pairs.some((pair) => pair.pain === card.pain && pair.format === card.format);
  }
  return allow.pains?.includes(card.pain) && allow.formats?.includes(card.format);
}

function validateCard(card) {
  const errors = [];
  if (!card) return ["card missing"];

  if (!pairAllowed(backupCombos.allow?.[card.seed], card)) {
    errors.push(`not in backup allow "${card.seed}|${card.pain}|${card.format}"`);
  }
  if (!validPainIds.has(card.pain)) errors.push(`invalid pain id ${card.pain}`);
  if (!validFormatIds.has(card.format)) errors.push(`invalid format id "${card.format}"`);
  if (!card.title || card.title.length > 26) errors.push("title missing or >26 chars");
  if (!card.oneliner || card.oneliner.length > 70) errors.push("oneliner missing or >70 chars");
  if (!card.target || card.target.length > 50) errors.push("target missing or >50 chars");
  if (!Array.isArray(card.mvp) || card.mvp.length !== 4) errors.push("mvp must have exactly 4 items");
  else {
    if (card.mvp.some((item) => !item || item.length > 22)) errors.push("mvp item >22 chars");
    if (new Set(card.mvp).size !== 4) errors.push("mvp items must be distinct");
  }
  if (!card.evidence || !amountPattern.test(card.evidence)) {
    errors.push('evidence must contain amount like "약 N만원" or "약 N억 N만원"');
  }
  if (card.evidence?.includes("$")) errors.push("evidence must not contain $ sign");
  if (!card.todayAction?.startsWith("오늘 반나절")) errors.push('todayAction must start with "오늘 반나절"');
  if (!card.buildPrompt) errors.push("buildPrompt empty");
  if (!card.appName) errors.push("appName empty");
  if (!card.anchorName) errors.push("anchorName empty");
  if (!card.anchorDetail) errors.push("anchorDetail empty");
  if (isGenericKoreanAnchor(card.anchorName)) errors.push("anchorName looks like generic Korean category, not a source");
  if (hasRawLargeManwonAmount(visibleText(card))) errors.push("large manwon amount must be formatted as 억원");
  if (maxEokAmount(visibleText(card)) >= 50) errors.push("mega-scale anchor is too broad for current rollout");
  if (/앞 위로 톤|위로 톤과|두개|세개|네개|후보 링크 저장 화면|태그 붙이기 버튼|묶음 링크 공유|후보 묶음 데모|관리판 데모/.test(visibleText(card))) {
    errors.push("awkward visible Korean phrase");
  }
  if (card.evidenceType !== "revenue" && card.evidenceType !== "usage") errors.push('evidenceType must be "revenue" or "usage"');
  if (card.needSource === "inferred") errors.push("needSource inferred blocked");
  if (badPattern.test(visibleText(card))) errors.push("visible smell pattern");

  const blacklist = /\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b|스트릭/;
  const text = visibleText(card);
  if (blacklist.test(text)) errors.push("contains blacklisted abbreviation");
  if (card.appName && !/\s/.test(card.appName) && /[가-힣]{9,}/.test(card.appName)) errors.push("dense appName");
  return errors;
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

const seenKeys = new Map();
const seenTitles = new Map();
const failed = [];

cards.forEach((card, index) => {
  const errors = validateCard(card);
  const key = `${card?.seed}|${card?.pain}|${card?.format}`;
  if (seenKeys.has(key)) errors.push(`duplicate key also at ${seenKeys.get(key)}`);
  else seenKeys.set(key, index);
  if (card?.title) {
    if (seenTitles.has(card.title)) errors.push(`duplicate title also at ${seenTitles.get(card.title)}`);
    else seenTitles.set(card.title, index);
  }
  if (errors.length) failed.push({ index, key, appName: card?.appName, errors });
});

const result = {
  ok: failed.length === 0,
  total: cards.length,
  failedCount: failed.length,
  failed,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
