#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "docs/research/idea-strong-mechanism-batch-012-card-drafts-raw-2026-07-15.jsonl");
const output = path.join(root, "docs/research/idea-strong-mechanism-batch-012-latin-axis-retry-card-drafts-2026-07-15.jsonl");
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
  .filter((row) => row.source_key === "app_store:1575583991");
if (rows.length !== 1) throw new Error(`Expected one retry card, got ${rows.length}`);

rows[0].card_draft.moments = [
  { value: "권한·통신 점검 결과를 다른 사람에게 전달하기 직전", detail: "보안 담당자·QA·컨설턴트 모두 추측이 아닌 앱별 로그 근거를 정리해 전달해야 한다." },
  { value: "수상한 권한 접근의 근거를 요구받은 직후", detail: "역할과 관계없이 어떤 앱이 언제 무엇에 접근했는지 App Privacy Report에서 바로 확인해야 한다." },
  { value: "최근 앱 활동에서 새로 생긴 항목을 확인하는 순간", detail: "배포 검수·문의 대응·감사 모두 이전 판단보다 최근에 기록된 권한·네트워크 활동을 먼저 확인해야 한다." },
];

fs.writeFileSync(output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ rows: rows.length, output: path.relative(root, output) }, null, 2));
