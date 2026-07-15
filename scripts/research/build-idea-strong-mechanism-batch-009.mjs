#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const researchDir = path.join(root, "docs/research");
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const candidates = new Map(
  readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl")
    .map((row) => [row.key, row]),
);
const appKeys = new Set(
  JSON.parse(fs.readFileSync(path.join(researchDir, "idea-app-portfolio.json"), "utf8"))
    .map((row) => row.source_key),
);
const priorCardKeys = new Set();
for (const filename of fs.readdirSync(researchDir)) {
  if (!filename.includes("card-drafts") || !filename.endsWith(".jsonl")) continue;
  for (const line of fs.readFileSync(path.join(researchDir, filename), "utf8").split(/\r?\n/).filter(Boolean)) {
    const row = JSON.parse(line);
    if (row.source_key) priorCardKeys.add(row.source_key);
  }
}

const contracts = [
  {
    source_key: "app_store:583922375",
    selection_reason: "카메라 권한 하나로 필름·디지털 촬영 직전의 조리개·셔터·ISO 결정을 닫는 전문 노출 계산이다.",
    prior_review_feedback: "입력은 촬영 장면을 비추는 단일 카메라 권한이다. payer는 필름 사진가·제품 사진가·소규모 촬영 스튜디오 조명 담당자처럼 유료 촬영 결과에 책임지는 사람으로 쓴다. 세 moment는 첫 컷 직전, 조명 변경 직후, 재촬영 노출을 맞추기 직전처럼 모든 payer가 겪는 촬영 직전 상황으로 쓴다. 세 twist는 조리개 우선 셔터값, 셔터 우선 조리개값, 평균 측광 노출 카드처럼 같은 노출 측정의 표시 초점만 바꾼다. 과초점거리·갤러리 사진·외장 디퓨저를 추가 입력으로 섞지 않는다.",
  },
  {
    source_key: "app_store:430807521",
    selection_reason: "결승선 카메라 한 번으로 여러 참가자의 순위와 기록이 남는 현장 스포츠 판정 결과가 선명하다.",
    prior_review_feedback: "입력은 결승선을 고정해 비추는 단일 카메라 권한이다. payer는 육상 코치·학교 체육교사·생활체육 대회 운영자처럼 여러 참가자의 기록을 직접 확정하는 사람으로 쓴다. 세 moment는 훈련 기록 발표, 교내 측정 결과 입력, 소규모 대회 순위 공지 직전처럼 모두 사진 판정이 필요한 상황이어야 한다. 세 twist는 참가자별 통과 시각, 순위선 오버레이, 공유용 포토피니시 이미지처럼 같은 결승선 영상 처리 결과의 표시만 바꾼다. 다른 기기 원격 시작·선수 태그 사전 입력·공식 0.01초 보장은 넣지 않는다.",
  },
  {
    source_key: "app_store:6760473513",
    selection_reason: "기기 기울기 하나에서 네 바퀴 중 어디를 몇 cm 올릴지 계산해 캠핑 도착 직후 행동을 바로 정한다.",
    prior_review_feedback: "입력은 캠핑 차량 바닥에 둔 휴대폰의 단일 기기 기울기 권한이다. payer는 캠핑카 소유자·카라반 대여 운영자·캠핑 차량 설치 대행자처럼 차량 수평을 직접 맞추는 사람으로 쓴다. 세 moment는 숙박 설치, 다음 대여 인계, 장박 위치 재조정 직전처럼 모든 payer에게 수평 보정이 필요한 상황이어야 한다. 세 twist는 바퀴별 cm 보정량, 먼저 올릴 바퀴 순서, 수평 도달 여부처럼 동일 측정 결과의 표시만 바꾼다. 식당 검색·경로 검사·두 번째 기기 연동은 넣지 않는다.",
  },
  {
    source_key: "app_store:655607914",
    selection_reason: "드럼 소리 한 번을 분석해 어느 러그를 얼마나 조정할지 알려주는 악기 전문 튜닝 결과다.",
    prior_review_feedback: "입력은 튜닝 중인 드럼을 두드린 단일 기기 마이크 권한이다. payer는 공연 드러머·녹음실 드럼 테크니션·드럼 레슨 강사처럼 드럼 음정을 직접 맞추는 사람으로 쓴다. 세 moment는 무대 사운드체크, 녹음 시작, 수업 시범 직전처럼 모든 payer가 균일한 튜닝을 확인해야 하는 상황이어야 한다. 세 twist는 목표 피치 차이, 러그별 불균형, 상·하피 간격처럼 같은 소리 분석의 표시 초점만 바꾼다. 메트로놈·리허설 녹음·곡 목록은 넣지 않는다.",
  },
  {
    source_key: "app_store:1520204499",
    selection_reason: "저해상도 래스터 파일 하나를 인쇄·커팅에 쓸 수 있는 SVG 한 개로 바꾸는 전문 파일 변환이다.",
    prior_review_feedback: "입력은 JPG 또는 PNG 이미지 파일 하나이고 결과는 SVG 파일 하나로 고정한다. payer는 소형 인쇄소 디자이너·레이저 커팅 공방 운영자·로고 납품 프리랜서처럼 확대 가능한 벡터 파일을 반복 납품하는 사람으로 쓴다. 세 moment는 대형 출력, 커팅 경로 전송, 로고 원본 납품 직전처럼 모든 payer가 깨지지 않는 벡터 파일을 필요로 하는 상황이어야 한다. 세 twist는 윤곽 단순화, 모서리 매끄럽게, 세부 수준 조절처럼 원본이 제공하는 변환 옵션 한 개만 바꾼 SVG 결과로 쓴다. 여러 출력 형식·수동 편집·새 디자인 생성은 넣지 않는다.",
  },
  {
    source_key: "app_store:6745445528",
    selection_reason: "원시 JSON 텍스트 하나를 검증하고 접어 읽을 수 있는 구조로 바꿔 API 확인 시간을 줄인다.",
    prior_review_feedback: "입력은 원시 JSON 텍스트 한 덩어리다. payer는 백엔드 개발자·모바일 QA 엔지니어·외부 API를 검수하는 기술 PM처럼 JSON 응답을 직접 확인하는 사람으로 쓴다. 세 moment는 오류 재현, 배포 전 응답 확인, 협력사 필드 검수 직전처럼 모든 payer가 구조와 값을 확인해야 하는 상황이어야 한다. 세 twist는 구문 오류 줄, 접을 수 있는 트리, 선택 키의 전체 경로처럼 동일 JSON 검증·형식화 결과의 표시만 바꾼다. Safari 설치·API 호출·외부 계정 데이터는 넣지 않는다.",
  },
  {
    source_key: "app_store:1643788233",
    selection_reason: "현장 삼각형 치수 텍스트 한 덩어리에서 절단에 필요한 나머지 값과 전개 치수를 즉시 계산한다.",
    prior_review_feedback: "입력은 두 변과 각도처럼 알려진 현장 치수를 적은 텍스트 한 덩어리다. payer는 배관 제작자·판금 가공자·설비 시공 반장처럼 절단 전에 치수를 직접 계산하는 사람으로 쓴다. 세 moment는 자재 절단, 비대칭 연결부 제작, 현장 재가공 직전처럼 모든 payer가 계산 오류를 피해야 하는 상황이어야 한다. 세 twist는 직각삼각형 나머지 변, 부등변삼각형 각도, 배관 대각 절단 길이처럼 원본 계산기의 좁은 계산 결과 하나로 쓴다. AR 전개·여러 형상 연속 계산·설계 자동화는 넣지 않는다.",
  },
  {
    source_key: "app_store:1494197457",
    selection_reason: "촬영 장면의 카메라 프리뷰 한 번에서 DSLR에 바로 넣을 켈빈 화이트밸런스 값을 돌려준다.",
    prior_review_feedback: "입력은 조명 장면을 비추는 단일 카메라 권한이다. payer는 제품 사진가·영상 촬영감독·소규모 스튜디오 조명 담당자처럼 색을 맞춰 납품하는 사람으로 쓴다. 세 moment는 첫 촬영, 광원 교체, 재촬영 색 맞춤 직전처럼 모든 payer가 즉시 색온도를 확인해야 하는 상황이어야 한다. 세 twist는 켈빈 수치, 보정 후 권장값, 측정 장면이 함께 찍힌 켈빈 스냅샷처럼 동일 색온도 분석의 표시만 바꾼다. 위치 정보·장기 기록·색 정확도 보장은 넣지 않는다.",
  },
  {
    source_key: "app_store:6755650844",
    selection_reason: "트레이딩 카드 사진 한 장에서 테두리 치우침을 수치화해 감정 제출·판매 전 판단을 돕는다.",
    prior_review_feedback: "입력은 트레이딩 카드 정면 사진 한 장이다. payer는 카드숍 매입 담당자·등급 감정 제출 대행자·고가 카드를 거래하는 수집가처럼 센터링을 반복 확인하는 사람으로 쓴다. 세 moment는 매입가 확정, 감정 발송, 판매 글 게시 직전처럼 모든 payer가 테두리 균형을 근거로 선별해야 하는 상황이어야 한다. 세 twist는 좌우 비율, 상하 비율, 치우친 경계 오버레이처럼 사진 기반 센터링 분석 결과만 바꾼다. 시장 가격·공식 등급 예측·앨범 기록은 넣지 않는다.",
  },
  {
    source_key: "app_store:1260311003",
    selection_reason: "인쇄 악보 사진 한 장을 음악 기호로 인식해 바로 들을 수 있는 전문 음악 OCR 결과다.",
    prior_review_feedback: "입력은 인쇄 악보 한 페이지 사진 한 장이다. payer는 피아노 반주자·합주를 준비하는 음악 교사·교회 성가대 지휘자처럼 낯선 악보를 빠르게 검토하는 사람으로 쓴다. 세 moment는 첫 합주, 대체 반주, 파트 오류 확인 직전처럼 모든 payer가 악보가 어떻게 들리는지 바로 확인해야 하는 상황이어야 한다. 세 twist는 선택 마디부터 재생, 느린 템포 재생, 한 성부만 강조 재생처럼 같은 악보 OCR 후 재생 결과의 한 기능만 바꾼다. 다중 페이지·파일 내보내기·100개 악기 선택은 넣지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("app_store:")) throw new Error(`Not app_store: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (priorCardKeys.has(contract.source_key)) throw new Error(`Source already has a card draft: ${contract.source_key}`);
  return {
    source_key: source.key,
    name: source.name,
    url: source.url,
    category: source.category ?? source.dataset,
    source_text: source.source_text,
    five_sentences: source.five_sentences,
    market_signal: source.market_signal,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-009-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-009-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 009 — 미검수 App Store 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 공통 조건: `app_store:` Candidate, 기존 카드 초안 0회, 앱 포트폴리오 미포함",
  "- 우선순위: 전문 작업의 입력 1개 → 처리 1회 → 결과 1개",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name.replace(/\|/g, "\\|")} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
