import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const CANDIDATE_PATH = path.join(
  ROOT,
  "docs/dev/experiments/idea-lab/qa/task4-candidate-five-draft.json",
);
const RUNTIME_PATH = path.join(
  ROOT,
  "src/components/organisms/idea-lab/sample-data.ts",
);
const OUTPUT_PATH = path.join(
  ROOT,
  "docs/research/idea-task4-candidate-five-combinations.jsonl",
);

function loadRuntimeScenarios() {
  const source = fs.readFileSync(RUNTIME_PATH, "utf8");
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

function collectIds(scenarios) {
  return scenarios.flatMap((scenario) => [
    scenario.id,
    scenario.source.id,
    ...scenario.payers.map((item) => item.id),
    ...scenario.moments.map((item) => item.id),
    ...scenario.twists.map((item) => item.id),
  ]);
}

const candidates = JSON.parse(fs.readFileSync(CANDIDATE_PATH, "utf8"));
const runtime = loadRuntimeScenarios();
const allowPromoted = process.argv.includes("--allow-promoted");
const errors = [];
const allowedPlatforms = new Set(["web", "app", "plugin"]);
const forbiddenMvpPattern = /OAuth|자동 발행|자동 게시|백그라운드|앱스토어 배포|대규모 크롤링|사이트 전체 순회|로그인 계정/;

if (candidates.length !== 5) errors.push(`expected 5 candidates, got ${candidates.length}`);

for (const scenario of candidates) {
  if (scenario.payers.length !== 3 || scenario.moments.length !== 3 || scenario.twists.length !== 3) {
    errors.push(`${scenario.id}: expected 3 payers × 3 moments × 3 twists`);
  }
  if (!allowedPlatforms.has(scenario.source.platform)) {
    errors.push(`${scenario.id}: invalid source platform ${scenario.source.platform}`);
  }
  for (const group of [scenario.payers, scenario.moments, scenario.twists]) {
    for (const item of group) {
      if (!item.id || !item.value || !item.detail) errors.push(`${scenario.id}: incomplete card`);
    }
  }
  for (const twist of scenario.twists) {
    if (!allowedPlatforms.has(twist.platform)) {
      errors.push(`${scenario.id}/${twist.id}: invalid twist platform ${twist.platform}`);
    }
    if (!twist.resultTitle || !twist.smallestBuild) {
      errors.push(`${scenario.id}/${twist.id}: incomplete result definition`);
    }
    if (forbiddenMvpPattern.test(twist.smallestBuild)) {
      errors.push(`${scenario.id}/${twist.id}: forbidden MVP dependency`);
    }
  }
}

const candidateIds = collectIds(candidates);
const duplicateCandidateIds = [...new Set(
  candidateIds.filter((id, index) => candidateIds.indexOf(id) !== index),
)];
if (duplicateCandidateIds.length > 0) {
  errors.push(`duplicate candidate ids: ${duplicateCandidateIds.join(", ")}`);
}

const runtimeIdList = collectIds(runtime);
const duplicateRuntimeIds = [...new Set(
  runtimeIdList.filter((id, index) => runtimeIdList.indexOf(id) !== index),
)];
if (duplicateRuntimeIds.length > 0) {
  errors.push(`duplicate runtime ids: ${duplicateRuntimeIds.join(", ")}`);
}

const runtimeIds = new Set(runtimeIdList);
const runtimeIdCollisions = candidateIds.filter((id) => runtimeIds.has(id));
if (!allowPromoted && runtimeIdCollisions.length > 0) {
  errors.push(`runtime id collisions: ${runtimeIdCollisions.join(", ")}`);
}

const runtimeSourceNames = new Set(runtime.map((scenario) => scenario.source.sourceName));
const existingSources = candidates
  .map((scenario) => scenario.source.sourceName)
  .filter((sourceName) => runtimeSourceNames.has(sourceName));
if (!allowPromoted && existingSources.length > 0) {
  errors.push(`candidate sources already exist in runtime: ${existingSources.join(", ")}`);
}

const runtimeById = new Map(runtime.map((scenario) => [scenario.id, scenario]));
const promotedMismatches = allowPromoted
  ? candidates.filter((candidate) => (
    JSON.stringify(runtimeById.get(candidate.id)) !== JSON.stringify(candidate)
  )).map((candidate) => candidate.id)
  : [];
if (promotedMismatches.length > 0) {
  errors.push(`promoted candidates differ from audited drafts: ${promotedMismatches.join(", ")}`);
}

const combinations = candidates.flatMap((scenario) => scenario.payers.flatMap((payer) => (
  scenario.moments.flatMap((moment) => scenario.twists.map((twist) => ({
    id: `${scenario.id}__${payer.id}__${moment.id}__${twist.id}`,
    scenario_id: scenario.id,
    source_name: scenario.source.sourceName,
    payer: payer.value,
    moment: moment.value,
    twist: twist.value,
    result_title: twist.resultTitle,
    smallest_build: twist.smallestBuild,
    sentence: `${payer.value}가 ${moment.value}에 쓰는 ${twist.resultTitle}`,
    structural_status: "pass",
  })))
)));

if (combinations.length !== 135) {
  errors.push(`expected 135 combinations, got ${combinations.length}`);
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

fs.writeFileSync(
  OUTPUT_PATH,
  `${combinations.map((combination) => JSON.stringify(combination)).join("\n")}\n`,
);

process.stdout.write(`${JSON.stringify({
  candidates: candidates.length,
  runtimeScenarios: runtime.length,
  payers: candidates.reduce((total, scenario) => total + scenario.payers.length, 0),
  moments: candidates.reduce((total, scenario) => total + scenario.moments.length, 0),
  twists: candidates.reduce((total, scenario) => total + scenario.twists.length, 0),
  combinations: combinations.length,
  duplicateCandidateIds,
  duplicateRuntimeIds,
  runtimeIdCollisions,
  existingSources,
  promotedMismatches,
  output: path.relative(ROOT, OUTPUT_PATH),
  status: allowPromoted ? "promoted-ok" : "candidate-ok",
}, null, 2)}\n`);
