#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-017-card-drafts-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-017-takeout-retry-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  .filter((row) => row.source_key === "trustmrr:takeout-tools");
if (rows.length !== 1) throw new Error(`Expected one Takeout Tools card, got ${rows.length}`);

rows[0].card_draft.moments[2] = {
  value: "위치 기록을 지도·분석 도구에서 다시 쓰기 직전",
  detail: "여행 기록·현장 조사·콘텐츠 제작 모두 Takeout 원본 대신 가져올 수 있는 표준 파일 하나가 필요하다.",
};
rows[0].prior_review_feedback = "Full-27의 유일한 review 축은 세 번째 moment가 동료·고객 전달로 한정되어 여행 기록자와 맞지 않은 문제였다. 세 번째 moment만 세 payer 모두 직접 다시 쓰는 순간으로 고쳤다.";

fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, key: rows[0].source_key, output: path.relative(root, output) }, null, 2));
