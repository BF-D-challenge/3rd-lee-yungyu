#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const gateRows = readJsonl("docs/research/idea-candidate-gate-results-2026-07-14.jsonl");
const gate = new Map(gateRows.map((row) => [row.source_key, row]));

const contracts = [
  {
    source_key: "trustmrr:compresso",
    selection_reason: "이미지 파일 하나를 업로드 제한 아래의 이미지 파일 하나로 줄이는 결과가 즉시 확인된다.",
    prior_review_feedback: "영상은 제외하고 이미지 파일 하나만 입력으로 받는다. 모든 payer는 쇼핑몰·광고·문서 업로드 제한 때문에 이미지를 다시 줄이는 실무자, 모든 moment는 업로드 직전에 용량 초과가 난 때로 묶는다. 세 twist는 300KB 이하, 1MB 이하, 2MB 이하 목표 용량만 바꾼다. 무손실을 주장하지 말고 목표 용량과 예상 화질을 함께 보여주는 압축본이라고 쓴다.",
  },
  {
    source_key: "trustmrr:handwritten-signature-generator",
    selection_reason: "이름 텍스트 하나에서 바로 붙여 넣을 수 있는 서명 이미지 하나를 만드는 흐름이 명확하다.",
    prior_review_feedback: "입력은 이름 텍스트 한 줄로 고정한다. 모든 payer는 계약서·견적서·확인서에 본인 서명 이미지를 반복해서 넣는 1인 사업자와 프리랜서, 모든 moment는 문서를 보내기 직전 서명 이미지가 없는 때로 묶는다. 세 twist는 투명 배경 PNG, 문서용 가는 선 PNG, 작은 이메일 하단용 PNG 출력만 바꾼다. 신원 인증·법적 효력·실제 필체 복제를 주장하지 않는다.",
  },
  {
    source_key: "trustmrr:thememorychess",
    selection_reason: "체스 포지션 하나를 잠깐 본 뒤 기억을 확인하는 훈련 결과가 원본 사용 방식에 직접 연결된다.",
    prior_review_feedback: "입력은 FEN 텍스트 한 줄로 고정한다. 모든 payer는 실전에서 보드 시각화와 기물 위치 기억을 훈련하는 체스 학습자·코치, 모든 moment는 짧은 개인 훈련 세트를 만들려는 때로 묶는다. 세 twist는 10초 뒤 전체 기물 복원, 사라진 기물 찾기, 지정 칸의 기물 맞히기 훈련지로 제한한다. 승률 예측·최선 수 추천·온라인 대국은 추가하지 않는다.",
  },
  {
    source_key: "trustmrr:milestone-clip",
    selection_reason: "공개 GitHub URL 하나에서 현재 수치를 읽어 공유 가능한 짧은 영상 하나로 만드는 결과가 구체적이다.",
    prior_review_feedback: "입력은 공개 GitHub 저장소 URL 하나로 고정한다. 모든 payer는 오픈소스 프로젝트의 성과를 알리는 메인테이너, 모든 moment는 공개 수치가 바뀐 뒤 커뮤니티에 짧게 알릴 때로 묶는다. 세 twist는 세로형, 정사각형, 가로형 MP4 배치만 바꾼다. GitHub 공개 API의 저장소 이름·별·포크 수만 쓰고 성장 원인 분석이나 비공개 데이터는 추가하지 않는다.",
  },
  {
    source_key: "trustmrr:qranalytica",
    selection_reason: "목적지 URL 하나에서 인쇄·게시할 QR 파일 하나를 만드는 흐름이 선명하다.",
    prior_review_feedback: "입력은 목적지 URL 하나로 고정한다. 모든 payer는 포스터·포장·안내물에 같은 링크의 QR을 넣는 소형 사업자·운영자, 모든 moment는 인쇄 또는 게시 직전 QR 파일이 필요한 때로 묶는다. 세 twist는 인쇄용 SVG, 투명 PNG, A4 테스트 PDF 출력 형식만 바꾼다. 스캔 수는 향후 부가 기능으로 두고 즉시 결과는 실제 스캔 테스트를 통과한 QR 파일 하나로 닫는다.",
  },
  {
    source_key: "trustmrr:gifduo",
    selection_reason: "정적인 프로필 사진 하나를 온라인 프로필에 쓸 반복 GIF 하나로 바꾸는 즉시 산출물이다.",
    prior_review_feedback: "입력은 정사각형 프로필 사진 하나로 고정한다. 모든 payer는 소개 페이지·커뮤니티·캠페인 프로필을 눈에 띄게 만들려는 1인 크리에이터와 운영자, 모든 moment는 프로필 이미지를 교체하기 직전으로 묶는다. 세 twist는 256px 가벼운 GIF, 512px 선명한 GIF, 투명 여백이 있는 정사각 GIF 출력 규격만 바꾼다. 얼굴 동작 생성이나 고품질 애니메이션 보장을 추가하지 않고 원본의 최소 애니메이션 변환만 유지한다.",
  },
  {
    source_key: "trustmrr:vibe-app-scanner",
    selection_reason: "공개 앱 URL 하나에서 확인 가능한 보안 응답을 증거와 함께 보고서 하나로 반환하는 흐름이다.",
    prior_review_feedback: "입력은 로그인 없는 공개 웹앱 URL 하나로 고정한다. 모든 payer는 출시 전 외부 노출을 빠르게 확인하는 1인 웹앱 빌더와 소형 개발팀, 모든 moment는 배포 URL이 생긴 뒤 공개 전에 점검하는 때로 묶는다. 세 twist는 보안 헤더, HTTPS·쿠키 설정, 공개 관리 경로 응답 점검 보고서로 제한한다. 취약점 없음·안전 보장·자동 수정은 주장하지 않고 HTTP에서 관찰한 사실과 재현 URL만 출력한다.",
  },
  {
    source_key: "trustmrr:moldaspace",
    selection_reason: "실내 스케치 이미지 하나를 고객에게 보여줄 렌더 시안 하나로 바꾸는 원본 메커니즘이 뚜렷하다.",
    prior_review_feedback: "입력은 실내 공간 스케치 이미지 한 장으로 고정한다. 모든 payer는 같은 스케치에서 재료 느낌을 빠르게 비교하는 소형 인테리어 실무자, 모든 moment는 고객 미팅 전에 첫 시안 한 장이 필요한 때로 묶는다. 세 twist는 밝은 원목, 짙은 원목, 무채색 콘크리트 재료 톤만 바꾼다. 치수 정확도·시공 가능성·사진 같은 품질을 보장하지 않고 컨셉 확인용 렌더라고 쓴다.",
  },
];

const rows = contracts.map((contract, index) => {
  const source = gate.get(contract.source_key);
  if (!source) throw new Error(`Missing candidate source: ${contract.source_key}`);
  if (source.audit?.hard_gate !== "pass") throw new Error(`Hard gate is not pass: ${contract.source_key}`);
  return {
    ...source,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
    batch_category: source.category,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-003-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-003-selection-2026-07-15.md";
const reviewHardPass = gateRows.filter((row) => row.audit?.status === "review" && row.audit?.hard_gate === "pass").length;
const lines = [
  "# 강한 메커니즘 배치 003 — 입력·결과 우선 재선별",
  "",
  `- 과거 gate review·hard gate pass: ${reviewHardPass}개`,
  `- 앱형 카드 작성 대상: ${rows.length}개`,
  "- 기준: 입력 1개와 즉시 결과 1개가 원본에 있고, 세 결제자와 세 순간이 같은 업무 문맥에서 교차 가능함",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name} | ${row.selection_reason} |`),
  "",
  "## 감사 순서",
  "",
  "1. 카드 3×3×3 작성",
  "2. Stress-3 3/3 원본만 Latin-9",
  "3. Latin-9 9/9 원본만 Full-27",
  "4. Full-27 27/27 결과를 먼저 문서로 공개한 뒤에만 앱 승격",
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));

console.log(JSON.stringify({ reviewHardPass, selected: rows.length, output, summaryPath }, null, 2));
