import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const readJsonl = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const inputs = readJsonl("docs/research/idea-search-demand-pilot-30-input.jsonl");
const results = readJsonl("docs/research/idea-search-demand-pilot-30-results.jsonl");
const analysis = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs/research/idea-search-demand-pilot-analysis.json"), "utf8"),
);

const errors = [];
if (inputs.length !== 30) errors.push(`input rows: expected 30, got ${inputs.length}`);
if (results.length !== 30) errors.push(`result rows: expected 30, got ${results.length}`);
if (new Set(inputs.map((row) => row.key)).size !== inputs.length) errors.push("duplicate input keys");
if (new Set(results.map((row) => row.key)).size !== results.length) errors.push("duplicate result keys");

const resultByKey = new Map(results.map((row) => [row.key, row]));
for (const input of inputs) {
  if (input.keyword_groups.length !== 3) errors.push(`${input.key}: expected 3 keyword groups`);
  for (const group of input.keyword_groups) {
    if (!group.representative || group.keywords.length === 0) errors.push(`${input.key}: empty keyword group`);
    if (group.keywords.length > 20) errors.push(`${input.key}: Naver keyword group exceeds 20`);
  }
  const result = resultByKey.get(input.key);
  if (!result) {
    errors.push(`${input.key}: missing result row`);
    continue;
  }
  if (result.automatic_quality_decision_change !== false) {
    errors.push(`${input.key}: search evidence changed quality decision automatically`);
  }
  if (!result.naver?.status || !result.google?.status) errors.push(`${input.key}: missing collection status`);
  if (result.naver.status !== "collected" && result.naver.groups.length !== 0) {
    errors.push(`${input.key}: unavailable Naver result contains fabricated groups`);
  }
  if (result.naver.status === "collected") {
    if (result.naver.groups.length !== 3) {
      errors.push(`${input.key}: collected Naver result must contain 3 groups`);
    }
    for (const group of result.naver.groups) {
      if (group.points.length !== 24) {
        errors.push(`${input.key}/${group.label}: expected 24 monthly points, got ${group.points.length}`);
      }
      if (!Number.isInteger(group.active_months_last_12)
        || group.active_months_last_12 < 0
        || group.active_months_last_12 > 12) {
        errors.push(`${input.key}/${group.label}: invalid active month count`);
      }
    }
  }
  if (result.google.status !== "collected" && result.google.groups.length !== 0) {
    errors.push(`${input.key}: unavailable Google result contains fabricated groups`);
  }
  const googleUrl = new URL(result.google.public_ui_url);
  if (googleUrl.hostname !== "trends.google.com") errors.push(`${input.key}: invalid Google Trends URL`);
  if ((googleUrl.searchParams.get("q") || "").split(",").length !== 3) {
    errors.push(`${input.key}: Google Trends URL must contain 3 representative terms`);
  }
}

const cohortCounts = Object.fromEntries(
  [...new Set(inputs.map((row) => row.cohort))].map((cohort) => [
    cohort,
    inputs.filter((row) => row.cohort === cohort).length,
  ]),
);
const statusCounts = (source) => Object.fromEntries(
  [...new Set(results.map((row) => row[source].status))].map((status) => [
    status,
    results.filter((row) => row[source].status === status).length,
  ]),
);

if (results.filter((row) => row.naver.status === "collected").length !== 30) {
  errors.push("Naver pilot is not complete: expected 30 collected rows");
}
if (analysis.rows !== 30 || analysis.keyword_groups !== 90) {
  errors.push("analysis summary counts do not match pilot inputs");
}
if (analysis.false_negative_audit.false_negative_rate !== 0.3) {
  errors.push(`expected current-app false-negative rate 0.3, got ${analysis.false_negative_audit.false_negative_rate}`);
}
if (analysis.adoption_decision.use_as_filter !== false
  || analysis.adoption_decision.use_as_automatic_ranking !== false
  || analysis.adoption_decision.use_as_manual_supporting_evidence !== true) {
  errors.push("analysis adoption decision violates the pilot result");
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify({
  rows: inputs.length,
  uniqueKeys: new Set(inputs.map((row) => row.key)).size,
  keywordGroups: inputs.reduce((total, row) => total + row.keyword_groups.length, 0),
  cohorts: cohortCounts,
  naverStatuses: statusCounts("naver"),
  googleStatuses: statusCounts("google"),
  automaticDecisionChanges: results.filter((row) => row.automatic_quality_decision_change).length,
  status: "ok",
}, null, 2)}\n`);
