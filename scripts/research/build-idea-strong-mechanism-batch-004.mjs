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
    .map((row) => [row.source_key, row]),
);

const contracts = [
  {
    source_key: "trustmrr:framera",
    selection_reason: "영상 파일 하나에서 원하는 순간의 고해상도 정지 이미지 하나를 뽑는 제작 흐름이 명확하다.",
    prior_review_feedback: "모든 payer는 영상에서 정확한 한 장을 뽑는 영상 제작 실무자, 모든 moment는 영상 편집·게시 직전 정지 이미지가 필요한 때로 통일한다. 입력은 영상 파일 하나다. 세 twist는 원본 해상도 PNG, 고화질 JPG, 타임코드가 파일명에 들어간 JPG 출력만 바꾼다. 썸네일 디자인·얼굴 선택·자세 분석은 추가하지 않는다.",
  },
  {
    source_key: "app_store:949490225",
    selection_reason: "사진 한 장을 고정된 실제 인쇄 크기의 파일 한 장으로 만드는 결과가 구체적이다.",
    prior_review_feedback: "입력은 사진 파일 한 장으로 고정하고 크기는 twist마다 미리 정한다. 모든 payer는 사진을 정확한 실물 크기로 한 장 인쇄해야 하는 제작자, 모든 moment는 인쇄 직전 크롭과 실제 크기를 확인하는 때로 통일한다. 세 twist는 3×4cm 증명사진, 10×15cm 사진, A4 한 장 배치 PDF로 제한한다. 여러 사진 배치와 프린터 직접 제어는 제외한다.",
  },
  {
    source_key: "app_store:1505140281",
    selection_reason: "오디오 파일 하나를 재생 반응형 시각화 MP4 하나로 내보내는 즉시 결과가 선명하다.",
    prior_review_feedback: "배경 이미지·로고 입력은 모두 제거하고 오디오 파일 하나만 받는다. 모든 payer는 음원에 붙일 간단한 시각화 영상을 만드는 음악 제작자, 모든 moment는 음원을 게시하기 직전 영상 파일이 필요한 때로 통일한다. 세 twist는 파형, 막대, 원형 스펙트럼 시각화 방식만 바꾸고 결과는 MP4 한 개로 닫는다.",
  },
  {
    source_key: "app_store:1043963852",
    selection_reason: "배관 치수 한 줄을 받아 현장 제작에 필요한 오프셋 값과 도면 한 장을 계산하는 전문 도구다.",
    prior_review_feedback: "모든 payer는 배관 제작·용접을 실제로 하는 실무자, 모든 moment는 절단·조립 직전 오프셋 치수를 계산해야 하는 때로 통일한다. 입력은 단위가 포함된 치수 텍스트 한 줄 하나다. 세 twist는 90도 엘보 오프셋, 두 엘보 사이 중심거리, 비스듬한 파이프 길이 계산으로 제한한다. 제목에 입력 문제와 결과 치수를 한국어로 풀어 쓴다.",
  },
  {
    source_key: "app_store:525176875",
    selection_reason: "장소와 날짜 한 줄에서 태양·달의 촬영 시각과 방향을 계산하는 전문 촬영 계획 흐름이다.",
    prior_review_feedback: "입력은 '장소 | 날짜' 형식의 텍스트 한 줄 하나로 취급한다. 모든 payer는 자연광 촬영 시간을 계획하는 사진·영상 제작자, 모든 moment는 현장 방문이나 촬영 전 빛의 시각과 방향을 확인하는 때로 통일한다. 세 twist는 골든아워 시각표, 일몰 시각·방향 카드, 월출 시각·방향 카드로 제한한다. 날씨 예측·AR·실시간 카메라는 제외한다.",
  },
  {
    source_key: "app_store:1446555252",
    selection_reason: "보유 룬 목록 하나를 게임 규칙표와 대조해 지금 만들 수 있는 룬워드 목록 하나를 반환한다.",
    prior_review_feedback: "카메라·실시간 일정·드롭 확률은 제외하고 입력은 보유 룬 이름을 적은 텍스트 한 덩어리 하나로 고정한다. 모든 payer는 디아블로2 룬 창고를 정리하는 플레이어, 모든 moment는 제작 전에 가능한 룬워드를 확인하는 때로 통일한다. 세 twist는 지금 제작 가능, 룬 하나 부족, 무기용만 필터한 결과 목록으로 제한한다.",
  },
  {
    source_key: "trustmrr:validemail-co",
    selection_reason: "이메일 CSV 하나를 검사해 문제가 표시된 CSV 하나로 되돌려 주는 반복 데이터 정리 흐름이다.",
    prior_review_feedback: "입력은 이메일 열이 있는 CSV 파일 하나로 고정한다. 모든 payer는 발송 전 이메일 목록을 정리하는 소형 마케팅·운영 실무자, 모든 moment는 캠페인 업로드 직전 목록 오류를 확인하는 때로 통일한다. 세 twist는 형식 오류 표시, 존재하지 않는 도메인 표시, 일회용 도메인 표시 CSV로 제한한다. 실제 수신·발송 성공을 보장하지 않고 관찰 가능한 형식·DNS·공개 목록 판정만 출력한다.",
  },
  {
    source_key: "trustmrr:filexhost",
    selection_reason: "파일 하나를 올리면 상대방이 바로 열 수 있는 공유 URL 하나가 생기는 결과가 명확하다.",
    prior_review_feedback: "입력은 일반 파일 하나로 고정한다. 모든 payer는 큰 파일을 잠깐 공유해야 하는 1인 제작자와 실무자, 모든 moment는 메일 첨부 제한 때문에 링크가 필요한 때로 통일한다. 세 twist는 바로 다운로드 링크, 브라우저 미리보기 링크, 조회 횟수가 보이는 공유 링크로 제한한다. 개인정보·민감 파일을 받지 않는다고 명시하고 장기 보관·협업·폴더 기능은 제외한다.",
  },
  {
    source_key: "trustmrr:myjson-online",
    selection_reason: "JSON 텍스트 하나를 저장하고 다시 읽을 수 있는 API URL 하나로 바꾸는 개발자 흐름이다.",
    prior_review_feedback: "입력은 JSON 텍스트 한 덩어리 하나로 고정한다. 모든 payer는 데모·테스트에서 임시 JSON 주소가 필요한 개발자, 모든 moment는 백엔드 없이 화면을 연결해야 하는 때로 통일한다. 세 twist는 읽기 전용 URL, 버전 번호가 붙은 스냅샷 URL, 브라우저에서 포맷된 미리보기 URL 출력만 바꾼다. 인증·민감정보·무기한 보관·복잡한 API 관리는 제외한다.",
  },
  {
    source_key: "trustmrr:mockphine",
    selection_reason: "경로와 JSON을 담은 텍스트 하나로 화면 테스트용 로컬 응답 주소 하나를 만드는 개발 흐름이다.",
    prior_review_feedback: "입력은 '경로 + JSON' 텍스트 블록 하나로 고정한다. 모든 payer는 백엔드가 막힌 동안 화면을 확인하는 프론트엔드·QA 실무자, 모든 moment는 API가 없어 화면 테스트가 멈춘 때로 통일한다. 세 twist는 성공 데이터, 빈 목록, 오류 상태 응답으로 제한한다. 결과 제목은 API 전문 용어보다 '성공 화면·빈 화면·오류 화면 테스트 주소'처럼 결과를 쉽게 쓴다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = gate.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (source.audit?.hard_gate !== "pass") throw new Error(`Hard gate is not pass: ${contract.source_key}`);
  return {
    ...source,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
    batch_category: source.category,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-004-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-004-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 004 — 전문 계산·파일 변환",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 범용 AI보다 전문 처리 규칙이 중요하고 입력 1개 → 즉시 결과 1개로 닫히는 원본",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
