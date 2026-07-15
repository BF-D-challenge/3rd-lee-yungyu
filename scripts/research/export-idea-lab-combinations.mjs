import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "src/components/organisms/idea-lab/sample-data.ts");

function loadData() {
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

function combinationsOf(items, size) {
  if (size === 1) return items.map((item) => [item]);
  const combinations = [];
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      combinations.push([items[left], items[right]]);
    }
  }
  return combinations;
}

function embeddingText(scenario, payer, moment, twists) {
  const changes = twists
    .map(
      (twist, index) =>
        `변화 ${index + 1}: ${twist.resultTitle}. ${twist.value}. ${twist.detail} 오늘 만들 결과: ${twist.smallestBuild}.`,
    )
    .join(" ");
  return [
    `조합 요약: ${payer.value}가 ${moment.value}에 쓰는 ${twists.map((twist) => twist.resultTitle).join(" + ")}.`,
    // 짧은 로컬 임베딩 모델에서도 조합을 구분하는 핵심 정보가 잘리지 않도록
    // 타겟·순간·끗을 공통 제품 설명보다 먼저 둔다.
    `타겟: ${payer.value}. 반복 행동: ${payer.detail}`,
    `필요한 순간: ${moment.value}. 통증: ${moment.detail}.`,
    changes,
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

function fidelityText(scenario, twists) {
  return [
    `해외 원본과 동일하게 유지: ${scenario.source.sourceName}.`,
    `제품 핵심: ${scenario.source.value}.`,
    `상세 작동: ${scenario.source.detail}.`,
    `검증된 흐름: ${scenario.source.preservedFlow}.`,
    `MVP에서 적용할 한 끗: ${twists.map((twist) => twist.resultTitle).join(" + ")}.`,
  ].join(" ");
}

const scenarios = loadData();
let count = 0;
for (const scenario of scenarios) {
  const twistSets = [...combinationsOf(scenario.twists, 1), ...combinationsOf(scenario.twists, 2)];
  for (const payer of scenario.payers) {
    for (const moment of scenario.moments) {
      for (const twists of twistSets) {
        const record = {
          id: [scenario.id, payer.id, moment.id, ...twists.map((twist) => twist.id)].join("__"),
          scenarioId: scenario.id,
          sourceName: scenario.source.sourceName,
          source_key: scenario.source.research.key,
          source_url: scenario.source.research.url,
          payerId: payer.id,
          payer: payer.value,
          momentId: moment.id,
          moment: moment.value,
          twistIds: twists.map((twist) => twist.id),
          twistTitles: twists.map((twist) => twist.resultTitle),
          twistCount: twists.length,
          text: embeddingText(scenario, payer, moment, twists),
          sourceText: sourceText(scenario),
          fidelityText: fidelityText(scenario, twists),
        };
        process.stdout.write(`${JSON.stringify(record)}\n`);
        count += 1;
      }
    }
  }
}

if (count !== scenarios.length * 54) {
  throw new Error(`예상한 조합 수와 다릅니다: ${count} / ${scenarios.length * 54}`);
}
