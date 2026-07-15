import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const DATA_PATH = path.join(
  ROOT,
  "src/components/organisms/idea-lab/sample-data.ts",
);
const RUNTIME_PATH = path.join(
  ROOT,
  "docs/research/idea-runtime-combinations-2026-07-15.jsonl",
);

function readJsonl(file) {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          `${path.relative(ROOT, file)}:${index + 1}: ${error.message}`,
        );
      }
    });
}

function loadScenarios() {
  const source = fs.readFileSync(DATA_PATH, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const evaluatedModule = { exports: {} };
  new Function("exports", "module", "require", javascript)(
    evaluatedModule.exports,
    evaluatedModule,
    () => ({}),
  );
  return evaluatedModule.exports.IDEA_LAB_SCENARIOS;
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const scenarios = loadScenarios();
const runtimeRows = readJsonl(RUNTIME_PATH);
const errors = [];
const scenarioIds = new Set();
const researchKeys = new Set();
const expectedCombinationIds = new Set();

if (scenarios.length !== 100)
  errors.push(`expected 100 scenarios, got ${scenarios.length}`);

for (const scenario of scenarios) {
  if (scenarioIds.has(scenario.id))
    errors.push(`duplicate scenario id: ${scenario.id}`);
  scenarioIds.add(scenario.id);

  const researchKey = scenario.source?.research?.key;
  if (!nonempty(researchKey))
    errors.push(`${scenario.id}: missing research key`);
  if (researchKeys.has(researchKey))
    errors.push(`${scenario.id}: duplicate research key ${researchKey}`);
  researchKeys.add(researchKey);

  for (const [axis, items] of [
    ["payer", scenario.payers],
    ["moment", scenario.moments],
    ["twist", scenario.twists],
  ]) {
    if (!Array.isArray(items) || items.length !== 3) {
      errors.push(`${scenario.id}: expected exactly 3 ${axis} cards`);
      continue;
    }
    if (new Set(items.map((item) => item.id)).size !== 3) {
      errors.push(`${scenario.id}: duplicate ${axis} card ids`);
    }
    if (new Set(items.map((item) => item.value.trim())).size !== 3) {
      errors.push(`${scenario.id}: duplicate ${axis} card values`);
    }
    for (const item of items) {
      if (![item.id, item.value, item.detail].every(nonempty)) {
        errors.push(
          `${scenario.id}: incomplete ${axis} card ${item.id || "unknown"}`,
        );
      }
    }
  }

  for (const twist of scenario.twists) {
    if (
      ![
        twist.resultTitle,
        twist.smallestBuild,
        twist.platform,
        twist.kind,
      ].every(nonempty)
    ) {
      errors.push(`${scenario.id}: incomplete twist result ${twist.id}`);
    }
  }

  for (const payer of scenario.payers) {
    for (const moment of scenario.moments) {
      for (const twist of scenario.twists) {
        expectedCombinationIds.add(
          [scenario.id, payer.id, moment.id, twist.id].join("__"),
        );
      }
    }
  }
}

const runtimeIds = runtimeRows.map((row) => row.id);
const runtimeIdSet = new Set(runtimeIds);
if (expectedCombinationIds.size !== 2700) {
  errors.push(
    `expected 2,700 generated combinations, got ${expectedCombinationIds.size}`,
  );
}
if (runtimeRows.length !== 2700)
  errors.push(
    `runtime artifact must have 2,700 rows, got ${runtimeRows.length}`,
  );
if (runtimeIdSet.size !== runtimeRows.length)
  errors.push("runtime artifact has duplicate combination ids");

const missingRuntimeIds = [...expectedCombinationIds].filter(
  (id) => !runtimeIdSet.has(id),
);
const unexpectedRuntimeIds = [...runtimeIdSet].filter(
  (id) => !expectedCombinationIds.has(id),
);
if (missingRuntimeIds.length) {
  errors.push(
    `runtime artifact is missing combinations: ${missingRuntimeIds.slice(0, 5).join(", ")}`,
  );
}
if (unexpectedRuntimeIds.length) {
  errors.push(
    `runtime artifact has unexpected combinations: ${unexpectedRuntimeIds.slice(0, 5).join(", ")}`,
  );
}

const runtimeCountsByScenario = runtimeRows.reduce((counts, row) => {
  counts[row.scenarioId] = (counts[row.scenarioId] || 0) + 1;
  return counts;
}, {});
for (const scenario of scenarios) {
  if (runtimeCountsByScenario[scenario.id] !== 27) {
    errors.push(
      `${scenario.id}: runtime artifact must contain exactly 27 combinations`,
    );
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      scenarios: scenarios.length,
      uniqueScenarioIds: scenarioIds.size,
      uniqueResearchKeys: researchKeys.size,
      payers: scenarios.reduce(
        (total, scenario) => total + scenario.payers.length,
        0,
      ),
      moments: scenarios.reduce(
        (total, scenario) => total + scenario.moments.length,
        0,
      ),
      twists: scenarios.reduce(
        (total, scenario) => total + scenario.twists.length,
        0,
      ),
      generatedCombinations: expectedCombinationIds.size,
      runtimeArtifactRows: runtimeRows.length,
      uniqueRuntimeIds: runtimeIdSet.size,
      status: "ok",
    },
    null,
    2,
  )}\n`,
);
