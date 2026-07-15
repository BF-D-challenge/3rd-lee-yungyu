import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/research/idea-source-screening-experiments.json");
const LEDGER_OUTPUT = path.join(ROOT, "docs/research/idea-source-screening-ledger.jsonl");

function readJsonl(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function compact(values) {
  return values.flat(Infinity).filter((value) => value !== null && value !== undefined && value !== "");
}

function text(values) {
  return compact(values).join(" ").replace(/\s+/g, " ").trim();
}

function tokenize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .match(/[\p{L}\p{N}]+/gu) || [];
}

function normalized(value) {
  return String(value || "").normalize("NFKC").toLocaleLowerCase("en");
}

function containsTerm(haystack, term) {
  return haystack.includes(normalized(term));
}

const coverage = readJsonl("docs/research/idea-source-coverage.jsonl");
const coverageByKey = new Map(coverage.map((row) => [`${row.dataset}:${row.source_id}`, row]));

const records = [];

for (const row of readJsonl("docs/research/trustmrr-acquire/ideas.jsonl")) {
  const key = `trustmrr:${row.slug}`;
  const searchText = text([
    row.name,
    row.category,
    row.raw_description,
    row.target_user,
    row.problem,
    row.current_alternative,
    row.tags,
  ]);
  records.push({
    key,
    dataset: "trustmrr",
    sourceId: row.slug,
    name: row.name,
    url: row.url,
    category: row.category || "",
    searchText,
    usableDescription: String(row.raw_description || "").trim().length >= 40,
    marketRaw: Math.log1p(Math.max(0, Number(row.revenue_30d_value) || 0))
      + (row.growth_30d_text ? 0.5 : 0)
      + (row.raw_description ? 0.5 : 0),
    coverage: coverageByKey.get(key),
  });
}

for (const row of readJsonl("docs/research/store-rankings/app-store-expanded-unique-apps.jsonl")) {
  const key = `app_store:${row.app_id}`;
  const ranks = [row.best_rss_rank, row.best_category_rank, row.best_search_rank]
    .filter((value) => Number.isFinite(value));
  const bestRank = ranks.length ? Math.min(...ranks) : 500;
  const searchText = text([row.name, row.categories, row.queries, row.description]);
  records.push({
    key,
    dataset: "app_store",
    sourceId: row.app_id,
    name: row.name,
    url: (row.urls || [])[0] || null,
    category: (row.categories || []).join(", "),
    searchText,
    usableDescription: String(row.description || "").trim().length >= 80,
    marketRaw: Math.log1p(Math.max(0, Number(row.user_rating_count) || 0))
      + Math.max(0, Number(row.average_user_rating) || 0) / 2
      + Math.log1p(Math.max(0, Number(row.appearances_count) || 0))
      + 3 / Math.sqrt(bestRank),
    coverage: coverageByKey.get(key),
  });
}

for (const row of readJsonl("docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl")) {
  const key = `chrome_web_store:${row.extension_id}`;
  const ranks = [row.best_top_chart_rank, row.best_category_rank, row.best_search_rank]
    .filter((value) => Number.isFinite(value));
  const bestRank = ranks.length ? Math.min(...ranks) : 500;
  const searchText = text([row.name, row.source_slugs, row.queries, row.description]);
  records.push({
    key,
    dataset: "chrome_web_store",
    sourceId: row.extension_id,
    name: row.name,
    url: row.url,
    category: (row.source_slugs || []).join(", "),
    searchText,
    usableDescription: String(row.description || "").trim().length >= 40,
    marketRaw: Math.max(0, Number(row.rating) || 0)
      + Math.log1p(Math.max(0, Number(row.appearances_count) || 0))
      + 3 / Math.sqrt(bestRank)
      + (row.featured_anywhere ? 0.5 : 0),
    coverage: coverageByKey.get(key),
  });
}

if (records.length !== 8406) throw new Error(`Expected 8406 records, got ${records.length}`);

const opportunityGrammar = {
  input: [
    "pdf", "csv", "spreadsheet", "document", "file", "upload", "url", "link", "screenshot",
    "photo", "image", "video", "audio", "recording", "receipt", "invoice", "email", "message",
    "calendar", "contract", "form", "scan", "camera", "문서", "파일", "사진", "영상", "영수증",
  ],
  process: [
    "compare", "comparison", "reconcile", "extract", "detect", "convert", "transform", "track",
    "verify", "validate", "organize", "classify", "match", "monitor", "schedule", "remind", "highlight",
    "difference", "diff", "audit", "proof", "비교", "대조", "추출", "변환", "추적", "검증", "분류",
  ],
  output: [
    "report", "checklist", "difference", "missing", "evidence", "proof", "deadline", "status", "alert",
    "summary", "timeline", "map", "card", "queue", "dashboard", "export", "result", "action item",
    "리포트", "차이", "누락", "증거", "마감", "상태", "알림", "결과", "목록",
  ],
  moment: [
    "before", "after", "when", "deadline", "due", "renewal", "refund", "payment", "interview",
    "handoff", "claim", "approval", "meeting", "submit", "submission", "booking", "order", "weekly",
    "monthly", "daily", "마감", "결제", "환불", "회의", "면접", "제출", "예약", "주문",
  ],
  ownership: [
    "history", "workflow", "follow up", "follow-up", "progress", "state", "version", "archive", "log",
    "approval", "publish", "send", "share", "complete", "history", "기록", "진행", "버전", "완료",
  ],
};

const riskRules = {
  platform_owner: [
    "backup", "restore", "device transfer", "phone transfer", "factory reset", "cloud sync", "authentication",
    "account recovery", "refund status", "백업", "복원", "휴대폰 이전", "초기화", "인증", "환불 상태",
  ],
  commodity_ai: [
    "summarize", "rewrite", "translate", "one click summary", "document comparison", "pdf comparison",
    "요약", "다시 쓰기", "번역", "문서 비교", "pdf 비교", "차이표",
  ],
  counterparty: [
    "approve", "approval", "sign", "signature", "confirm", "client portal", "landlord", "vendor",
    "승인", "서명", "확인", "집주인", "기사", "고객 확인",
  ],
  regulated: [
    "diagnose", "diagnosis", "legal advice", "tax filing", "insurance claim", "medical", "진단", "법률",
    "세무", "세금 신고", "보험금", "보상",
  ],
  pre_event_capture: [
    "before accident", "always on", "continuous recording", "before damage", "before check in",
    "사고 전", "파손 전", "항상 녹화", "체크인 전", "인수 전",
  ],
};

const lenses = [
  { id: "money-gap", query: "invoice payment payout reconcile missing unpaid amount fee difference" },
  { id: "deadline-evidence", query: "deadline submission missing evidence document claim proof" },
  { id: "version-change", query: "compare file pdf version changed pages revision difference" },
  { id: "weekly-action", query: "multiple notices messages weekly action checklist deadline" },
  { id: "result-proof", query: "work result evidence portfolio file metrics proof" },
  { id: "handoff-status", query: "handoff client project status missing follow up" },
  { id: "first-result", query: "customer student onboarding no result progress inactive" },
  { id: "booking-deposit", query: "booking reservation deposit unpaid order payment" },
  { id: "photo-to-proof", query: "photo receipt scan evidence report claim" },
  { id: "link-to-structured", query: "url link extract location product structured data" },
  { id: "multi-channel-publish", query: "content preview multiple channels publish schedule" },
  { id: "review-feedback", query: "feedback comments revision unresolved approval" },
  { id: "renewal-expiry", query: "renewal expiration subscription deadline reminder" },
  { id: "lesson-mistake", query: "course lesson mistakes study review source page" },
  { id: "meeting-brief", query: "before meeting client history notes decision evidence" },
  { id: "creator-production", query: "video creator script recording edit publish workflow" },
  { id: "seller-operations", query: "seller order inventory return claim payout" },
  { id: "small-business-review", query: "local business customer review qr employee feedback" },
  { id: "file-cleanup", query: "files duplicates organize archive delete verified" },
  { id: "browser-workflow", query: "browser extension webpage extract save compare automate" },
  { id: "family-notice", query: "family school notice schedule preparation signature" },
  { id: "coach-followup", query: "coach client progress follow up action result" },
  { id: "comparison-decision", query: "compare options price features decision shortlist" },
  { id: "single-input-output", query: "upload one file instant report result" },
];

for (const record of records) {
  record.normalizedText = normalized(record.searchText);
  record.tokens = tokenize(record.searchText);
  record.tokenCounts = new Map();
  for (const token of record.tokens) record.tokenCounts.set(token, (record.tokenCounts.get(token) || 0) + 1);
  const matchedGroups = {};
  let termHits = 0;
  for (const [group, terms] of Object.entries(opportunityGrammar)) {
    const hits = terms.filter((term) => containsTerm(record.normalizedText, term));
    if (hits.length) matchedGroups[group] = hits;
    termHits += Math.min(hits.length, 4);
  }
  record.grammarGroups = Object.keys(matchedGroups).length;
  record.grammarScore = record.grammarGroups * 4 + termHits + (matchedGroups.ownership ? 2 : 0);
  record.grammarMatches = matchedGroups;
  record.riskTags = Object.entries(riskRules)
    .filter(([, terms]) => terms.some((term) => containsTerm(record.normalizedText, term)))
    .map(([id]) => id);
}

for (const dataset of ["trustmrr", "app_store", "chrome_web_store"]) {
  const subset = records.filter((record) => record.dataset === dataset).sort((a, b) => a.marketRaw - b.marketRaw);
  subset.forEach((record, index) => { record.marketPercentile = subset.length === 1 ? 1 : index / (subset.length - 1); });
}

const documentFrequency = new Map();
let totalLength = 0;
for (const record of records) {
  totalLength += record.tokens.length;
  for (const token of new Set(record.tokens)) documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
}
const averageLength = totalLength / records.length;

function bm25(record, query) {
  const k1 = 1.2;
  const b = 0.72;
  let score = 0;
  for (const term of new Set(tokenize(query))) {
    const tf = record.tokenCounts.get(term) || 0;
    if (!tf) continue;
    const df = documentFrequency.get(term) || 0;
    const idf = Math.log(1 + (records.length - df + 0.5) / (df + 0.5));
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * record.tokens.length / averageLength)));
  }
  return score;
}

const lensTopKeys = new Map();
for (const lens of lenses) {
  const scored = records
    .map((record) => ({ record, score: bm25(record, lens.query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const max = scored[0]?.score || 1;
  lensTopKeys.set(lens.id, new Set(scored.slice(0, 50).map((item) => item.record.key)));
  for (const { record, score } of scored) {
    const normalizedScore = score / max;
    record.lensScore = Math.max(record.lensScore || 0, normalizedScore);
    record.lensHits = (record.lensHits || 0) + (lensTopKeys.get(lens.id).has(record.key) ? 1 : 0);
    if (lensTopKeys.get(lens.id).has(record.key)) {
      record.matchedLenses = [...(record.matchedLenses || []), lens.id];
    }
  }
}

const maxGrammar = Math.max(...records.map((record) => record.grammarScore));
const embeddingPath = path.join(ROOT, "docs/research/idea-source-embedding-scores.jsonl");
const embeddingByKey = fs.existsSync(embeddingPath)
  ? new Map(readJsonl("docs/research/idea-source-embedding-scores.jsonl").map((row) => [row.key, row]))
  : new Map();
for (const record of records) {
  record.lensScore ||= 0;
  record.lensHits ||= 0;
  record.matchedLenses ||= [];
  record.grammarNormalized = record.grammarScore / maxGrammar;
  record.hybridScore = 0.45 * record.lensScore
    + 0.30 * record.grammarNormalized
    + 0.25 * record.marketPercentile;
  Object.assign(record, embeddingByKey.get(record.key) || {
    current_similarity_loo: 0,
    pass_similarity: 0,
    fail_similarity: 0,
    merge_similarity: 0,
    decision_margin: 0,
  });
  record.hybridV2Score = 0.30 * record.marketPercentile
    + 0.20 * record.lensScore
    + 0.15 * record.grammarNormalized
    + 0.20 * record.current_similarity_loo
    + 0.15 * ((record.decision_margin + 1) / 2);
}

function ranked(metric) {
  return [...records].sort((a, b) => b[metric] - a[metric] || b.marketPercentile - a.marketPercentile);
}

function stratifiedRanking(metric) {
  const queues = Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => [
    dataset,
    records.filter((record) => record.dataset === dataset)
      .sort((a, b) => b[metric] - a[metric] || b.marketPercentile - a.marketPercentile),
  ]));
  const pattern = ["trustmrr", "app_store", "trustmrr", "chrome_web_store", "app_store"];
  const output = [];
  const positions = { trustmrr: 0, app_store: 0, chrome_web_store: 0 };
  while (output.length < records.length) {
    let moved = false;
    for (const dataset of pattern) {
      const record = queues[dataset][positions[dataset]++];
      if (record) {
        output.push(record);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return output;
}

const canaries = new Set(records.filter((record) => record.coverage?.matched_scenario_ids?.length).map((record) => record.key));
if (canaries.size === 0) throw new Error("Expected at least one in-app source canary");

function recallAt(ranking, limit) {
  const found = ranking.slice(0, limit).filter((record) => canaries.has(record.key));
  return {
    found: found.length,
    total: canaries.size,
    recall: Number((found.length / canaries.size).toFixed(4)),
    missed: [...canaries].filter((key) => !new Set(ranking.slice(0, limit).map((record) => record.key)).has(key)),
  };
}

function datasetMix(ranking, limit) {
  return Object.fromEntries(Object.entries(ranking.slice(0, limit).reduce((acc, record) => {
    acc[record.dataset] = (acc[record.dataset] || 0) + 1;
    return acc;
  }, {})).sort());
}

function datasetRecallAt(ranking, dataset, limit) {
  const subset = ranking.filter((record) => record.dataset === dataset);
  const datasetCanaries = new Set([...canaries].filter((key) => key.startsWith(`${dataset}:`)));
  const found = subset.slice(0, limit).filter((record) => datasetCanaries.has(record.key)).length;
  return {
    found,
    total: datasetCanaries.size,
    recall: Number((found / Math.max(1, datasetCanaries.size)).toFixed(4)),
  };
}

function topRows(ranking, limit = 20) {
  return ranking.slice(0, limit).map((record) => ({
    key: record.key,
    dataset: record.dataset,
    name: record.name,
    category: record.category,
    url: record.url,
    usableDescription: record.usableDescription,
    grammarScore: record.grammarScore,
    grammarGroups: record.grammarGroups,
    grammarMatches: record.grammarMatches,
    lensScore: Number(record.lensScore.toFixed(5)),
    lensHits: record.lensHits,
    matchedLenses: record.matchedLenses,
    marketPercentile: Number(record.marketPercentile.toFixed(5)),
    hybridScore: Number(record.hybridScore.toFixed(5)),
    hybridV2Score: Number(record.hybridV2Score.toFixed(5)),
    currentSimilarityLoo: Number(record.current_similarity_loo.toFixed(5)),
    decisionMargin: Number(record.decision_margin.toFixed(5)),
    nearestPassId: record.nearest_pass_id || null,
    nearestFailId: record.nearest_fail_id || null,
    riskTags: record.riskTags,
    isCanary: canaries.has(record.key),
    excerpt: record.searchText.slice(0, 500),
  }));
}

const rankings = {
  grammar: ranked("grammarScore"),
  lens: [...records].sort((a, b) => b.lensHits - a.lensHits || b.lensScore - a.lensScore || b.marketPercentile - a.marketPercentile),
  market: ranked("marketPercentile"),
  hybrid: ranked("hybridScore"),
  grammarStratified: stratifiedRanking("grammarScore"),
  lensStratified: stratifiedRanking("lensScore"),
  embeddingCurrent: ranked("current_similarity_loo"),
  embeddingDecisionMargin: ranked("decision_margin"),
  hybridV2: ranked("hybridV2Score"),
};

const lensUnion = new Set([...lensTopKeys.values()].flatMap((set) => [...set]));

const finalDecisions = readJsonl("docs/research/idea-final-decisions-62.jsonl");
const applicableGate = (gate) => {
  if (gate.includes("platform")) return "platform_owner";
  if (gate.includes("commodity-ai")) return "commodity_ai";
  if (gate.includes("counterparty")) return "counterparty";
  if (gate.includes("domain")) return "regulated";
  return null;
};
const riskEvaluationRows = finalDecisions
  .map((row) => {
    const expected = applicableGate(row.gate);
    const candidateText = normalized(row.title);
    const predicted = Object.entries(riskRules)
      .filter(([, terms]) => terms.some((term) => containsTerm(candidateText, term)))
      .map(([id]) => id);
    return { id: row.id, title: row.title, finalStatus: row.final_status, gate: row.gate, expected, predicted, hit: expected ? predicted.includes(expected) : null };
  })
  .filter((row) => row.expected);

const report = {
  generatedAt: new Date().toISOString(),
  corpus: {
    total: records.length,
    canaries: canaries.size,
    descriptions: Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => {
      const subset = records.filter((record) => record.dataset === dataset);
      return [dataset, { total: subset.length, usable: subset.filter((record) => record.usableDescription).length }];
    })),
  },
  settings: {
    lenses: lenses.length,
    topPerLens: 50,
    lensUnionSize: lensUnion.size,
    opportunityGrammar,
    riskRules,
    embeddingAvailable: embeddingByKey.size === records.length,
  },
  experiments: Object.fromEntries(Object.entries(rankings).map(([name, ranking]) => [name, {
    recallAt300: recallAt(ranking, 300),
    recallAt1000: recallAt(ranking, 1000),
    recallAt2000: recallAt(ranking, 2000),
    datasetMixAt300: datasetMix(ranking, 300),
    perDatasetRecall: Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => [dataset, {
      at100: datasetRecallAt(ranking, dataset, 100),
      at300: datasetRecallAt(ranking, dataset, 300),
      at500: datasetRecallAt(ranking, dataset, 500),
    }])),
    top20: topRows(ranking, 20),
    top100: topRows(ranking, 100),
  }])),
  lensUnion: {
    size: lensUnion.size,
    canaries: [...canaries].filter((key) => lensUnion.has(key)).length,
    canaryRecall: Number(([...canaries].filter((key) => lensUnion.has(key)).length / canaries.size).toFixed(4)),
    perLens: Object.fromEntries([...lensTopKeys].map(([id, keys]) => [id, {
      size: keys.size,
      canaries: [...canaries].filter((key) => keys.has(key)).length,
    }])),
  },
  riskKeywordTitleOnly: {
    applicable: riskEvaluationRows.length,
    hits: riskEvaluationRows.filter((row) => row.hit).length,
    recall: Number((riskEvaluationRows.filter((row) => row.hit).length / Math.max(1, riskEvaluationRows.length)).toFixed(4)),
    rows: riskEvaluationRows,
  },
  randomBaseline: {
    expectedCanariesAt300: Number((300 * canaries.size / records.length).toFixed(2)),
    expectedRecallAt300: Number((300 / records.length).toFixed(4)),
    expectedCanariesAt1000: Number((1000 * canaries.size / records.length).toFixed(2)),
    expectedRecallAt1000: Number((1000 / records.length).toFixed(4)),
  },
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(
  LEDGER_OUTPUT,
  `${records.map((record) => JSON.stringify({
    key: record.key,
    dataset: record.dataset,
    source_id: record.sourceId,
    name: record.name,
    url: record.url,
    category: record.category,
    usable_description: record.usableDescription,
    text_length: record.searchText.length,
    grammar_score: record.grammarScore,
    grammar_groups: record.grammarGroups,
    grammar_matches: record.grammarMatches,
    lens_score: Number(record.lensScore.toFixed(6)),
    lens_hits: record.lensHits,
    matched_lenses: record.matchedLenses,
    market_percentile: Number(record.marketPercentile.toFixed(6)),
    hybrid_v2_score: Number(record.hybridV2Score.toFixed(6)),
    risk_tags: record.riskTags,
    current_similarity_loo: Number(record.current_similarity_loo.toFixed(6)),
    decision_margin: Number(record.decision_margin.toFixed(6)),
    nearest_pass_id: record.nearest_pass_id || null,
    nearest_fail_id: record.nearest_fail_id || null,
    nearest_merge_id: record.nearest_merge_id || null,
    matched_scenario_ids: record.coverage?.matched_scenario_ids || [],
    first_pass_status: record.usableDescription ? "machine_scored" : "needs_enrichment",
  })).join("\n")}\n`,
);
console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT),
  ledgerOutput: path.relative(ROOT, LEDGER_OUTPUT),
  corpus: report.corpus,
  lensUnion: report.lensUnion,
  experiments: Object.fromEntries(Object.entries(report.experiments).map(([name, value]) => [name, {
    recallAt300: value.recallAt300,
    recallAt1000: value.recallAt1000,
    mix: value.datasetMixAt300,
  }])),
  riskKeywordTitleOnly: report.riskKeywordTitleOnly,
}, null, 2));
