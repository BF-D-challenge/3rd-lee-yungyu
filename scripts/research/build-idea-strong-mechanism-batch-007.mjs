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
    source_key: "app_store:1312141691",
    selection_reason: "HAR 파일 하나를 열어 실패한 요청의 상태·헤더·본문을 읽을 수 있는 개발자용 네트워크 진단 결과가 즉시 나온다.",
    prior_review_feedback: "입력은 브라우저나 앱에서 내보낸 HAR 파일 하나다. payer는 프론트엔드 개발자·모바일 QA·API 연동 담당자, moment는 요청 실패·로그인 오류·외부 API 장애를 재현한 직후다. twist는 실패 요청 요약, 느린 요청 목록, 요청·응답 본문 비교가 담긴 HTML 보고서 한 개로 제한한다. VPN 캡처·실시간 감청·요청 재전송은 넣지 않는다.",
  },
  {
    source_key: "app_store:6705123515",
    selection_reason: "햅틱 종류 하나를 고르면 실제 기기 촉감과 구현 코드가 함께 나와 개발자가 바로 비교할 수 있다.",
    prior_review_feedback: "입력은 iPhone에서 고른 햅틱 종류 하나다. payer는 iOS 개발자·모바일 UI 디자이너·앱 QA 담당자, moment는 버튼·성공·경고 동작의 촉감을 정하기 직전이다. twist는 탭, 성공, 경고 햅틱의 실기기 재생과 Swift 코드 카드 한 장으로 제한한다. 사용자 조사·자동 코드 삽입·백그라운드 권한은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:figma-ai-rename-plugin",
    selection_reason: "복잡한 Figma 목업의 이름 없는 레이어를 시각 역할에 맞는 이름으로 한 번에 정리하는 반복 디자인 작업이다.",
    prior_review_feedback: "입력은 Figma에서 선택한 프레임 하나다. payer는 프로덕트 디자이너·디자인 시스템 담당자·개발 인수인계를 준비하는 외주 디자이너, moment는 컴포넌트화·인수인계·리뷰 직전이다. twist는 UI 역할명, 계층 경로명, 반복 요소 번호가 적용된 레이어 이름 변경 미리보기 한 장으로 제한한다. 새 디자인 생성·팀 라이브러리 배포·전체 파일 자동 수정은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:pdf-dino",
    selection_reason: "표가 든 PDF 한 개에서 행과 열을 복원해 바로 계산할 수 있는 구조화 파일 하나로 바꾸는 문서 작업이다.",
    prior_review_feedback: "입력은 표가 들어 있는 PDF 파일 하나다. payer는 정산 담당자·리서치 운영자·문서 디지털화 실무자, moment는 PDF 수치를 비교·합산·업로드하기 직전이다. twist는 Excel, CSV, JSON 중 한 형식으로 내보낸 구조화 파일 하나만 바꾼다. 1만 페이지·OCR 정확도 보장·여러 파일 일괄 처리는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:videosubtitleone",
    selection_reason: "영상 파일 하나에 읽기 쉬운 자막 스타일을 입힌 완성 MP4 한 개를 만드는 결과가 명확하다.",
    prior_review_feedback: "입력은 말소리가 있는 영상 파일 하나다. payer는 숏폼 제작자·온라인 강사·제품 데모 담당자, moment는 영상을 게시·납품·공유하기 직전이다. twist는 기본 가독형, 강조 단어형, 노래방 진행형 자막이 적용된 MP4 한 개로 제한한다. 다국어 번역·대본 생성·여러 영상 일괄 처리는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:memosyne",
    selection_reason: "메신저에서 받은 일정 문장 하나를 놓치지 않도록 날짜·시간·할 일을 읽어 캘린더 파일 한 개로 바꾼다.",
    prior_review_feedback: "원본 WhatsApp 메커니즘을 한국 메신저 문맥으로만 바꾼다. 입력은 카카오톡 등에서 복사한 일정 문장 한 덩어리다. payer는 프리랜서·개인 레슨 운영자·소규모 행사 담당자, moment는 약속·마감·반복 일정을 받은 직후다. twist는 단일 약속, 마감 할 일, 반복 일정으로 해석한 ICS 파일 한 개로 제한한다. 캘린더 로그인·메신저 봇·상대방 알림은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:exam-forge",
    selection_reason: "강의 자료 파일 하나만 근거로 문제와 해설이 붙은 시험지를 만드는 교육용 세로 조각이다.",
    prior_review_feedback: "입력은 강의 노트 또는 슬라이드 PDF 파일 하나다. payer는 교사·학원 강사·자격시험 스터디 운영자, moment는 수업 복습·모의고사·보충 문제를 준비하기 직전이다. twist는 개념 확인형, 적용 문제형, 시간 제한 모의형 시험지 PDF 한 개로 제한한다. 자료 밖 지식·자동 채점·학습관리 시스템 연동은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:kejbdjndbnbjgmefkgdddjlbokphdefk",
    selection_reason: "웹페이지 URL 하나로 Google 태그 설치 오류를 찾아 수정 위치가 보이는 QA 보고서 한 장을 만든다.",
    prior_review_feedback: "입력은 본인이 관리하는 공개 웹페이지 URL 하나다. payer는 퍼포먼스 마케터·프론트엔드 개발자·분석 구축 대행자, moment는 캠페인 시작·배포·전환 누락 확인 직전이다. twist는 누락 태그, 중복 발화, 동의 전 발화가 표시된 HTML 진단 보고서 한 개로 제한한다. 계정 로그인·코드 자동 수정·장기 모니터링은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:pinstats",
    selection_reason: "Pinterest 핀 URL 하나에서 노출·저장·클릭 성과를 한 장으로 확인하는 실제 매출이 있는 분석 도구다.",
    prior_review_feedback: "입력은 공개 Pinterest 핀 URL 하나다. payer는 콘텐츠 마케터·쇼핑몰 운영자·Pinterest 운영 대행자, moment는 다음 핀 제작·주간 보고·성과 비교 직전이다. twist는 노출 대비 저장률, 클릭률, 최근 반응 요약이 담긴 통계 카드 한 장으로 제한한다. 계정 로그인·예약 게시·장기 추적은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:appgrowkit",
    selection_reason: "공개 App Store URL 하나에서 키워드·리뷰·스크린샷의 다음 개선점 한 장을 뽑는 유료 앱 성장 작업이다.",
    prior_review_feedback: "입력은 공개 App Store 앱 URL 하나다. payer는 인디 앱 개발자·모바일 그로스 마케터·ASO 대행자, moment는 업데이트·메타데이터 수정·월간 성장 회의 직전이다. twist는 키워드 공백, 리뷰 불만 주제, 스크린샷 메시지 누락이 정리된 개선 보고서 한 장으로 제한한다. 순위 보장·자동 업데이트·경쟁 앱 장기 추적은 넣지 않는다.",
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

const output = "docs/research/idea-strong-mechanism-batch-007-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-007-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 007 — 전문 작업 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 기존 카드 감사에 한 번도 들어가지 않은 Candidate 중 입력 한 덩어리 → 전문 처리 1회 → 즉시 결과 1개가 선명한 원본",
  "- 제외: 금융 계산·보안 보장, 기존 파일 공유 카드와 가까운 원본, 범용 생성만 남는 원본",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
