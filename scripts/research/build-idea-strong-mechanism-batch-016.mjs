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
const priorStrongKeys = new Set();
const allCardDraftKeys = new Set();
for (const file of fs.readdirSync(researchDir)) {
  const isPriorStrong = /^idea-strong-mechanism-batch-(00[1-9]|01[0-4])-(input|card-drafts)(?:-raw)?-.*\.jsonl$/.test(file);
  const isAnyCardDraft = file.includes("card-drafts") && file.endsWith(".jsonl");
  if (!isPriorStrong && !isAnyCardDraft) continue;
  for (const row of readJsonl(path.join("docs/research", file))) {
    const key = row.source_key ?? row.key;
    if (!key) continue;
    if (isPriorStrong) priorStrongKeys.add(key);
    if (isAnyCardDraft) allCardDraftKeys.add(key);
  }
}

const contracts = [
  {
    source_key: "chrome_web_store:pgdmhodlebnljmmknpicldhgdnllonmd",
    selection_reason: "HTML 코드 한 덩어리를 이메일 클라이언트에서 바로 쓸 수 있는 호환 HTML 파일로 정리하는 전문 변환이다.",
    prior_review_feedback: "입력은 HTML 코드 텍스트 한 덩어리다. payer는 캠페인 메일을 만드는 1인 마케터·주문 안내를 관리하는 쇼핑몰 운영자·고객 이메일을 납품하는 제작 대행자다. moment는 발송 전 렌더 점검·공지 템플릿 교체·고객 납품 직전처럼 세 payer 모두 호환 HTML이 필요한 공통 순간으로 쓴다. twist는 CSS 인라인 HTML, 위험 태그 제거 HTML, 이미지 alt fallback이 남은 HTML 파일 한 개로 제한한다. Gmail 로그인·실제 발송·수신자 행동은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:goncjmclfcobfokbehhinncaoakndmlj",
    selection_reason: "현재 웹페이지에서 민감한 한 종류의 정보를 가려 안전하게 화면을 공유하는 즉시 브라우저 상태 변화다.",
    prior_review_feedback: "입력은 현재 탭을 읽는 단일 사이트 권한 하나다. payer는 고객 화면을 시연하는 SaaS 운영자·원격 지원 담당자·수업 화면을 공유하는 강사다. moment는 라이브 데모·지원 통화·녹화 시작 직전처럼 세 payer 모두 민감정보 마스킹이 필요한 공통 순간으로 쓴다. twist는 이메일·전화번호 패턴, 폼 입력값, 사용자가 한 번 클릭한 요소만 가린 현재 페이지 상태 하나로 제한한다. 녹화·영구 저장·여러 탭 추적은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:eccnkhkjhagigeodencdfcdeahdfpifp",
    selection_reason: "영문 레시피 텍스트 한 덩어리의 미국식 단위를 한국 주방에서 바로 쓰는 미터법 레시피로 바꾼다.",
    prior_review_feedback: "입력은 영문 레시피 텍스트 한 덩어리다. payer는 해외 레시피를 따라 하는 홈베이커·수업 자료를 만드는 요리 강사·레시피를 번역하는 콘텐츠 편집자다. moment는 재료 계량 전·수업안 인쇄 전·번역 원고 납품 직전처럼 세 payer 모두 변환 레시피가 필요한 공통 순간으로 쓴다. twist는 cup·fl oz를 ml로, oz·lb를 g·kg로, Fahrenheit를 Celsius로 바꾼 TXT 파일 한 개로 제한한다. 재료 추천·장보기·레시피 생성은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:dlepebghjlnddgihakmnpoiifjjpmomh",
    selection_reason: "Google 문서 한 개의 수정 이력을 최종본이 아닌 실제 작성 과정 보고서로 바꾸는 교육·편집 검수다.",
    prior_review_feedback: "입력은 사용자가 권한을 허용한 Google Docs 문서 한 개다. payer는 학생 글을 피드백하는 교사·외주 원고를 검수하는 편집자·팀 문서 작성 과정을 회고하는 콘텐츠 리더다. moment는 피드백 작성·원고 승인·회고 직전처럼 세 payer 모두 수정 과정 근거가 필요한 공통 순간으로 쓴다. twist는 작성 세션 타임라인, 가장 크게 바뀐 구간 목록, 삭제·복원 구간 목록이 담긴 HTML 보고서 한 개로 제한한다. 표절 판정·AI 작성 판정·여러 문서 감시는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:phidhnmbkbkbkbknhldmpmnacgicphkf",
    selection_reason: "공개 자료 URL 하나의 서지 정보를 읽어 제출 가능한 참고문헌 한 줄로 만드는 검증된 변환이다.",
    prior_review_feedback: "입력은 공개 웹페이지 또는 논문 URL 하나다. payer는 과제를 쓰는 대학생·리서치 보고서를 만드는 실무자·고객 자료의 출처를 정리하는 콘텐츠 편집자다. moment는 과제 제출·보고서 공유·원고 납품 직전처럼 세 payer 모두 참고문헌이 필요한 공통 순간으로 쓴다. twist는 APA 7, MLA 9, Harvard 형식의 TXT 파일 한 개로 제한한다. 참고문헌 검색·내용 요약·사실 검증은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:pgljnijjnadadejhogpebobnldbeocbn",
    selection_reason: "현재 Shopify 페이지의 dataLayer 이벤트를 읽어 누락 키와 실행 순서를 검수 가능한 파일로 내보낸다.",
    prior_review_feedback: "입력은 현재 Shopify 테스트 페이지를 읽는 단일 탭 권한 하나다. payer는 전환 이벤트를 구현하는 Shopify 개발자·고객 픽셀을 검수하는 분석 대행자·광고 전환 누락을 조사하는 이커머스 마케터다. moment는 checkout 이벤트 테스트·Custom Pixel 미리보기 오류·고객 인수인계 직전처럼 세 payer 모두 이벤트 근거가 필요한 공통 순간으로 쓴다. twist는 event 이름 목록 JSON, 필수 키 누락 HTML, 이벤트 시간순 JSON 파일 한 개로 제한한다. GTM 주입·실제 주문·상시 모니터링은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:enohbojoeceihccbalgijnfbhbinfllf",
    selection_reason: "공개 WordPress 사이트 URL 하나에서 노출된 테마·플러그인·버전 단서를 정적 구성 목록으로 만든다.",
    prior_review_feedback: "입력은 공개 WordPress 사이트 URL 하나다. payer는 유지보수 견적을 내는 WordPress 개발자·마이그레이션을 준비하는 소형 에이전시·고객 사이트 기술 구성을 확인하는 기술 영업자다. moment는 견적 작성·이전 계획·첫 미팅 직전처럼 세 payer 모두 공개 구성 근거가 필요한 공통 순간으로 쓴다. twist는 활성 테마 단서 JSON, 공개 플러그인 slug CSV, 버전·호스팅 힌트 HTML 보고서 한 개로 제한한다. 취약점 공격·로그인·비공개 정보 추정은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:nhjmglaaldpcoefcekigflenpdgoaela",
    selection_reason: "공개 웹페이지 URL 하나에서 링크의 rel·색인·외부 연결 상태를 바로 고칠 수 있는 목록으로 만든다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL 하나다. payer는 게시물을 발행하는 콘텐츠 운영자·고객 사이트를 감사하는 SEO 대행자·제휴 링크를 관리하는 이커머스 편집자다. moment는 발행 전·월간 SEO 보고·제휴 페이지 수정 직전처럼 세 payer 모두 링크 상태표가 필요한 공통 순간으로 쓴다. twist는 dofollow·nofollow CSV, 외부 링크 상태 HTML, 색인 가능성 단서 CSV 파일 한 개로 제한한다. 검색 순위 예측·여러 사이트 크롤링·백링크 구매는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:eihpmapodnppeemkhkbhikmggfojdkjd",
    selection_reason: "단일 화면 녹화 권한으로 클릭과 입력 위치를 따라가는 자동 줌·팬 MP4 한 개를 만든다.",
    prior_review_feedback: "입력은 화면 녹화 단일 기기 권한 하나다. payer는 제품 데모를 만드는 1인 SaaS 운영자·문제 해결 영상을 보내는 고객지원 담당자·짧은 도구 수업을 만드는 강사다. moment는 데모 게시·지원 답변·수업 자료 전달 직전처럼 세 payer 모두 보기 쉬운 화면 녹화가 필요한 공통 순간으로 쓴다. twist는 클릭 위치 자동 줌, 입력 영역 자동 팬, 커서 강조가 적용된 MP4 파일 한 개로 제한한다. 대본 생성·음성 편집·클라우드 업로드는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:bbjcdpjihbfmkgikdkplcalfebgcjjpm",
    selection_reason: "cURL 명령 하나에서 실제 서버 없이 화면 상태를 재현할 단일 mock 응답 규칙 파일을 만든다.",
    prior_review_feedback: "입력은 API 요청이 담긴 cURL 명령 텍스트 한 덩어리다. payer는 백엔드를 기다리는 프론트엔드 개발자·오류 상태를 검수하는 API QA·고객 시연 환경을 만드는 솔루션 엔지니어다. moment는 백엔드 미완성·빈 목록 화면 검사·오류 데모 직전처럼 세 payer 모두 mock 규칙이 필요한 공통 순간으로 쓴다. twist는 200 예시 응답, 빈 배열 응답, 500 오류 응답을 한 경로에 매핑한 JSON 규칙 파일 한 개로 제한한다. 프록시 설치·실제 API 호출·상시 가로채기는 넣지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("chrome_web_store:")) throw new Error(`Not Chrome Web Store: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (priorStrongKeys.has(contract.source_key)) throw new Error(`Source appeared in strong batch 001-014: ${contract.source_key}`);
  if (allCardDraftKeys.has(contract.source_key)) throw new Error(`Source already appeared in card drafts: ${contract.source_key}`);
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

if (rows.length !== 10) throw new Error(`Expected exactly 10 rows, got ${rows.length}`);

const output = "docs/research/idea-strong-mechanism-batch-016-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-016-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 016 — Chrome 전문 변환·검수 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  `- 앱 포트폴리오 기준: ${appKeys.size}개 원본`,
  "- 제외: 앱 source key, strong-mechanism 001~014 input/card-drafts, 그 밖의 모든 기존 card-drafts",
  "- 우선순위: 입력 1개 → 전문 처리 1회 → 검증 가능한 파일·페이지 상태 1개",
  "- 앱 반영: 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, appScenarios: appKeys.size, output, summaryPath }, null, 2));
