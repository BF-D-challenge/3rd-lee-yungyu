#!/usr/bin/env node
// Human-fit QA for golden cards.
//
// The existing validator checks schema and length. This script checks whether a
// card feels defensible to a user: grounded need, natural Korean, specific MVP,
// and non-template wording. It can run dry experiments or write a filtered
// golden/allowlist pair.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const minScore = Number(args.minScore ?? 72);
const write = Boolean(args.write);
const label = String(args.label ?? `min-${minScore}`);

const combosPath = path.join(repoRoot, "src/data/combos.json");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const qualityGatesPath = path.join(repoRoot, "src/data/card-quality-gates.json");
const reportPath = path.join(
  repoRoot,
  "docs/dev/experiments/card-quality/qa",
  `human-fit-audit-${label}.json`,
);
const combos = JSON.parse(fs.readFileSync(combosPath, "utf8"));
const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const qualityGates = JSON.parse(fs.readFileSync(qualityGatesPath, "utf8"));
const manuallyQuarantinedKeys = new Set(qualityGates.quarantined.map((item) => item.key));

const seedMeta = new Map();
for (const [track, trackData] of Object.entries(combos.tracks)) {
  for (const category of trackData.categories) {
    for (const seed of category.seeds) {
      seedMeta.set(seed.id, {
        track,
        categoryId: category.id,
        categoryLabel: category.label,
        seedLabel: seed.label,
      });
    }
  }
}
for (const seed of combos.presetSeeds ?? []) {
  if (!seedMeta.has(seed.id)) {
    seedMeta.set(seed.id, {
      track: seed.track ?? "like",
      categoryId: "_preset",
      categoryLabel: "preset",
      seedLabel: seed.label,
    });
  }
}

const painById = new Map(combos.pains.map((pain) => [pain.id, pain]));
const formatById = new Map(combos.formats.map((format) => [format.id, format]));

const needSourceScore = {
  direct: 22,
  external: 14,
  adjacent: 4,
  inferred: -38,
};

const formatFit = {
  "calc-tool": [/선택|비교|가격|비용|계산|검증|진단|우선순위|누락|위험/],
  dashboard: [/흩어|파편|현황|성과|집계|비용|반복|관리|누락/],
  "template-gen": [/초안|답장|문장|문서|작성|반복 문의|계약|제안|소개/],
  curation: [/추천|후보|목록|고르|찾기|비교|저장|모음/],
  "share-link": [/공유|물어|친구|동행|상대|피드백|링크|보내/],
  "vote-card": [/투표|고르|친구|동료|피드백|선택/],
  chatbot: [/묻|답변|상담|질문|대화/],
  "digest-bot": [/요약|알림|뉴스|리뷰|새 항목|모니터링/],
  "streak-tracker": [/꾸준|지속|끊기|루틴|기록|회복|동기/],
};

const genericTitlePatterns = [
  /개인진단/,
  /검가짜|점검CO|점검AI|점검이번/,
  /트평판|트썸네|리리뷰/,
  /설(개인|전문|고객|계산|링크|판|틀)/,
  /판 — 요약판|틀 — 생성 템플릿|진단 — 진단 계산기/,
];

const genericTextPatterns = [
  ["template-oneliner-first-decision", /문제를 미루던 .{2,4}에게 .*첫 결정을 줘요/],
  ["template-oneliner-path", /.{2,4}(가|이) .* 앞에서 헤매지 않게 .*길을 냅니다/],
  ["template-oneliner-summary", /.{2,4}(가|이) .* 볼 때마다 .*먼저 가릅니다/],
  ["generic-target", /.+를 다루는 .+/],
  ["generic-evidence", /처럼 좁은 문제를 푸는 도구에도 (매출|사용) 신호가 있고/],
  ["generic-today-action", /입력하는 화면, .* 결과를 만들고 저장하거나 공유하는 흐름/],
  ["awkward-spaced-particle", /결론 에|리뷰을|문의을|자료을|메모을|금액를|목록을 오늘 처리/],
  ["raw-generated-number", /\d+개 뒤지다|식은땀|바로 정리돼 안심/],
  ["too-vague-mvp", /결과 확인|저장 기능|공유 기능|입력 화면/],
];

const hardBlockPatterns = [
  ["hard-manual-semantic-quarantine", (card) => manuallyQuarantinedKeys.has(key(card))],
  ["hard-known-semantic-mismatch", (card) => knownSemanticMismatchKeys.has(key(card))],
  ["hard-inferred-niche-review", (card, meta) => card.needSource === "inferred" && /news|magazine|review|digest/i.test(card.seed)],
  ["hard-football-anchor", (card) => /football|축구/i.test(card.anchorName ?? "")],
  [
    "hard-risky-theme",
    (card) =>
      /face-swap|market-prediction|auto-trade|watchlist-news-scatter|auction-rights|freelance-contract|apt-price-tracker|chat-mockup|cold-email|niche-tool-directory|prompt-drawer/.test(card.seed ?? "") ||
      /얼굴 합성|매수판단|주가예측|자동매매|투자 토론|매수·관망|위험체크|경매 입문|경매질문|계약검토|수정 요청할 조항|첫 수량 추천|매수 판단|후기처럼 보이는 채팅|스팸함 직행|재발송 순서/.test(allText(card)),
  ],
  ["hard-generic-korean-anchor", (card) => isGenericKoreanAnchor(card.anchorName)],
  ["hard-raw-manwon-amount", (card) => hasRawLargeManwonAmount(allText(card))],
  ["hard-mega-anchor", (card) => maxEokAmount(allText(card)) >= 50],
  ["hard-awkward-title", (card) => genericTitlePatterns.some((pattern) => pattern.test(card.title ?? ""))],
  [
    "hard-bad-korean",
    (card) =>
	      /결론 에|리뷰을|문의을|자료을|메모을|금액를|출처을|주제을|메시지을|문구을|공고을|자세을|서비스을|오류을|소재을|컴포넌트을|리드을|후보을|근거을|키워드을|경비을|신호을|신호 신호|투표카드으로|공유링크으로|문안틀으로|진단툴으로|진단기으로|대시보드으로|관리표으로|크루장가|취준생가|앞 위로 톤|위로 톤과|두개|세개|네개|후보 링크 저장 화면|태그 붙이기 버튼|묶음 링크 공유|후보 묶음 데모|관리판 데모|피드백 받기 전에 지침|선택 마비|가짜 가입 못 걸러|CORS 에러 못 읽음|복붙|아무데나|커피당번 답 대충옴|하루 어기면 다 포기|상품등록 노가다|AI가 노드 헛짓|첫방 카드|주의열|처음 딥워크|첫 슬롯|가게랜딩|Notion tool|위험체크|경매 입문|경매질문|계약검토|수정 요청할 조항|첫 수량 추천|매수 판단|후기처럼 보이는 채팅|스팸함 직행|재발송 순서/.test(
        allText(card),
      ),
  ],
  ["hard-seed-pain-semantic-clash", (card) => /지원자관리/.test(allText(card)) && /발주/.test(allText(card))],
  [
    "hard-generic-calc-mvp",
    (card) =>
      card.format === "calc-tool" &&
      ["후보 입력", "내 기준 점수", "추천 이유 보기", "결과 카드 저장"].filter((term) => allText(card).includes(term))
        .length >= 3,
  ],
  ["hard-sample5-template", (card) => /샘플 5개/.test(allText(card))],
  ["hard-generic-low-evidence", (card) => /DevSuite|AppGrowKit|월매출 약 68만원|매달 약 68만원|반복 해결이에요/.test(allText(card))],
  [
    "hard-repeated-korean-token",
    (card) =>
      /후보 후보|기준 기준|상태을|공고을|초안를|후보 묶음를|반응 버튼 열기|띄우기 확인|결과 이미지 저장|후보 카드 만들기부터 결과 이미지 저장|도메인 규칙 저장 결과|결과 카드 저장 결과|후보 링크 저장 화면|태그 붙이기 버튼|묶음 링크 공유|후보 묶음 데모|관리판 데모/.test(
        allText(card),
      ),
  ],
  ["hard-template-scene", (card) => /\d+개 뒤지다|식은땀|바로 정리돼 안심/.test(allText(card))],
  [
    "hard-generic-frontstory",
    (card) =>
      /오늘 처리하려고 열어봄|기준이 없어 손이 멈춤|다시 사람 기억에 기대려 함|공유 직전에 다시 확인하느라 지침|피드백 받기 전에 지침/.test(
        allText(card),
      ),
  ],
  ["hard-awkward-surface-copy", (card) => /단계을|성공배|초안사람결|대시보 —|앞 위로 톤|위로 톤과|두개|세개|네개|피드백 받기 전에 지침|선택 마비|가짜 가입 못 걸러|CORS 에러 못 읽음|복붙|아무데나|커피당번 답 대충옴|하루 어기면 다 포기|상품등록 노가다|AI가 노드 헛짓|첫방 카드|주의열|처음 딥워크|첫 슬롯|가게랜딩|Notion tool|위험체크|경매 입문|경매질문|계약검토|수정 요청할 조항|첫 수량 추천|매수 판단|후기처럼 보이는 채팅|스팸함 직행|재발송 순서/.test(allText(card))],
];

const knownSemanticMismatchKeys = new Set([
  "community-friend-map|79|crud-app",
  "community-friend-map|79|vote-card",
  "data-ai|34|dashboard",
  "iot-hardware-diy-project|13|template-gen",
  "marketplace-store-transfer-deal|32|chatbot",
  "marketplace-store-transfer-deal|32|dashboard",
  "mobile-apps-ai-reply-generator|13|template-gen",
  "mobile-apps-vertical-niche-validation|10|curation",
  "movie|16|calc-tool",
  "ott|74|curation",
  "performance-marketing|60|calc-tool",
  "fintech-auto-trade-rule-manage|15|template-gen",
  "utilities-prompt-drawer|15|template-gen",
  "social-media-live-stream-setup|59|digest-bot",
  "security-launch-checklist|32|dashboard",
  "recruiting-hr-candidate-outreach|69|dashboard",
  "real-estate-rental-listing-compare|10|calc-tool",
  "travel-country-survival-guide|16|chatbot",
  "entertainment-face-swap-meme|13|vote-card",
  "ai-mock-interview|9|vote-card",
  "utilities-video-subtitle-extract|78|digest-bot",
  "fintech-insurance-renewal-compare|10|calc-tool",
  "fintech-insurance-renewal-compare|2|calc-tool",
  "marketplace-niche-tool-directory|10|calc-tool",
  "community-niche-forum|32|crud-app",
  "fintech-insurance-renewal-compare|10|curation",
  "entertainment-face-swap-meme|10|curation",
  "entertainment-face-swap-meme|10|vote-card",
  "fintech-market-prediction-confidence|10|dashboard",
  "fintech-market-prediction-confidence|10|vote-card",
  "fintech-auto-trade-rule-manage|10|calc-tool",
  "fintech-watchlist-news-scatter|10|curation",
  "home-workout|10|vote-card",
  "performance-marketing|61|dashboard",
  "social-media-influencer-search|72|curation",
  "real-estate-auction-rights-check|13|template-gen",
  "real-estate-auction-rights-check|2|calc-tool",
  "legal-freelance-contract|10|curation",
  "md-buying|52|calc-tool",
  "md-buying|53|dashboard",
  "real-estate-apt-price-tracker|10|curation",
  "design-tools-chat-mockup|10|curation",
  "design-tools-chat-mockup|10|vote-card",
  "sales-cold-email-outreach|69|dashboard",
  "sales-cold-email-outreach|69|digest-bot",
  "marketplace-niche-tool-directory|10|curation",
  "utilities-prompt-drawer|10|curation",
]);

function allText(card) {
  return [
    card.title,
    card.oneliner,
    card.target,
    card.evidence,
    card.todayAction,
    card.buildPrompt,
    card.anchorDetail,
    card.whyItMatters,
    ...(card.mvp ?? []),
    card.frontStory?.persona,
    ...(card.frontStory?.timeline ?? []).flatMap((step) => [step.t, step.act, step.emo]),
  ].filter(Boolean).join(" ");
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

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function formatFits(card) {
  const pain = painById.get(card.pain);
  const format = formatById.get(card.format);
  if (!pain || !format) return false;
  const patterns = formatFit[card.format];
  if (!patterns) return true;
  const text = `${pain.label} ${pain.short} ${card.target ?? ""} ${card.oneliner ?? ""}`;
  return patterns.some((pattern) => pattern.test(text));
}

function scoreCard(card) {
  const meta = seedMeta.get(card.seed) ?? {
    track: "_unknown",
    categoryId: "_unknown",
    categoryLabel: "_unknown",
    seedLabel: card.seed,
  };
  const reasons = [];
  let score = 50;

  score += needSourceScore[card.needSource] ?? -18;
  if (card.evidenceType === "revenue") score += 6;
  if (card.evidenceType === "usage") score += 2;
  if (card.source === "v7") score += 4;
  if (card.anchorName && !/^(SEO STACK|SetSmart|Synta|IdeasPlusBusiness)$/i.test(card.anchorName)) score += 6;

  if (formatFits(card)) score += 10;
  else {
    score -= 18;
    reasons.push("format-need-mismatch");
  }

  const pain = painById.get(card.pain);
  if (pain?.label && pain.label.length >= 34 && /요$|못|불안|민망|헷갈|포기|놓치|지쳐|부담/.test(pain.label)) {
    score += 8;
  } else {
    score -= 8;
    reasons.push("weak-pain-voice");
  }

  if (card.target && !/다루는/.test(card.target) && card.target.length >= 14) score += 7;
  else {
    score -= 10;
    reasons.push("generic-target");
  }

  if (card.oneliner && /[가-힣]{2,4}(가|이|은|는)/.test(card.oneliner) && /문제|불안|장면/.test(card.oneliner)) {
    score -= 8;
    reasons.push("fake-name-template");
  }

  for (const [name, pattern] of genericTextPatterns) {
    const target = name === "too-vague-mvp" ? (card.mvp ?? []).join(" ") : allText(card);
    if (pattern.test(target)) {
      score -= name.startsWith("generic") ? 9 : 16;
      reasons.push(name);
    }
  }

  for (const pattern of genericTitlePatterns) {
    if (pattern.test(card.title ?? "")) {
      score -= 18;
      reasons.push("generated-title");
      break;
    }
  }

  if (card.needSource === "inferred") {
    reasons.push("inferred-need");
  }

  const hardBlocks = hardBlockPatterns
    .filter(([_, predicate]) => predicate(card, meta))
    .map(([name]) => name);
  if (hardBlocks.length) {
    score = Math.min(score, 30);
    reasons.push(...hardBlocks);
  }

  return {
    key: key(card),
    score,
    pass: score >= minScore && hardBlocks.length === 0,
    hardBlocks,
    reasons: [...new Set(reasons)],
    seed: card.seed,
    seedLabel: meta.seedLabel,
    categoryId: meta.categoryId,
    categoryLabel: meta.categoryLabel,
    pain: card.pain,
    painShort: painById.get(card.pain)?.short,
    format: card.format,
    formatShort: formatById.get(card.format)?.short,
    title: card.title,
    oneliner: card.oneliner,
    needSource: card.needSource,
    evidenceType: card.evidenceType,
    anchorName: card.anchorName,
  };
}

const scored = golden.map(scoreCard).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
const passed = scored.filter((item) => item.pass);
const blocked = scored.filter((item) => !item.pass);

function countBy(items, field) {
  const map = {};
  for (const item of items) {
    const key = item[field] ?? "_missing";
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(map).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

const reasonCounts = {};
for (const item of blocked) {
  for (const reason of item.reasons) reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
}

const report = {
  label,
  minScore,
  total: golden.length,
  passed: passed.length,
  blocked: blocked.length,
  passRate: Number((passed.length / golden.length).toFixed(3)),
  scoreRange: {
    max: scored[0]?.score ?? null,
    min: scored.at(-1)?.score ?? null,
    p10: scored[Math.floor(scored.length * 0.1)]?.score ?? null,
    p50: scored[Math.floor(scored.length * 0.5)]?.score ?? null,
    p90: scored[Math.floor(scored.length * 0.9)]?.score ?? null,
  },
  passNeedSource: countBy(passed, "needSource"),
  blockNeedSource: countBy(blocked, "needSource"),
  passCategories: countBy(passed, "categoryId"),
  blockCategories: countBy(blocked, "categoryId"),
  reasonCounts: Object.fromEntries(Object.entries(reasonCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  examples: {
    best: scored.slice(0, 20),
    threshold: scored.filter((item) => item.score >= minScore - 5 && item.score <= minScore + 5).slice(0, 30),
    worst: scored.slice(-40).reverse(),
    football: scored.filter((item) => item.seed === "news-magazines-football-tactics-digest"),
  },
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

if (write) {
  const passKeys = new Set(passed.map((item) => item.key));
  const nextGolden = golden.filter((card) => passKeys.has(key(card)));
  const nextAllow = {};
  for (const card of nextGolden) {
    const entry = nextAllow[card.seed] ??= { pains: new Set(), formats: new Set(), pairs: [] };
    entry.pains.add(card.pain);
    entry.formats.add(card.format);
    entry.pairs.push({ pain: card.pain, format: card.format });
  }
  const serialAllow = {};
  for (const [seed, entry] of Object.entries(nextAllow)) {
    serialAllow[seed] = {
      pains: [...entry.pains].sort((a, b) => a - b),
      formats: [...entry.formats].sort(),
      pairs: entry.pairs.sort((a, b) => a.pain - b.pain || a.format.localeCompare(b.format)),
    };
  }

  const backupDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");
  const stamp = Date.now();
  fs.writeFileSync(path.join(backupDir, `golden-before-human-fit-${stamp}.json`), JSON.stringify(golden, null, 2) + "\n");
  fs.writeFileSync(path.join(backupDir, `combos-before-human-fit-${stamp}.json`), JSON.stringify(combos, null, 2) + "\n");
  fs.writeFileSync(goldenPath, JSON.stringify(nextGolden, null, 2) + "\n");
  fs.writeFileSync(combosPath, JSON.stringify({ ...combos, version: (combos.version ?? 1) + 1, allow: serialAllow }, null, 2) + "\n");
}

console.log(JSON.stringify({
  label,
  minScore,
  total: report.total,
  passed: report.passed,
  blocked: report.blocked,
  passRate: report.passRate,
  football: report.examples.football.map((item) => ({
    title: item.title,
    score: item.score,
    pass: item.pass,
    reasons: item.reasons,
  })),
  reasonCounts: report.reasonCounts,
  reportPath: path.relative(repoRoot, reportPath),
  wrote: write,
}, null, 2));
