#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-009-card-drafts-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-009-retry-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const selected = rows.filter((row) => ["app_store:583922375", "app_store:6745445528"].includes(row.source_key));

const lightMeter = selected.find((row) => row.source_key === "app_store:583922375");
lightMeter.card_draft.twists[2] = {
  value: "촬영 장면의 바로 쓰는 노출 조합",
  detail: "카메라 포인트 측광 흐름은 유지하고 현재 장면에 맞는 조리개·셔터·ISO를 한 장의 노출 설정 카드로 묶어 표시한다.",
  resultTitle: "촬영 장면의 즉시 노출 설정",
  smallestBuild: "단일 카메라 권한으로 촬영 장면의 한 지점을 비추고 반사광을 한 번 측정해 조리개·셔터·ISO가 묶인 노출 설정 카드 하나를 즉시 표시한다.",
};

const formatJson = selected.find((row) => row.source_key === "app_store:6745445528");
formatJson.card_draft.twists[2] = {
  value: "모든 키 경로가 붙은 JSON 트리",
  detail: "원시 JSON 형식화 흐름은 유지하고 별도 키 선택 없이 각 키 옆에 전체 경로를 함께 표시한다.",
  resultTitle: "전체 키 경로가 붙은 JSON 트리",
  smallestBuild: "원시 JSON 텍스트 한 덩어리를 입력받아 한 번 형식화하고 각 키에 전체 경로가 붙은 JSON 트리 하나를 즉시 보여준다.",
};

fs.writeFileSync(output, selected.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: selected.length, output: path.relative(root, output) }, null, 2));
