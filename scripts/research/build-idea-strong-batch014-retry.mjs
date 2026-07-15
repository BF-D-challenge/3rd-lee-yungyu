#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = "docs/research/idea-strong-mechanism-batch-014-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, input), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);
const sourceKey = "trustmrr:checkemail-dev";
const row = structuredClone(rows.find((item) => item.source_key === sourceKey));
if (!row) throw new Error(`Missing source: ${sourceKey}`);

row.card_draft.moments = [
  {
    value: "가입 이메일 한 건이 수상하지만 이유를 모를 때",
    detail: "구문·도메인·일회용 주소 중 무엇이 문제인지 나눠 확인해야 차단 또는 허용을 결정할 수 있다.",
  },
  {
    value: "신규 가입 폼을 공개하기 직전",
    detail: "실제 가입을 받기 전에 이메일 검증 규칙 세 종류가 각각 작동하는지 한 건으로 확인해야 한다.",
  },
  {
    value: "반송과 가짜 가입의 원인을 분류해야 할 때",
    detail: "주소 한 건의 형식·도메인·일회용 여부를 분리해야 다음 검증 규칙을 정할 수 있다.",
  },
];

const output = "docs/research/idea-strong-mechanism-batch-014-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), JSON.stringify(row) + "\n");
console.log(JSON.stringify({ sourceKey, cards: 1, output }, null, 2));
