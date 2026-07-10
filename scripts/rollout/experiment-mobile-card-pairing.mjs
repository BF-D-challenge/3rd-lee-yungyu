#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const golden = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/golden.json"), "utf8"));
const combos = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/combos.json"), "utf8"));
const qualityGates = JSON.parse(fs.readFileSync(path.join(repoRoot, "src/data/card-quality-gates.json"), "utf8"));
const optionValue = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const runs = Number(optionValue("--runs") || 20_000);
const preferenceArg = optionValue("--preferences");
const fixedPreferences = preferenceArg?.split(",").filter(Boolean) ?? null;
const label = optionValue("--label") || "latest";

const PROFILES = {
  "make-now": {
    categories: ["no-code", "mobile-apps", "productivity", "dev", "design-tools"],
    formats: ["template-gen", "calc-tool", "curation", "vote-card"],
  },
  "share-reaction": {
    categories: ["social-media", "community", "games", "entertainment"],
    formats: ["vote-card", "landing-waitlist", "share-link"],
    keywords: /공유|반응|투표|알림|친구|팔로워/,
  },
  paid: {
    categories: ["commerce", "sales", "saas", "marketing"],
    formats: ["calc-tool", "dashboard", "landing-waitlist"],
    preferDirect: true,
  },
  community: {
    categories: ["community", "social-media", "games"],
    formats: ["vote-card", "crud-app", "chatbot"],
    keywords: /커뮤니티|모임|팀|친구|댓글|동료/,
  },
  "ai-tools": {
    categories: ["ai", "mobile-apps", "dev"],
    formats: ["calc-tool", "template-gen", "chatbot"],
    keywords: /AI|진단|요약|자동|오류/,
  },
  "one-day": {
    categories: ["mobile-apps", "no-code", "productivity", "dev", "design-tools"],
    formats: ["template-gen", "calc-tool", "curation", "vote-card"],
    keywords: /오늘|반나절|첫|빠르|간단/,
  },
  "friend-vote": {
    categories: ["games", "community", "travel", "entertainment"],
    formats: ["vote-card"],
    keywords: /투표|카드|친구|동행|동료|팔로워/,
  },
  content: {
    categories: ["content", "social-media", "marketing"],
    formats: ["template-gen", "digest-bot", "curation"],
    keywords: /문장|콘텐츠|글|방송|팟캐스트|책/,
  },
  "light-fun": {
    categories: ["entertainment", "games", "travel", "food"],
    formats: ["vote-card", "curation"],
    keywords: /게임|데이트|여행|술자리|운세|카페/,
  },
  b2b: {
    categories: ["saas", "sales", "recruiting-hr", "marketing", "commerce", "legal"],
    formats: ["dashboard", "calc-tool", "template-gen"],
    preferDirect: true,
    keywords: /영업|제안|지원|업무|가입|고객|발주/,
  },
  local: {
    categories: ["food", "commerce", "sales", "travel", "no-code"],
    formats: ["dashboard", "curation", "template-gen", "calc-tool"],
    keywords: /가게|동네|카페|소상공인|방문|지역|여행|매장/,
  },
  education: {
    categories: ["education", "ai", "fitness", "content"],
    formats: ["calc-tool", "template-gen", "vote-card"],
    keywords: /학습|학생|취준|강의|연습|피드백|면접|노트/,
  },
};

const PREFERENCES = Object.keys(PROFILES);
const CURRENT_PRIMARY = {
  "make-now": "no-code",
  "share-reaction": "social-media",
  paid: "commerce",
  community: "community",
  "ai-tools": "ai",
  "one-day": "mobile-apps",
  "friend-vote": "games",
  content: "content",
  "light-fun": "entertainment",
  b2b: "saas",
  local: "marketplace",
  education: "education",
};
const seedMeta = new Map();
for (const [track, trackData] of Object.entries(combos.tracks)) {
  for (const category of trackData.categories) {
    for (const seed of category.seeds) seedMeta.set(seed.id, { track, category: category.id });
  }
}

const quarantinedKeys = new Set(qualityGates.quarantined.map((item) => item.key));
const cards = golden.filter((card) => !quarantinedKeys.has(`${card.seed}|${card.pain}|${card.format}`)).map((card) => ({
  ...card,
  key: `${card.seed}|${card.pain}|${card.format}`,
  category: seedMeta.get(card.seed)?.category ?? "unknown",
}));

function rngFactory(seed = 0x1a2b3c4d) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

const rng = rngFactory();
const pick = (items) => items[Math.floor(rng() * items.length)];
const shuffled = (items) => [...items].sort(() => rng() - 0.5);

function cardText(card) {
  return [card.title, card.oneliner, card.target, card.differentiationAxis?.socialContext]
    .filter(Boolean)
    .join(" ");
}

function preferenceScore(card, preferenceId) {
  const profile = PROFILES[preferenceId];
  const categoryIndex = profile.categories.indexOf(card.category);
  let score = categoryIndex === 0 ? 8 : categoryIndex > 0 ? Math.max(3, 6 - categoryIndex) : 0;
  if (profile.formats?.includes(card.format)) score += 3;
  if (profile.keywords?.test(cardText(card))) score += 2;
  if (profile.preferDirect && card.needSource === "direct") score += 2;
  return score;
}

function semanticPool(preferenceId) {
  const scored = cards
    .map((card) => ({ card, score: preferenceScore(card, preferenceId) }))
    .sort((a, b) => b.score - a.score || a.card.key.localeCompare(b.card.key));
  const cutoff = Math.max(5, scored[0].score - 4);
  return scored.filter((item) => item.score >= cutoff);
}

const semanticPools = Object.fromEntries(PREFERENCES.map((id) => [id, semanticPool(id)]));
const balancedPools = Object.fromEntries(
  PREFERENCES.map((id) => [id, cards
    .map((card) => ({ card, score: preferenceScore(card, id) }))
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score || a.card.key.localeCompare(b.card.key))]),
);
const appealCohort = qualityGates.cohorts?.["appeal-first-v1"];
const appealKeys = new Set(appealCohort?.keys ?? []);
const appealPreferences = new Set(appealCohort?.preferences ?? []);
const appealCards = cards.filter((card) => appealKeys.has(card.key));
const appealPools = Object.fromEntries(
  PREFERENCES.map((id) => [id, appealCards
    .map((card) => ({ card, score: preferenceScore(card, id) }))
    .filter((item) => item.score >= 5)
    .map(({ card }) => ({ card, score: 5 }))]),
);

function currentCard(preferenceId) {
  const exact = cards.filter((card) => card.category === CURRENT_PRIMARY[preferenceId]);
  return pick(exact.length ? exact : cards);
}

function semanticCard(preferenceId) {
  return pick(semanticPools[preferenceId]).card;
}

function weightedCard(pool) {
  const weights = pool.map((item) => Math.max(1, item.score - 4) ** 2);
  let cursor = rng() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return pool[index].card;
  }
  return pool.at(-1).card;
}

function tokenSet(card) {
  return new Set(
    cardText(card)
      .replace(/[^0-9A-Za-z가-힣 ]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 2),
  );
}

function lexicalSimilarity(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function contrastScore(a, b) {
  let score = 0;
  if (a.seed !== b.seed) score += 3;
  if (a.category !== b.category) score += 3;
  if (a.format !== b.format) score += 3;
  if (a.psychologyPrinciple !== b.psychologyPrinciple) score += 1;
  if (a.differentiationAxis?.socialContext !== b.differentiationAxis?.socialContext) score += 1;
  if (a.differentiationAxis?.outputShape !== b.differentiationAxis?.outputShape) score += 1;
  if (a.differentiationAxis?.emotionalResolution !== b.differentiationAxis?.emotionalResolution) score += 1;
  score -= lexicalSimilarity(a, b) * 4;
  return score;
}

function collisionPenalty(a, b) {
  let penalty = 0;
  if (a.seed === b.seed) penalty += 8;
  if (a.category === b.category) penalty += 6;
  if (a.format === b.format) penalty += 4;
  if (a.psychologyPrinciple === b.psychologyPrinciple) penalty += 3;
  return penalty;
}

function rerankedSecond(first, preferenceId) {
  const candidates = shuffled(semanticPools[preferenceId]).slice(0, 12);
  return candidates
    .map(({ card, score }) => ({ card, rank: score + contrastScore(first, card) + rng() * 1.5 }))
    .sort((a, b) => b.rank - a.rank)[0].card;
}

function balancedSecond(first, preferenceId) {
  const pool = balancedPools[preferenceId];
  const candidates = [];
  const seen = new Set();
  for (let guard = 0; candidates.length < Math.min(12, pool.length) && guard < 80; guard += 1) {
    const card = weightedCard(pool);
    if (seen.has(card.key)) continue;
    seen.add(card.key);
    candidates.push(card);
  }
  return candidates
    .map((card) => ({
      card,
      rank: preferenceScore(card, preferenceId) + contrastScore(first, card) + rng() * 1.5,
    }))
    .sort((a, b) => b.rank - a.rank)[0].card;
}

function bestOfThreeSecondFrom(pools, first, preferenceId) {
  const pool = pools[preferenceId].filter(({ card }) => card.key !== first.key && card.seed !== first.seed);
  const candidates = new Map();
  for (let guard = 0; candidates.size < Math.min(3, pool.length) && guard < 30; guard += 1) {
    const card = weightedCard(pool);
    candidates.set(card.key, card);
  }
  return [...candidates.values()].sort((a, b) => collisionPenalty(first, a) - collisionPenalty(first, b))[0];
}

const bestOfThreeSecond = (first, preferenceId) => bestOfThreeSecondFrom(balancedPools, first, preferenceId);

function selectionSet() {
  if (fixedPreferences) return shuffled(fixedPreferences);
  const count = 3 + Math.floor(rng() * 6);
  return shuffled(PREFERENCES).slice(0, count);
}

const methods = {
  H0_current(selected) {
    return [
      { card: currentCard(selected[0]), preferenceId: selected[0] },
      { card: currentCard(selected[1]), preferenceId: selected[1] },
    ];
  },
  H1_all_preferences(selected) {
    const [a, b] = shuffled(selected).slice(0, 2);
    return [
      { card: currentCard(a), preferenceId: a },
      { card: currentCard(b), preferenceId: b },
    ];
  },
  H2_semantic_fit(selected) {
    const [a, b] = shuffled(selected).slice(0, 2);
    return [
      { card: semanticCard(a), preferenceId: a },
      { card: semanticCard(b), preferenceId: b },
    ];
  },
  H3_fit_plus_contrast(selected) {
    const [a, b] = shuffled(selected).slice(0, 2);
    const first = semanticCard(a);
    return [
      { card: first, preferenceId: a },
      { card: rerankedSecond(first, b), preferenceId: b },
    ];
  },
  H4_balanced_coverage(selected) {
    const [a, b] = shuffled(selected).slice(0, 2);
    const first = weightedCard(balancedPools[a]);
    return [
      { card: first, preferenceId: a },
      { card: balancedSecond(first, b), preferenceId: b },
    ];
  },
  H5_best_of_three(selected) {
    const [a, b] = shuffled(selected).slice(0, 2);
    const first = weightedCard(balancedPools[a]);
    return [
      { card: first, preferenceId: a },
      { card: bestOfThreeSecond(first, b), preferenceId: b },
    ];
  },
};

if (fixedPreferences?.every((id) => appealPreferences.has(id))) {
  methods.H6_appeal_first_cohort = (selected) => {
    const [a, b] = shuffled(selected).slice(0, 2);
    const first = weightedCard(appealPools[a]);
    return [
      { card: first, preferenceId: a },
      { card: bestOfThreeSecondFrom(appealPools, first, b), preferenceId: b },
    ];
  };
}

const stats = Object.fromEntries(
  Object.keys(methods).map((method) => [method, {
    pairs: 0,
    cards: 0,
    fitScore: 0,
    contrastScore: 0,
    preferenceFit: 0,
    latePreference: 0,
    localCards: 0,
    localMismatch: 0,
    sameCategory: 0,
    sameFormat: 0,
    samePsychology: 0,
    sameOutputShape: 0,
    highLexicalSimilarity: 0,
    contrastPass: 0,
    cardCounts: new Map(),
  }]),
);

for (let run = 0; run < runs; run += 1) {
  const selected = selectionSet();
  for (const [method, draw] of Object.entries(methods)) {
    const pair = draw(selected);
    const [a, b] = pair.map((item) => item.card);
    const stat = stats[method];
    stat.pairs += 1;
    stat.cards += 2;
    stat.contrastScore += contrastScore(a, b);
    stat.sameCategory += Number(a.category === b.category);
    stat.sameFormat += Number(a.format === b.format);
    stat.samePsychology += Number(a.psychologyPrinciple === b.psychologyPrinciple);
    stat.sameOutputShape += Number(a.differentiationAxis?.outputShape === b.differentiationAxis?.outputShape);
    stat.highLexicalSimilarity += Number(lexicalSimilarity(a, b) >= 0.22);
    stat.contrastPass += Number(
      a.category !== b.category &&
      a.format !== b.format &&
      a.psychologyPrinciple !== b.psychologyPrinciple &&
      a.differentiationAxis?.outputShape !== b.differentiationAxis?.outputShape,
    );

    pair.forEach(({ card, preferenceId }) => {
      const fit = preferenceScore(card, preferenceId);
      stat.fitScore += fit;
      stat.preferenceFit += Number(fit >= 5);
      stat.latePreference += Number(selected.indexOf(preferenceId) >= 2);
      if (preferenceId === "local") {
        stat.localCards += 1;
        stat.localMismatch += Number(fit < 5);
      }
      stat.cardCounts.set(card.key, (stat.cardCounts.get(card.key) ?? 0) + 1);
    });
  }
}

const rate = (value, total) => Number((value / Math.max(1, total)).toFixed(3));
const result = {
  runs,
  sourceCards: golden.length,
  quarantinedCards: qualityGates.quarantined.length,
  cards: cards.length,
  hypotheses: {
    H0_current: "현재처럼 첫 두 취향의 1차 카테고리에서 무작위 선택",
    H1_all_preferences: "선택한 모든 취향에 동일한 노출 기회",
    H2_semantic_fit: "다중 카테고리·형태·문구 신호로 취향 적합 풀 구성",
    H3_fit_plus_contrast: "취향 적합 풀에서 두 번째 카드의 차별성 재정렬",
    H4_balanced_coverage: "적합도 가중 추첨과 차별성 재정렬로 품질·전체 카드 노출 균형",
    H5_best_of_three: "정규화된 충돌 감점으로 최대 세 후보만 비교",
    ...(methods.H6_appeal_first_cohort
      ? { H6_appeal_first_cohort: "사람 검수 10장 hard filter + 균등 추첨 + 최대 세 후보 비교" }
      : {}),
  },
  fixedPreferences,
  appealCohort: {
    cards: appealCards.length,
    pools: Object.fromEntries(PREFERENCES.map((id) => [id, appealPools[id].length])),
  },
  preferencePools: Object.fromEntries(
    PREFERENCES.map((id) => [id, {
      currentExactCards: cards.filter((card) => card.category === CURRENT_PRIMARY[id]).length,
      semanticCards: semanticPools[id].length,
      balancedCards: balancedPools[id].length,
      maxScore: semanticPools[id][0]?.score ?? 0,
    }]),
  ),
  methods: Object.fromEntries(Object.entries(stats).map(([method, stat]) => {
    const topCount = Math.max(...stat.cardCounts.values());
    return [method, {
      meanPreferenceFitScore: Number((stat.fitScore / stat.cards).toFixed(2)),
      preferenceFitRate: rate(stat.preferenceFit, stat.cards),
      latePreferenceExposureRate: rate(stat.latePreference, stat.cards),
      localMismatchRate: rate(stat.localMismatch, stat.localCards),
      meanPairContrastScore: Number((stat.contrastScore / stat.pairs).toFixed(2)),
      sameCategoryRate: rate(stat.sameCategory, stat.pairs),
      sameFormatRate: rate(stat.sameFormat, stat.pairs),
      samePsychologyRate: rate(stat.samePsychology, stat.pairs),
      sameOutputShapeRate: rate(stat.sameOutputShape, stat.pairs),
      highLexicalSimilarityRate: rate(stat.highLexicalSimilarity, stat.pairs),
      contrastPassRate: rate(stat.contrastPass, stat.pairs),
      uniqueCardsSeen: stat.cardCounts.size,
      maxCardShare: rate(topCount, stat.cards),
    }];
  })),
};

const outputPath = path.join(
  repoRoot,
  `docs/dev/experiments/card-quality/qa/mobile-pairing-experiment-${label}.json`,
);
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
