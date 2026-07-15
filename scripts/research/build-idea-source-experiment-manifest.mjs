import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "docs/research/idea-source-screening-ledger.jsonl");
const OUTPUT = path.join(ROOT, "docs/research/idea-source-experiment-manifest.jsonl");
const SUMMARY = path.join(ROOT, "docs/research/idea-source-experiment-manifest-summary.md");
const BATCH_SIZE = 100;

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const rows = readJsonl(INPUT);
if (rows.length !== 8406) throw new Error(`Expected 8406 rows, got ${rows.length}`);

const datasets = ["trustmrr", "app_store", "chrome_web_store"];
const queues = Object.fromEntries(datasets.map((dataset) => [
  dataset,
  rows.filter((row) => row.dataset === dataset)
    .sort((a, b) => b.hybrid_v2_score - a.hybrid_v2_score || a.key.localeCompare(b.key)),
]));
const originalCounts = Object.fromEntries(datasets.map((dataset) => [dataset, queues[dataset].length]));
const ratios = Object.fromEntries(datasets.map((dataset) => [dataset, originalCounts[dataset] / rows.length]));
const consumed = Object.fromEntries(datasets.map((dataset) => [dataset, 0]));
const manifest = [];
const batchSummaries = [];

let batchNumber = 1;
while (manifest.length < rows.length) {
  const batchId = `EXH-${String(batchNumber).padStart(3, "0")}`;
  const batch = [];
  const batchCounts = Object.fromEntries(datasets.map((dataset) => [dataset, 0]));

  while (batch.length < BATCH_SIZE && manifest.length + batch.length < rows.length) {
    const eligible = datasets.filter((dataset) => consumed[dataset] < queues[dataset].length);
    if (!eligible.length) break;
    const nextPosition = batch.length + 1;
    eligible.sort((left, right) => {
      const leftDeficit = nextPosition * ratios[left] - batchCounts[left];
      const rightDeficit = nextPosition * ratios[right] - batchCounts[right];
      return rightDeficit - leftDeficit || left.localeCompare(right);
    });
    const dataset = eligible[0];
    const source = queues[dataset][consumed[dataset]++];
    batchCounts[dataset] += 1;
    batch.push(source);
  }

  batch.forEach((source, index) => {
    manifest.push({
      batch_id: batchId,
      batch_position: index + 1,
      key: source.key,
      dataset: source.dataset,
      source_id: source.source_id,
      name: source.name,
      url: source.url,
      category: source.category,
      priority_score: source.hybrid_v2_score,
      first_pass_status: source.first_pass_status,
      initial_risk_tags: source.risk_tags,
      matched_scenario_ids: source.matched_scenario_ids,
      coverage_level: "L1_machine_scored",
      experiments: {
        X01_source_integrity: source.usable_description ? "complete" : "needs_enrichment",
        X02_keyword_lenses: "complete",
        X03_market_signal: "complete",
        X04_embedding_baseline: "complete",
        X05_mechanism_normalization: "pending",
        X06_owner_triangle: "pending",
        X07_moment_counterfactual: "pending",
        X08_default_ai_counterfactual: "pending",
        X09_case_law_pairwise: "pending",
        X10_portfolio_cluster: "pending",
        X11_independent_jury: "conditional",
        X12_rejection_shadow_audit: "conditional",
        X13_nine_cell_preflight: "conditional",
        X14_full_27_audit: "conditional",
      },
      mechanism: null,
      decision: null,
      decision_reason: null,
      reviewed_at: null,
    });
  });

  batchSummaries.push({ batchId, total: batch.length, counts: batchCounts });
  batchNumber += 1;
}

const uniqueKeys = new Set(manifest.map((row) => row.key));
if (manifest.length !== 8406 || uniqueKeys.size !== manifest.length) {
  throw new Error(`Manifest integrity failed: rows=${manifest.length}, unique=${uniqueKeys.size}`);
}
for (const dataset of datasets) {
  const count = manifest.filter((row) => row.dataset === dataset).length;
  if (count !== originalCounts[dataset]) throw new Error(`${dataset}: ${count} != ${originalCounts[dataset]}`);
}

fs.writeFileSync(OUTPUT, `${manifest.map((row) => JSON.stringify(row)).join("\n")}\n`);

const needsEnrichment = manifest.filter((row) => row.first_pass_status === "needs_enrichment").length;
const matched = manifest.filter((row) => row.matched_scenario_ids.length > 0).length;
const batchTable = batchSummaries.map((batch) => [
  batch.batchId,
  batch.total,
  batch.counts.trustmrr,
  batch.counts.app_store,
  batch.counts.chrome_web_store,
].join(" | ")).join("\n");
const summary = `# 아이디어 원본 전수 실험 배치 요약

생성일: ${new Date().toISOString()}  
생성 스크립트: \`scripts/research/build-idea-source-experiment-manifest.mjs\`  
전수 장부: \`docs/research/idea-source-experiment-manifest.jsonl\`

## 무결성

- 전체 원본: **${manifest.length.toLocaleString()}개**
- 고유 키: **${uniqueKeys.size.toLocaleString()}개**
- 전수 배치: **${batchSummaries.length}개** — 84개 × 100건 + 마지막 6건
- TrustMRR: **${originalCounts.trustmrr.toLocaleString()}개**
- App Store: **${originalCounts.app_store.toLocaleString()}개**
- Chrome Web Store: **${originalCounts.chrome_web_store.toLocaleString()}개**
- 설명 보강 필요: **${needsEnrichment.toLocaleString()}개** — 탈락이 아니라 X01 보강 큐
- 현재 앱 연결 원본: **${matched}개**

모든 원본은 X01~X04 기계 실험을 완료했고 X05 의미 정규화 배치에 정확히 한 번 배정됐다. X05~X09를 통과하거나 탈락 사유를 기록해야만 전수 확인 완료로 센다.

## 배치 구성

배치 안에서도 전체 소스 비율을 유지하면서 각 소스의 혼합 v2 우선순위 순으로 배정했다.

배치 | 합계 | TrustMRR | App Store | Chrome
---|---:|---:|---:|---:
${batchTable}
`;
fs.writeFileSync(SUMMARY, summary);

console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT),
  summary: path.relative(ROOT, SUMMARY),
  rows: manifest.length,
  uniqueKeys: uniqueKeys.size,
  batches: batchSummaries.length,
  originalCounts,
  needsEnrichment,
  matched,
}, null, 2));
