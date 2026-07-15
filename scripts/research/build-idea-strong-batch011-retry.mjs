#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = "docs/research/idea-strong-mechanism-batch-011-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, input), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);
const sourceKey = "trustmrr:docuaudit";
const row = structuredClone(rows.find((item) => item.source_key === sourceKey));
if (!row) throw new Error(`Missing source: ${sourceKey}`);

row.card_draft.twists = [
  {
    value: "문서에 적힌 행 합계와 청구 총액만 대조하기",
    detail: "외부 운임표 없이 각 비용 행의 금액 합과 문서에 인쇄된 청구 총액이 다른 위치만 표시한다.",
    resultTitle: "화물 청구서 내부 합계 불일치 CSV",
    smallestBuild: "운송사 화물 청구서 PDF 파일 하나를 입력받아 문서 안의 비용 행 합계와 인쇄된 총액을 한 번 대조하고 불일치 행이 표시된 감사 CSV 파일 한 개를 즉시 만든다.",
  },
  {
    value: "같은 운송장·날짜·금액이 겹친 행만 찾기",
    detail: "운송장 번호·청구일·비용 금액이 모두 같은 행만 중복 후보로 표시하고 외부 계약 운임은 판단하지 않는다.",
    resultTitle: "화물 청구서 동일 비용 중복 후보 CSV",
    smallestBuild: "운송사 화물 청구서 PDF 파일 하나를 입력받아 운송장 번호·청구일·금액이 모두 같은 비용 행을 한 번 찾고 중복 후보가 표시된 감사 CSV 파일 한 개를 즉시 만든다.",
  },
  {
    value: "운송장 번호·청구일·통화 누락만 찾기",
    detail: "필수 기준을 운송장 번호·청구일·통화 세 필드로 고정하고 비어 있는 필드 위치만 표시한다.",
    resultTitle: "화물 청구서 필수 3항목 누락 CSV",
    smallestBuild: "운송사 화물 청구서 PDF 파일 하나를 입력받아 운송장 번호·청구일·통화 세 필드의 기재 여부를 한 번 확인하고 누락 위치가 표시된 감사 CSV 파일 한 개를 즉시 만든다.",
  },
];

const output = "docs/research/idea-strong-mechanism-batch-011-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), JSON.stringify(row) + "\n");
console.log(JSON.stringify({ sourceKey, cards: 1, output }, null, 2));
