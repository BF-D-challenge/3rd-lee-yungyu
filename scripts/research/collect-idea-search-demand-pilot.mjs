import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, "docs/research/idea-search-demand-pilot-30-input.jsonl");
const OUTPUT_PATH = path.join(ROOT, "docs/research/idea-search-demand-pilot-30-results.jsonl");
const REPORT_PATH = path.join(
  ROOT,
  "docs/dev/experiments/idea-lab/search-demand-pilot-30-2026-07-13.md",
);
const NAVER_ENDPOINT = "https://openapi.naver.com/v1/datalab/search";

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

const GOOGLE_PUBLIC_STATUS = option("--google-status") || "not_attempted";
const RESUME_FAILED = process.argv.includes("--resume-failed");
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const rows = fs.readFileSync(INPUT_PATH, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const now = new Date();
const lastCompleteMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
const twentyFourMonthStart = new Date(Date.UTC(
  lastCompleteMonthEnd.getUTCFullYear() - 2,
  lastCompleteMonthEnd.getUTCMonth() + 1,
  1,
));
const period = {
  start_date: formatDate(twentyFourMonthStart),
  end_date: formatDate(lastCompleteMonthEnd),
  time_unit: "month",
};

const mean = (values) => values.length === 0
  ? null
  : values.reduce((total, value) => total + value, 0) / values.length;
const rounded = (value) => Number.isFinite(value) ? Number(value.toFixed(3)) : null;

function monthlyPeriods(startDate, endDate) {
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const periods = [];
  while (current <= end) {
    periods.push(`${current.getUTCFullYear()}-${pad(current.getUTCMonth() + 1)}-01`);
    current.setUTCMonth(current.getUTCMonth() + 1);
  }
  return periods;
}

function summarizeSeries(data) {
  const ratioByPeriod = new Map(
    data.map((item) => [item.period.slice(0, 7), Number(item.ratio)]),
  );
  const points = monthlyPeriods(period.start_date, period.end_date).map((month) => ({
    period: month,
    ratio: ratioByPeriod.get(month.slice(0, 7)) || 0,
  }));
  const latest12 = points.slice(-12).map((item) => item.ratio);
  const previous12 = points.slice(-24, -12).map((item) => item.ratio);
  const recent3 = latest12.slice(-3);
  const prior3 = latest12.slice(-6, -3);
  const latestMean = mean(latest12);
  const previousMean = mean(previous12);
  const recentMean = mean(recent3);
  const priorMean = mean(prior3);
  const yoy = previousMean > 0 ? ((latestMean - previousMean) / previousMean) * 100 : null;
  const recentGrowth = priorMean > 0 ? ((recentMean - priorMean) / priorMean) * 100 : null;
  const activeMonths = latest12.filter((value) => value > 0).length;
  let direction = "sparse";
  if (activeMonths >= 6) {
    if (yoy !== null && yoy >= 20) direction = "rising";
    else if (yoy !== null && yoy <= -20) direction = "falling";
    else direction = "stable";
  }
  return {
    points,
    latest_12m_mean: rounded(latestMean),
    previous_12m_mean: rounded(previousMean),
    yoy_percent: rounded(yoy),
    recent_3m_vs_prior_3m_percent: rounded(recentGrowth),
    active_months_last_12: activeMonths,
    direction,
  };
}

function googleExploreUrl(row) {
  const params = new URLSearchParams({
    date: "today 12-m",
    geo: "KR",
    q: row.keyword_groups.map((group) => group.representative).join(","),
    hl: "ko",
  });
  return `https://trends.google.com/trends/explore?${params.toString()}`;
}

function readKeychainPassword(service) {
  try {
    return execFileSync(
      "security",
      ["find-generic-password", "-a", "naver-datalab", "-s", service, "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return null;
  }
}

const environmentClientId = process.env.NAVER_CLIENT_ID;
const environmentClientSecret = process.env.NAVER_CLIENT_SECRET;
const keychainClientId = environmentClientId
  ? null
  : readKeychainPassword("oneul-haebolkka-naver-client-id");
const keychainClientSecret = environmentClientSecret
  ? null
  : readKeychainPassword("oneul-haebolkka-naver-client-secret");
const naverClientId = environmentClientId || keychainClientId;
const naverClientSecret = environmentClientSecret || keychainClientSecret;
const hasNaverCredentials = Boolean(naverClientId && naverClientSecret);
const naverCredentialSource = environmentClientId && environmentClientSecret
  ? "environment"
  : keychainClientId && keychainClientSecret
    ? "macos_keychain"
    : "missing";

const existingByKey = RESUME_FAILED && fs.existsSync(OUTPUT_PATH)
  ? new Map(
    fs.readFileSync(OUTPUT_PATH, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .map((row) => [row.key, row]),
  )
  : new Map();

async function collectNaver(row) {
  if (!hasNaverCredentials) {
    return {
      status: "missing_credentials",
      endpoint: NAVER_ENDPOINT,
      period,
      groups: [],
      comparison_note: "상대지수이므로 서로 다른 원본의 절대 수요 크기를 비교하지 않는다.",
    };
  }
  const response = await fetch(NAVER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Naver-Client-Id": naverClientId,
      "X-Naver-Client-Secret": naverClientSecret,
    },
    body: JSON.stringify({
      startDate: period.start_date,
      endDate: period.end_date,
      timeUnit: period.time_unit,
      keywordGroups: row.keyword_groups.map((group) => ({
        groupName: group.label,
        keywords: group.keywords,
      })),
    }),
  });
  if (!response.ok) {
    const responseText = (await response.text()).replace(/\s+/g, " ").slice(0, 300);
    return {
      status: "request_failed",
      endpoint: NAVER_ENDPOINT,
      period,
      http_status: response.status,
      error: responseText,
      groups: [],
      comparison_note: "실패를 검색 수요 0으로 해석하지 않는다.",
    };
  }
  const payload = await response.json();
  const byTitle = new Map(row.keyword_groups.map((group) => [group.label, group]));
  const groups = (payload.results || []).map((result) => {
    const definition = byTitle.get(result.title);
    return {
      intent: definition?.intent || null,
      label: result.title,
      keywords: result.keywords || definition?.keywords || [],
      ...summarizeSeries(result.data || []),
    };
  });
    return {
      status: "collected",
      endpoint: NAVER_ENDPOINT,
      period,
      credential_source: naverCredentialSource,
      groups,
    comparison_note: "같은 검색어 묶음의 시간 변화만 해석한다. 원본 간 절대 수요 순위에는 쓰지 않는다.",
  };
}

const results = [];
for (const row of rows) {
  const existing = existingByKey.get(row.key);
  if (existing?.naver?.status === "collected") {
    results.push({
      ...existing,
      naver: {
        ...existing.naver,
        groups: existing.naver.groups.map((group) => ({
          ...group,
          ...summarizeSeries(group.points || []),
        })),
      },
    });
    continue;
  }
  let naver;
  try {
    naver = await collectNaver(row);
  } catch (error) {
    naver = {
      status: "request_failed",
      endpoint: NAVER_ENDPOINT,
      period,
      error: String(error?.message || error).slice(0, 300),
      groups: [],
      comparison_note: "실패를 검색 수요 0으로 해석하지 않는다.",
    };
  }
  results.push({
    ...row,
    collected_at: new Date().toISOString(),
    naver,
    google: {
      status: GOOGLE_PUBLIC_STATUS,
      public_ui_url: googleExploreUrl(row),
      official_api_status: "alpha_access_required",
      groups: [],
      comparison_note: "공식 API 또는 검증된 수동 내보내기 전에는 숫자를 만들지 않는다.",
    },
    demand_evidence_decision: "pending_data",
    automatic_quality_decision_change: false,
  });
  if (hasNaverCredentials) await sleep(120);
}

fs.writeFileSync(OUTPUT_PATH, `${results.map((row) => JSON.stringify(row)).join("\n")}\n`);

const countStatus = (source, status) => results.filter((row) => row[source].status === status).length;
const naverCollected = countStatus("naver", "collected");
const googleCollected = countStatus("google", "collected");
const report = [];
report.push("# 검색 수요 근거 파일럿 30개 — 수집 상태");
report.push("");
report.push("작성일: 2026-07-14");
report.push("");
report.push("## 결론");
report.push("");
if (naverCollected + googleCollected === 0) {
  report.push("30개 원본과 90개 한국어 검색어 묶음은 준비됐지만 현재 인증 상태에서는 숫자를 수집하지 못했다. 이 상태를 검색 수요 0으로 기록하지 않았고, 모든 원본의 기존 품질 판정도 바꾸지 않았다.");
} else {
  report.push(`네이버 ${naverCollected}/30, Google ${googleCollected}/30의 추세 근거를 수집했다. 검색 신호는 기존 품질 판정을 자동으로 바꾸지 않는다.`);
}
report.push("");
report.push("## 수집 상태");
report.push("");
report.push("| 출처 | 수집 | 인증 없음 | 호출 제한·실패 | 해석 |");
report.push("|---|---:|---:|---:|---|");
report.push(`| 네이버 데이터랩 | ${naverCollected}/30 | ${countStatus("naver", "missing_credentials")}/30 | ${countStatus("naver", "request_failed")}/30 | 24개월 상대 추세만 사용 |`);
report.push(`| Google Trends | ${googleCollected}/30 | ${countStatus("google", "alpha_access_required")}/30 | ${countStatus("google", "rate_limited_public_endpoint")}/30 | 공식 API·수동 내보내기 전 숫자 금지 |`);
report.push("");
report.push("## 표본");
report.push("");
report.push("| 순위 | 원본 | 표본 | 대표 검색어 | 네이버 | Google | 기존 판정 변경 |");
report.push("|---:|---|---|---|---|---|---|");
for (const row of results) {
  report.push(`| ${row.pilot_rank} | ${row.name} | ${row.cohort} | ${row.keyword_groups.map((group) => group.representative).join(" / ")} | ${row.naver.status} | ${row.google.status} | 없음 |`);
}
report.push("");
report.push("## 운영 규칙");
report.push("");
report.push("- 검색어는 제품명이 아니라 문제·원하는 결과·도구 범주의 한국어 표현으로 만든다.");
report.push("- 네이버·Google 수집 실패는 0점이 아니라 `미수집`이다.");
report.push("- 상대지수로 서로 다른 원본의 절대 검색량 순위를 만들지 않는다.");
report.push("- 검색량이 작아도 실제 매출·명확한 결제자·고객 채널이 있으면 B2B 후보를 탈락시키지 않는다.");
report.push("- 데이터가 모인 뒤 현재 앱 10개·정밀검사 5개·탈락 10개·무작위 5개를 비교한다.");
report.push("- 현재 좋은 원본을 잘못 낮추는 비율이 5% 이상이면 이 기준을 채택하지 않는다.");
report.push("");
report.push("## 공식 근거");
report.push("");
report.push("- 네이버 데이터랩: https://developers.naver.com/docs/serviceapi/datalab/search/search.md");
report.push("- Google Trends API alpha: https://developers.google.com/search/apis/trends");
report.push("- Google Trends 정규화 설명: https://support.google.com/trends/answer/4365533?hl=en");

fs.writeFileSync(REPORT_PATH, `${report.join("\n")}\n`);

process.stdout.write(`${JSON.stringify({
  rows: results.length,
  keywordGroups: results.reduce((total, row) => total + row.keyword_groups.length, 0),
  naver: {
    collected: naverCollected,
    missingCredentials: countStatus("naver", "missing_credentials"),
    failed: countStatus("naver", "request_failed"),
  },
  google: {
    collected: googleCollected,
    publicStatus: GOOGLE_PUBLIC_STATUS,
  },
  output: path.relative(ROOT, OUTPUT_PATH),
  report: path.relative(ROOT, REPORT_PATH),
}, null, 2)}\n`);
