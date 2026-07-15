#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const candidates = new Map(
  readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl")
    .map((row) => [row.key, row]),
);
const appKeys = new Set(
  JSON.parse(fs.readFileSync(path.join(root, "docs/research/idea-app-portfolio.json"), "utf8"))
    .map((row) => row.source_key),
);

const contracts = [
  {
    source_key: "trustmrr:check-position",
    selection_reason: "도메인·검색어·지역이 적힌 텍스트 한 줄로 현재 Google 노출 위치 한 장을 측정하는 유료 SEO 반복 업무다.",
    prior_review_feedback: "입력은 '도메인 | 검색어 | 한국 | 모바일' 텍스트 한 줄 하나다. payer는 소형 쇼핑몰·로컬 매장·SEO 대행 실무자, moment는 수정이나 보고 직후 현재 순위를 확인해야 하는 때로 통일한다. twist는 현재 순위, 상위 10개 이웃, 모바일·데스크톱 차이 카드로 제한한다. 장기 추적·자동 알림은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:docswrite",
    selection_reason: "Google Doc URL 하나를 서식을 보존한 CMS 게시 초안 한 건으로 바꾸는 실제 매출이 있는 발행 도구다.",
    prior_review_feedback: "입력은 공개 Google Doc URL 하나로 고정한다. CMS 로그인·자동 게시 대신 WordPress에 붙여 넣을 Gutenberg HTML 파일 한 개를 결과로 내서 외부 계정 행동을 없앤다. payer는 블로그를 반복 발행하는 콘텐츠 실무자, moment는 작성 완료 뒤 CMS에 옮기기 직전이다. twist는 제목 계층, 이미지 캡션, 표 서식 보존 결과만 바꾼다.",
  },
  {
    source_key: "trustmrr:autozoom-cross-platform",
    selection_reason: "화면 녹화 파일 하나에서 클릭 지점을 따라 자동 확대된 4K 설명 영상 하나를 만드는 전문 후처리 흐름이다.",
    prior_review_feedback: "입력은 화면 녹화 영상 파일 하나다. payer는 제품 데모·고객 매뉴얼·교육 영상을 반복 만드는 실무자, moment는 녹화를 끝내고 공유하기 직전으로 통일한다. twist는 클릭 자동 줌, 커서 강조, 모션 블러가 적용된 MP4 한 개만 바꾼다. 새 장면 생성·대본·자막은 추가하지 않는다.",
  },
  {
    source_key: "app_store:1509085044",
    selection_reason: "단일 블루투스 권한으로 주변 기기의 서비스·특성값을 읽어 타임스탬프 로그 파일 하나로 내보내는 전문 진단 도구다.",
    prior_review_feedback: "입력은 블루투스 권한 하나와 현재 주변 기기 스캔으로 고정한다. payer는 BLE 기기 개발·현장 설치·QA 실무자, moment는 연결은 되지만 값이 이상한 기기를 눈앞에서 진단하는 때다. twist는 RSSI 변화 로그, 서비스 UUID 목록, 특성값 변경 로그 파일로 제한한다. 기기 쓰기·제어·백그라운드 추적은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:meyoo",
    selection_reason: "스마트스토어 주문·수수료·원가가 함께 적힌 표 한 덩어리로 주문별 실이익 정산표를 계산하는 한국 판매자 문제다.",
    prior_review_feedback: "원본 Shopify 메커니즘을 한국 네이버 스마트스토어 문맥으로만 바꾼다. 입력은 '주문번호 | 상품 | 결제액 | 수수료 | 광고비 | 원가'가 적힌 CSV 또는 붙여넣기 표 한 개다. payer는 스마트스토어 셀러·운영 대행자·브랜드 정산 담당자, moment는 월 정산·가격 수정·광고 중단 판단 직전이다. twist는 주문별, 상품별, 광고 포함 실이익 표만 바꾼다.",
  },
  {
    source_key: "chrome_web_store:gnbafbeabkbkecmbedfgebgboicpnkpp",
    selection_reason: "Figma 프레임 URL과 실제 페이지 URL 한 줄을 픽셀 단위로 겹쳐 구현 오차 이미지 한 장을 만드는 디자인 QA 도구다.",
    prior_review_feedback: "입력은 'Figma 공개 프레임 URL | 실제 페이지 URL' 텍스트 한 줄 하나로 취급한다. payer는 웹 디자이너·퍼블리셔·프론트엔드 QA 실무자, moment는 배포·검수·수정 완료 직전이다. twist는 반투명 오버레이, 차이 영역 표시, 차이율 요약이 붙은 비교 이미지 한 장으로 제한한다. 자동 수정·비공개 Figma 권한은 추가하지 않는다.",
  },
  {
    source_key: "trustmrr:cable-identifier",
    selection_reason: "정체를 모르는 케이블 사진 한 장에서 종류·규격·호환 포트를 보여주는 전문 식별 결과가 즉시 필요하다.",
    prior_review_feedback: "입력은 케이블 또는 커넥터 사진 한 장이다. payer는 중고 전자기기 판매자·촬영 장비 실무자·사무실 IT 담당자, moment는 연결·구매·판매 직전 케이블 정체를 확인해야 하는 때다. twist는 정확한 종류명, 규격·속도, 호환 포트 카드로 제한한다. 안전 보장·전력 적합 판정은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:previewly",
    selection_reason: "공개 서비스 URL 하나에서 로고와 설명을 읽어 링크 공유용 OG 미리보기 이미지 한 장을 만드는 결과가 분명하다.",
    prior_review_feedback: "원본의 로고+설명 입력은 공개 서비스 URL 하나에서 같은 정보를 읽는 좁은 흐름으로 정리한다. payer는 1인 SaaS 창업자·개발자 마케터·프리랜서 제작자, moment는 링크를 처음 공유하거나 출시 글을 올리기 직전이다. twist는 1200×630 기본형, 제목 강조형, 다크 배경형 OG PNG만 바꾼다. 랜딩페이지 재디자인은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:local-styler-figma-plugin",
    selection_reason: "Figma 파일 하나에서 흩어진 색상·타이포그래피·효과를 로컬 스타일 세트로 정리하는 디자인 시스템 반복 작업이다.",
    prior_review_feedback: "입력은 현재 Figma 디자인 파일 하나다. payer는 브랜드 디자이너·디자인 시스템 담당자·외주 UI 디자이너, moment는 컴포넌트 정리·인수인계·리브랜딩 직전이다. twist는 색상 스타일, 타이포 스타일, 효과·그리드 스타일 세트만 바꾼다. 새 디자인 생성이나 팀 라이브러리 배포는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:yt-clipper",
    selection_reason: "본인이 관리하는 YouTube 영상 URL과 시작·끝 시각 한 줄로 짧은 MP4 클립 하나를 바로 추출하는 제작 흐름이다.",
    prior_review_feedback: "입력은 '본인 YouTube 영상 URL | 시작 시각 | 끝 시각' 텍스트 한 줄 하나다. payer는 자기 채널을 재가공하는 유튜버·교육자·팟캐스트 제작자, moment는 새 게시물·강의 자료·홍보 글에 특정 구간이 필요한 때다. twist는 세로 9:16, 정사각 1:1, 원본 비율 MP4만 바꾼다. 자동 하이라이트·타인 영상·전체 다운로드는 넣지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
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

const output = "docs/research/idea-strong-mechanism-batch-006-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-006-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 006 — 미검토 전문 작업",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 기존 감사 결과에 없는 Candidate 중 입력 한 덩어리 → 전문 처리 1회 → 즉시 결과 1개가 선명한 원본",
  "- 제외: 건강·안전 판정, 범용 AI 생성, 사전 장기 기록, 이미 감사한 원본",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
