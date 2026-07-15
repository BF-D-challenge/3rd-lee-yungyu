#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const sources = new Map(
  readJsonl("docs/research/idea-strong-mechanism-batch-003-card-drafts-2026-07-15.jsonl")
    .map((row) => [row.source_key, row]),
);

const replacements = {
  "trustmrr:qranalytica": {
    payers: [
      {
        value: "오프라인 안내물에 QR을 넣는 매장 운영자",
        detail: "포스터·가격표·테이블 안내물을 만들 때 링크를 QR 파일로 바꾸고 인쇄 전에 직접 스캔해 확인하는 일을 반복한다.",
      },
      {
        value: "행사·교육 인쇄물을 만드는 운영 담당자",
        detail: "행사 안내문과 교육 자료마다 목적지 링크를 QR로 만들고 인쇄 규격에 맞춰 다시 저장한다.",
      },
      {
        value: "포장 동봉물을 발주하는 온라인 판매자",
        detail: "상품 설명·재구매 페이지 링크를 포장 카드에 넣기 위해 QR을 만들고 발주 전 해상도와 스캔 여부를 확인한다.",
      },
    ],
    moments: [
      {
        value: "인쇄 파일을 넘기기 전 QR이 빠진 것을 발견했을 때",
        detail: "마감 전에 목적지 URL로 실제 스캔되는 QR 파일을 즉시 만들어 시안에 넣어야 한다.",
      },
      {
        value: "기존 링크를 인쇄물용 QR로 바꿔야 할 때",
        detail: "링크를 그대로 적을 수 없어 인쇄 규격에 맞고 휴대폰으로 읽히는 QR 결과가 지금 필요하다.",
      },
      {
        value: "발주 직전 QR 해상도와 스캔 여부가 불안할 때",
        detail: "잘못 인쇄하면 전체를 다시 제작해야 하므로 URL 하나로 만든 QR 파일과 출력 테스트 결과를 바로 확인해야 한다.",
      },
    ],
    twists: [
      {
        value: "URL을 인쇄용 SVG QR로 바꾸기",
        detail: "목적지 URL을 QR로 인코딩하고 스캔을 확인하는 흐름은 유지하며 확대해도 선명한 SVG 출력만 선택한다.",
        resultTitle: "인쇄해도 선명한 SVG QR 파일",
        smallestBuild: "목적지 URL 1개를 입력받아 QR 인코딩과 스캔 확인을 한 번 처리하고 인쇄용 SVG QR 파일 1개를 즉시 출력한다.",
      },
      {
        value: "URL을 투명 PNG QR로 바꾸기",
        detail: "목적지 URL 입력과 QR 스캔 확인은 유지하고 사진·디자인 위에 올릴 투명 배경 PNG 출력만 선택한다.",
        resultTitle: "디자인 위에 올리는 투명 PNG QR",
        smallestBuild: "목적지 URL 1개를 입력받아 QR 인코딩과 스캔 확인을 한 번 처리하고 투명 배경 PNG QR 파일 1개를 즉시 출력한다.",
      },
      {
        value: "URL을 A4 스캔 테스트 PDF로 바꾸기",
        detail: "목적지 URL을 QR로 만들고 읽히는지 확인하는 흐름은 유지하며 실제 크기로 시험 인쇄할 A4 PDF 출력만 선택한다.",
        resultTitle: "발주 전 확인하는 QR 테스트 PDF",
        smallestBuild: "목적지 URL 1개를 입력받아 QR 인코딩과 스캔 확인을 한 번 처리하고 실제 크기의 A4 테스트 PDF 1개를 즉시 출력한다.",
      },
    ],
  },
  "trustmrr:gifduo": {
    payers: [
      {
        value: "여러 채널의 프로필을 관리하는 1인 크리에이터",
        detail: "같은 프로필 사진을 소개 페이지와 커뮤니티에 올릴 때 채널별 크기와 용량에 맞춰 반복 변환한다.",
      },
      {
        value: "브랜드 계정 프로필을 바꾸는 소상공인 운영자",
        detail: "새 캠페인마다 정적인 대표 사진을 눈에 띄는 프로필 GIF로 만들고 업로드 규격을 다시 맞춘다.",
      },
      {
        value: "포트폴리오 프로필을 운영하는 프리랜서",
        detail: "소개 페이지와 작업 커뮤니티에서 사용할 프로필 사진을 크기별로 저장하고 가벼운 애니메이션 파일을 따로 만든다.",
      },
    ],
    moments: [
      {
        value: "정적인 프로필 사진이 눈에 띄지 않아 바꾸려 할 때",
        detail: "새 촬영 없이 기존 사진 한 장으로 움직이는 프로필 파일을 바로 만들어야 한다.",
      },
      {
        value: "새 프로필 이미지를 여러 채널에 올리기 직전",
        detail: "채널마다 다른 크기 제한 때문에 같은 사진에서 규격에 맞는 GIF 결과가 즉시 필요하다.",
      },
      {
        value: "프로필 GIF가 너무 크거나 흐리게 보일 때",
        detail: "업로드를 다시 시도하기 전에 용도에 맞는 해상도와 여백의 GIF 파일로 바로 바꿔야 한다.",
      },
    ],
    twists: [
      {
        value: "프로필 사진을 256픽셀 GIF로 바꾸기",
        detail: "정적 프로필 사진을 반복 GIF로 바꾸는 흐름은 유지하고 작은 채널용 256픽셀 출력 규격만 선택한다.",
        resultTitle: "가볍게 올리는 256픽셀 프로필 GIF",
        smallestBuild: "정사각형 프로필 사진 1개를 입력받아 최소 반복 애니메이션 변환을 한 번 처리하고 256픽셀 GIF 파일 1개를 즉시 출력한다.",
      },
      {
        value: "프로필 사진을 512픽셀 GIF로 바꾸기",
        detail: "정적 프로필 사진 입력과 반복 GIF 변환은 유지하고 큰 화면용 512픽셀 출력 규격만 선택한다.",
        resultTitle: "선명하게 보이는 512픽셀 프로필 GIF",
        smallestBuild: "정사각형 프로필 사진 1개를 입력받아 최소 반복 애니메이션 변환을 한 번 처리하고 512픽셀 GIF 파일 1개를 즉시 출력한다.",
      },
      {
        value: "프로필 사진을 여백 있는 정사각 GIF로 바꾸기",
        detail: "프로필 사진의 애니메이션 변환은 유지하고 원형 크롭에서도 잘리지 않는 투명 여백만 추가한다.",
        resultTitle: "원형 크롭에도 안 잘리는 프로필 GIF",
        smallestBuild: "정사각형 프로필 사진 1개를 입력받아 최소 반복 애니메이션과 투명 여백 처리를 한 번 적용하고 정사각 GIF 파일 1개를 즉시 출력한다.",
      },
    ],
  },
};

const rows = Object.entries(replacements).map(([key, cardDraft]) => {
  const source = sources.get(key);
  if (!source) throw new Error(`Missing source: ${key}`);
  return {
    ...source,
    prior_review_feedback: "결제자와 순간을 특정 업종이 아니라 같은 결과물을 반복 제작하는 공통 업무로 통일하고, 전체 27개 교차 조합에서 같은 문제로 읽히게 수정했다.",
    card_draft: { source_key: key, ...cardDraft },
  };
});

const output = "docs/research/idea-strong-mechanism-batch-003-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: rows.length, keys: rows.map((row) => row.source_key), output }, null, 2));
