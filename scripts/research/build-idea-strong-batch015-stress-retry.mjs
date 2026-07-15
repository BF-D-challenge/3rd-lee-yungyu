#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-015-card-drafts-raw-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-015-stress-retry-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  .filter((row) => row.source_key === "app_store:6759912958");
if (rows.length !== 1) throw new Error(`Expected one retry card, got ${rows.length}`);

rows[0].card_draft.twists[2] = {
  value: "마감까지 필요한 하루 작업시간 계산",
  detail: "페이지 수·현재 가능한 작업시간·마감일 계산은 유지하고, 결과를 마감하려면 하루 몇 시간을 확보해야 하는지와 현재 계획 대비 부족한 분으로 표시한다.",
  resultTitle: "마감까지 필요한 하루 작업시간",
  smallestBuild: "전체 페이지 수·하루 작업 가능 시간·마감일을 적은 텍스트 한 덩어리를 입력받아 남은 일수와 필요 작업시간을 한 번 계산하고, 하루 필요 시간과 현재 계획 대비 부족한 분이 보이는 결과 카드 1개를 즉시 보여준다.",
};

fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, output: path.relative(root, output) }, null, 2));
