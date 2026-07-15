import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const CANDIDATE_PATH = path.join(
  ROOT,
  "docs/dev/experiments/idea-lab/qa/exh001-candidate-nine-draft.json",
);
const RUNTIME_PATH = path.join(
  ROOT,
  "src/components/organisms/idea-lab/sample-data.ts",
);
const OUTPUT_PATH = path.join(
  ROOT,
  "docs/research/idea-exh001-candidate-nine-combinations.jsonl",
);
const LATIN_OUTPUT_PATH = path.join(
  ROOT,
  "docs/research/idea-exh001-candidate-nine-latin-audit.jsonl",
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
const errors = [];
const allowedPlatforms = new Set(["web", "app", "plugin"]);
const forbiddenMvpPattern = /자동 발행|자동 게시|앱스토어 배포|대규모 크롤링|사이트 전체 순회|상대방이 앱을 설치/;

if (candidates.length !== 9) errors.push(`expected 9 candidates, got ${candidates.length}`);

for (const scenario of candidates) {
  if (scenario.payers.length !== 3 || scenario.moments.length !== 3 || scenario.twists.length !== 3) {
    errors.push(`${scenario.id}: expected 3 payers × 3 moments × 3 twists`);
  }
  if (!allowedPlatforms.has(scenario.source.platform)) {
    errors.push(`${scenario.id}: invalid source platform ${scenario.source.platform}`);
  }
  for (const item of [scenario.source, ...scenario.payers, ...scenario.moments, ...scenario.twists]) {
    if (!item.id || !item.value || !item.detail) errors.push(`${scenario.id}: incomplete card ${item.id || "unknown"}`);
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

const runtimeIds = new Set(collectIds(runtime));
const runtimeIdCollisions = candidateIds.filter((id) => runtimeIds.has(id));
if (runtimeIdCollisions.length > 0) {
  errors.push(`runtime id collisions: ${runtimeIdCollisions.join(", ")}`);
}

const runtimeSourceNames = new Set(runtime.map((scenario) => scenario.source.sourceName));
const existingSources = candidates
  .map((scenario) => scenario.source.sourceName)
  .filter((sourceName) => runtimeSourceNames.has(sourceName));
if (existingSources.length > 0) {
  errors.push(`candidate sources already exist in runtime: ${existingSources.join(", ")}`);
}

const combinations = candidates.flatMap((scenario) => scenario.payers.flatMap((payer) => (
  scenario.moments.flatMap((moment) => scenario.twists.map((twist) => ({
    id: `${scenario.id}__${payer.id}__${moment.id}__${twist.id}`,
    scenario_id: scenario.id,
    source_name: scenario.source.sourceName,
    payer_id: payer.id,
    payer: payer.value,
    moment_id: moment.id,
    moment: moment.value,
    twist_id: twist.id,
    twist: twist.value,
    result_title: twist.resultTitle,
    smallest_build: twist.smallestBuild,
    sentence: `${payer.value}가 ${moment.value}에 쓰는 ${twist.resultTitle}`,
    hard_gate_status: "pass",
  })))
)));

if (combinations.length !== 243) {
  errors.push(`expected 243 combinations, got ${combinations.length}`);
}

const latinIndexes = [
  [0, 0, 0], [0, 1, 1], [0, 2, 2],
  [1, 0, 1], [1, 1, 2], [1, 2, 0],
  [2, 0, 2], [2, 1, 0], [2, 2, 1],
];
const latinCombinations = candidates.flatMap((scenario) => latinIndexes.map(([payer, moment, twist]) => {
  const combinationId = `${scenario.id}__${scenario.payers[payer].id}__${scenario.moments[moment].id}__${scenario.twists[twist].id}`;
  return {
    id: combinationId,
    scenario_id: scenario.id,
    payer_index: payer,
    moment_index: moment,
    twist_index: twist,
    sentence: `${scenario.payers[payer].value}가 ${scenario.moments[moment].value}에 쓰는 ${scenario.twists[twist].resultTitle}`,
    hard_gate_status: "pass",
  };
}));

if (latinCombinations.length !== 81) {
  errors.push(`expected 81 Latin combinations, got ${latinCombinations.length}`);
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

fs.writeFileSync(
  OUTPUT_PATH,
  `${combinations.map((combination) => JSON.stringify(combination)).join("\n")}\n`,
);
fs.writeFileSync(
  LATIN_OUTPUT_PATH,
  `${latinCombinations.map((combination) => JSON.stringify(combination)).join("\n")}\n`,
);

process.stdout.write(`${JSON.stringify({
  candidates: candidates.length,
  runtimeScenarios: runtime.length,
  payers: candidates.reduce((total, scenario) => total + scenario.payers.length, 0),
  moments: candidates.reduce((total, scenario) => total + scenario.moments.length, 0),
  twists: candidates.reduce((total, scenario) => total + scenario.twists.length, 0),
  latinCombinations: latinCombinations.length,
  combinations: combinations.length,
  duplicateCandidateIds,
  runtimeIdCollisions,
  existingSources,
  output: path.relative(ROOT, OUTPUT_PATH),
  latinOutput: path.relative(ROOT, LATIN_OUTPUT_PATH),
  status: "candidate-ok",
}, null, 2)}\n`);
