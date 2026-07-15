#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const researchDir = path.join(root, "docs/research");
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const candidates = new Map(
  readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl")
    .map((row) => [row.key, row]),
);
const appKeys = new Set(
  JSON.parse(fs.readFileSync(path.join(researchDir, "idea-app-portfolio.json"), "utf8"))
    .map((row) => row.source_key),
);
const priorBatchKeys = new Set();
for (const filename of fs.readdirSync(researchDir)) {
  if (!/^idea-strong-mechanism-batch-(00[1-9]|01[0-4])-(input|.*card-drafts).*\.jsonl$/.test(filename)) continue;
  for (const line of fs.readFileSync(path.join(researchDir, filename), "utf8").split(/\r?\n/).filter(Boolean)) {
    const row = JSON.parse(line);
    if (row.source_key) priorBatchKeys.add(row.source_key);
  }
}

const contracts = [
  {
    source_key: "app_store:6443821393",
    selection_reason: "영수증 사진 한 장을 OCR해 나중에 검색하고 바로 전달할 수 있는 증빙 PDF 한 개로 만든다.",
    prior_review_feedback: "입력은 영수증 정면 사진 한 장이고 결과는 영수증 PDF 또는 요약 카드 한 개다. payer는 소규모 사업자 경비 담당자·외근 비용을 정리하는 프리랜서·보험 청구 서류 담당자처럼 영수증 증빙을 반복 처리하는 사람으로 쓴다. 세 moment는 종이 영수증을 버리기 전, 비용 증빙을 전달하기 전, 특정 영수증의 상호·합계를 다시 찾아야 하는 순간처럼 모든 payer가 함께 겪는 상황으로 쓴다. 세 twist는 검색 가능한 OCR PDF, 상호·날짜·합계 요약 카드, 합계가 강조된 공유용 PDF처럼 같은 OCR 결과의 표시만 바꾼다. 다중 페이지·태그 누적 통계·iCloud 백업은 넣지 않는다.",
  },
  {
    source_key: "app_store:6759912958",
    selection_reason: "페이지 수·작업 가능 시간·마감을 한 번 입력해 매일 필요한 분량과 공정별 간트차트를 만든다.",
    prior_review_feedback: "입력은 전체 페이지 수·하루 작업 가능 시간·마감일을 적은 텍스트 한 덩어리다. payer는 동인지 만화가·연재 원고를 준비하는 웹소설 작가·삽화 묶음을 납품하는 일러스트레이터처럼 창작 분량과 마감을 함께 관리하는 사람으로 쓴다. 세 moment는 새 원고의 분량과 마감이 확정된 직후, 남은 기간에 맞출 수 있는지 불안한 순간, 작업 가능 시간이 바뀌어 계획을 다시 짜야 하는 순간처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 하루 목표 페이지표, 공정별 간트차트, 마감까지 부족한 작업시간 경고처럼 같은 일정 계산 결과의 표시만 바꾼다. 작업 기록 누적·인쇄소 비교·이벤트 관리·클라우드 동기화는 넣지 않는다.",
  },
  {
    source_key: "app_store:6757283848",
    selection_reason: "총 반죽 중량과 재료 비율 한 묶음을 실제 계량할 재료별 그램표로 즉시 환산한다.",
    prior_review_feedback: "입력은 목표 총 반죽 중량과 재료별 비율을 적은 텍스트 한 덩어리다. payer는 소형 베이커리 제품 개발자·제빵 생산 반장·주문제작 홈베이커처럼 배치 크기를 반복 조정하는 사람으로 쓴다. 세 moment는 테스트 레시피를 판매 배치로 키우기 전, 주문 수량이 바뀐 직후, 재료를 저울에 올리기 직전처럼 모든 payer가 정확한 계량표를 필요로 하는 상황으로 쓴다. 세 twist는 재료별 그램표, 밀가루 100% 기준 배합표, 1g 단위로 반올림한 생산 계량표처럼 같은 baker's percentage 계산의 표시만 바꾼다. 원가·재고·유통기한·팬 부피 변환은 넣지 않는다.",
  },
  {
    source_key: "app_store:880510678",
    selection_reason: "GPX 파일 하나를 파싱해 경로·웨이포인트·고도 변화가 보이는 지도 보고서로 바꾼다.",
    prior_review_feedback: "입력은 GPX 경로 파일 하나다. payer는 등산 가이드·자전거 행사 코스 담당자·트레일 러닝 코치처럼 참가자에게 경로를 설명하고 검수하는 사람으로 쓴다. 세 moment는 경로 파일을 참가자에게 보내기 전, 고도 변화가 위험한 구간을 확인하는 순간, 현장 답사 후 기록을 검수하는 순간처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 경로·웨이포인트 지도, 거리별 고도 프로필, 총거리·상승고도 요약 보고서처럼 GPX 내부 좌표와 고도만 한 번 파싱한 결과를 바꾼다. 실시간 내비게이션·외부 지도 검색·여러 GPX 병합은 넣지 않는다.",
  },
  {
    source_key: "app_store:1517487743",
    selection_reason: "도메인 하나를 DNS에 조회해 터미널 없이 사람이 읽는 레코드 응답을 즉시 보여준다.",
    prior_review_feedback: "입력은 도메인 이름 텍스트 하나다. payer는 백엔드 개발자·도메인 운영 담당자·이메일 발송 설정 컨설턴트처럼 DNS 레코드를 직접 확인하는 사람으로 쓴다. 세 moment는 DNS 변경 반영을 확인할 때, 서비스 연결 문제를 진단할 때, 장애 종료 전에 현재 레코드를 근거로 남길 때처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 A·AAAA 주소 응답, MX 메일 경로 응답, TXT·CNAME 검증 응답처럼 같은 도메인 DNS 조회의 레코드 초점만 바꾼다. 리졸버 비교·전파 추적·역방향 조회·터미널 실행은 넣지 않는다.",
  },
  {
    source_key: "app_store:538386564",
    selection_reason: "Visio 파일 하나를 전용 프로그램 없이 렌더링해 레이어·도형 데이터까지 확인 가능한 도면 화면으로 만든다.",
    prior_review_feedback: "입력은 VSD·VDX·VSDX 중 Visio 도면 파일 하나이고 결과는 상세 미리보기 화면 한 개다. payer는 설비 도면을 검토하는 프로젝트 매니저·현장 유지보수 기사·외부 도면을 승인하는 발주 담당자처럼 Visio 없이 도면을 확인해야 하는 사람으로 쓴다. 세 moment는 회의 전에 도면을 처음 열 때, 숨은 레이어나 도형 속성을 확인할 때, 현장 작업 전에 최신 도면 내용을 검수할 때처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 전체 도면 상세 미리보기, 레이어별 가시성 미리보기, 선택 도형의 Shape Data 패널처럼 같은 파일 렌더링 결과의 보기만 바꾼다. 문서 편집·다른 오피스 형식·PDF 변환·클라우드 파일 관리는 넣지 않는다.",
  },
  {
    source_key: "app_store:6759006922",
    selection_reason: "Apple Health 권한 한 번으로 선택 기간의 건강·운동 기록을 다시 분석할 수 있는 JSON 파일 한 개로 내보낸다.",
    prior_review_feedback: "입력은 단일 기기의 Apple Health 데이터 권한이고 결과는 구조화된 JSON 파일 하나다. payer는 자기 기록을 분석하는 운동선수·정량적 자기관리를 하는 사용자·건강 데이터 연동을 테스트하는 모바일 개발자처럼 자신의 원시 건강 데이터를 다시 써야 하는 사람으로 쓴다. 세 moment는 원시 데이터를 백업하기 전, 분석 도구에 기록을 넘기기 전, 연동 테스트용 실제 데이터가 필요한 순간처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 최근 30일 활동 일별 JSON, 최근 운동 상세 JSON, 심박·수면 일별 요약 JSON처럼 원본이 지원하는 고정 프리셋 한 개로 추출 범위만 바꾼다. 진단·건강 조언·여러 출력 형식·자동화 설정은 넣지 않는다.",
  },
  {
    source_key: "app_store:586447913",
    selection_reason: "편집할 수 없는 PDF 파일 하나를 바로 수정 가능한 DOCX 파일 한 개로 변환한다.",
    prior_review_feedback: "입력은 PDF 문서 파일 하나이고 결과는 DOCX 파일 하나로 고정한다. payer는 외부 서류를 수정하는 사무 담당자·수업 자료를 재편집하는 교사·고객 초안을 고치는 문서 프리랜서처럼 PDF 내용을 Word에서 다시 써야 하는 사람으로 쓴다. 세 moment는 PDF의 문구를 수정해야 하는 순간, 표·제목을 재배치해야 하는 순간, 변경 가능한 Word 원본을 전달해야 하는 순간처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 편집 가능한 본문 DOCX, 표 구조가 살아 있는 DOCX, 이미지 배치가 유지된 DOCX처럼 같은 PDF→Word 변환의 보존 초점만 바꾼다. 공동 편집·Copilot·템플릿·여러 파일 일괄 변환은 넣지 않는다.",
  },
  {
    source_key: "app_store:6471380298",
    selection_reason: "긴 공유 URL 하나에서 추적용 쿼리만 제거해 같은 목적지로 가는 깨끗한 링크 한 개를 돌려준다.",
    prior_review_feedback: "입력은 추적 쿼리가 붙은 웹페이지 URL 하나이고 결과는 정리된 URL 하나다. payer는 뉴스레터 편집자·제휴 링크를 검수하는 콘텐츠 운영자·고객에게 링크를 보내는 개인정보 담당자처럼 공유 전 URL을 반복 정리하는 사람으로 쓴다. 세 moment는 외부에 링크를 공유하기 전, 문서에 출처 링크를 넣기 전, 추적 파라미터가 노출된 것을 발견한 순간처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 utm 계열 제거 URL, 알려진 광고 식별자 제거 URL, 제거한 파라미터 목록이 붙은 정리 결과처럼 목적지는 유지하고 쿼리 정리 결과만 바꾼다. 광고 차단·웹페이지 수정·단축 URL 해제·브라우저 상시 확장은 넣지 않는다.",
  },
  {
    source_key: "app_store:6759467015",
    selection_reason: "Markdown 파일 하나의 표·코드·수식·다이어그램을 오프라인에서 읽을 수 있는 완성 문서 화면으로 렌더링한다.",
    prior_review_feedback: "입력은 Markdown 파일 하나이고 결과는 렌더링된 문서 화면 한 개다. payer는 기술 문서를 검수하는 개발자·수식 노트를 읽는 연구자·README를 확인하는 프로젝트 매니저처럼 원시 Markdown을 모바일에서 정확히 읽어야 하는 사람으로 쓴다. 세 moment는 파일을 전달하기 전 렌더링 오류를 확인할 때, 이동 중 문서를 읽어야 할 때, 코드·수식·다이어그램이 깨졌는지 검수할 때처럼 모든 payer가 겪는 상황으로 쓴다. 세 twist는 코드·표 중심 렌더링, KaTeX 수식 중심 렌더링, Mermaid 다이어그램 중심 렌더링처럼 같은 파일 렌더링 결과의 강조만 바꾼다. 편집·PDF/HTML 내보내기·체크박스 저장·클라우드 동기화는 넣지 않는다.",
  },
];

if (contracts.length !== 10) throw new Error(`Expected 10 contracts, got ${contracts.length}`);
const contractKeys = contracts.map((row) => row.source_key);
if (new Set(contractKeys).size !== contracts.length) throw new Error("Duplicate source keys");
const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("app_store:")) throw new Error(`Not app_store: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (priorBatchKeys.has(contract.source_key)) throw new Error(`Source already appeared in batch 001-014 input/card drafts: ${contract.source_key}`);
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

const output = "docs/research/idea-strong-mechanism-batch-015-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-015-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 015 — 미검수 App Store 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 공통 조건: `app_store:` Candidate, 배치 001~014 입력·카드 초안 미등장, 현재 97개 앱 포트폴리오 미포함",
  "- 우선순위: 입력 1개 → 처리 1회 → 결과 1개가 닫히는 전문 작업",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name.replace(/\|/g, "\\|")} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, appCount: appKeys.size, excludedPriorBatchSources: priorBatchKeys.size, output, summaryPath }, null, 2));
