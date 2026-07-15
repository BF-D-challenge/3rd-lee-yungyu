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
  const isPriorStrong = /^idea-strong-mechanism-batch-(00[1-9]|01[01])-(input|card-drafts)(?:-raw)?-.*\.jsonl$/.test(file);
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
    source_key: "chrome_web_store:ndgimibanhlabgdgjcpbbndiehljcpfh",
    selection_reason: "HTML 요소 한 개에서 실제로 검증된 Playwright·XPath·CSS locator를 만드는 전문 자동화 결과다.",
    prior_review_feedback: "입력은 대상 요소 하나만 담긴 HTML 코드 텍스트 한 덩어리다. payer는 E2E 테스트를 쓰는 QA 자동화 엔지니어·프론트엔드 개발자·웹 테스트 대행 컨설턴트로 모두 세 locator 형식을 실제 업무에서 쓸 사람으로 잡는다. moment는 자동화 작성 직전·DOM 변경 뒤 테스트 복구·고객 테스트 인수인계 직전처럼 세 payer 모두 겪는 공통 순간으로 쓴다. twist는 검증된 Playwright locator, XPath, CSS selector 텍스트 파일 한 개로 제한한다. 브라우저 상시 감시·테스트 실행·원격 계정은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:bcnbbkdpnoeaaedhhnlefgpijlpbmije",
    selection_reason: "웹 앱 URL 하나를 한 번 열어 발생한 API 호출을 재현 가능한 정적 파일로 내보내는 개발 QA 메커니즘이다.",
    prior_review_feedback: "입력은 로그인 없이 열리는 웹 애플리케이션 URL 하나다. payer는 프론트엔드 개발자·API QA 엔지니어·연동 문제를 조사하는 기술 컨설턴트다. moment는 오류 재현 직후·릴리스 전 API 확인·외부 개발팀에 증거 전달 직전처럼 세 payer 모두 같은 호출 기록이 필요한 순간으로 쓴다. twist는 실패 호출만 담은 HAR, 중복 제거 endpoint JSON, 민감 헤더가 가려진 cURL 묶음 TXT 파일 한 개로 제한한다. 로그인·상시 기록·API 재생은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:ffabmkklhbepgcgfonabamgnfafbdlkn",
    selection_reason: "공개 GitHub 하위 폴더 URL 하나를 저장소 전체 clone 없이 구조가 보존된 ZIP 한 개로 만든다.",
    prior_review_feedback: "입력은 공개 GitHub 저장소의 하위 폴더 URL 하나다. payer는 예제 코드를 받는 개발자·수업 샘플을 배포하는 강사·오픈소스 일부를 검토하는 기술 PM이다. moment는 샘플 실행·수업 자료 전달·코드 검토 직전처럼 세 payer 모두 폴더 ZIP이 필요한 공통 순간으로 쓴다. twist는 폴더 구조 보존, 파일 목록 manifest 포함, 불필요한 Git 메타데이터 제외가 적용된 ZIP 파일 한 개로 제한한다. 전체 clone·비공개 저장소·빌드 실행은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:lcgfgelbpgaepigopgkoloicjjkgihcg",
    selection_reason: "웹사이트 URL 하나에서 눈대중이 아닌 재사용 가능한 색상·글꼴·간격 토큰 파일을 추출한다.",
    prior_review_feedback: "입력은 공개 웹사이트 URL 하나다. payer는 디자인 시스템을 만드는 프로덕트 디자이너·CSS를 정리하는 프론트엔드 개발자·브랜드 일관성을 검수하는 디자인 QA다. moment는 리디자인 착수·컴포넌트 구현·브랜드 검수 직전처럼 세 payer 모두 디자인 토큰이 필요한 공통 순간으로 쓴다. twist는 CSS variables 파일, JSON token 파일, Figma에서 읽을 수 있는 token JSON 파일 한 개로 제한한다. 디자인 생성·미적 평가·로그인은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:bnjjngeaknajbdcgpfkgnonkmififhfo",
    selection_reason: "공개 폼 URL 하나의 입력 타입을 읽어 테스트 가능한 더미 값으로 한 번 채우는 반복 QA 작업이다.",
    prior_review_feedback: "입력은 로그인 없이 열리는 공개 테스트 폼 URL 하나다. payer는 웹 폼 QA 엔지니어·가입 흐름을 만드는 프론트엔드 개발자·고객 폼을 검수하는 노코드 제작자다. moment는 정상 제출 확인·수정 뒤 회귀 검사·고객 시연 직전처럼 세 payer 모두 더미 폼이 필요한 공통 순간으로 쓴다. twist는 입력 타입 맞춤값, 같은 seed의 재현값, 한국 주소·전화 형식값으로 채워진 현재 폼 한 화면으로 제한한다. 실제 제출·개인정보·상시 저장은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:idickfnblhhleimfneihpmddjabiodlp",
    selection_reason: "YouTube URL 하나에서 공개 메타데이터의 숨은 태그를 추출해 바로 비교 가능한 목록 파일로 만든다.",
    prior_review_feedback: "입력은 공개 YouTube 영상 URL 하나다. payer는 채널을 운영하는 영상 제작자·경쟁 영상을 조사하는 콘텐츠 마케터·영상 메타데이터를 검수하는 대행 편집자다. moment는 제목·태그 수정 전·경쟁 영상 브리프 작성·업로드 검수 직전처럼 세 payer 모두 태그 목록을 쓸 공통 순간으로 쓴다. twist는 원래 순서 TXT, 중복 제거 CSV, 긴 구문 우선 CSV 파일 한 개로 제한한다. 성과 예측·추천 태그 생성·YouTube 계정 연동은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:nnffbdeachhbpfapjklmpnmjcgamcdmm",
    selection_reason: "웹페이지 URL 하나에서 필요한 이미지 규격만 골라 구조가 단순한 ZIP 한 개로 내려받는 자료 수집 도구다.",
    prior_review_feedback: "입력은 다운로드가 허용된 공개 웹페이지 URL 하나다. payer는 상품 자료를 정리하는 이커머스 운영자·레퍼런스를 모으는 디자이너·웹 콘텐츠를 이관하는 편집자다. moment는 상품 등록·디자인 보드 작성·페이지 이전 직전처럼 세 payer 모두 선별 이미지 ZIP이 필요한 공통 순간으로 쓴다. twist는 최소 가로폭, 이미지 형식, 최소 파일 크기 필터가 적용된 ZIP 파일 한 개로 제한한다. 저작권 우회·여러 탭·영상 다운로드는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:nbmkpdgmnjbiohfpiofmjhpbeakpmlfd",
    selection_reason: "공개 웹페이지 URL 하나를 재작업 가능한 디자인·와이어프레임 파일로 변환하는 전문 디자인 역설계 결과다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL 하나다. payer는 기존 화면을 리디자인하는 프로덕트 디자이너·구현 구조를 검토하는 프론트엔드 개발자·워크숍 자료를 만드는 UX 컨설턴트다. moment는 리디자인 시작·구현 분석·고객 워크숍 직전처럼 세 payer 모두 페이지 구조 파일을 쓸 공통 순간으로 쓴다. twist는 편집 가능한 SVG 디자인, 회색조 SVG 와이어프레임, 전체 길이 PNG 참고 이미지 파일 한 개로 제한한다. Figma 계정 동작·디자인 자동 개선·여러 페이지 크롤링은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:jonplpbnhmanoekkgcepnedhghflblmo",
    selection_reason: "공개 three.js 데모 URL 하나에서 눈에 보이지 않는 scene hierarchy와 속성 근거를 정적 보고서로 뽑는다.",
    prior_review_feedback: "입력은 로그인 없이 열리는 공개 three.js 또는 react-three-fiber 데모 URL 하나다. payer는 3D 웹 개발자·기술 아티스트·WebGL QA 엔지니어다. moment는 오브젝트 찾기·속성 오류 조사·납품 구조 검수 직전처럼 세 payer 모두 scene 근거가 필요한 공통 순간으로 쓴다. twist는 scene hierarchy JSON, 선택 가능한 object property HTML, material·texture inventory JSON 파일 한 개로 제한한다. 속성 수정·MCP 연결·상시 DevTools 감시는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:ijolfnkijbagodcigeebgjhlkdgcebmf",
    selection_reason: "현재 사이트 쿠키를 값 노출 없이 유형별로 정리한 재현용 JSON 프로필 한 개로 내보내는 개발 지원 결과다.",
    prior_review_feedback: "입력은 현재 사이트 쿠키를 읽는 단일 사이트 권한 하나다. payer는 로그인 버그를 재현하는 웹 QA·세션 설정을 확인하는 프론트엔드 개발자·고객 브라우저 이슈를 지원하는 기술 담당자다. moment는 버그 증거 저장·환경 초기화 전·개발팀 전달 직전처럼 세 payer 모두 쿠키 구조 기록이 필요한 공통 순간으로 쓴다. twist는 session cookie만, SameSite·Secure 플래그만, domain·path 그룹만 담고 모든 value를 마스킹한 JSON 파일 한 개로 제한한다. 원문 값 저장·다른 사이트 쿠키·상시 모니터링은 넣지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("chrome_web_store:")) throw new Error(`Not Chrome Web Store: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (priorStrongKeys.has(contract.source_key)) throw new Error(`Source appeared in strong batch 001-011: ${contract.source_key}`);
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

const output = "docs/research/idea-strong-mechanism-batch-013-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-013-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 013 — Chrome 전문 변환·검사 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  `- 앱 포트폴리오 기준: ${appKeys.size}개 원본`,
  "- 제외: 앱 source key, strong-mechanism 001~011 input/card-drafts, 그 밖의 모든 기존 card-drafts",
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
