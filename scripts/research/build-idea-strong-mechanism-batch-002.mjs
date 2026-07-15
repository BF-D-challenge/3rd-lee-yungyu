#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const gate = new Map(readJsonl("docs/research/idea-candidate-gate-results-2026-07-14.jsonl").map((row) => [row.source_key, row]));
const contracts = [
  {
    source_key: "trustmrr:carmaster",
    selection_reason: "실제 월 매출이 있는 차량 청취 전용 음악 마스터링이며 음악 파일 하나가 저장 가능한 오디오 하나로 끝난다.",
    prior_review_feedback: "모든 payer는 차량 스피커에서 랩·힙합 믹스를 확인하는 제작자, 모든 moment는 공개·납품 전 차량 재생에서 균형을 확인하는 때로 묶는다. 세 twist는 차량 청취용 마스터링 안에서 저역 과밀 정리, 보컬 명료도 보정, 차 안 체감 음량 균일화로만 제한한다. 전문 마스터링 보장이나 새 음원 생성을 주장하지 않는다.",
  },
  {
    source_key: "trustmrr:sqlflow",
    selection_reason: "CSV 파일 하나를 열 구조에 맞는 SQL 스크립트 하나로 바꾸는 개발자용 세로 조각이 분명하다.",
    prior_review_feedback: "입력은 CSV 파일 하나로 고정한다. 모든 payer는 여러 고객·프로젝트의 데이터 이전을 맡는 개발자, 모든 moment는 파일을 DB로 옮기기 전 SQL 초안을 만들어야 하는 때로 묶는다. 세 twist는 PostgreSQL, MySQL, T-SQL 방언 출력만 바꾼다. production-ready나 즉시 실행 가능을 주장하지 말고 타입 추정과 검토 필요 표시가 있는 초안 스크립트라고 쓴다.",
  },
  {
    source_key: "trustmrr:chordprep",
    selection_reason: "코드가 포함된 곡 텍스트 하나를 조옮김 계산해 연주용 코드 시트 한 장으로 만드는 흐름이 선명하다.",
    prior_review_feedback: "URL 수집은 버리고 코드가 포함된 곡 텍스트 하나만 입력으로 받는다. 모든 payer는 곡을 다른 키로 바로 연주해야 하는 연주자·반주자, 모든 moment는 합주·예배·공연 직전 키를 맞춰야 하는 때로 묶는다. 세 twist는 목표 키 조옮김, 카포 위치에 맞춘 코드 표시, 한 페이지 인쇄 배치로 제한한다. 원곡 코드가 입력에 이미 있어야 한다.",
  },
  {
    source_key: "trustmrr:mockphine",
    selection_reason: "엔드포인트 정의 하나를 받아 프론트엔드가 즉시 호출할 로컬 모의 응답 하나를 돌려주는 개발 흐름이다.",
    prior_review_feedback: "입력은 엔드포인트 경로와 JSON 응답을 담은 텍스트 한 덩어리로 고정한다. 모든 payer는 실제 백엔드가 준비되기 전 화면을 테스트하는 개발·QA 실무자, 모든 moment는 막힌 API 때문에 테스트를 이어가야 하는 때로 묶는다. 세 twist는 성공 JSON, 빈 결과 JSON, 오류 상태 JSON 모의 응답으로 제한한다. 팀 협업·실제 서버 통과·배포 기능은 빼고 로컬 한 엔드포인트만 만든다.",
  },
  {
    source_key: "trustmrr:hyperfocal",
    selection_reason: "참고 이미지 하나에서 편집기에 다시 쓸 색감 프리셋 파일 하나를 만드는 반복 제작 흐름이다.",
    prior_review_feedback: "입력은 원하는 색감의 참고 사진 한 장으로 고정한다. 모든 payer는 사진과 짧은 영상을 함께 만드는 소형 콘텐츠 제작자, 모든 moment는 같은 색감을 다음 촬영물에 반복 적용하려는 편집 시작 전으로 묶는다. 세 twist는 Lightroom XMP, Photoshop ACR XMP, 영상용 LUT 중 출력 형식 하나만 바꾼다. 완벽한 색상 일치나 자동 편집을 주장하지 않고 시작용 색감 초안이라고 쓴다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = gate.get(contract.source_key);
  if (!source) throw new Error(`Missing candidate source: ${contract.source_key}`);
  if (source.audit?.hard_gate !== "pass") throw new Error(`Hard gate is not pass: ${contract.source_key}`);
  return {
    ...source,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
    batch_category: source.category,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-002-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-002-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 002 — gate review 재선별",
  "",
  "- 과거 gate review·hard gate pass: 570개",
  `- 앱형 카드 재작성 대상: ${rows.length}개`,
  "- 기준: 제목·범위·처리 설명을 좁히면 입력 1개 → 결과 1개가 남고, 같은 문제 안에서 세 결과 변화를 만들 수 있음",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
