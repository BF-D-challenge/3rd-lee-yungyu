import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "docs/research/idea-source-screening-ledger.jsonl");
const OUTPUT = path.join(ROOT, "docs/research/idea-source-experiment-pilot-60.jsonl");
const SUMMARY = path.join(ROOT, "docs/research/idea-source-experiment-pilot-60-summary.md");

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of `20260713:${value}`) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const rows = readJsonl(INPUT);
const datasets = ["trustmrr", "app_store", "chrome_web_store"];
const selected = [];

for (const dataset of datasets) {
  const subset = rows.filter((row) => row.dataset === dataset);
  const used = new Set();

  const high = [...subset]
    .sort((a, b) => b.hybrid_v2_score - a.hybrid_v2_score || a.key.localeCompare(b.key))
    .slice(0, 8);
  high.forEach((row) => used.add(row.key));

  const lensOutliers = [...subset]
    .filter((row) => !used.has(row.key))
    .sort((a, b) => b.lens_hits - a.lens_hits || b.lens_score - a.lens_score || a.key.localeCompare(b.key))
    .slice(0, 6);
  lensOutliers.forEach((row) => used.add(row.key));

  const randomShadow = [...subset]
    .filter((row) => !used.has(row.key))
    .sort((a, b) => stableHash(a.key) - stableHash(b.key) || a.key.localeCompare(b.key))
    .slice(0, 6);

  for (const [arm, armRows] of [["hybrid_high", high], ["lens_outlier", lensOutliers], ["random_shadow", randomShadow]]) {
    for (const row of armRows) {
      selected.push({
        pilot_id: `P60-${String(selected.length + 1).padStart(2, "0")}`,
        arm,
        key: row.key,
        dataset: row.dataset,
        source_id: row.source_id,
        name: row.name,
        url: row.url,
        category: row.category,
        usable_description: row.usable_description,
        hybrid_v2_score: row.hybrid_v2_score,
        lens_hits: row.lens_hits,
        matched_lenses: row.matched_lenses,
        initial_risk_tags: row.risk_tags,
        matched_scenario_ids: row.matched_scenario_ids,
        mechanism_arm_a: null,
        mechanism_arm_b: null,
        owner_moment_result: null,
        default_ai_duel_result: null,
        case_law_result: null,
        manual_gold: null,
      });
    }
  }
}

const uniqueKeys = new Set(selected.map((row) => row.key));
if (selected.length !== 60 || uniqueKeys.size !== 60) {
  throw new Error(`Pilot integrity failed: rows=${selected.length}, unique=${uniqueKeys.size}`);
}

fs.writeFileSync(OUTPUT, `${selected.map((row) => JSON.stringify(row)).join("\n")}\n`);

const table = datasets.flatMap((dataset) => ["hybrid_high", "lens_outlier", "random_shadow"].map((arm) => {
  const count = selected.filter((row) => row.dataset === dataset && row.arm === arm).length;
  return `| ${dataset} | ${arm} | ${count} |`;
})).join("\n");
const summary = `# 아이디어 원본 의미 심사 파일럿 60

생성일: ${new Date().toISOString()}  
생성 스크립트: \`scripts/research/build-idea-source-pilot-60.mjs\`  
파일럿 장부: \`docs/research/idea-source-experiment-pilot-60.jsonl\`

## 구성

각 소스에서 혼합 점수 상위 8개, 문제 렌즈 이상치 6개, 무작위 감시 6개를 중복 없이 뽑았다.

| 소스 | 실험군 | 수 |
|---|---|---:|
${table}

합계: **${selected.length}개**, 고유 키 **${uniqueKeys.size}개**.

## 목적

같은 60개를 두 가지 메커니즘 정규화 방식과 판례 비교 방식으로 독립 심사해, 8,406개 전수 심사에 사용할 의미 표현을 고른다. 이 파일럿의 후보는 앱 승격 후보가 아니며 방식 보정용이다.
`;
fs.writeFileSync(SUMMARY, summary);

console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT),
  summary: path.relative(ROOT, SUMMARY),
  rows: selected.length,
  uniqueKeys: uniqueKeys.size,
  byDataset: Object.fromEntries(datasets.map((dataset) => [dataset, selected.filter((row) => row.dataset === dataset).length])),
  byArm: Object.fromEntries(["hybrid_high", "lens_outlier", "random_shadow"].map((arm) => [arm, selected.filter((row) => row.arm === arm).length])),
}, null, 2));
