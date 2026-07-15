#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-017-card-drafts-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-017-stress-retry-card-drafts-2026-07-15.jsonl");
const retryKeys = new Set([
  "trustmrr:octree",
  "trustmrr:beep-productivity-inc",
]);
const rows = fs.readFileSync(input, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse)
  .filter((row) => retryKeys.has(row.source_key));

if (rows.length !== retryKeys.size) throw new Error(`Expected ${retryKeys.size} retry cards, got ${rows.length}`);

const octree = rows.find((row) => row.source_key === "trustmrr:octree");
octree.card_draft.twists[0].resultTitle = "LaTeX 특수문자 4종 이스케이프 수정 파일";
octree.prior_review_feedback = "Stress-3의 유일한 review는 제목이 모든 컴파일 오류를 고치는 것처럼 읽힌 문제였다. 첫 번째 twist의 제목만 실제 처리 범위인 특수문자 4종(%, _, &, #) 이스케이프 수정으로 좁혔다.";

const beep = rows.find((row) => row.source_key === "trustmrr:beep-productivity-inc");
beep.card_draft.payers[1] = {
  value: "웹 수정 요청을 정리하는 1인 브랜드 웹 운영자",
  detail: "브라우저 검사 도구에서 대상 selector를 복사할 수 있지만, 캡처·위치·댓글을 한 문서로 묶는 데 시간이 든다.",
};
beep.prior_review_feedback = "Stress-3의 유일한 review는 CSS selector를 모르는 결제자가 selector를 직접 입력해야 한 문제였다. 두 번째 payer 카드만 검사 도구에서 selector를 복사할 수 있는 웹 운영자로 고쳤다.";

fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, keys: rows.map((row) => row.source_key), output: path.relative(root, output) }, null, 2));
