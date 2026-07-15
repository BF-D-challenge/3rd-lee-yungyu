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
const auditedKeys = new Set();
for (const file of fs.readdirSync(researchDir).filter((name) => name.includes("card-drafts") && name.endsWith(".jsonl"))) {
  for (const row of readJsonl(path.join("docs/research", file))) {
    if (row.source_key) auditedKeys.add(row.source_key);
    if (row.key) auditedKeys.add(row.key);
  }
}

const contracts = [
  {
    source_key: "chrome_web_store:dhildnnjbegaggknfkagdpnballiepfm",
    selection_reason: "HTTP 요청 한 건을 캡처해 수정·재생하고 차이를 보여 주는 전문 개발 작업은 입력과 결과가 검증 가능하다.",
    prior_review_feedback: "입력은 Chrome DevTools에서 복사한 cURL 명령 텍스트 한 덩어리다. payer는 프론트엔드 개발자·API QA 엔지니어·웹 보안 점검자, moment는 오류 재현·수정 확인·보안 검토 직전처럼 모두 같은 요청 재생 결과가 필요한 순간으로 쓴다. twist는 원본 메커니즘 안에서 헤더 변경 재생, JSON 본문 변경 재생, 민감 헤더 표시 재생 결과 한 장으로 제한한다. 새 취약점 예측·상시 프록시·계정 데이터는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:dedhhonndhpolmfaficejlcahmcgaell",
    selection_reason: "이미지 파일 한 장을 규격에 맞는 다운로드 파일 한 개로 바꾸는 결정적 변환이라 세로 조각이 작다.",
    prior_review_feedback: "입력은 이미지 파일 한 장이다. payer는 쇼핑몰 운영자·SNS 콘텐츠 디자이너·수업 자료를 만드는 교사, moment는 상품 등록·게시 예약·자료 배포 직전처럼 규격 파일이 바로 필요한 순간으로 쓴다. twist는 정사각형 리사이즈, 둥근 프로필 크롭, WebP 용량 변환 중 하나가 적용된 다운로드 이미지 파일 한 개로 제한한다. 여러 파일·배경 생성·미적 품질 평가는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:jjacifoecglgcnngpjhkckcofiliddei",
    selection_reason: "API 요청 설정 텍스트 하나를 즉시 호출 가능한 고정 응답 모형으로 바꾸는 전문 개발 결과가 선명하다.",
    prior_review_feedback: "입력은 메서드·경로·상태 코드·JSON 본문을 담은 API 모킹 설정 텍스트 한 덩어리다. payer는 프론트엔드 개발자·앱 QA 엔지니어·노코드 자동화 제작자, moment는 백엔드 대기·오류 화면 확인·데모 연결 직전처럼 모두 가상 응답이 필요한 순간으로 쓴다. twist는 성공 응답, 빈 목록 응답, 오류 응답을 재생할 수 있는 로컬 mock URL 결과 한 개로 제한한다. 외부 서버 운영·실제 API 변경·AI 생성은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:cipdlgmjblnniiicohcmcafcncippbha",
    selection_reason: "공개 페이지 URL 하나의 링크를 한 번 검사해 수정할 위치가 담긴 CSV 한 개를 주는 전문 QA 작업이다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL 하나다. payer는 콘텐츠 편집자·이커머스 운영자·웹 제작 대행 QA 담당자, moment는 게시·캠페인 시작·고객 납품 직전처럼 모두 링크 오류를 고쳐야 하는 순간으로 쓴다. twist는 404 링크, 불필요한 리다이렉트, 응답 실패 외부 링크가 각각 표시된 CSV 파일 한 개로 제한한다. 사이트 전체 크롤링·상시 모니터링·자동 수정은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:okeampldbdmpachkggljgpngbooaclal",
    selection_reason: "지도 경로 URL 하나를 라이딩 기기에서 열 수 있는 경로 파일 한 개로 내보내는 전문 여행 도구다.",
    prior_review_feedback: "입력은 경유지가 포함된 공개 Google Maps 경로 URL 하나다. payer는 자전거 동호회 운영자·오토바이 투어 가이드·장거리 라이딩 콘텐츠 제작자, moment는 단체 출발·고객 안내·경로 공개 직전처럼 모두 동일한 경로 파일이 필요한 순간으로 쓴다. twist는 경유지 보존 GPX, 구간별 트랙 GPX, 회차점 이름 포함 GPX 파일 한 개로 제한한다. 새 장소 추천·교통 예측·지도 계정 저장은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:nkgaaaiaadfgellaglahphkfjipcgmin",
    selection_reason: "Chrome 확장 프로그램 한 개의 권한·동작 단서를 읽어 검토 항목을 표시하는 보안 결과가 구체적이다.",
    prior_review_feedback: "입력은 Chrome 확장 프로그램의 CRX 파일 하나다. payer는 사내 IT 관리자·보안 컨설턴트·업무용 브라우저를 관리하는 프리랜서, moment는 배포 승인·보안 점검·고객 환경 설치 직전처럼 모두 설치 전 위험 검토가 필요한 순간으로 쓴다. twist는 과도한 권한, 외부 전송 도메인, 난독화 스크립트 위치가 표시된 정적 HTML 보고서 한 개로 제한한다. 악성 확정·실행 중 감시·스토어 계정 접근은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:gnmpfminmaijfpdcegocbpkdolkndkpd",
    selection_reason: "항공편 결제 화면 URL 하나에서 포인트당 가치를 계산해 현금 결제와 비교하는 니치 계산 결과다.",
    prior_review_feedback: "입력은 공개 Air Canada 항공편 결제 화면 URL 하나다. payer는 캐나다 출장을 예약하는 총무·Aeroplan 포인트를 쓰는 여행자·항공 마일리지 상담자, moment는 법인 결재 요청·개인 예약·고객 옵션 전달 직전처럼 모두 포인트 사용 가치를 확인하는 순간으로 쓴다. twist는 세금 포함 센트/포인트, 현금 절약액, 보유 포인트 차감 후 부족분이 표시된 계산 카드 한 장으로 제한한다. 별도 계정 잔액·미래 운임 예측·예약 실행은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:caipeabgogcpmihgldebnaalinnaaeda",
    selection_reason: "공개 LeetCode 프로필 URL 하나의 풀이 기록을 직무 준비에 쓰는 공유 카드 한 장으로 정리한다.",
    prior_review_feedback: "입력은 공개 LeetCode 프로필 URL 하나다. payer는 개발자 취업 준비생·코딩 테스트 강사·부트캠프 학습 코치, moment는 지원 서류 첨부·주간 피드백·상담 준비 직전처럼 모두 풀이 현황을 공유할 순간으로 쓴다. twist는 난이도 분포, 최근 풀이 꾸준함, 주제별 강약점이 표시된 PNG 통계 카드 한 장으로 제한한다. 합격 예측·비공개 계정 데이터·학습 계획 생성은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:ijaopicbldggjdgbnfdlkljeggibmcha",
    selection_reason: "공개 Notion 페이지 URL 하나를 표·이미지 배치를 유지한 PDF 한 개로 바꾸는 문서 변환 결과다.",
    prior_review_feedback: "입력은 공개 Notion 페이지 URL 하나다. payer는 고객 문서를 납품하는 프리랜서·수업 자료를 배포하는 교사·운영 매뉴얼을 공유하는 팀 리더, moment는 고객 발송·인쇄 배포·외부 협력사 전달 직전처럼 모두 고정 PDF가 필요한 순간으로 쓴다. twist는 표 페이지 나눔, 이미지 원본 비율, 다크 페이지 인쇄 대비가 보존된 PDF 파일 한 개로 제한한다. 비공개 로그인·메일 머지·자동 발송은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:ecanpcehffngcegjmadlcijfolapggal",
    selection_reason: "공개 웹페이지 URL 하나가 연결한 서버·외부 요청을 한 번 요약해 네트워크 문제를 찾게 한다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL 하나다. payer는 웹 호스팅을 점검하는 개발자·개인정보 요청을 확인하는 보안 담당자·사이트 속도를 검수하는 QA 엔지니어, moment는 DNS 이전 확인·외부 전송 검토·성능 이슈 재현 직전처럼 모두 네트워크 요약이 필요한 순간으로 쓴다. twist는 원본 서버 IP, 제3자 도메인, 요청별 IP 버전이 표시된 정적 HTML 네트워크 보고서 한 개로 제한한다. 상시 패킷 감시·공격 판정·비공개 트래픽은 넣지 않는다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("chrome_web_store:")) throw new Error(`Not Chrome Web Store: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (auditedKeys.has(contract.source_key)) throw new Error(`Source already appeared in card drafts: ${contract.source_key}`);
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

const output = "docs/research/idea-strong-mechanism-batch-010-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-010-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 010 — Chrome 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 카드 감사·앱 포트폴리오에 한 번도 쓰이지 않은 chrome_web_store Candidate",
  "- 우선순위: 입력 1개 → 결정적 전문 처리 1회 → 파일·보고서·카드 결과 1개",
  "- 제외: 브라우저 기본 기능 대체, 상대방 행동, 상시 감시, 범용 AI 생성",
  "- 앱 반영: 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
