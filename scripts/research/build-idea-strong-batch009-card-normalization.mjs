#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-009-card-drafts-raw-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-009-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);

const byKey = new Map(rows.map((row) => [row.source_key, row]));
const lightMeter = byKey.get("app_store:583922375");
lightMeter.card_draft.twists = [
  {
    value: "고정 조리개에 맞춘 촬영 셔터값",
    detail: "카메라 포인트 측광 흐름은 유지하고 ISO 400·f/2.8 고정 조건에서 셔터값 하나만 계산한다.",
    resultTitle: "촬영 장면에 맞는 셔터값",
    smallestBuild: "단일 카메라 권한으로 촬영 장면의 한 지점을 비추고, ISO 400·f/2.8 고정 조건으로 한 번 계산해 셔터값 하나를 즉시 표시한다.",
  },
  {
    value: "고정 셔터에 맞춘 촬영 조리개값",
    detail: "카메라 포인트 측광 흐름은 유지하고 ISO 400·1/125초 고정 조건에서 조리개값 하나만 계산한다.",
    resultTitle: "촬영 장면에 맞는 조리개값",
    smallestBuild: "단일 카메라 권한으로 촬영 장면의 한 지점을 비추고, ISO 400·1/125초 고정 조건으로 한 번 계산해 조리개값 하나를 즉시 표시한다.",
  },
  {
    value: "촬영 장면의 숫자 EV 측광",
    detail: "카메라 포인트 측광 흐름은 유지하고 노출 조합 대신 장면의 EV 숫자 하나만 표시한다.",
    resultTitle: "촬영 장면의 노출 EV 수치",
    smallestBuild: "단일 카메라 권한으로 촬영 장면의 한 지점을 비추고 반사광을 한 번 측정해 EV 수치 하나를 즉시 표시한다.",
  },
];

const formatJson = byKey.get("app_store:6745445528");
formatJson.card_draft.twists[0] = {
  value: "JSON 구문 오류 줄 먼저 표시",
  detail: "원시 JSON 검증 흐름은 유지하고 파싱을 막는 첫 오류 줄 하나만 결과로 표시한다.",
  resultTitle: "원시 JSON의 첫 오류 줄",
  smallestBuild: "원시 JSON 텍스트 한 덩어리를 입력받아 구문을 한 번 검증하고 첫 오류 줄 하나를 즉시 보여준다.",
};

const triangle = byKey.get("app_store:1643788233");
triangle.card_draft.twists[0] = {
  value: "두 직각변으로 빗변 계산",
  detail: "현장 치수 계산 흐름은 유지하고 두 직각변에서 빗변 하나만 계산한다.",
  resultTitle: "두 직각변의 빗변 길이 계산",
  smallestBuild: "두 직각변 치수를 적은 텍스트 한 덩어리를 입력받아 피타고라스 식으로 한 번 계산하고 빗변 길이 하나를 즉시 보여준다.",
};

fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, normalized: 3, output: path.relative(root, output) }, null, 2));
