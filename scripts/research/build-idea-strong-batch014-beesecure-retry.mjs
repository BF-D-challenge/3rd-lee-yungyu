#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = "docs/research/idea-strong-mechanism-batch-014-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, input), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);
const sourceKey = "trustmrr:beesecure";
const row = structuredClone(rows.find((item) => item.source_key === sourceKey));
if (!row) throw new Error(`Missing source: ${sourceKey}`);

row.card_draft.twists[2] = {
  value: "와일드카드 CORS 허용 코드 위치만 찾기",
  detail: "코드 ZIP 정적검사 흐름은 유지하고, 모든 출처를 허용하는 CORS 설정 코드의 파일·행 위치만 표시한다.",
  resultTitle: "코드 속 전체 허용 CORS 위치 보고서",
  smallestBuild: "웹 프로젝트 ZIP 파일 하나를 입력받아 모든 출처를 허용하는 CORS 설정 패턴을 정적 검사하고, 해당 파일·행 위치가 적힌 HTML 보고서 한 개를 즉시 반환한다.",
};

const output = "docs/research/idea-strong-mechanism-batch-014-beesecure-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), JSON.stringify(row) + "\n");
console.log(JSON.stringify({ sourceKey, cards: 1, output }, null, 2));
