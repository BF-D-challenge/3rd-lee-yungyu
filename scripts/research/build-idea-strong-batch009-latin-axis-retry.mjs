#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-009-card-drafts-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-009-latin-axis-retry-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  .filter((row) => ["app_store:430807521", "app_store:1520204499", "app_store:6755650844"].includes(row.source_key));

rows.find((row) => row.source_key === "app_store:430807521").card_draft.moments = [
  { value: "여러 참가자의 결승선 기록을 확정하는 순간", detail: "코치·교사·대회 운영자 모두 참가자별 순위와 시간을 발표하기 전에 사진 근거가 바로 필요하다." },
  { value: "육안으로 선착순을 가르기 어려운 순간", detail: "기록 담당자 한 명의 눈으로는 순서를 확정하기 어려워 결승선 이미지 판정이 즉시 필요하다." },
  { value: "참가자별 시간을 기록표에 옮기기 직전", detail: "한 번 입력한 순위와 시간이 공식 훈련·수업·경기 결과로 남기 전에 사진 판정을 확인해야 한다." },
];

rows.find((row) => row.source_key === "app_store:1520204499").card_draft.moments = [
  { value: "저해상도 로고를 제작 파일로 넘기기 직전", detail: "인쇄·커팅·브랜드 납품 모두 픽셀이 깨지지 않는 SVG 원본이 있어야 다음 제작 단계로 넘어갈 수 있다." },
  { value: "확대하자 픽셀 윤곽이 깨진 것을 발견한 순간", detail: "출력 방식과 관계없이 깨진 경계를 그대로 넘기면 재작업이 생기므로 벡터 변환 결과가 즉시 필요하다." },
  { value: "확대 가능한 로고 원본 SVG를 요청받은 순간", detail: "인쇄소·공방·프리랜서 모두 고객 요청에 맞춰 바로 쓸 수 있는 SVG 한 개를 전달해야 한다." },
];

rows.find((row) => row.source_key === "app_store:6755650844").card_draft.moments = [
  { value: "여러 장 중 센터링이 좋은 카드를 고르는 순간", detail: "매입·감정·판매 담당자 모두 정면 사진만으로 테두리 균형이 좋은 카드를 먼저 선별해야 한다." },
  { value: "카드 상태와 가격을 확정하기 직전", detail: "센터링 차이가 판단에 영향을 주므로 좌우·상하 수치와 경계 근거를 바로 확인해야 한다." },
  { value: "카드 선별 근거를 기록하기 직전", detail: "감정 발송·매입·판매 결정을 남기기 전에 누구나 다시 확인할 수 있는 센터링 결과가 필요하다." },
];

fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, output: path.relative(root, output) }, null, 2));
