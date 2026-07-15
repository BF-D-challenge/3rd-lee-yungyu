#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = "docs/research/idea-strong-mechanism-batch-008-card-drafts-2026-07-15.jsonl";
const output = "docs/research/idea-strong-mechanism-batch-008-evaluator-correction-card-drafts-2026-07-15.jsonl";
const keep = new Set([
  "trustmrr:corsproxy",
  "chrome_web_store:epbobagokhieoonfplomdklollconnkl",
]);
const rows = fs.readFileSync(path.join(root, source), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse)
  .filter((row) => keep.has(row.source_key))
  .map((row) => ({
    ...row,
    evaluator_correction: "사용자가 제공한 URL·cURL 대상의 내용이나 응답은 허용 입력을 처리한 결과이며, 별도 외부 데이터가 아니다. 카드 문구는 바꾸지 않고 수정된 동일 평가 규칙으로 재판정한다.",
  }));
if (rows.length !== keep.size) throw new Error(`Expected ${keep.size} rows, got ${rows.length}`);
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, output }, null, 2));
