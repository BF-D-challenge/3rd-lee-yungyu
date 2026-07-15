import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "docs/research/idea-source-experiment-manifest.jsonl");
const COVERAGE_PATH = path.join(ROOT, "docs/research/idea-source-coverage.jsonl");
const TASK2_PATH = path.join(ROOT, "docs/research/idea-task2-filter-expanded-30-audit.jsonl");
const LEGACY_PATH = path.join(ROOT, "docs/research/idea-final-decisions-62.jsonl");
const DECISION_DIR = path.join(ROOT, "docs/research/idea-source-batch-decisions");
const AUDIT_DIR = path.join(ROOT, "docs/research/idea-source-batch-audits");
const OUTPUT_PATH = path.join(ROOT, "docs/research/idea-source-final-ledger.jsonl");
const SUMMARY_PATH = path.join(ROOT, "docs/research/idea-source-final-ledger-summary.md");
const SAMPLE_DATA_PATH = path.join(ROOT, "src/components/organisms/idea-lab/sample-data.ts");
const RESEARCH_KEY_PATTERN = /^(trustmrr|app_store|chrome_web_store):.+$/;

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${path.relative(ROOT, file)}:${index + 1}: ${error.message}`);
      }
    });
}

function compact(...values) {
  return values.flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
}

function clipped(...values) {
  const limit = 1600;
  const normalized = compact(...values);
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
}

function loadScenarios() {
  const source = fs.readFileSync(SAMPLE_DATA_PATH, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const evaluatedModule = { exports: {} };
  new Function("exports", "module", "require", javascript)(
    evaluatedModule.exports,
    evaluatedModule,
    () => ({}),
  );
  return evaluatedModule.exports.IDEA_LAB_SCENARIOS;
}

function loadSourceCatalog() {
  const catalog = new Map();
  const appEnrichmentPath = path.join(ROOT, "docs/research/source-enrichment/app-store-lookup.jsonl");
  const appEnrichment = fs.existsSync(appEnrichmentPath)
    ? new Map(readJsonl(appEnrichmentPath).map((row) => [String(row.app_id), row]))
    : new Map();
  for (const row of readJsonl(path.join(ROOT, "docs/research/trustmrr-acquire/ideas.jsonl"))) {
    catalog.set(`trustmrr:${row.slug}`, clipped(
      row.name,
      row.category,
      row.raw_description,
      row.target_user,
      row.problem,
      row.current_alternative,
    ));
  }
  for (const row of readJsonl(path.join(ROOT, "docs/research/store-rankings/app-store-expanded-unique-apps.jsonl"))) {
    const enriched = appEnrichment.get(String(row.app_id));
    catalog.set(`app_store:${row.app_id}`, clipped(
      row.name,
      row.categories,
      row.queries,
      enriched?.description,
      enriched?.release_notes,
      row.description,
    ));
  }
  for (const row of readJsonl(path.join(ROOT, "docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl"))) {
    catalog.set(`chrome_web_store:${row.extension_id}`, clipped(
      row.name,
      row.source_slugs,
      row.queries,
      row.description,
    ));
  }
  return catalog;
}

function loadBatchDecisions() {
  if (!fs.existsSync(DECISION_DIR)) return { decisions: new Map(), byBatch: new Map() };
  const files = fs.readdirSync(DECISION_DIR)
    .filter((name) => name.endsWith(".jsonl"))
    .sort();
  const decisions = new Map();
  const byBatch = new Map();
  for (const name of files) {
    const batchId = path.basename(name, ".jsonl");
    const batchRows = readJsonl(path.join(DECISION_DIR, name));
    for (const row of batchRows) {
      if (row.batch_id !== batchId) {
        throw new Error(`${path.relative(ROOT, path.join(DECISION_DIR, name))}: row batch_id ${row.batch_id} does not match ${batchId}`);
      }
      if (decisions.has(row.key)) throw new Error(`Duplicate batch decision key: ${row.key}`);
      decisions.set(row.key, row);
    }
    byBatch.set(batchId, batchRows);
  }
  return { decisions, byBatch };
}

function loadBatchAudits() {
  if (!fs.existsSync(AUDIT_DIR)) return new Map();
  const files = fs.readdirSync(AUDIT_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const audits = new Map();
  for (const name of files) {
    const file = path.join(AUDIT_DIR, name);
    const row = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!row.batch_id) throw new Error(`${path.relative(ROOT, file)}: batch_id is required`);
    if (audits.has(row.batch_id)) throw new Error(`Duplicate batch audit: ${row.batch_id}`);
    audits.set(row.batch_id, row);
  }
  return audits;
}

function sentence(value) {
  const normalized = compact(value);
  if (!normalized) return null;
  return /[.!?。]$/.test(normalized) ? normalized : `${normalized}.`;
}

function existingFiveSentences(scenario) {
  const flow = scenario.source.preservedFlow.split("→").map((part) => part.trim()).filter(Boolean);
  return {
    input: sentence(`${flow[0] || scenario.source.value}을 입력으로 받는다`),
    process: sentence(`${flow[1] || scenario.source.detail}을 한 번 처리한다`),
    immediate_result: sentence(`${flow.slice(2).join(" → ") || scenario.twists[0].resultTitle} 결과를 바로 보여준다`),
    need_moment: sentence(`${scenario.moments.map((moment) => moment.value).join(" / ")} 같은 순간에 찾는다`),
    advantage: sentence(`${scenario.source.value} ${scenario.source.evidence}`),
  };
}

const manifest = readJsonl(MANIFEST_PATH);
const coverage = readJsonl(COVERAGE_PATH);
const coverageByKey = new Map(coverage.map((row) => [`${row.dataset}:${row.source_id}`, row]));
const sourceCatalog = loadSourceCatalog();
const scenarios = loadScenarios();
const scenariosById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
const { decisions: batchDecisions, byBatch: batchDecisionsByBatch } = loadBatchDecisions();
const batchAudits = loadBatchAudits();

function assertScenarioResearchLinks() {
  const scenarioByResearchKey = new Map();
  for (const scenario of scenarios) {
    const research = scenario.source.research;
    if (!research || typeof research.key !== "string" || typeof research.url !== "string" || !research.url) {
      throw new Error(`${scenario.id}: source.research.key and source.research.url are required`);
    }
    if (!RESEARCH_KEY_PATTERN.test(research.key)) {
      throw new Error(`${scenario.id}: unsupported research key ${research.key}`);
    }
    if (scenarioByResearchKey.has(research.key)) {
      throw new Error(`${scenario.id}: research key is already used by ${scenarioByResearchKey.get(research.key)}`);
    }
    const coverageRow = coverageByKey.get(research.key);
    if (!coverageRow) throw new Error(`${scenario.id}: research key is missing from coverage: ${research.key}`);
    if (coverageRow.url !== research.url) {
      throw new Error(`${scenario.id}: research URL does not exactly match coverage for ${research.key}`);
    }
    const matchedScenarioIds = coverageRow.matched_scenario_ids || [];
    if (matchedScenarioIds.length !== 1 || matchedScenarioIds[0] !== scenario.id) {
      throw new Error(`${scenario.id}: coverage must directly link exactly one scenario for ${research.key}`);
    }
    scenarioByResearchKey.set(research.key, scenario.id);
  }
  if (scenarioByResearchKey.size !== scenarios.length) {
    throw new Error(`Scenario research link count mismatch: ${scenarioByResearchKey.size} / ${scenarios.length}`);
  }
}

assertScenarioResearchLinks();

function batchDecisionCounts(rows) {
  return rows.reduce((counts, row) => {
    counts[row.decision] = (counts[row.decision] || 0) + 1;
    return counts;
  }, {});
}

function normalizedCounts(counts) {
  return Object.fromEntries(Object.entries(counts || {}).sort(([left], [right]) => left.localeCompare(right)));
}

function substantiveSentence(value) {
  const text = String(value || "")
    .replace(/^\s*[^:]+:\s*/, "")
    .replace(/[.。!?\s]/g, "");
  return text.length >= 4 && !/^(없음|미상|불명|n\/a|null|unknown)$/i.test(text);
}

function assertPassedBatchDecisionIntegrity() {
  const manifestByBatch = new Map();
  for (const row of manifest) {
    const rows = manifestByBatch.get(row.batch_id) || [];
    rows.push(row);
    manifestByBatch.set(row.batch_id, rows);
  }

  for (const [batchId, decisions] of batchDecisionsByBatch) {
    const audit = batchAudits.get(batchId);
    if (!audit || audit.status !== "passed") {
      throw new Error(`${batchId}: decision rows cannot enter the final ledger without a passed batch audit`);
    }
    const sources = manifestByBatch.get(batchId) || [];
    if (sources.length === 0) throw new Error(`${batchId}: decision rows have no manifest sources`);
    const sourceKeys = new Set(sources.map((row) => row.key));
    const decisionKeys = new Set(decisions.map((row) => row.key));
    const unexpected = [...decisionKeys].filter((key) => !sourceKeys.has(key));
    if (unexpected.length) throw new Error(`${batchId}: decisions outside the manifest: ${unexpected.slice(0, 5).join(", ")}`);
    const appCoveredKeys = new Set(sources
      .filter((row) => coverageByKey.get(row.key)?.matched_scenario_ids?.length > 0)
      .map((row) => row.key));
    const missing = [...sourceKeys].filter((key) => !appCoveredKeys.has(key) && !decisionKeys.has(key));
    if (missing.length) throw new Error(`${batchId}: unresolved sources missing decisions: ${missing.slice(0, 5).join(", ")}`);
    const incomplete = decisions.filter((row) => {
      const sentences = row.five_sentences || {};
      return !row.decision_reason || !row.reviewed_at
        || ["input", "process", "immediate_result", "need_moment", "advantage"]
          .some((field) => !substantiveSentence(sentences[field]));
    });
    if (incomplete.length) {
      throw new Error(`${batchId}: decisions with incomplete five-sentence evidence: ${incomplete.slice(0, 5).map((row) => row.key).join(", ")}`);
    }
    if (audit.source_rows !== undefined && Number(audit.source_rows) !== sources.length) {
      throw new Error(`${batchId}: audit source_rows ${audit.source_rows} does not match manifest ${sources.length}`);
    }
    if (audit.decision_rows !== undefined && Number(audit.decision_rows) !== decisions.length) {
      throw new Error(`${batchId}: audit decision_rows ${audit.decision_rows} does not match decision file ${decisions.length}`);
    }
    if (audit.decision_counts !== undefined && JSON.stringify(normalizedCounts(audit.decision_counts)) !== JSON.stringify(normalizedCounts(batchDecisionCounts(decisions)))) {
      throw new Error(`${batchId}: audit decision_counts do not match the decision file`);
    }
  }
}

assertPassedBatchDecisionIntegrity();

const task2Priority = new Map([
  ["deep_review", 4],
  ["custom_reserve", 3],
  ["merge_material", 2],
  ["reject", 1],
]);
const task2ByKey = new Map();
for (const row of readJsonl(TASK2_PATH)) {
  const existing = task2ByKey.get(row.key);
  if (!existing || task2Priority.get(row.audit_decision) > task2Priority.get(existing.audit_decision)) {
    task2ByKey.set(row.key, row);
  }
}

const task2Decision = {
  reject: "Fail",
  deep_review: "Candidate",
  merge_material: "Merge",
  custom_reserve: "Reserve",
};

const finalRows = manifest.map((row) => {
  const coverageRow = coverageByKey.get(row.key);
  if (!coverageRow) throw new Error(`Coverage row missing: ${row.key}`);
  const matchedScenarios = coverageRow.matched_scenario_ids.map((id) => scenariosById.get(id));
  if (matchedScenarios.some((scenario) => !scenario)) {
    throw new Error(`Unknown matched scenario for ${row.key}`);
  }
  const batchDecision = batchDecisions.get(row.key);
  const imported = task2ByKey.get(row.key);
  const sourceText = sourceCatalog.get(row.key);
  if (!sourceText) throw new Error(`Source text missing: ${row.key}`);

  let reviewState = "pending";
  let decision = null;
  let decisionReason = null;
  let rejectionCode = null;
  let fiveSentences = {
    input: null,
    process: null,
    immediate_result: null,
    need_moment: null,
    advantage: null,
  };
  let reviewedAt = null;
  let reviewSource = null;

  if (matchedScenarios.length > 0) {
    const scenario = matchedScenarios[0];
    reviewState = "finalized";
    decision = "Existing";
    decisionReason = `앱 시나리오 ${coverageRow.matched_scenario_ids.join(", ")}와 정확히 연결됐고 3×3×3 카드 감사를 통과했다.`;
    rejectionCode = null;
    fiveSentences = batchDecision?.five_sentences || existingFiveSentences(scenario);
    reviewedAt = batchDecision?.reviewed_at || "2026-07-14";
    reviewSource = batchDecision
      ? "app_source_coverage+batch_manual_review"
      : "app_source_coverage";
  } else if (batchDecision) {
    reviewState = "finalized";
    decision = batchDecision.decision;
    decisionReason = batchDecision.decision_reason;
    rejectionCode = batchDecision.rejection_code || null;
    fiveSentences = batchDecision.five_sentences;
    reviewedAt = batchDecision.reviewed_at;
    reviewSource = batchDecision.review_source || "batch_manual_review";
  } else if (imported) {
    reviewState = "imported_needs_normalization";
    reviewSource = "task2_filter_audit";
  }

  return {
    batch_id: row.batch_id,
    batch_position: row.batch_position,
    key: row.key,
    dataset: row.dataset,
    source_id: row.source_id,
    name: row.name,
    url: row.url,
    category: row.category,
    priority_score: row.priority_score,
    source_text: sourceText,
    needs_enrichment: row.experiments.X01_source_integrity === "needs_enrichment",
    market_signal: coverageRow.market_signal,
    matched_scenario_ids: coverageRow.matched_scenario_ids,
    review_state: reviewState,
    five_sentences: fiveSentences,
    decision,
    decision_reason: decisionReason,
    rejection_code: rejectionCode,
    reviewed_at: reviewedAt,
    review_source: reviewSource,
    provisional_decision: imported && matchedScenarios.length === 0
      ? task2Decision[imported.audit_decision]
      : null,
    provisional_reason: imported && matchedScenarios.length === 0 ? imported.audit_reason : null,
  };
});

const uniqueKeys = new Set(finalRows.map((row) => row.key));
if (finalRows.length !== 8406 || uniqueKeys.size !== 8406) {
  throw new Error(`Final ledger integrity failed: rows=${finalRows.length}, unique=${uniqueKeys.size}`);
}

const stateCounts = finalRows.reduce((counts, row) => {
  counts[row.review_state] = (counts[row.review_state] || 0) + 1;
  return counts;
}, {});
const decisionCounts = finalRows.filter((row) => row.decision).reduce((counts, row) => {
  counts[row.decision] = (counts[row.decision] || 0) + 1;
  return counts;
}, {});
const fullyReviewedBatches = [...new Set(finalRows.map((row) => row.batch_id))].filter((batchId) => {
  const rows = finalRows.filter((row) => row.batch_id === batchId);
  return rows.every((row) => row.review_state === "finalized");
});
const completedBatches = fullyReviewedBatches.filter((batchId) => batchAudits.get(batchId)?.status === "passed");
const legacyRows = readJsonl(LEGACY_PATH);

fs.writeFileSync(OUTPUT_PATH, `${finalRows.map((row) => JSON.stringify(row)).join("\n")}\n`);

const summary = `# 아이디어 원본 최종 판정 통합 원장

생성일: ${new Date().toISOString()}  
생성 스크립트: \`scripts/research/build-idea-source-final-ledger.mjs\`  
기계 판독 원장: \`docs/research/idea-source-final-ledger.jsonl\`

## 현재 진행률

- 전체 원본: **${finalRows.length.toLocaleString()}개**
- 최종 판정 완료: **${(stateCounts.finalized || 0).toLocaleString()}개**
- 기존 수동 감사는 있으나 다섯 문장 정규화가 남음: **${(stateCounts.imported_needs_normalization || 0).toLocaleString()}개**
- 아직 판정 전: **${(stateCounts.pending || 0).toLocaleString()}개**
- 100개 판정은 끝났으나 Fail 재감사 미통과: **${fullyReviewedBatches.filter((batchId) => !completedBatches.includes(batchId)).length}개**${fullyReviewedBatches.filter((batchId) => !completedBatches.includes(batchId)).length ? ` — ${fullyReviewedBatches.filter((batchId) => !completedBatches.includes(batchId)).join(", ")}` : ""}
- 완료 배치: **${completedBatches.length}개**${completedBatches.length ? ` — ${completedBatches.join(", ")}` : ""}

## 최종 판정 수

${Object.entries(decisionCounts).map(([decision, count]) => `- ${decision}: **${count.toLocaleString()}개**`).join("\n")}

## 기존 기록을 가져온 방법

- 현재 앱과 정확히 연결된 ${scenarios.length}개 원본은 \`Existing\`으로 최종 반영했다.
- 2단계 필터 실험의 고유 원본 ${task2ByKey.size}개 중 앱 원본과 겹치지 않는 ${(stateCounts.imported_needs_normalization || 0).toLocaleString()}개는 기존 판정과 이유를 보존하되, 다섯 문장을 채우기 전에는 최종 완료로 세지 않는다.
- 최근 카드 판정 ${legacyRows.length}개는 \`idea-final-decisions-62.jsonl\`에 원본 키가 없고 한 원본과 1:1 대응하지 않는 아이디어 판정이다. 원본 수를 부풀리지 않기 위해 8,406행에 억지로 매핑하지 않고, Fail·Merge·Reserve 재진입을 막는 판정 사례집으로만 사용한다.

## 완료 기준

모든 행이 \`finalized\`이고, 다섯 문장·판정·구체적 이유가 비어 있지 않아야 한다. 각 100개 배치는 Fail의 10% 재검사를 별도 파일에 남기고 오판율 5% 미만을 확인한 뒤 완료한다.
`;
fs.writeFileSync(SUMMARY_PATH, summary);

process.stdout.write(`${JSON.stringify({
  rows: finalRows.length,
  uniqueKeys: uniqueKeys.size,
  stateCounts,
  decisionCounts,
  fullyReviewedBatches,
  completedBatches,
  task2UniqueKeys: task2ByKey.size,
  legacyCaseRows: legacyRows.length,
  output: path.relative(ROOT, OUTPUT_PATH),
  summary: path.relative(ROOT, SUMMARY_PATH),
}, null, 2)}\n`);
