import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LEDGER_PATH = path.join(ROOT, "docs/research/idea-source-screening-ledger.jsonl");

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

const PER_ARM = Number(option("--per-arm") || 6);
const ONLY_EXPERIMENTS = new Set((option("--experiments") || "").split(",").filter(Boolean));
const isDefaultRun = PER_ARM === 6 && ONLY_EXPERIMENTS.size === 0;
const OUTPUT_PATH = path.join(
  ROOT,
  isDefaultRun
    ? "docs/research/idea-task2-filter-top6.jsonl"
    : `docs/research/idea-task2-filter-expanded-${PER_ARM}.jsonl`,
);
const SUMMARY_PATH = path.join(
  ROOT,
  isDefaultRun
    ? "docs/research/idea-task2-filter-top6-summary.md"
    : `docs/research/idea-task2-filter-expanded-${PER_ARM}-summary.md`,
);

function readJsonl(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function compact(values) {
  return values.flat(Infinity)
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return String(value || "").normalize("NFKC").toLocaleLowerCase("en");
}

function normalizedName(value) {
  return normalized(value).replace(/[^\p{L}\p{N}]+/gu, "");
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of `task2-filter-20260713:${value}`) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function termHits(text, terms) {
  const haystack = normalized(text);
  return terms.filter((term) => haystack.includes(normalized(term))).length;
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function riskPenalty(row) {
  return Math.min(0.45, (row.risk_tags || []).length * 0.15);
}

function topUnique(rows, score, limit = PER_ARM) {
  const output = [];
  const names = new Set();
  for (const row of [...rows].sort((left, right) => score(right) - score(left) || left.key.localeCompare(right.key))) {
    const nameKey = normalizedName(row.name);
    if (!nameKey || names.has(nameKey)) continue;
    names.add(nameKey);
    output.push({ row, score: score(row) });
    if (output.length === limit) break;
  }
  return output;
}

const ledger = readJsonl("docs/research/idea-source-screening-ledger.jsonl");
const byKey = new Map(ledger.map((row) => [row.key, row]));

for (const row of readJsonl("docs/research/trustmrr-acquire/ideas.jsonl")) {
  const record = byKey.get(`trustmrr:${row.slug}`);
  record.source_text = compact([
    row.name,
    row.category,
    row.raw_description,
    row.target_user,
    row.problem,
    row.current_alternative,
    row.tags,
  ]);
  record.source_specific_signal = {
    revenue_30d_value: row.revenue_30d_value ?? null,
    growth_30d_text: row.growth_30d_text ?? null,
  };
}

for (const row of readJsonl("docs/research/store-rankings/app-store-expanded-unique-apps.jsonl")) {
  const record = byKey.get(`app_store:${row.app_id}`);
  record.source_text = compact([row.name, row.categories, row.queries, row.description]);
  record.source_specific_signal = {
    average_user_rating: row.average_user_rating ?? null,
    user_rating_count: row.user_rating_count ?? null,
    best_rank: Math.min(
      ...[row.best_rss_rank, row.best_category_rank, row.best_search_rank].filter(Number.isFinite),
      999,
    ),
  };
}

for (const row of readJsonl("docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl")) {
  const record = byKey.get(`chrome_web_store:${row.extension_id}`);
  record.source_text = compact([row.name, row.source_slugs, row.queries, row.description]);
  record.source_specific_signal = {
    rating: row.rating ?? null,
    appearances_count: row.appearances_count ?? null,
    best_rank: Math.min(
      ...[row.best_top_chart_rank, row.best_category_rank, row.best_search_rank].filter(Number.isFinite),
      999,
    ),
  };
}

const alreadyAudited = new Set(
  readJsonl("docs/research/idea-source-parallel-pilot-audit.jsonl").map((row) => row.key),
);
const eligible = ledger.filter((row) => (
  row.usable_description
  && row.matched_scenario_ids.length === 0
  && !alreadyAudited.has(row.key)
));

const immediateTerms = [
  "current page", "this page", "webpage", "browser", "extension", "selected text", "highlight",
  "right click", "one click", "instantly", "immediately", "open tabs", "url", "link",
  "현재 페이지", "브라우저", "선택한 텍스트", "즉시",
];
const painTerms = [
  "missing", "forgot", "forgotten", "overdue", "deadline", "error", "failed", "broken", "lost",
  "waste", "overpay", "increase", "duplicate", "expired", "unpaid", "cancel", "refund", "avoid",
  "누락", "잊", "마감", "오류", "실패", "손실", "중복", "만료", "미납", "환불",
];
const measurableTerms = [
  "amount", "price", "cost", "date", "deadline", "difference", "missing", "count", "status",
  "report", "checklist", "alert", "history", "evidence", "export", "timeline",
  "금액", "가격", "날짜", "차이", "누락", "개수", "상태", "근거", "목록",
];
const inputTerms = [
  "pdf", "csv", "xlsx", "spreadsheet", "document", "file", "url", "link", "photo", "image",
  "video", "audio", "receipt", "invoice", "email", "message", "screenshot", "scan", "transcript",
  "문서", "파일", "사진", "영상", "영수증", "메시지", "캡처",
];
const processTerms = [
  "compare", "extract", "detect", "convert", "transform", "classify", "match", "check", "verify",
  "highlight", "calculate", "clean", "remove", "find", "organize", "summarize",
  "비교", "추출", "탐지", "변환", "분류", "검사", "확인", "계산", "정리",
];
const outputTerms = [
  "report", "checklist", "table", "export", "result", "alert", "card", "list", "timeline", "preview",
  "file", "pdf", "csv", "summary", "map", "dashboard", "score",
  "보고서", "표", "목록", "파일", "미리보기", "결과",
];
const postProblemTerms = [
  "after", "received", "uploaded", "already", "current", "now", "today", "found", "when",
  "transaction", "statement", "history", "existing", "completed", "finished", "last",
  "받은", "직후", "현재", "오늘", "기록", "내역", "완료", "지난",
];
const preEventTerms = [
  "always on", "continuous", "before accident", "before damage", "background monitoring", "track over time",
  "monitor continuously", "must install before", "상시", "계속 기록", "사고 전", "파손 전",
];
const defaultTrapTerms = [
  "scanner", "scan documents", "qr code", "barcode", "calendar", "to do", "todo", "habit tracker",
  "translator", "translation", "summarizer", "meeting notes", "ai assistant", "chatbot", "wallpaper",
];

const scoreA = (row) => (
  0.22 * row.market_percentile
  + 0.18 * row.lens_score
  + 0.22 * clamp(termHits(row.source_text, immediateTerms) / 3)
  + 0.18 * clamp(row.grammar_groups / 4)
  + 0.20 * (row.dataset === "chrome_web_store" ? 1 : 0)
  - riskPenalty(row)
  - 0.12 * clamp(termHits(row.source_text, defaultTrapTerms) / 2)
);
const scoreB = (row) => (
  0.20 * row.market_percentile
  + 0.16 * row.lens_score
  + 0.28 * clamp(termHits(row.source_text, painTerms) / 3)
  + 0.26 * clamp(termHits(row.source_text, measurableTerms) / 3)
  + 0.10 * clamp(row.grammar_groups / 4)
  - riskPenalty(row)
);
const scoreC = (row) => (
  0.15 * row.market_percentile
  + 0.15 * row.lens_score
  + 0.22 * clamp(termHits(row.source_text, inputTerms) / 2)
  + 0.22 * clamp(termHits(row.source_text, processTerms) / 2)
  + 0.22 * clamp(termHits(row.source_text, outputTerms) / 2)
  + 0.04 * clamp(row.grammar_groups / 4)
  - riskPenalty(row)
  - 0.20 * clamp(termHits(row.source_text, defaultTrapTerms) / 2)
);
const scoreD = (row) => (
  0.34 * row.current_similarity_loo
  + 0.34 * clamp((row.decision_margin + 0.4) / 0.8)
  + 0.16 * row.market_percentile
  + 0.16 * row.lens_score
  - riskPenalty(row)
);
const scoreEBase = (row) => (
  0.34 * row.market_percentile
  + 0.24 * row.lens_score
  + 0.26 * (1 - row.current_similarity_loo)
  + 0.16 * clamp(row.grammar_groups / 4)
  - riskPenalty(row)
  - 0.15 * clamp(termHits(row.source_text, defaultTrapTerms) / 2)
);
const scoreF = (row) => (
  0.16 * row.market_percentile
  + 0.16 * row.lens_score
  + 0.26 * clamp(termHits(row.source_text, postProblemTerms) / 3)
  + 0.18 * clamp(termHits(row.source_text, inputTerms) / 2)
  + 0.14 * clamp(termHits(row.source_text, outputTerms) / 2)
  + 0.10 * clamp(row.grammar_groups / 4)
  - riskPenalty(row)
  - 0.35 * clamp(termHits(row.source_text, preEventTerms))
);

function diversityTop(rows, limit = PER_ARM) {
  const pool = topUnique(rows, scoreEBase, 300).map(({ row }) => row);
  const selected = [];
  const names = new Set();
  const datasetCounts = new Map();
  const categoryCounts = new Map();
  while (selected.length < limit) {
    const next = pool
      .filter((row) => !names.has(normalizedName(row.name)))
      .map((row) => {
        const categoryKey = normalized(row.category).split(/[,/]/)[0].trim() || "unknown";
        const noveltyBonus = 0.16 / (1 + (datasetCounts.get(row.dataset) || 0))
          + 0.18 / (1 + (categoryCounts.get(categoryKey) || 0));
        return { row, score: scoreEBase(row) + noveltyBonus, categoryKey };
      })
      .sort((left, right) => right.score - left.score || left.row.key.localeCompare(right.row.key))[0];
    if (!next) break;
    selected.push({ row: next.row, score: next.score });
    names.add(normalizedName(next.row.name));
    datasetCounts.set(next.row.dataset, (datasetCounts.get(next.row.dataset) || 0) + 1);
    categoryCounts.set(next.categoryKey, (categoryCounts.get(next.categoryKey) || 0) + 1);
  }
  return selected;
}

const experimentDefinitions = [
  {
    id: "A_immediate_result",
    label: "현재 페이지·설치 직후 결과",
    hypothesis: "현재 페이지나 이미 열린 데이터로 설치 직후 결과를 주는 원본은 작은 MVP 후보율이 높다.",
    select: () => topUnique(eligible, scoreA),
  },
  {
    id: "B_pain_and_result",
    label: "손실·누락·마감 + 측정 결과",
    hypothesis: "통증 언어와 금액·날짜·차이 같은 측정 결과가 함께 있는 원본은 좋은 카드로 깎기 쉽다.",
    select: () => topUnique(eligible, scoreB),
  },
  {
    id: "C_one_in_one_out",
    label: "입력 1개 → 처리 1회 → 결과 1개",
    hypothesis: "현실적인 입력·처리·결과가 모두 보이는 원본은 1~3화면 MVP가 되기 쉽다.",
    select: () => topUnique(eligible, scoreC),
  },
  {
    id: "D_pass_near_fail_far",
    label: "현재 좋은 원본과 가깝고 Fail과 멀기",
    hypothesis: "현재 원본 유사도와 Pass-Fail 임베딩 마진을 함께 쓰면 과거 실패를 덜 반복한다.",
    select: () => topUnique(eligible, scoreD),
  },
  {
    id: "E_diverse_outlier",
    label: "기존 후보와 다른 종류",
    hypothesis: "시장 신호는 있지만 현재 38개와 먼 후보를 소스·카테고리까지 분산하면 새 영역을 찾는다.",
    select: () => diversityTop(eligible),
  },
  {
    id: "F_post_problem_start",
    label: "문제가 생긴 뒤 시작 가능",
    hypothesis: "이미 받은 파일·내역·기록으로 문제 뒤 시작할 수 있는 원본은 유입 순간이 분명하다.",
    select: () => topUnique(eligible, scoreF),
  },
  {
    id: "G_random_control",
    label: "무작위 대조군",
    hypothesis: "무작위 표본은 필터가 실제로 개선됐는지 비교하는 기준선이다.",
    select: () => ["trustmrr", "app_store", "chrome_web_store"].flatMap((dataset) => eligible
      .filter((row) => row.dataset === dataset)
      .sort((left, right) => stableHash(left.key) - stableHash(right.key) || left.key.localeCompare(right.key))
      .slice(0, 2)
      .map((row) => ({ row, score: null }))),
  },
];

const activeExperimentDefinitions = ONLY_EXPERIMENTS.size === 0
  ? experimentDefinitions
  : experimentDefinitions.filter((experiment) => ONLY_EXPERIMENTS.has(experiment.id));
if (activeExperimentDefinitions.length === 0) {
  throw new Error("No matching experiments selected");
}

const selected = [];
for (const experiment of activeExperimentDefinitions) {
  for (const [index, item] of experiment.select().entries()) {
    const row = item.row;
    selected.push({
      experiment_id: experiment.id,
      experiment_label: experiment.label,
      hypothesis: experiment.hypothesis,
      experiment_rank: index + 1,
      selection_score: Number.isFinite(item.score) ? Number(item.score.toFixed(6)) : null,
      key: row.key,
      dataset: row.dataset,
      source_id: row.source_id,
      name: row.name,
      url: row.url,
      category: row.category,
      source_text: row.source_text,
      market_percentile: row.market_percentile,
      lens_score: row.lens_score,
      lens_hits: row.lens_hits,
      matched_lenses: row.matched_lenses,
      grammar_groups: row.grammar_groups,
      grammar_matches: row.grammar_matches,
      current_similarity_loo: row.current_similarity_loo,
      pass_similarity: row.pass_similarity,
      fail_similarity: row.fail_similarity,
      decision_margin: row.decision_margin,
      initial_risk_tags: row.risk_tags,
      source_specific_signal: row.source_specific_signal,
      audit_decision: null,
      hard_failure: null,
      audit_reason: null,
    });
  }
}

if (selected.length !== activeExperimentDefinitions.length * PER_ARM) {
  throw new Error(`Expected ${activeExperimentDefinitions.length * PER_ARM} slots, got ${selected.length}`);
}

fs.writeFileSync(OUTPUT_PATH, `${selected.map((row) => JSON.stringify(row)).join("\n")}\n`);

const unique = new Map();
for (const row of selected) {
  const arms = unique.get(row.key) || [];
  arms.push(row.experiment_id);
  unique.set(row.key, arms);
}
const table = activeExperimentDefinitions.map((experiment) => {
  const rows = selected.filter((row) => row.experiment_id === experiment.id);
  const mix = Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => [
    dataset,
    rows.filter((row) => row.dataset === dataset).length,
  ]));
  return `| ${experiment.id} | ${rows.length} | ${mix.trustmrr} | ${mix.app_store} | ${mix.chrome_web_store} | ${experiment.hypothesis} |`;
}).join("\n");

const summary = `# TASK 2 필터 실험 — ${activeExperimentDefinitions.length}개 방법 상위 ${PER_ARM}개

생성일: 2026-07-13

- 전체 점수화: **8,406개**
- 결과 후보에서는 현재 앱 38개와 기존 병렬 파일럿에서 이미 읽은 ${alreadyAudited.size}개 키를 제외했다.
- 실험: **${activeExperimentDefinitions.length}개**
- 실험당: **${PER_ARM}개**
- 총 판정 슬롯: **${selected.length}개**
- 고유 원본: **${unique.size}개**
- 필터는 탈락 판정이 아니라 사람이 먼저 읽을 순서만 정한다.

| 실험 | 슬롯 | TrustMRR | App Store | Chrome | 가설 |
|---|---:|---:|---:|---:|---|
${table}
`;
fs.writeFileSync(SUMMARY_PATH, summary);

process.stdout.write(`${JSON.stringify({
  corpus: ledger.length,
  eligibleForDelivery: eligible.length,
  experiments: activeExperimentDefinitions.length,
  slots: selected.length,
  uniqueCandidates: unique.size,
  excludedCurrent: ledger.filter((row) => row.matched_scenario_ids.length > 0).length,
  excludedPreviouslyAudited: alreadyAudited.size,
  output: path.relative(ROOT, OUTPUT_PATH),
  summary: path.relative(ROOT, SUMMARY_PATH),
}, null, 2)}\n`);
