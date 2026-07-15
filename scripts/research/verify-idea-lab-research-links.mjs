import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const DATA_PATH = path.join(
  ROOT,
  "src/components/organisms/idea-lab/sample-data.ts",
);
const COVERAGE_PATH = path.join(
  ROOT,
  "docs/research/idea-source-coverage.jsonl",
);
const LEDGER_PATH = path.join(
  ROOT,
  "docs/research/idea-source-final-ledger.jsonl",
);
const RESEARCH_KEY_PATTERN = /^(trustmrr|app_store|chrome_web_store):.+$/;

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

function exactScenarioMatch(row, scenarioId) {
  const matched = row?.matched_scenario_ids || [];
  return matched.length === 1 && matched[0] === scenarioId;
}

const scenarios = loadScenarios();
const coverage = readJsonl(COVERAGE_PATH);
const coverageByKey = new Map(
  coverage.map((row) => [`${row.dataset}:${row.source_id}`, row]),
);
const ledger = fs.existsSync(LEDGER_PATH) ? readJsonl(LEDGER_PATH) : [];
const ledgerByKey = new Map(ledger.map((row) => [row.key, row]));
const errors = [];
const scenarioIds = new Set();
const scenarioByResearchKey = new Map();

if (scenarios.length !== 100) {
  errors.push(`expected 100 app scenarios, got ${scenarios.length}`);
}

for (const scenario of scenarios) {
  if (scenarioIds.has(scenario.id))
    errors.push(`duplicate scenario id: ${scenario.id}`);
  scenarioIds.add(scenario.id);

  const research = scenario.source.research;
  if (
    !research ||
    typeof research.key !== "string" ||
    typeof research.url !== "string" ||
    !research.url
  ) {
    errors.push(
      `${scenario.id}: source.research.key and source.research.url are required`,
    );
    continue;
  }
  if (!RESEARCH_KEY_PATTERN.test(research.key)) {
    errors.push(`${scenario.id}: unsupported research key ${research.key}`);
  }
  if (scenarioByResearchKey.has(research.key)) {
    errors.push(
      `${scenario.id}: duplicate research key also used by ${scenarioByResearchKey.get(research.key)}`,
    );
  }
  scenarioByResearchKey.set(research.key, scenario.id);

  const coverageRow = coverageByKey.get(research.key);
  if (!coverageRow) {
    errors.push(
      `${scenario.id}: coverage is missing research key ${research.key}`,
    );
  } else {
    if (coverageRow.url !== research.url) {
      errors.push(`${scenario.id}: coverage URL mismatch for ${research.key}`);
    }
    if (!exactScenarioMatch(coverageRow, scenario.id)) {
      errors.push(
        `${scenario.id}: coverage must map ${research.key} to exactly this scenario`,
      );
    }
  }

  if (ledger.length > 0) {
    const ledgerRow = ledgerByKey.get(research.key);
    if (!ledgerRow) {
      errors.push(
        `${scenario.id}: final ledger is missing research key ${research.key}`,
      );
    } else {
      if (ledgerRow.url !== research.url) {
        errors.push(
          `${scenario.id}: final ledger URL mismatch for ${research.key}`,
        );
      }
      if (!exactScenarioMatch(ledgerRow, scenario.id)) {
        errors.push(
          `${scenario.id}: final ledger must map ${research.key} to exactly this scenario`,
        );
      }
      if (
        ledgerRow.review_state !== "finalized" ||
        ledgerRow.decision !== "Existing"
      ) {
        errors.push(
          `${scenario.id}: linked ledger row must be finalized Existing`,
        );
      }
    }
  }
}

const coverageLinkedRows = coverage.filter(
  (row) => (row.matched_scenario_ids || []).length > 0,
);
for (const row of coverageLinkedRows) {
  const key = `${row.dataset}:${row.source_id}`;
  const scenarioId = exactScenarioMatch(row, row.matched_scenario_ids[0])
    ? row.matched_scenario_ids[0]
    : null;
  if (!scenarioId || scenarioByResearchKey.get(key) !== scenarioId) {
    errors.push(`coverage has a non-canonical app link: ${key}`);
  }
}

if (scenarioByResearchKey.size !== scenarios.length) {
  errors.push(
    `research key count mismatch: ${scenarioByResearchKey.size} / ${scenarios.length}`,
  );
}
if (coverageLinkedRows.length !== scenarios.length) {
  errors.push(
    `coverage linked-row count mismatch: ${coverageLinkedRows.length} / ${scenarios.length}`,
  );
}
const existingLedgerRows = ledger.filter((row) => row.decision === "Existing");
if (ledger.length > 0 && existingLedgerRows.length !== 100) {
  errors.push(
    `expected 100 Existing ledger rows, got ${existingLedgerRows.length}`,
  );
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      scenarios: scenarios.length,
      uniqueResearchKeys: scenarioByResearchKey.size,
      coverageLinks: coverageLinkedRows.length,
      existingLedgerRows: existingLedgerRows.length,
      ledgerChecked: ledger.length > 0,
      status: "ok",
    },
    null,
    2,
  )}\n`,
);
