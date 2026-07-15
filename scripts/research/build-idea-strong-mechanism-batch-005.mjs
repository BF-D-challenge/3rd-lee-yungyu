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

const appKeys = new Set(
  JSON.parse(fs.readFileSync(path.join(root, "docs/research/idea-app-portfolio.json"), "utf8"))
    .map((row) => row.source_key),
);

const contracts = [
  {
    source_key: "trustmrr:photo-string-art",
    selection_reason: "사진 한 장을 바늘 번호와 선 연결 순서가 있는 스트링 아트 도안 한 장으로 바꾸는 전문 알고리즘 결과가 분명하다.",
    prior_review_feedback: "과거 Stress-3 3/3 뒤 Latin-9에서 사진 입력이 제목보다 약하게 보여 review가 남았다. 입력은 사진 한 장으로 고정한다. 모든 payer는 실제 스트링 아트를 제작·수업·판매하는 사람, 모든 moment는 판에 못을 박기 직전 도안이 필요한 때로 통일한다. 세 twist는 120핀 입문 도안, 180핀 표준 도안, 240핀 정밀 도안 PDF로 제한한다. 각 제목과 smallestBuild에 사진 입력과 번호가 붙은 선 연결 도안을 명시한다.",
  },
  {
    source_key: "trustmrr:smokify",
    selection_reason: "금연 시작 정보 한 줄로 지금까지의 금연 일수·피우지 않은 담배·절약액을 계산하는 결과가 즉시 보인다.",
    prior_review_feedback: "과거 Stress-3에서 기업 프로그램 payer가 기관 행동을 요구해 2 pass·1 fail이었다. 모든 payer는 자신의 금연 성과를 지금 확인하는 개인 흡연자로 통일하고 회사·상담사·가족은 제외한다. 입력은 '금연 시작일 | 하루 개비 | 한 갑 가격' 텍스트 한 줄 하나다. 세 twist는 금연 일수, 피우지 않은 개비, 절약 금액 카드만 바꾸고 치료·건강 개선 예측은 하지 않는다.",
  },
  {
    source_key: "trustmrr:exif-data",
    selection_reason: "사진 한 장에서 공개 전 숨기고 싶은 위치·기기·전체 EXIF를 제거한 새 파일 하나를 만드는 개인정보 처리 흐름이다.",
    prior_review_feedback: "과거 Stress-3은 메커니즘이 아니라 제목이 모호해 3 review였다. 입력은 공개 직전 사진 파일 한 장으로 고정한다. 모든 payer는 사진을 외부에 게시·납품하는 실무자, 모든 moment는 원본 파일을 공개하기 직전으로 통일한다. 세 twist는 GPS 위치만 삭제, 기기 모델만 삭제, 전체 EXIF 삭제로 제한한다. 제목에 '사진'과 삭제되는 정보와 결과 파일을 모두 쓴다.",
  },
  {
    source_key: "trustmrr:mermaidonline-live",
    selection_reason: "Mermaid 코드 한 덩어리를 문서에 바로 붙일 수 있는 다이어그램 이미지 한 장으로 렌더링하는 개발자 흐름이다.",
    prior_review_feedback: "과거 Stress-3은 사용자 제목 대신 해외 제품명을 평가해 3 review였다. 입력은 Mermaid 코드 블록 하나, 처리는 렌더링 한 번으로 고정한다. 모든 payer는 이미 Mermaid 문법을 쓰는 개발·문서 실무자, 모든 moment는 문서·PR·발표 자료에 다이어그램을 붙이기 직전으로 통일한다. 세 twist는 투명 PNG, 2배 해상도 PNG, 편집 가능한 SVG 출력만 바꾼다.",
  },
  {
    source_key: "app_store:1119117405",
    selection_reason: "판재와 부품 치수 텍스트 한 덩어리를 자투리가 적은 절단 배치 PDF 한 장으로 계산하는 전문 제작 도구다.",
    prior_review_feedback: "과거 Stress-3 3/3 뒤 Latin-9에서 해외 제품명 제목 때문에 review가 남았다. 입력은 '판재 크기 | 톱날 폭 | 부품 가로×세로×수량 목록' 텍스트 블록 하나로 취급한다. 모든 payer는 판재를 직접 재단하는 가구·목공 실무자, 모든 moment는 재단소 주문 또는 톱질 직전으로 통일한다. 세 twist는 자투리 최소 배치 PDF, 재단 순서가 적힌 PDF, 부품 번호가 적힌 PDF 출력만 바꾼다.",
  },
  {
    source_key: "app_store:6760979290",
    selection_reason: "연필 스케치 사진 한 장에서 종이 그림자와 얼룩을 지우고 깨끗한 투명 배경 선화 PNG 하나를 만든다.",
    prior_review_feedback: "과거 Stress-3 3/3·Latin-9 9/9을 이미 통과했다. 입력은 종이에 그린 스케치 사진 한 장으로 고정한다. 모든 payer는 손그림을 디지털 작업에 넣는 제작자, 모든 moment는 스캔·채색·인쇄 직전 깨끗한 선화가 필요한 때로 통일한다. 세 twist는 종이 그림자 제거 PNG, 연필 얼룩 제거 PNG, 흰 배경을 투명하게 만든 PNG로 제한한다. 새 그림 생성이나 스타일 변환은 추가하지 않는다.",
  },
  {
    source_key: "app_store:288054534",
    selection_reason: "현재 위치 하나로 오늘의 기도 시각과 키블라 방향을 계산해 낯선 장소에서 바로 확인하게 하는 생활 계산 도구다.",
    prior_review_feedback: "과거 Stress-3 3/3·Latin-9 9/9을 이미 통과했다. 입력은 현재 위치 권한 하나로 고정한다. 모든 payer는 한국에서 생활·공부·여행 중인 무슬림 사용자, 모든 moment는 낯선 장소에서 다음 기도 시각이나 방향을 즉시 확인해야 하는 때로 통일한다. 세 twist는 한국 현지시각 기도표, 다음 기도까지 남은 시간, 키블라 방향 카드로 제한한다. 알림 누적·커뮤니티·종교 조언은 추가하지 않는다.",
  },
  {
    source_key: "app_store:6449972752",
    selection_reason: "마이크로 기타 한 줄의 음정을 듣고 목표 음과의 차이를 즉시 보여주는 전문 튜닝 피드백이다.",
    prior_review_feedback: "과거 Stress-3 3/3·Latin-9 8 pass·1 review였다. 입력은 마이크 권한 하나와 지금 울리는 기타 한 줄로 고정한다. 모든 payer는 공연·녹음·연습 직전 기타를 조율하는 연주자, 모든 moment는 소리를 내자마자 음정 오차를 확인해야 하는 때로 통일한다. 세 twist는 표준 E 튜닝의 현재 음·센트 오차, 줄 이름 자동 표시, 목표음에 들어온 초록 판정 카드로 제한한다. 주변 소음 제거·특수 튜닝·연주 평가를 추가하지 않는다.",
  },
  {
    source_key: "app_store:1526081216",
    selection_reason: "JSON 텍스트 하나를 검사해 배포를 막는 문법 오류 위치 하나를 즉시 표시하는 개발자 검증 흐름이다.",
    prior_review_feedback: "과거 Stress-3 3/3·Latin-9 6 pass·3 review였고 review는 제목과 결과 범위가 넓은 문제였다. CSV·YAML·코드 변환은 버리고 입력은 JSON 텍스트 블록 하나, 결과는 오류 위치가 표시된 검사 결과 하나로 고정한다. 모든 payer는 JSON을 붙여 넣고 배포·연동·공유 직전에 오류를 찾는 개발 실무자다. 세 twist는 첫 문법 오류 줄, 잘못 닫힌 괄호 위치, 잘못된 쉼표 위치 표시만 바꾼다.",
  },
  {
    source_key: "app_store:402405770",
    selection_reason: "필름·현상액·희석·온도 텍스트 한 덩어리로 보정된 현상 시간표 하나를 계산하는 아날로그 사진 전문 도구다.",
    prior_review_feedback: "과거 Stress-3 3/3·Latin-9 6 pass·3 review였고 원본에 없는 한국 동호회 레시피가 review 원인이었다. 외부 커뮤니티 데이터는 제거한다. 입력은 '필름 | 현상액 | 희석 | 온도' 텍스트 블록 하나로 고정한다. 모든 payer는 흑백 필름을 직접 현상하는 사진가·현상실 실무자, 모든 moment는 약품을 붓기 직전으로 통일한다. 세 twist는 온도 보정 시간표, 교반 시점 포함 시간표, 푸시 1스톱 시간표로 제한한다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = gate.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (source.audit?.hard_gate !== "pass") throw new Error(`Hard gate is not pass: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  return {
    ...source,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
    batch_category: source.category,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-005-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-005-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 005 — 기존 근접 통과 재활용",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 과거 Stress·Latin 결과를 재사용해 메커니즘은 살아 있고 카드 범위·제목만 고치면 되는 후보를 우선함",
  "- 제외: 사전 수집 파일 의존, 범용 AI·계산기 대체, 이미 앱에 있는 원본",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
