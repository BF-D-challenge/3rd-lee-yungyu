#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const gate = read("docs/research/idea-candidate-gate-results-2026-07-14.jsonl");
const stress = read("docs/research/idea-candidate-stress-audit-results-2026-07-14.jsonl");
const latin = read("docs/research/idea-candidate-latin-shortlist-results-2026-07-14.jsonl");
const full = read("docs/research/idea-candidate-full-audit-results-2026-07-14.jsonl");
const counts = (rows, key = "source_key") => {
  const result = new Map();
  for (const row of rows) {
    const item = result.get(row[key]) ?? { pass: 0, review: 0, fail: 0 };
    item[row.audit.status] += 1;
    result.set(row[key], item);
  }
  return result;
};
const gateBy = counts(gate);
const stressBy = counts(stress);
const latinBy = counts(latin);
const fullBy = counts(full);
const statusCount = (rows) => Object.fromEntries(["pass", "review", "fail"].map((status) => [status, rows.filter((row) => row.audit.status === status).length]));
const allPass = [...fullBy.entries()].filter(([, result]) => result.pass === 27).map(([key]) => key);
const edge = [...fullBy.entries()].filter(([, result]) => result.fail === 0 && result.pass < 27).map(([key]) => key);
const failed = [...fullBy.entries()].filter(([, result]) => result.fail > 0).map(([key]) => key);
const lines = [
  "# Candidate 2,576개 적응형 카드 감사 최종 보고서",
  "",
  "## 결론",
  "",
  "- 앱 데이터는 아직 수정하지 않았습니다.",
  "- 2,576개를 모두 같은 27조합으로 반복하지 않고, 대표 게이트 → 3개 스트레스 조합 → Latin-9 → 전체 27조합 순서로 줄였습니다.",
  "- 전체 27조합을 통과한 원본은 " + allPass.length + "개입니다.",
  "- 일부 조합만 review인 원본은 " + edge.length + "개이며, 문구를 고친 뒤 재감사해야 합니다.",
  "- fail 조합이 있는 원본은 " + failed.length + "개이며, 이번 승격에서 제외합니다.",
  "",
  "## 단계별 숫자",
  "",
  "| 단계 | 검사량 | pass | review | fail | 의미 |",
  "|---|---:|---:|---:|---:|---|",
  "| 대표 게이트 | " + gate.length + " | " + statusCount(gate).pass + " | " + statusCount(gate).review + " | " + statusCount(gate).fail + " | 원본 메커니즘이 작동할 수 있는지 먼저 확인 |",
  "| 스트레스 3조합 | " + stress.length + " | " + statusCount(stress).pass + " | " + statusCount(stress).review + " | " + statusCount(stress).fail + " | 결제자·순간·한 끗이 실제로 어울리는지 확인 |",
  "| Latin-9 | " + latin.length + " | " + statusCount(latin).pass + " | " + statusCount(latin).review + " | " + statusCount(latin).fail + " | 세 축의 쌍을 빠르게 모두 확인 |",
  "| 전체 27조합 | " + full.length + " | " + statusCount(full).pass + " | " + statusCount(full).review + " | " + statusCount(full).fail + " | 최종 승격 전 전체 확인 |",
  "",
  "## 판정 예시",
  "",
  "- 통과 예: 사진 한 장을 넣어 배경을 바꾸고 결과 이미지를 받는 조합. 입력과 결과가 한 번에 보이고 다른 사람의 행동이 필요하지 않습니다.",
  "- review 예: 기능 자체는 되지만 특정 플랫폼 권한이나 전문 용어가 필요한 조합. 문구를 고치거나 입력 조건을 더 분명히 해야 합니다.",
  "- fail 예: 과거 3개월 가격처럼 설치 전에 모아 둔 데이터가 필요한 조합, 또는 브라우저 확장 권한·외부 기관의 행동이 필요한 조합.",
  "",
  "## 전체 27조합 통과 원본",
  "",
  ...allPass.map((key) => "- " + key),
  "",
  "## 다음 순서",
  "",
  "1. 위 21개를 한국 사용자용 카드 문구로 다시 읽고, 제목·UVP·입력·결과가 한 줄에 보이는지 확인합니다.",
  "2. " + edge.length + "개 review 원본은 문제가 된 조합만 18 또는 27조합으로 다시 확인합니다.",
  "3. 카드 27개 조합이 모두 자연스러운 원본만 sample-data.ts에 승격합니다.",
  "4. 승격 후 typecheck, 조합 수 검사, Idea Lab E2E를 실행합니다.",
  "",
  "검사 산출물: docs/research/idea-candidate-gate-summary-2026-07-14.md, docs/research/idea-candidate-stress-audit-summary-2026-07-14.md, docs/research/idea-candidate-latin-shortlist-summary-2026-07-14.md, docs/research/idea-candidate-full-audit-summary-2026-07-14.md",
  "",
];
const output = path.join(root, "docs/dev/experiments/idea-lab/adaptive-card-audit-final-report-2026-07-14.md");
fs.writeFileSync(output, lines.join("\n"));
console.log(JSON.stringify({ gate: statusCount(gate), stress: statusCount(stress), latin: statusCount(latin), full: statusCount(full), allPass: allPass.length, edge: edge.length, failed: failed.length, output }, null, 2));
