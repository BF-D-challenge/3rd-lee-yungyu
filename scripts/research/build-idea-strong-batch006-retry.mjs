#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = "docs/research/idea-strong-mechanism-batch-006-card-drafts-2026-07-15.jsonl";
const output = "docs/research/idea-strong-mechanism-batch-006-retry-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, source), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);
const meyoo = rows.find((row) => row.source_key === "trustmrr:meyoo");
if (!meyoo) throw new Error("Meyoo card not found");

const retry = structuredClone(meyoo);
retry.prior_review_feedback = "첫 Latin-9은 8/9였고 유일한 review는 가격 변경 순간과 주문별 실이익 표의 범위 불일치였다. 원본·payer·twist는 유지하고 두 번째 moment만 주문·상품·광고비 어느 표에서도 적자 원인을 확인하는 순간으로 고친다. 이 한 번 뒤에도 9/9가 아니면 종료한다.";
retry.card_draft.moments[1] = {
  value: "정산표에서 적자 원인을 찾는 순간",
  detail: "주문·상품·광고비 중 어디에서 손실이 났는지 바로 보여야 다음 운영 결정을 내릴 수 있다.",
};

fs.writeFileSync(path.join(root, output), JSON.stringify(retry) + "\n");
console.log(JSON.stringify({ candidates: 1, output }, null, 2));
