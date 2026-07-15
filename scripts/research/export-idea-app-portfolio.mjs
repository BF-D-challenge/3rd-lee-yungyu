import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "src/components/organisms/idea-lab/sample-data.ts");
const OUTPUT = path.join(ROOT, "docs/research/idea-app-portfolio.json");

const source = fs.readFileSync(INPUT, "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluatedModule = { exports: {} };
new Function("exports", "module", "require", javascript)(
  evaluatedModule.exports,
  evaluatedModule,
  () => ({}),
);

const scenarios = evaluatedModule.exports.IDEA_LAB_SCENARIOS;
const portfolio = scenarios.map((scenario) => ({
  id: scenario.id,
  source_name: scenario.source.sourceName,
  source_key: scenario.source.research.key,
  source_url: scenario.source.research.url,
  mechanism: scenario.source.value,
  flow: scenario.source.preservedFlow,
  result_titles: scenario.twists.map((twist) => twist.resultTitle),
}));

fs.writeFileSync(OUTPUT, `${JSON.stringify(portfolio, null, 2)}\n`);
console.log(JSON.stringify({
  scenarios: portfolio.length,
  combinations: portfolio.length * 27,
  output: path.relative(ROOT, OUTPUT),
}, null, 2));
