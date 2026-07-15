import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const outputPath = path.join(root, 'docs/research/idea-source-coverage.jsonl');
const summaryPath = path.join(root, 'docs/research/idea-source-coverage-summary.md');
const sampleDataPath = path.join(root, 'src/components/organisms/idea-lab/sample-data.ts');
const RESEARCH_KEY_PATTERN = /^(trustmrr|app_store|chrome_web_store):.+$/;

const sources = [
  {
    dataset: 'trustmrr',
    path: 'docs/research/trustmrr-acquire/ideas.jsonl',
    expected: 1863,
    map(record) {
      return {
        source_id: record.slug,
        normalized_name: normalizeDisplayName(record.name),
        name: record.name,
        url: record.url,
        category: record.category,
        market_signal: {
          revenue_30d_value: record.revenue_30d_value ?? null,
          asking_price_value: record.asking_price_value ?? null,
          growth_30d_text: record.growth_30d_text ?? null,
          has_description: Boolean(record.raw_description),
        },
      };
    },
  },
  {
    dataset: 'app_store',
    path: 'docs/research/store-rankings/app-store-expanded-unique-apps.jsonl',
    expected: 4512,
    map(record) {
      const urls = record.urls || [];
      return {
        source_id: record.app_id,
        normalized_name: record.normalized_name || normalizeDisplayName(record.name),
        name: record.name,
        url: urls.find((url) => url.includes('/kr/')) || urls[0] || null,
        category: record.categories || [],
        market_signal: {
          average_user_rating: record.average_user_rating ?? null,
          user_rating_count: record.user_rating_count ?? null,
          best_rss_rank: record.best_rss_rank ?? null,
          best_category_rank: record.best_category_rank ?? null,
          best_search_rank: record.best_search_rank ?? null,
          countries: record.countries || [],
          price: record.price ?? null,
        },
      };
    },
  },
  {
    dataset: 'chrome_web_store',
    path: 'docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl',
    expected: 2031,
    map(record) {
      return {
        source_id: record.extension_id,
        normalized_name: record.normalized_name || normalizeDisplayName(record.name),
        name: record.name,
        url: record.url,
        category: record.source_slugs || [],
        market_signal: {
          rating: record.rating ?? null,
          appearances_count: record.appearances_count ?? null,
          best_top_chart_rank: record.best_top_chart_rank ?? null,
          best_category_rank: record.best_category_rank ?? null,
          best_search_rank: record.best_search_rank ?? null,
          featured_anywhere: record.featured_anywhere ?? false,
        },
      };
    },
  },
];

function normalizeDisplayName(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readJsonl(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return fs.readFileSync(absolutePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${relativePath}:${index + 1}: ${error.message}`);
      }
    });
}

function loadScenarios() {
  const source = fs.readFileSync(sampleDataPath, 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const evaluatedModule = { exports: {} };
  new Function('exports', 'module', 'require', javascript)(
    evaluatedModule.exports,
    evaluatedModule,
    () => ({}),
  );
  return evaluatedModule.exports.IDEA_LAB_SCENARIOS;
}

const scenarios = loadScenarios();
const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
const scenarioByResearchKey = new Map();
for (const scenario of scenarios) {
  const research = scenario.source.research;
  if (!research || typeof research.key !== 'string' || typeof research.url !== 'string' || !research.url) {
    throw new Error(`${scenario.id}: source.research.key and source.research.url are required`);
  }
  if (!RESEARCH_KEY_PATTERN.test(research.key)) {
    throw new Error(`${scenario.id}: unsupported research key ${research.key}`);
  }
  if (scenarioByResearchKey.has(research.key)) {
    throw new Error(`${scenario.id}: research key is already used by ${scenarioByResearchKey.get(research.key).scenario_id}`);
  }
  scenarioByResearchKey.set(research.key, {
    scenario_id: scenario.id,
    source_url: research.url,
  });
}

const records = [];
const datasetCounts = {};
for (const source of sources) {
  const input = readJsonl(source.path);
  if (input.length !== source.expected) {
    throw new Error(`${source.dataset}: expected ${source.expected}, got ${input.length}`);
  }
  datasetCounts[source.dataset] = input.length;
  for (const raw of input) {
    const mapped = source.map(raw);
    const researchKey = `${source.dataset}:${mapped.source_id}`;
    const linkedScenario = scenarioByResearchKey.get(researchKey);
    if (linkedScenario && mapped.url !== linkedScenario.source_url) {
      throw new Error(`${linkedScenario.scenario_id}: research URL does not exactly match ${researchKey}`);
    }
    const nameKey = normalizeDisplayName(mapped.normalized_name || mapped.name).replace(/[^\p{L}\p{N}]+/gu, '');
    records.push({
      dataset: source.dataset,
      source_id: mapped.source_id,
      normalized_name: mapped.normalized_name,
      name: mapped.name,
      url: mapped.url,
      category: mapped.category,
      market_signal: mapped.market_signal,
      review_status: linkedScenario ? 'in_app_unverified' : 'unseen',
      review_batch: null,
      reviewed_at: null,
      rejection_code: null,
      matched_scenario_ids: linkedScenario ? [linkedScenario.scenario_id] : [],
      custom_reserve_reason: null,
      notes: null,
      cross_dataset_name_key: nameKey,
    });
  }
}

const clusters = new Map();
for (const record of records) {
  const cluster = clusters.get(record.cross_dataset_name_key) || [];
  cluster.push(record);
  clusters.set(record.cross_dataset_name_key, cluster);
}
for (const record of records) {
  const cluster = clusters.get(record.cross_dataset_name_key);
  record.normalized_name_candidate_count = cluster.length;
  record.cross_dataset_candidate = new Set(cluster.map((item) => item.dataset)).size > 1;
}

const uniqueIds = new Set(records.map((record) => `${record.dataset}:${record.source_id}`));
const recordsByKey = new Map(records.map((record) => [`${record.dataset}:${record.source_id}`, record]));
for (const [researchKey, linkedScenario] of scenarioByResearchKey) {
  const record = recordsByKey.get(researchKey);
  if (!record) throw new Error(`${linkedScenario.scenario_id}: research key does not exist in the source catalog: ${researchKey}`);
  if (record.url !== linkedScenario.source_url) {
    throw new Error(`${linkedScenario.scenario_id}: research URL does not exactly match ${researchKey}`);
  }
  if (record.matched_scenario_ids.length !== 1 || record.matched_scenario_ids[0] !== linkedScenario.scenario_id) {
    throw new Error(`${linkedScenario.scenario_id}: source catalog link must be one scenario per research key`);
  }
}
if (records.length !== 8406 || uniqueIds.size !== records.length || scenarioIds.size !== scenarios.length || scenarioByResearchKey.size !== scenarios.length) {
  throw new Error(`Unexpected coverage totals: ${JSON.stringify({
    records: records.length,
    uniqueIds: uniqueIds.size,
    scenarios: scenarios.length,
    uniqueScenarioIds: scenarioIds.size,
    uniqueResearchKeys: scenarioByResearchKey.size,
    datasetCounts,
  })}`);
}

const matchedScenarioIds = new Set(records.flatMap((record) => record.matched_scenario_ids));
const unmatchedScenarios = scenarios
  .filter((scenario) => !matchedScenarioIds.has(scenario.id))
  .map((scenario) => ({ id: scenario.id, sourceName: scenario.source.sourceName }));
const statusCounts = records.reduce((result, record) => {
  result[record.review_status] = (result[record.review_status] || 0) + 1;
  return result;
}, {});
const duplicateClusters = [...clusters.values()].filter((cluster) => cluster.length > 1);
const crossDatasetClusters = duplicateClusters.filter(
  (cluster) => new Set(cluster.map((item) => item.dataset)).size > 1,
);

fs.writeFileSync(
  outputPath,
  `${records.map((record) => JSON.stringify(record)).join('\n')}\n`,
  'utf8',
);

const unmatchedLines = unmatchedScenarios.length > 0
  ? unmatchedScenarios.map((item) => `- \`${item.id}\` / ${item.sourceName}`).join('\n')
  : '- 없음';
const summary = `# 아이디어 원본 커버리지 장부 요약

생성일: ${new Date().toISOString().slice(0, 10)}

생성 스크립트: \`scripts/research/build-idea-source-coverage.mjs\`

기계 판독 장부: \`docs/research/idea-source-coverage.jsonl\`

## 결론

- 원본 **8,406건**을 하나의 추적 장부로 통합했다.
- TrustMRR ${datasetCounts.trustmrr.toLocaleString()} / App Store ${datasetCounts.app_store.toLocaleString()} / Chrome Web Store ${datasetCounts.chrome_web_store.toLocaleString()}건이다.
- 현재 앱 원본의 정규 \`research.key\`·\`research.url\`과 정확히 연결된 원본 레코드는 **${statusCounts.in_app_unverified || 0}건**이다.
- 현재 앱 ${scenarios.length}개 시나리오 중 로컬 원본 레코드와 정확히 연결된 시나리오는 **${matchedScenarioIds.size}개**, 미연결은 **${unmatchedScenarios.length}개**다.
- 정규화 이름 중복 후보 클러스터는 **${duplicateClusters.length}개**, 서로 다른 데이터셋 사이의 중복 후보는 **${crossDatasetClusters.length}개**다.

\`in_app_unverified\`는 앱의 정규 원본 키·URL이 연구 장부와 정확히 같다는 뜻일 뿐 사용자 승인이나 품질 통과가 아니다. 이름이 같아도 이 직접 연결이 없으면 앱 원본으로 취급하지 않는다.

## 데이터셋별 수

| 데이터셋 | 원본 수 |
|---|---:|
| TrustMRR | ${datasetCounts.trustmrr.toLocaleString()} |
| App Store | ${datasetCounts.app_store.toLocaleString()} |
| Chrome Web Store | ${datasetCounts.chrome_web_store.toLocaleString()} |
| **합계** | **${records.length.toLocaleString()}** |

## 초기 상태

| 상태 | 수 | 의미 |
|---|---:|---|
| \`unseen\` | ${(statusCounts.unseen || 0).toLocaleString()} | 아직 원본 단위 심사를 시작하지 않음 |
| \`in_app_unverified\` | ${(statusCounts.in_app_unverified || 0).toLocaleString()} | 현재 앱의 정규 키·URL과 연결됐지만 품질·사용자 승인 상태는 별도 확인 필요 |

## 현재 앱에서 원본 레코드와 정확히 연결되지 않은 시나리오

${unmatchedLines}

미연결은 원본 부재를 의미하지 않는다. 상품명 변형, 기능명 사용, 다른 조사 소스 사용 가능성이 있으므로 수동 링크가 필요하다.

## 다음 사용법

1. 매 회차 \`unseen\` 원본 50개만 선택한다.
2. 검사 결과를 \`auto_reject / shortlist / deep_reviewed / user_queue / approved / merge / custom_reserve / rejected\` 중 하나로 바꾼다.
3. \`review_batch\`, \`reviewed_at\`, \`rejection_code\`를 반드시 기록한다.
4. 정규화 이름 중복은 후보 탐색에만 사용하고 수동 확인 뒤 병합한다.
5. 앱에 들어 있는 원본도 사용자 최종 Yes 전에는 \`approved\`로 바꾸지 않는다.
`;
fs.writeFileSync(summaryPath, summary, 'utf8');

process.stdout.write(`${JSON.stringify({
  records: records.length,
  datasetCounts,
  statusCounts,
  scenarios: scenarios.length,
  matchedScenarios: matchedScenarioIds.size,
  unmatchedScenarios,
  duplicateClusters: duplicateClusters.length,
  crossDatasetClusters: crossDatasetClusters.length,
  outputPath,
  summaryPath,
}, null, 2)}\n`);
