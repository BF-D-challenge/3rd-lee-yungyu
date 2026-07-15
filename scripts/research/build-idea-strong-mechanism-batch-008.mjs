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
    source_key: "app_store:6461213251",
    selection_reason: "네이버 후기 URL 하나에서 협찬·원고료 문구를 먼저 찾아 긴 글을 읽기 전 기대치를 조정해 주는 한국 소비 순간이 선명하다.",
    prior_review_feedback: "입력은 공개 네이버 블로그 후기 URL 하나다. payer는 육아용품 구매자·가전 비교 구매자·맛집을 찾는 직장인, moment는 결제·방문·가족 공유 전에 후기를 믿어도 되는지 확인할 때다. twist는 협찬 고지 위치, 대가성 표현 수, 직접 구매 근거가 표시된 후기 필터 카드 한 장으로 제한한다. 진실 보장·작성자 의도 단정·네이버 로그인은 넣지 않는다.",
  },
  {
    source_key: "app_store:1140451547",
    selection_reason: "골프 스윙 영상 한 개에서 공 궤적선이 보이는 완성 영상을 만드는 스포츠 전문 후처리 결과가 명확하다.",
    prior_review_feedback: "입력은 공이 날아가는 장면이 담긴 골프 영상 파일 하나다. payer는 골프 레슨 코치·연습 영상을 올리는 아마추어 골퍼·골프장 콘텐츠 담당자, moment는 레슨 피드백·SNS 게시·대회 기록 공유 직전이다. twist는 직선 궤적, 페이드 궤적, 드로우 궤적선이 적용된 MP4 한 개로 제한한다. 비거리 예측·스윙 진단·자동 게시를 넣지 않는다.",
  },
  {
    source_key: "app_store:6762625967",
    selection_reason: "아이폰에서 열리지 않는 HWP·HWPX 파일 하나를 읽을 수 있는 PDF 한 개로 즉시 바꾸는 한국 문서 문제다.",
    prior_review_feedback: "입력은 HWP 또는 HWPX 문서 파일 하나다. payer는 공공기관 문서를 받는 프리랜서·학교 가정통신문을 확인하는 보호자·과제 문서를 받은 대학생, moment는 이동 중 확인·서명 전달·마감 제출 직전이다. twist는 본문 가독성, 표 배치, 이미지 위치를 보존한 PDF 한 개로 제한한다. 문서 편집·전자서명·클라우드 연동은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:mirage-detect-image-editing",
    selection_reason: "사진 한 장에서 합성·보정 가능성이 높은 영역을 표시해 검토 위치를 좁히는 이미지 포렌식 결과다.",
    prior_review_feedback: "입력은 확인할 사진 파일 하나다. payer는 중고거래 검수 담당자·보도 사진 편집자·브랜드 콘텐츠 QA 담당자, moment는 게시·분쟁 답변·소재 승인 직전이다. twist는 복제 흔적, 경계 불일치, 과도한 보정 영역이 표시된 히트맵 이미지 한 장으로 제한한다. 진위 확정·원본 복원·법적 증거 보장은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:ios-app-growing-fast-with-seo",
    selection_reason: "흑백 도안 이미지 하나를 3D 프린터에서 바로 열 수 있는 STL 입체 파일 한 개로 바꾸는 전문 변환이다.",
    prior_review_feedback: "입력은 흰 배경의 고대비 도안 이미지 파일 하나다. payer는 쿠키 커터 제작자·도장 시제품을 만드는 공방 운영자·수업용 3D 프린팅 교사, moment는 슬라이서에 넣어 출력 크기와 모양을 확인하기 직전이다. twist는 양각 부조, 외곽 커터, 음각 도장 STL 한 개로 제한한다. 복잡한 다중 시점 3D 복원·프린터 제어·재질 계산은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:corsproxy",
    selection_reason: "브라우저에서 CORS로 막힌 API 요청 한 건을 프록시 가능한 요청으로 바꿔 실제 응답을 확인하게 하는 유료 개발 도구다.",
    prior_review_feedback: "입력은 URL·메서드·헤더·본문이 모두 담긴 cURL 명령 텍스트 한 덩어리다. payer는 프론트엔드 개발자·노코드 자동화 제작자·외부 API를 검수하는 QA 엔지니어, moment는 브라우저 콘솔에 CORS 오류가 난 직후다. twist는 GET, JSON POST, 인증 헤더 요청을 프록시해 받은 응답 미리보기 한 장으로 제한한다. 상시 프록시 운영·보안 우회·대상 API 변경은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:novel-translator",
    selection_reason: "영문 EPUB 파일 하나를 장·대화·서식을 유지한 한국어 EPUB 한 개로 바꾸는 긴 문서 특화 결과다.",
    prior_review_feedback: "입력은 영어 EPUB 전자책 파일 하나이고 결과 언어는 한국어로 고정한다. payer는 해외 웹소설을 읽는 독자·번역 초벌이 필요한 출판 편집자·원서 독서 모임 운영자, moment는 개인 열람·초벌 검토·모임 분량 배포 직전이다. twist는 장 구분, 대화 따옴표, 각주 링크 보존을 강조한 번역 EPUB 한 개로 제한한다. 저작권 없는 파일 또는 사용 권한이 있는 파일만 다루고 문학 번역 품질 보장은 넣지 않는다.",
  },
  {
    source_key: "trustmrr:zero-bounce",
    selection_reason: "발송할 이메일 원본 파일 하나로 스팸·인증·본문 위험을 한 번에 확인하는 실제 매출이 있는 이메일 QA 도구다.",
    prior_review_feedback: "입력은 발신자·제목·본문이 담긴 EML 파일 하나다. payer는 뉴스레터 운영자·이커머스 CRM 마케터·고객사 메일을 검수하는 대행자, moment는 대량 발송·프로모션 시작·납품 승인 직전이다. twist는 인증 레코드, 스팸 표현, 깨진 링크가 표시된 전달 가능성 HTML 보고서 한 개로 제한한다. 실제 발송·수신함 도착 보장·장기 평판 추적은 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:epbobagokhieoonfplomdklollconnkl",
    selection_reason: "자료 URL 하나에서 저자·제목·날짜를 읽어 바로 붙일 수 있는 정확한 참고문헌 한 줄을 만든다.",
    prior_review_feedback: "입력은 공개 웹페이지 URL 하나다. payer는 대학생·학술 콘텐츠 편집자·리서치 보고서를 쓰는 실무자, moment는 과제·원고·보고서의 출처 목록을 마무리하기 직전이다. twist는 APA 7판, MLA 9판, Chicago 저자-날짜 형식의 인용문 텍스트 한 줄로 제한한다. 본문 작성·표절 판정·자료 신뢰도 평가는 넣지 않는다.",
  },
  {
    source_key: "chrome_web_store:npdeilagbbimhnbbdjmagmedchnpjeid",
    selection_reason: "생성형 AI에 붙여넣을 텍스트 한 덩어리에서 개인정보·비밀키·내부 계약 문구를 전송 전에 표시하는 보안 순간이 분명하다.",
    prior_review_feedback: "입력은 AI 도구에 붙여넣으려는 텍스트 한 덩어리다. payer는 고객 문의를 요약하는 CS 담당자·코드를 질문하는 개발자·계약 문서를 다루는 운영 담당자, moment는 외부 AI 입력창에 붙여넣기 직전이다. twist는 개인정보, API 키, 비공개 계약 조건이 표시된 마스킹 미리보기 한 장으로 제한한다. 브라우저 상시 감시·전송 차단 보장·법률 판정은 넣지 않는다.",
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

const output = "docs/research/idea-strong-mechanism-batch-008-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-008-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 008 — 한국 맥락·전문 파일 작업 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 기준: 아직 카드 감사에 쓰이지 않은 Candidate 중 한국 사용 순간 또는 전문 파일 결과가 선명한 원본",
  "- 제외: 상시 기록·기관 행동·범용 이미지 생성·건강 판정",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, output, summaryPath }, null, 2));
