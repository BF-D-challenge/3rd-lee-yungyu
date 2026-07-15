import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, "docs/research/idea-search-demand-pilot-30-results.jsonl");
const JSON_PATH = path.join(ROOT, "docs/research/idea-search-demand-pilot-analysis.json");
const REPORT_PATH = path.join(
  ROOT,
  "docs/dev/experiments/idea-lab/search-demand-pilot-analysis-2026-07-14.md",
);

const rows = fs.readFileSync(INPUT_PATH, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const cohortLabels = {
  current_app_checkpoint: "현재 좋은 원본",
  stage2_deep_review: "2단계 정밀검사 후보",
  stage2_reject: "2단계 탈락",
  random_control: "무작위 대조군",
};

function summarizeRow(row) {
  const observableGroups = row.naver.groups.filter(
    (group) => group.active_months_last_12 >= 6,
  ).length;
  const risingGroups = row.naver.groups.filter((group) => group.direction === "rising").length;
  return {
    pilot_rank: row.pilot_rank,
    key: row.key,
    name: row.name,
    cohort: row.cohort,
    observable_groups: observableGroups,
    rising_groups: risingGroups,
    signal_class: observableGroups >= 2
      ? "broad"
      : observableGroups === 1
        ? "partial"
        : "sparse",
    groups: row.naver.groups.map((group) => ({
      intent: group.intent,
      label: group.label,
      active_months_last_12: group.active_months_last_12,
      direction: group.direction,
      yoy_percent: group.yoy_percent,
    })),
  };
}

const summarizedRows = rows.map(summarizeRow);
const cohortOrder = [
  "current_app_checkpoint",
  "stage2_deep_review",
  "stage2_reject",
  "random_control",
];
const cohorts = cohortOrder.map((cohort) => {
  const cohortRows = summarizedRows.filter((row) => row.cohort === cohort);
  const anyObservable = cohortRows.filter((row) => row.observable_groups >= 1).length;
  const twoPlusObservable = cohortRows.filter((row) => row.observable_groups >= 2).length;
  const zeroObservable = cohortRows.filter((row) => row.observable_groups === 0).length;
  const anyRising = cohortRows.filter((row) => row.rising_groups >= 1).length;
  return {
    cohort,
    label: cohortLabels[cohort],
    rows: cohortRows.length,
    any_observable: anyObservable,
    any_observable_rate: anyObservable / cohortRows.length,
    two_plus_observable: twoPlusObservable,
    two_plus_observable_rate: twoPlusObservable / cohortRows.length,
    zero_observable: zeroObservable,
    zero_observable_rate: zeroObservable / cohortRows.length,
    any_rising: anyRising,
    any_rising_rate: anyRising / cohortRows.length,
  };
});

const currentApp = cohorts.find((cohort) => cohort.cohort === "current_app_checkpoint");
const falseNegativeRate = currentApp.zero_observable_rate;
const fivePercentGatePassed = falseNegativeRate < 0.05;
const analysis = {
  created_at: "2026-07-14",
  source: "Naver DataLab Search Trends",
  period: rows[0]?.naver?.period || null,
  rows: rows.length,
  keyword_groups: rows.reduce((total, row) => total + row.naver.groups.length, 0),
  interpretation_rule: {
    observable_group: "최근 12개월 중 상대지수가 0보다 큰 달이 6개월 이상",
    comparison_limit: "서로 다른 API 요청의 상대지수 절댓값은 비교하지 않음",
  },
  cohorts,
  false_negative_audit: {
    baseline: "current_app_checkpoint",
    rule_tested: "관찰 가능한 검색어 묶음이 하나도 없으면 낮춤",
    false_negatives: currentApp.zero_observable,
    baseline_rows: currentApp.rows,
    false_negative_rate: falseNegativeRate,
    allowed_rate: 0.05,
    passed: fivePercentGatePassed,
  },
  adoption_decision: {
    use_as_filter: false,
    use_as_automatic_ranking: false,
    use_as_manual_supporting_evidence: true,
    reason: "현재 좋은 원본 30%를 잘못 낮추고, 2단계 탈락 원본의 90%에는 오히려 검색 신호가 있어 품질을 구분하지 못함",
  },
  rows_detail: summarizedRows,
};

fs.writeFileSync(JSON_PATH, `${JSON.stringify(analysis, null, 2)}\n`);

const percent = (value) => `${Math.round(value * 100)}%`;
const directionLabels = {
  rising: "상승",
  stable: "유지",
  falling: "하락",
  sparse: "희소",
};
const report = [];
report.push("# 네이버 검색 수요 파일럿 30개 — 결과와 채택 결정");
report.push("");
report.push("작성일: 2026-07-14");
report.push("");
report.push("## 한 줄 결론");
report.push("");
report.push("검색 트렌드는 아이디어 품질 필터로 쓰지 않는다. 현재 좋은 원본 10개 중 3개를 잘못 낮추고, 이미 탈락한 범용 아이디어 10개 중 9개에는 오히려 검색 신호가 잡혔다. 다만 한국 사용자가 실제로 쓰는 문제 표현을 확인하는 수동 보조 근거로는 남긴다.");
report.push("");
report.push("## As-is → 실험 → To-be");
report.push("");
report.push("| 구분 | 내용 |");
report.push("|---|---|");
report.push("| As-is | 검색량이 적으면 수요가 없는 아이디어라고 생각할 수 있었다. |");
report.push("| 짧은 실험 | 현재 좋은 원본 10개, 정밀검사 후보 5개, 탈락 10개, 무작위 5개에 검색어 3묶음씩 붙여 최근 24개월을 확인했다. |");
report.push("| 실제 결과 | 좋은 원본도 검색어가 희소했고, 날씨·QR·할 일·TTS 같은 탈락 원본은 검색이 꾸준했다. 검색 수요는 문제의 크기는 보여도 ‘우리 앱에서 만들 좋은 세로 조각’인지는 구분하지 못했다. |");
report.push("| To-be | 검색 신호로 자동 합격·탈락·순위 변경을 하지 않는다. 수동 검수 화면에 `한국 검색 표현`, `12개월 관찰 개월`, `추세`만 증거로 붙인다. |");
report.push("");
report.push("## 네 집단 비교");
report.push("");
report.push("`관찰됨`은 검색어 3묶음 중 하나라도 최근 12개월의 6개월 이상에서 상대지수가 나타난 경우다.");
report.push("");
report.push("| 표본 | 개수 | 1묶음 이상 관찰 | 2묶음 이상 관찰 | 전부 희소 | 상승 신호 있음 |");
report.push("|---|---:|---:|---:|---:|---:|");
for (const cohort of cohorts) {
  report.push(`| ${cohort.label} | ${cohort.rows} | ${cohort.any_observable}/${cohort.rows} (${percent(cohort.any_observable_rate)}) | ${cohort.two_plus_observable}/${cohort.rows} (${percent(cohort.two_plus_observable_rate)}) | ${cohort.zero_observable}/${cohort.rows} (${percent(cohort.zero_observable_rate)}) | ${cohort.any_rising}/${cohort.rows} (${percent(cohort.any_rising_rate)}) |`);
}
report.push("");
report.push("## 중학생도 이해할 수 있는 예시");
report.push("");
report.push("- `Due Date Radar`와 `TEXT-2-ICS`는 이미 좋은 원본으로 통과했지만 검색어 3묶음이 모두 희소했다. 검색 기준만 썼다면 좋은 아이디어를 버린다.");
report.push("- `WeatherNow`, `QR Reader`, `Todo`, `TTS Reader`는 2단계에서 탈락했지만 검색어가 대부분 매달 관찰됐다. 사람들이 많이 찾는 문제여도 OS 기본 기능이나 흔한 앱이 더 편하면 좋은 후보가 아니다.");
report.push("- `1Lookup`은 좋은 원본이면서 3묶음 모두 상승했다. 이런 경우 검색 신호는 아이디어를 합격시키는 판정이 아니라 한국어 문제 표현을 더 자신 있게 고르는 근거가 된다.");
report.push("");
report.push("## 30개에 실제로 쓴 검색 신호");
report.push("");
report.push("| 순위 | 원본 | 표본 | 문제 / 결과 / 범주 신호 | 관찰 묶음 |");
report.push("|---:|---|---|---|---:|");
for (const row of summarizedRows) {
  const groups = row.groups
    .map((group) => `${group.label}: ${group.active_months_last_12}/12개월·${directionLabels[group.direction]}`)
    .join(" / ");
  report.push(`| ${row.pilot_rank} | ${row.name} | ${cohortLabels[row.cohort]} | ${groups} | ${row.observable_groups}/3 |`);
}
report.push("");
report.push("## 채택 결정");
report.push("");
report.push(`- 가장 느슨한 규칙인 ‘검색어 1묶음 이상 관찰’만 써도 현재 좋은 원본 ${currentApp.zero_observable}/${currentApp.rows}, 즉 ${percent(falseNegativeRate)}를 잘못 낮춘다. 허용선 5%를 넘으므로 필터 채택 실패다.`);
report.push("- 2단계 정밀검사 후보는 1/5만 관찰됐지만 2단계 탈락은 9/10이 관찰됐다. 좋은 후보를 위로 올리는 정렬 기준으로도 쓰지 않는다.");
report.push("- 유지할 값은 `한국어 검색어 묶음`, `최근 12개월 관찰 개월`, `상승·유지·하락·희소`다. 사람이 후보를 읽을 때 참고만 한다.");
report.push("- B2B·니치 원본은 검색량이 작다는 이유로 감점하지 않는다. 실제 매출, 명확한 결제자, 유입 채널 근거를 우선한다.");
report.push("- Google Trends는 공식 alpha 접근 또는 검증된 수동 내보내기가 가능할 때 교차 확인하되, 네이버 결과만으로도 자동 필터 불채택 결정은 바뀌지 않는다.");
report.push("");
report.push("## 데이터 주의사항");
report.push("");
report.push("- 네이버 값은 검색량 절댓값이 아니라 한 요청 안에서 정규화된 상대지수다.");
report.push("- 네이버가 0인 달을 생략하므로, 분석 전에 빠진 달을 0으로 채워 모든 검색어를 정확히 24개월로 맞췄다.");
report.push("- 서로 다른 원본의 지수 크기를 비교하지 않고, 각 검색어가 최근 12개월 중 몇 달 관찰됐는지와 시간 방향만 비교했다.");

fs.writeFileSync(REPORT_PATH, `${report.join("\n")}\n`);

process.stdout.write(`${JSON.stringify({
  rows: rows.length,
  keywordGroups: analysis.keyword_groups,
  currentAppFalseNegativeRate: falseNegativeRate,
  fivePercentGatePassed,
  adoptionDecision: analysis.adoption_decision,
  json: path.relative(ROOT, JSON_PATH),
  report: path.relative(ROOT, REPORT_PATH),
}, null, 2)}\n`);
