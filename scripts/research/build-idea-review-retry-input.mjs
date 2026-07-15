#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};
const readJsonl = (file) => fs.readFileSync(path.resolve(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const candidatesPath = option("--candidates");
const resultsPath = option("--results");
const outputPath = option("--output");
const expectedRows = Number(option("--expected-rows") ?? "9");
if (!candidatesPath || !resultsPath || !outputPath) throw new Error("Usage: --candidates <JSONL> --results <Latin results JSONL> --output <JSONL>");

const candidates = new Map(readJsonl(candidatesPath).map((row) => [row.source_key, row]));
const grouped = new Map();
for (const row of readJsonl(resultsPath)) {
  const item = grouped.get(row.source_key) ?? { pass: 0, review: 0, fail: 0, reviews: [] };
  item[row.audit.status] += 1;
  if (row.audit.status === "review") {
    item.reviews.push({
      payer: row.payer,
      moment: row.moment,
      twist: row.twist,
      result_title: row.result_title,
      reason: row.audit.reason,
      risk_flags: row.audit.risk_flags,
    });
  }
  grouped.set(row.source_key, item);
}

const selected = [...grouped.entries()]
  .filter(([, item]) => item.fail === 0 && item.review > 0 && item.pass + item.review === expectedRows)
  .map(([key, item]) => {
    const candidate = candidates.get(key);
    if (!candidate) throw new Error(`Missing candidate ${key}`);
    return {
      ...candidate,
      prior_review_feedback: {
        instruction: "아래 불일치가 27개 조합 어디에서도 재발하지 않도록 payer·moment·twist 전체를 하나의 공통 문제 맥락으로 다시 작성한다. 특정 결제자에게만 맞는 제품·여행·팬덤 같은 twist를 만들지 말고 세 twist 모두 세 payer와 세 moment에 교차 적용 가능해야 한다. 원본 메커니즘은 유지한다.",
        previous_latin: { pass: item.pass, review: item.review, fail: item.fail },
        review_rows: item.reviews,
      },
    };
  });
if (selected.length === 0) throw new Error("No review-only candidates found");
fs.mkdirSync(path.dirname(path.resolve(root, outputPath)), { recursive: true });
fs.writeFileSync(path.resolve(root, outputPath), selected.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ selected: selected.length, keys: selected.map((row) => row.source_key), output: outputPath }, null, 2));
