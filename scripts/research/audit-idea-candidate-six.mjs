import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(
  root,
  "docs/dev/experiments/idea-lab/qa/candidate-six-draft.json",
);
const scenarios = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const forbiddenMvpPattern =
  /OAuth|자동 발행|자동 게시|백그라운드|앱스토어 배포|자체 모델|대규모 크롤링|여러 외부 서비스/;

const ids = [];
const combinations = [];
for (const scenario of scenarios) {
  ids.push(scenario.id, scenario.source.id);
  ids.push(...scenario.payers.map((item) => item.id));
  ids.push(...scenario.moments.map((item) => item.id));
  ids.push(...scenario.twists.map((item) => item.id));

  if (
    scenario.payers.length !== 3 ||
    scenario.moments.length !== 3 ||
    scenario.twists.length !== 3
  ) {
    throw new Error(`${scenario.id}: expected 3 payers × 3 moments × 3 twists`);
  }

  for (const twist of scenario.twists) {
    if (twist.platform !== "web") {
      throw new Error(`${scenario.id}/${twist.id}: MVP platform must be web`);
    }
    if (forbiddenMvpPattern.test(twist.smallestBuild)) {
      throw new Error(`${scenario.id}/${twist.id}: forbidden MVP dependency`);
    }
  }

  for (const payer of scenario.payers) {
    for (const moment of scenario.moments) {
      for (const twist of scenario.twists) {
        combinations.push({
          id: `${scenario.id}__${payer.id}__${moment.id}__${twist.id}`,
          scenario_id: scenario.id,
          payer: payer.value,
          moment: moment.value,
          twist: twist.value,
          result_title: twist.resultTitle,
          smallest_build: twist.smallestBuild,
          structural_status: "pass",
        });
      }
    }
  }
}

const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`duplicate ids: ${[...new Set(duplicateIds)].join(", ")}`);
}
if (scenarios.length !== 6 || combinations.length !== 162) {
  throw new Error(`unexpected totals: scenarios=${scenarios.length}, combinations=${combinations.length}`);
}

const countsByScenario = Object.fromEntries(
  scenarios.map((scenario) => [
    scenario.id,
    combinations.filter((item) => item.scenario_id === scenario.id).length,
  ]),
);

process.stdout.write(
  `${JSON.stringify(
    {
      scenarios: scenarios.length,
      payers: scenarios.reduce((sum, item) => sum + item.payers.length, 0),
      moments: scenarios.reduce((sum, item) => sum + item.moments.length, 0),
      twists: scenarios.reduce((sum, item) => sum + item.twists.length, 0),
      combinations: combinations.length,
      duplicateIds,
      countsByScenario,
    },
    null,
    2,
  )}\n`,
);
