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
    source_key: "trustmrr:glamour",
    selection_reason: "셀피 한 장에서 계절형 퍼스널 컬러 팔레트를 만드는 단일 사진 전문 결과이며 실제 월매출 신호가 강하다.",
    prior_review_feedback: "입력은 정면 셀피 사진 파일 하나다. payer는 모두 고객 사진으로 색을 제안하는 퍼스널 컬러 컨설턴트·브라이덜 스타일리스트·온라인 패션 스타일리스트다. 세 moment는 고객 셀피를 받은 직후, 의상·메이크업 제안서를 확정하기 직전, 상담 중 추천 색 근거를 바로 보여줘야 할 때처럼 세 payer 모두에게 공통인 업무 순간으로 쓴다. twist는 봄·여름·가을·겨울 팔레트, 피해야 할 색, 추천 조합 중 하나가 강조된 팔레트 카드 한 장으로 제한한다. 피부 건강 진단·제품 구매·상시 추적은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:pdf-translator",
    selection_reason: "외국어 PDF 한 파일을 레이아웃이 유지된 한국어 PDF 한 파일로 바꾸는 입력·결과가 매우 선명하다.",
    prior_review_feedback: "입력은 영어 PDF 문서 파일 하나이고 결과 언어는 한국어로 고정한다. payer는 해외 매뉴얼을 다루는 기술문서 담당자·외국 자료를 검토하는 리서처·수입 서류를 처리하는 무역 실무자다. 세 moment는 외국어 PDF를 받은 직후, 내부 공유본을 만들기 직전, 회의에서 표와 그림 위치를 유지한 번역본이 급할 때처럼 모두에게 공통으로 쓴다. twist는 표 배치, 이미지 캡션, 각주 링크 중 하나를 특히 보존한 번역 PDF 한 파일이다. 편집기·협업·다국어 일괄 처리·내용 검증은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:chromapick-chrome-extension",
    selection_reason: "참고 웹사이트 URL 하나에서 색·폰트를 뽑아 Figma에 붙일 스타일 결과 하나를 만드는 디자인 전문 도구다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL 하나다. payer는 브랜드 디자이너·UI 디자이너·디자인 시스템을 만드는 프론트엔드 디자이너다. 세 moment는 참고 사이트 URL을 받은 직후, 시안의 색·폰트를 맞추기 직전, 개발 전달 전에 스타일 값을 확인할 때처럼 세 payer 공통 순간으로 쓴다. twist는 색 토큰, 폰트 스택, 색 대비가 강조된 Figma 복사용 스타일 텍스트 한 파일로 제한한다. Figma 계정 쓰기·전체 디자인 복제·컴포넌트 코드는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:docuaudit",
    selection_reason: "화물 청구서 PDF 한 장의 내부 합계·중복·누락을 감사 가능한 데이터로 바꾸는 전문 문서 검수다.",
    prior_review_feedback: "입력은 한 운송사의 화물 청구서 PDF 파일 하나다. payer는 물류사 정산 담당자·화주 재무 담당자·3PL 비용 검수자다. 세 moment는 청구서를 받은 직후, 지급 승인 직전, 월말 증빙을 넘기기 직전처럼 세 payer 모두의 공통 순간으로 쓴다. twist는 문서 안에서만 확인 가능한 합계 불일치, 중복 비용, 필수 필드 누락 중 하나가 표시된 감사 CSV 한 파일로 제한한다. 계약 운임·외부 시세·사기 판정·지급 실행은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:describeit",
    selection_reason: "스톡 영상 한 파일에서 업로드용 제목·설명·키워드를 한 묶음으로 만드는 좁은 판매자 워크플로다.",
    prior_review_feedback: "입력은 스톡 마켓에 올릴 짧은 영상 파일 하나다. payer는 스톡 영상 판매자·영상 아카이브 담당자·촬영 스튜디오 업로드 담당자다. 세 moment는 영상 편집이 끝난 직후, 스톡 사이트 업로드 직전, 반려된 메타데이터를 다시 작성할 때처럼 세 payer 공통으로 쓴다. twist는 검색형 제목, 사실 중심 설명, 중복 제거 키워드 중 하나가 강조된 업로드 메타데이터 CSV 한 파일이다. 게시·판매 예측·트렌드 데이터·여러 플랫폼 자동 등록은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:appforgenow",
    selection_reason: "REST API 문서 URL 하나를 ChatGPT 앱 설정 초안 한 파일로 바꾸는 개발자 특화 변환이다.",
    prior_review_feedback: "입력은 공개 OpenAPI 문서 URL 하나다. payer는 API를 제품화하는 백엔드 개발자·고객 API를 연결하는 개발 대행자·사내 도구를 만드는 AI 엔지니어다. 세 moment는 API 문서가 준비된 직후, 앱 연결 시제품을 만들기 직전, 데모 전에 설정 누락을 확인할 때처럼 세 payer 공통으로 쓴다. twist는 도구 이름, 요청 스키마, 인증 자리표시자 중 하나가 강조된 ChatGPT 앱 설정 JSON 한 파일로 제한한다. 배포·MCP 서버 운영·실제 비밀키·백엔드 생성은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:apirealtest",
    selection_reason: "API 엔드포인트 URL 하나를 사용자 환경의 요청으로 시험해 응답 검수표 하나를 만드는 전문 QA다.",
    prior_review_feedback: "입력은 공개 테스트 API 엔드포인트가 포함된 cURL 명령 텍스트 하나다. payer는 프론트엔드 개발자·API QA 엔지니어·연동을 검수하는 개발 대행자다. 세 moment는 브라우저 연동이 실패한 직후, 배포 승인 직전, 고객 데모 전에 실제 응답을 확인할 때처럼 세 payer 공통으로 쓴다. twist는 상태 코드, 응답 스키마, 지연 시간이 강조된 API 테스트 HTML 보고서 한 파일로 제한한다. 부하 테스트·상시 모니터링·인증 우회·Postman 전체 대체는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:scopepilot",
    selection_reason: "프로젝트 범위 문서 하나에서 추가 작업을 골라 변경 주문서 한 장을 만드는 프리랜서 수익 방어 도구다.",
    prior_review_feedback: "입력은 기존 범위와 새 요청이 함께 적힌 프로젝트 변경 요청 문서 파일 하나다. payer는 웹 제작 프리랜서·브랜딩 스튜디오 PM·영상 제작 대행자다. 세 moment는 추가 요청을 받은 직후, 범위 밖 작업을 시작하기 직전, 추가비 합의를 요청할 때처럼 세 payer 공통으로 쓴다. twist는 추가 작업, 추가 일정, 추가 금액 중 하나가 강조된 변경 주문서 PDF 한 파일로 제한한다. 전자서명·결제·법적 판단·프로젝트 상시 관리는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:receiptworks",
    selection_reason: "실제 거래 내용 텍스트 한 덩어리를 전문적인 영수증 PDF 한 장으로 만드는 단순 문서 생성기다.",
    prior_review_feedback: "입력은 판매자·거래일·품목·금액이 포함된 실제 거래 내용 텍스트 한 덩어리다. payer는 팝업 판매자·소규모 공방 운영자·현장 서비스를 제공한 프리랜서다. 세 moment는 결제가 끝난 직후, 고객이 영수증 재발급을 요청했을 때, 월말 정산 전에 증빙 형식을 맞출 때처럼 세 payer 공통으로 쓴다. twist는 세금 항목, 품목별 금액, 환불 안내 중 하나가 강조된 영수증 PDF 한 장으로 제한한다. 허위 거래 생성·결제·세무 신고·장부 관리는 넣지 않는다.",
  },
  {
    source_key: "trustmrr:supergitsight",
    selection_reason: "GitHub 프로필 URL 하나를 명시된 KCRIM·ACID 기준의 개발자 검토 점수표로 바꾸는 채용 전문 결과다.",
    prior_review_feedback: "입력은 공개 GitHub 프로필 URL 하나다. payer는 개발자 채용 대행사의 기술 스크리너·스타트업 엔지니어링 리드·외주 개발자를 고르는 제품 책임자다. 세 moment는 지원자 프로필을 받은 직후, 인터뷰 대상자를 고르기 직전, 후보 비교 근거를 남겨야 할 때처럼 세 payer 공통으로 쓴다. twist는 기여 일관성, 저장소 신뢰성, 기술 숙련도 중 하나가 강조된 KCRIM·ACID 점수 HTML 보고서 한 파일로 제한한다. 채용 합격 판정·비공개 저장소·성격 추론·상시 추적은 넣지 않는다.",
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

const output = "docs/research/idea-strong-mechanism-batch-011-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-011-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 011 — TrustMRR 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 범위: source_key가 trustmrr:로 시작하는 아직 미감사 Candidate만 사용",
  "- 우선순위: 전문 파일 변환·개발 QA·문서 검수의 입력 1개 → 처리 1회 → 결과 1개",
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
