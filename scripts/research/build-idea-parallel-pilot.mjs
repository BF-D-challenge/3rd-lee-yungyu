import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LEDGER = path.join(ROOT, "docs/research/idea-source-screening-ledger.jsonl");
const OUTPUT = path.join(ROOT, "docs/research/idea-source-parallel-pilot.jsonl");
const SUMMARY = path.join(ROOT, "docs/research/idea-source-parallel-pilot-summary.md");
const PER_ARM = 6;

function readJsonl(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function text(values) {
  return values.flat(Infinity).filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ").replace(/\s+/g, " ").trim();
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of `parallel-20260713:${value}`) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const ledger = readJsonl("docs/research/idea-source-screening-ledger.jsonl");
const byKey = new Map(ledger.map((row) => [row.key, row]));

for (const row of readJsonl("docs/research/trustmrr-acquire/ideas.jsonl")) {
  const record = byKey.get(`trustmrr:${row.slug}`);
  record.source_text = text([row.name, row.category, row.raw_description]);
  record.countries = [];
  record.source_specific_signal = { revenue_30d_value: row.revenue_30d_value };
}
for (const row of readJsonl("docs/research/store-rankings/app-store-expanded-unique-apps.jsonl")) {
  const record = byKey.get(`app_store:${row.app_id}`);
  record.source_text = text([row.name, row.categories, row.queries, row.description]);
  record.countries = row.countries || [];
  record.source_specific_signal = {
    average_user_rating: row.average_user_rating,
    user_rating_count: row.user_rating_count,
    best_rank: Math.min(...[row.best_rss_rank, row.best_category_rank, row.best_search_rank].filter(Number.isFinite), 999),
  };
}
for (const row of readJsonl("docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl")) {
  const record = byKey.get(`chrome_web_store:${row.extension_id}`);
  record.source_text = text([row.name, row.source_slugs, row.queries, row.description]);
  record.countries = [];
  record.source_specific_signal = {
    rating: row.rating,
    appearances_count: row.appearances_count,
    best_rank: Math.min(...[row.best_top_chart_rank, row.best_category_rank, row.best_search_rank].filter(Number.isFinite), 999),
  };
}

const eligible = ledger.filter((row) => row.usable_description && row.matched_scenario_ids.length === 0);
const noInitialRisk = (row) => row.risk_tags.length === 0;
const descending = (score) => (left, right) => score(right) - score(left) || left.key.localeCompare(right.key);

const inputTerms = ["pdf", "csv", "file", "document", "url", "link", "photo", "image", "video", "audio", "receipt", "invoice", "email", "screenshot", "scan"];
const painTerms = ["missing", "forget", "forgot", "deadline", "error", "mistake", "without", "stop", "avoid", "no more", "save time", "instantly", "automatically", "unpaid", "overdue", "broken", "failed"];
const termCount = (row, terms) => {
  const value = row.source_text.toLocaleLowerCase("en");
  return terms.filter((term) => value.includes(term)).length;
};

const armDefinitions = [
  {
    id: "A_revenue_proof",
    hypothesis: "실제 매출 신호가 강한 원본에서 작은 세로 조각을 찾으면 고품질 후보 비율이 높다.",
    rows: eligible.filter((row) => row.dataset === "trustmrr")
      .sort(descending((row) => row.market_percentile)),
  },
  {
    id: "B_korean_behavior",
    hypothesis: "한국 노출·순위가 있고 설명이 있는 앱은 실제 한국 사용 순간을 찾기 쉽다.",
    rows: eligible.filter((row) => row.dataset === "app_store" && row.countries.includes("kr"))
      .sort(descending((row) => row.market_percentile)),
  },
  {
    id: "C_tiny_extension",
    hypothesis: "단순 브라우저 확장은 반나절~2일 MVP로 축소하기 쉽다.",
    rows: eligible.filter((row) => row.dataset === "chrome_web_store" && noInitialRisk(row))
      .sort(descending((row) => 0.45 * row.hybrid_v2_score + 0.35 * row.lens_score + 0.20 * row.market_percentile)),
  },
  {
    id: "D_problem_lenses",
    hypothesis: "돈·마감·증거·버전·인계 문제 렌즈에 여러 번 걸리는 원본은 구체적 결과가 있을 가능성이 높다.",
    rows: eligible.filter(noInitialRisk)
      .sort(descending((row) => row.lens_hits + row.lens_score)),
  },
  {
    id: "E_concrete_input",
    hypothesis: "현실적인 입력 객체가 명시된 원본은 카드와 MVP로 변환하기 쉽다.",
    rows: eligible.filter(noInitialRisk)
      .sort(descending((row) => termCount(row, inputTerms) * 3 + row.grammar_groups + row.lens_score)),
  },
  {
    id: "F_pain_language",
    hypothesis: "손실·누락·마감·실패 언어가 있는 원본은 제목과 UVP를 구체화하기 쉽다.",
    rows: eligible.filter(noInitialRisk)
      .sort(descending((row) => termCount(row, painTerms) * 3 + row.market_percentile + row.lens_score)),
  },
  {
    id: "G_novel_outlier",
    hypothesis: "현재 38개와 멀지만 시장 신호가 있는 원본을 따로 보면 포트폴리오의 새 영역을 찾을 수 있다.",
    rows: eligible.filter(noInitialRisk)
      .sort(descending((row) => row.market_percentile + row.lens_score - row.current_similarity_loo)),
  },
  {
    id: "H_merge_neighbor",
    hypothesis: "현재 원본과 가까운 제품은 새 그룹보다 결제자·순간·한 끗 카드 재료를 빠르게 보강한다.",
    rows: eligible.sort(descending((row) => row.current_similarity_loo)),
  },
  {
    id: "I_random_control",
    hypothesis: "무작위 표본은 다른 방법이 놓치는 사각지대와 실제 개선 폭을 측정하는 기준선이다.",
    rows: ["trustmrr", "app_store", "chrome_web_store"].flatMap((dataset) => eligible
      .filter((row) => row.dataset === dataset)
      .sort((a, b) => stableHash(a.key) - stableHash(b.key) || a.key.localeCompare(b.key))
      .slice(0, 2)),
  },
];

const selected = [];
for (const arm of armDefinitions) {
  for (const [index, row] of arm.rows.slice(0, PER_ARM).entries()) {
    selected.push({
      experiment_id: arm.id,
      hypothesis: arm.hypothesis,
      experiment_rank: index + 1,
      key: row.key,
      dataset: row.dataset,
      source_id: row.source_id,
      name: row.name,
      url: row.url,
      category: row.category,
      source_text: row.source_text,
      market_percentile: row.market_percentile,
      lens_hits: row.lens_hits,
      matched_lenses: row.matched_lenses,
      grammar_groups: row.grammar_groups,
      current_similarity_loo: row.current_similarity_loo,
      initial_risk_tags: row.risk_tags,
      source_specific_signal: row.source_specific_signal,
      audit_decision: null,
      hard_failure: null,
      novelty: null,
      specificity: null,
      audit_reason: null,
    });
  }
}

if (selected.length !== armDefinitions.length * PER_ARM) {
  throw new Error(`Expected ${armDefinitions.length * PER_ARM} rows, got ${selected.length}`);
}

fs.writeFileSync(OUTPUT, `${selected.map((row) => JSON.stringify(row)).join("\n")}\n`);

const overlaps = new Map();
for (const row of selected) {
  const arms = overlaps.get(row.key) || [];
  arms.push(row.experiment_id);
  overlaps.set(row.key, arms);
}
const repeated = [...overlaps].filter(([, arms]) => arms.length > 1);
const table = armDefinitions.map((arm) => {
  const rows = selected.filter((row) => row.experiment_id === arm.id);
  const mix = Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => [dataset, rows.filter((row) => row.dataset === dataset).length]));
  return `| ${arm.id} | ${rows.length} | ${mix.trustmrr} | ${mix.app_store} | ${mix.chrome_web_store} | ${arm.hypothesis} |`;
}).join("\n");
const summary = `# 아이디어 원본 병렬 파일럿

생성일: ${new Date().toISOString()}  
후보 장부: \`docs/research/idea-source-parallel-pilot.jsonl\`  
실험 수: **${armDefinitions.length}개**, 실험당 **${PER_ARM}개**, 총 판정 슬롯 **${selected.length}개**

각 실험은 8,406개 원본에서 독립적으로 후보를 선택한다. 다른 실험의 점수·판정을 입력으로 사용하지 않는다. 후보 중복은 제거하지 않고 두 방법이 같은 원본을 찾았다는 효과 신호로 기록한다.

| 실험 | 후보 | TrustMRR | App Store | Chrome | 가설 |
|---|---:|---:|---:|---:|---|
${table}

- 고유 후보: **${overlaps.size}개**
- 두 실험 이상 중복 후보: **${repeated.length}개**

공통 효과 지표는 \`상세 검토 가치 비율 / New 비율 / Merge 재료 비율 / 하드 실패율 / 소스 다양성\`이다.
`;
fs.writeFileSync(SUMMARY, summary);

console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT),
  summary: path.relative(ROOT, SUMMARY),
  experiments: armDefinitions.length,
  slots: selected.length,
  uniqueCandidates: overlaps.size,
  repeatedCandidates: repeated.length,
}, null, 2));
