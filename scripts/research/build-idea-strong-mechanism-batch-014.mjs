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
const auditedKeys = new Set();
for (const file of fs.readdirSync(path.join(root, "docs/research"))) {
  if (!file.includes("card-drafts") || !file.endsWith(".jsonl")) continue;
  for (const row of readJsonl(path.join("docs/research", file))) auditedKeys.add(row.source_key);
}

const contracts = [
  {
    source_key: "trustmrr:beesecure",
    selection_reason: "코드 ZIP 한 개에서 정적으로 확인 가능한 보안 흔적만 골라 위치가 붙은 보고서를 만드는 전문 개발 QA다.",
    prior_review_feedback: "입력은 배포할 웹 프로젝트 코드 ZIP 파일 하나다. payer는 인디 SaaS 개발자·고객 사이트를 납품하는 개발 대행사 리드·사내 도구를 운영하는 풀스택 개발자다. 세 moment는 배포 직전, AI가 만든 코드를 합친 직후, 다른 팀에 코드를 넘기기 직전처럼 세 payer 공통으로 쓴다. twist는 하드코딩된 비밀키 패턴, 위험한 eval 계열 호출, 보안 헤더 설정 누락 중 하나의 파일·행 위치가 표시된 정적검사 HTML 보고서 한 파일로 제한한다. 침투 테스트·CVE 외부 조회·안전 보장·자동 수정은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:sheetsandbox",
    selection_reason: "공개 Google Sheet URL 하나를 읽기 전용 JSON API 엔드포인트 하나로 바꾸는 MVP 데이터 연결 조각이 선명하다.",
    prior_review_feedback: "입력은 공개 CSV 게시가 켜진 Google Sheet URL 하나다. payer는 시제품을 만드는 1인 개발자·고객 MVP를 만드는 노코드 대행자·사내 데모를 만드는 제품 엔지니어다. 세 moment는 시트 데이터가 준비된 직후, 하드코딩 데이터를 실제 목록으로 바꾸기 직전, 데모에서 최신 행을 보여줘야 할 때처럼 세 payer 공통으로 쓴다. twist는 전체 행 JSON, 한 열 필터 JSON, 열 이름이 적힌 OpenAPI 문서 중 하나가 포함된 읽기 전용 API 링크 한 개로 제한한다. POST·인증·운영 DB 보장·비공개 시트는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:webtoapp-no-code-app-converter",
    selection_reason: "모바일 웹 URL 하나를 설치 가능한 Android WebView APK 한 파일로 감싸는 결정적 패키징 결과다.",
    prior_review_feedback: "입력은 모바일 대응이 끝난 공개 웹사이트 URL 하나다. payer는 자사 웹을 앱으로 제공하려는 소상공인 운영자·지역 고객 사이트를 만드는 웹 대행자·회원용 웹서비스를 운영하는 커뮤니티 매니저다. 세 moment는 웹사이트가 완성된 직후, 사용자가 홈 화면 앱을 요구했을 때, 테스트 단말에 설치본을 보여주기 직전처럼 세 payer 공통으로 쓴다. twist는 사이트 favicon을 쓴 앱 아이콘, 뒤로가기 처리, 자사 도메인 안에서만 여는 규칙 중 하나가 적용된 debug APK 한 파일로 제한한다. 스토어 제출·푸시·로그인 개발·네이티브 화면 재구축은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:scrapestudio-co",
    selection_reason: "웹페이지의 URL#CSS선택자 한 덩어리에서 실제 DOM·스타일을 추출해 재사용 코드 한 파일로 만드는 전문 프런트엔드 도구다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL과 대상 CSS selector가 합쳐진 `URL#selector` 텍스트 한 덩어리다. payer는 레퍼런스를 구현하는 프론트엔드 개발자·고객 사이트를 만드는 퍼블리셔·디자인 시스템을 정리하는 UI 엔지니어다. 세 moment는 참고 컴포넌트가 확정된 직후, 같은 모양을 손으로 다시 만들기 직전, 구현 코드의 구조를 팀에 넘기기 전처럼 세 payer 공통으로 쓴다. twist는 인라인 스타일 제거 HTML/CSS, React JSX, Tailwind class 변환 중 하나의 컴포넌트 코드 파일 한 개다. 전체 사이트 복제·이미지 자산 복사·배포·브랜드 카피 복제는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:checkemail-dev",
    selection_reason: "이메일 주소 한 줄에서 구문·도메인·일회용 주소 여부를 발송 없이 확인하는 개발자 검증 메커니즘이다.",
    prior_review_feedback: "입력은 가입 폼에서 받은 이메일 주소 텍스트 한 줄이다. payer는 무료체험 SaaS 운영자·회원가입 API를 검수하는 백엔드 개발자·캠페인 폼을 운영하는 CRM 담당자다. 세 moment는 가짜 가입이 늘어난 직후, 신규 가입 폼을 공개하기 직전, 반송 주소 원인을 확인할 때처럼 세 payer 공통으로 쓴다. twist는 RFC 구문 오류, 도메인의 공개 MX 존재, 내장 목록과 일치한 일회용 도메인 중 하나가 표시된 이메일 검증 JSON 한 파일로 제한한다. 메일 발송·수신함 존재 보장·개인정보 조회·평판 예측은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:contextblur",
    selection_reason: "공개 웹페이지 URL 하나에서 화면공유 전에 개인정보 패턴을 가린 미리보기 한 장을 만드는 사전 예방 결과다.",
    prior_review_feedback: "입력은 로그인 없이 열리는 데모용 공개 웹페이지 URL 하나다. payer는 고객 화면을 공유하는 CS 리드·제품 데모를 하는 세일즈 엔지니어·기능 영상을 녹화하는 제품 매니저다. 세 moment는 화면공유 시작 직전, 녹화 미리보기에서 민감정보를 발견한 직후, 외부 발표용 화면을 확정하기 전처럼 세 payer 공통으로 쓴다. twist는 이메일·전화번호, 금액·계좌형 숫자, 사람 이름 후보 중 하나가 자동 블러된 전체 페이지 PNG 한 장이다. 브라우저 상시 감시·사설 페이지 로그인·완전 탐지 보장·실시간 영상 처리는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:lightspeed-run",
    selection_reason: "웹사이트 URL 하나를 실제 브라우저로 한 번 측정해 느린 지표와 원인 파일이 붙은 성능 보고서를 만드는 결정적 QA다.",
    prior_review_feedback: "입력은 공개 웹사이트 URL 하나다. payer는 자사몰을 운영하는 개발자·고객 랜딩페이지를 납품하는 웹 대행자·콘텐츠 사이트를 관리하는 퍼블리셔다. 세 moment는 새 페이지 공개 직전, 사용자가 느리다고 말한 직후, 고객에게 성능 개선 근거를 보내기 전처럼 세 payer 공통으로 쓴다. twist는 LCP와 가장 큰 요소, CLS와 움직인 요소, 긴 JavaScript 작업과 파일 URL 중 하나가 표시된 1회 측정 HTML 보고서 한 파일이다. 상시 모니터링·전환율 예측·SEO 순위 보장·자동 최적화는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:trainy-train-identifier",
    selection_reason: "열차 사진 한 장을 기관차·객차 모델과 식별 근거가 붙은 사양 카드 한 장으로 바꾸는 강한 전문 이미지 식별이다.",
    prior_review_feedback: "입력은 측면 특징이 보이는 열차 사진 파일 한 장이다. payer는 철도 박물관 자료 담당자·열차 콘텐츠 편집자·모형 열차 상품 등록자다. 세 moment는 출처 불명 사진을 받은 직후, 게시물 캡션을 확정하기 직전, 카탈로그 모델명을 입력해야 할 때처럼 세 payer 공통으로 쓴다. twist는 차량 형식, 운영 국가·사업자, 외형 식별 포인트 중 하나가 강조된 후보 모델 사양 카드 PNG 한 장이다. 확정 감정·위치 추적·안전 판정·사진 밖 운행 정보는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:shiptested",
    selection_reason: "코드 ZIP 한 개에서 실제로 실행되는 좁은 테스트 하나를 생성·실행해 통과한 테스트 파일 하나로 돌려주는 전문 샌드박스 처리다.",
    prior_review_feedback: "입력은 package.json이 포함된 소형 웹 MVP 코드 ZIP 파일 하나다. payer는 AI로 MVP를 만든 1인 개발자·빠른 시제품을 검수하는 개발 대행자·사내 실험 앱을 넘겨받은 QA 엔지니어다. 세 moment는 배포 버튼을 누르기 직전, AI 코드 수정 직후, 다른 사람이 유지보수하기 전에 최소 테스트를 남길 때처럼 세 payer 공통으로 쓴다. twist는 첫 페이지 렌더, 한 폼 제출, 한 API 응답 형식 중 하나를 실행 확인한 테스트 코드 파일 한 개로 제한한다. 전체 회귀테스트·프로덕션 배포·코드 자동 수정·통과 보장은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:formnx",
    selection_reason: "폼 정의 텍스트 한 덩어리를 검증 규칙이 포함된 제출 가능한 단일 HTML 폼 파일로 바꾸는 단순 빌더다.",
    prior_review_feedback: "입력은 폼 제목·질문·선택지·필수 여부가 줄 단위로 적힌 폼 정의 텍스트 한 덩어리다. payer는 행사 신청을 받는 운영자·수강 문의를 받는 교육 사업자·현장 서비스 예약을 받는 소상공인이다. 세 moment는 받을 항목이 확정된 직후, 신청 링크를 공개하기 직전, 기존 수기 접수에서 누락이 생긴 직후처럼 세 payer 공통으로 쓴다. twist는 필수값 검증, 한 조건부 질문, 허니팟 스팸 필드 중 하나가 포함된 단일 HTML 폼 파일 한 개로 제한한다. 결제·DB 저장·알림·템플릿 마켓·호스팅은 넣지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("trustmrr:")) throw new Error(`Not TrustMRR: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (auditedKeys.has(contract.source_key)) throw new Error(`Source already has card drafts: ${contract.source_key}`);
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

if (rows.length !== 10) throw new Error(`Expected 10 rows, got ${rows.length}`);

const output = "docs/research/idea-strong-mechanism-batch-014-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-014-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 014 — TrustMRR 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 범위: 현재 앱 89개와 모든 과거 카드 초안에서 제외된 trustmrr: Candidate",
  "- 우선순위: 전문 정적검사·결정적 변환·단일 파일 결과",
  "- 게이트: Stress-3 3/3 → Latin-9 9/9 → Full-27 27/27",
  "- 앱 반영: 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
