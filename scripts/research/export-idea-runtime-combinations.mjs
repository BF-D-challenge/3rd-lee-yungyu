import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "src/components/organisms/idea-lab/sample-data.ts");

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function applyOverrides(scenarios) {
  const overridesFile = option("--overrides-file");
  if (!overridesFile) return scenarios;
  const overrides = JSON.parse(fs.readFileSync(path.resolve(ROOT, overridesFile), "utf8"));
  return scenarios.map((scenario) => ({ ...scenario, ...(overrides[scenario.id] || {}) }));
}

function filterScenarios(scenarios) {
  const scenarioIds = option("--scenario-ids");
  if (!scenarioIds) return scenarios;
  const allowed = new Set(scenarioIds.split(",").filter(Boolean));
  return scenarios.filter((scenario) => allowed.has(scenario.id));
}

function loadRuntimeData() {
  const source = fs.readFileSync(DATA_PATH, "utf8");
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

function loadScenarios() {
  const candidateFile = option("--candidate-file");
  if (!candidateFile) return filterScenarios(applyOverrides(loadRuntimeData()));
  const parsed = JSON.parse(fs.readFileSync(path.resolve(ROOT, candidateFile), "utf8"));
  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  const scenarios = process.argv.includes("--include-runtime")
    ? [...loadRuntimeData(), ...candidates]
    : candidates;
  return filterScenarios(applyOverrides(scenarios));
}

function embeddingText(scenario, payer, moment, twist) {
  return [
    `조합 요약: ${payer.value}가 ${moment.value}에 쓰는 ${twist.resultTitle}.`,
    `타겟: ${payer.value}. 반복 행동: ${payer.detail}`,
    `필요한 순간: ${moment.value}. 통증: ${moment.detail}.`,
    `변화: ${twist.resultTitle}. ${twist.value}. ${twist.detail} 오늘 만들 결과: ${twist.smallestBuild}.`,
    `제품 핵심: ${scenario.source.value}.`,
    `검증된 흐름: ${scenario.source.preservedFlow}.`,
  ].join(" ");
}

function sourceText(scenario) {
  return [
    `해외 원본: ${scenario.source.sourceName}.`,
    `제품 핵심: ${scenario.source.value}.`,
    `상세 작동: ${scenario.source.detail}.`,
    `검증된 흐름: ${scenario.source.preservedFlow}.`,
  ].join(" ");
}

function fidelityText(scenario, twist) {
  return [
    `해외 원본과 동일하게 유지: ${scenario.source.sourceName}.`,
    `제품 핵심: ${scenario.source.value}.`,
    `상세 작동: ${scenario.source.detail}.`,
    `검증된 흐름: ${scenario.source.preservedFlow}.`,
    `MVP에서 적용할 한 끗: ${twist.resultTitle}.`,
  ].join(" ");
}

const scenarios = loadScenarios();
const records = [];
for (const scenario of scenarios) {
  for (const payer of scenario.payers) {
    for (const moment of scenario.moments) {
      for (const twist of scenario.twists) {
        const record = {
          id: [scenario.id, payer.id, moment.id, twist.id].join("__"),
          scenarioId: scenario.id,
          sourceName: scenario.source.sourceName,
          source_key: scenario.source.research?.key ?? null,
          source_url: scenario.source.research?.url ?? null,
          payerId: payer.id,
          payer: payer.value,
          momentId: moment.id,
          moment: moment.value,
          twistIds: [twist.id],
          twistTitles: [twist.resultTitle],
          twistCount: 1,
          text: embeddingText(scenario, payer, moment, twist),
          sourceText: sourceText(scenario),
          fidelityText: fidelityText(scenario, twist),
        };
        records.push(record);
      }
    }
  }
}

const expected = scenarios.length * 27;
if (records.length !== expected) {
  throw new Error(`예상한 런타임 조합 수와 다릅니다: ${records.length} / ${expected}`);
}

const outputFile = option("--output");
const output = `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
if (outputFile) {
  fs.writeFileSync(path.resolve(ROOT, outputFile), output);
} else {
  process.stdout.write(output);
}
