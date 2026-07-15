#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const gate = new Map(
  readJsonl("docs/research/idea-candidate-gate-results-2026-07-14.jsonl")
    .filter((row) => row.audit?.status === "pass")
    .map((row) => [row.source_key, row]),
);

const contracts = [
  {
    source_key: "app_store:964220645",
    selection_reason: "사진 한 장을 공유하기 직전에 얼굴·번호판·선택 영역을 가리는 동일한 개인정보 문제로 세 축을 묶을 수 있다.",
    prior_review_feedback: "모든 결제자는 사진을 외부에 공유하는 사람, 모든 순간은 공유 직전, 세 twist는 원본이 지원하는 얼굴·차량 번호판·손가락 선택 영역 모자이크로만 제한한다. 사진 한 장 입력과 검열 사진 한 장 결과를 유지한다.",
  },
  {
    source_key: "app_store:6670228620",
    selection_reason: "한 번의 모임 정산에서 차등 비율·반올림·부족액을 계산하는 결과가 원본에 명시돼 있다.",
    prior_review_feedback: "모든 결제자는 차등 정산을 맡는 사람, 모든 순간은 총액이 나온 뒤 정산해야 하는 때로 묶는다. 세 twist는 비율별 분담금, 단위별 반올림, 부족액·거스름돈 표시만 사용한다. 참가자·비율·총액을 한 장의 정산표 입력으로 취급한다.",
  },
  {
    source_key: "app_store:733449239",
    selection_reason: "현장 가공자가 두 변 또는 각도를 넣고 누락된 면취·개선 치수를 바로 얻는 전문 계산기다.",
    prior_review_feedback: "모든 결제자는 금속 절단·용접 준비자, 모든 순간은 도면의 면취·개선 치수가 부족한 작업 직전으로 묶는다. 세 twist는 원본 삼각형 계산으로 얻는 누락 각도, 누락 길이, 현장용 형상 치수 요약만 쓴다. 새 공차 예측이나 CAD 연동을 추가하지 않는다.",
  },
  {
    source_key: "app_store:6443780213",
    selection_reason: "응원 문구 한 줄을 공연장에서 읽히는 부채 글자 이미지로 만드는 입력과 결과가 선명하다.",
    prior_review_feedback: "모든 결제자는 오프라인 공연 응원물을 직접 만드는 팬, 모든 순간은 공연 전에 부채 문구를 출력해야 할 때로 묶는다. 세 twist는 원본 글자 디자인 범위 안에서 굵은 외곽선, 두 줄 배치, 인쇄 크기 맞춤으로 제한한다. 텍스트 한 줄 입력과 부채 글자 이미지 한 장 결과를 유지한다.",
  },
  {
    source_key: "app_store:451326903",
    selection_reason: "지도에서 찍은 점이라는 단일 입력으로 면적·거리·GeoJSON을 즉시 얻는 전문 현장 측정 흐름이다.",
    prior_review_feedback: "모든 결제자는 현장 부지의 대략 치수를 확인하는 실무자, 모든 순간은 방문·견적·작업 계획 전에 경계를 재야 하는 때로 묶는다. 세 twist는 원본 결과인 면적, 거리, GeoJSON 내보내기로만 제한한다. 법적 측량 정확도를 주장하지 않는다.",
  },
  {
    source_key: "app_store:459111718",
    selection_reason: "전압·전류·저항 중 아는 값을 넣어 필요한 전력값을 즉시 얻는 반복 계산 문제다.",
    prior_review_feedback: "모든 결제자는 전기 부품의 소비전력을 확인하는 사람, 모든 순간은 어댑터·부품 선택 직전으로 묶는다. 세 twist는 원본의 세 전력 공식에 맞춘 전압×전류, 전류²×저항, 전압²÷저항 계산으로만 쓴다. 여러 숫자는 계산식 한 줄이라는 단일 텍스트 입력으로 표현한다.",
  },
  {
    source_key: "app_store:1566817391",
    selection_reason: "혼자 훈련할 때 촬영 지연 후 최근 동작을 바로 재생하는 셀프 피드백 문제다.",
    prior_review_feedback: "모든 결제자는 혼자 스키·스노보드 자세를 연습하는 사람, 모든 순간은 한 동작을 수행하고 바로 확인하려는 훈련 중으로 묶는다. 세 twist는 원본의 지연 촬영, 최근 클립 자동 재생, 재생 뒤 절전 전환 안에서만 만든다. 코칭·자세 판정·AI 분석을 추가하지 않는다.",
  },
  {
    source_key: "app_store:1500098830",
    selection_reason: "영상 파일 하나에서 저장 가능한 오디오 파일 하나를 만드는 세로 조각이 단순하고 즉시 작동한다.",
    prior_review_feedback: "모든 결제자는 본인이 가진 영상에서 소리를 따로 써야 하는 제작자, 모든 순간은 영상의 음원을 편집·보관하기 직전으로 묶는다. 세 twist는 원본 변환 안에서 전체 오디오 추출, 선택 구간 추출, 음성 채널 추출로 제한한다. 자막·요약·노이즈 제거를 추가하지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = gate.get(contract.source_key);
  if (!source) throw new Error(`Missing gate-pass source: ${contract.source_key}`);
  return {
    ...source,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
    batch_category: source.category,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-001-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summary = [
  "# 강한 메커니즘 배치 001 — 사전 선별",
  "",
  "- 미검토 gate-pass 원본: 43개",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 같은 입력·같은 문제 안에서 원본 근거가 있는 결과 변화 3개를 만들 수 있음",
  "- 제외 예: 사전 기록 필수, OS·범용 AI 대체, 외부 데이터 필수, 결제 통증 부족",
  "- 앱 반영: 아직 하지 않음",
  "",
  "## 선택 원본",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
  "## 다음 순서",
  "",
  "1. 앱형 payer 3·moment 3·twist 3 작성",
  "2. Stress-3 통과 원본만 Latin-9",
  "3. Latin-9 9/9 원본만 Full-27",
  "4. 보고서를 먼저 공개한 뒤 통과 원본만 앱 승격",
  "",
];
const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-001-selection-2026-07-15.md";
fs.writeFileSync(path.join(root, summaryPath), summary.join("\n"));

console.log(JSON.stringify({ remainingGatePass: 43, selected: rows.length, output, summaryPath }, null, 2));
