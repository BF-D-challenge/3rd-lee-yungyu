#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};
const readJsonl = (file) => fs.readFileSync(path.resolve(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const candidatesPath = option("--candidates");
const resultsPath = option("--results");
const outputPath = option("--output");
if (!candidatesPath || !resultsPath || !outputPath) {
  throw new Error("Usage: --candidates <JSONL> --results <JSONL> --output <JSONL>");
}

const candidates = new Map(readJsonl(candidatesPath).map((row) => [row.source_key, row]));
const groups = new Map();
for (const row of readJsonl(resultsPath)) {
  const group = groups.get(row.source_key) ?? { rows: [], risks: new Set() };
  group.rows.push(row);
  for (const risk of row.audit.risk_flags) group.risks.add(risk);
  groups.set(row.source_key, group);
}

const allowedRisks = new Set(["payer_moment_mismatch"]);
const selected = [...groups.entries()]
  .filter(([, group]) => group.rows.length === 9)
  .filter(([, group]) => group.rows.some((row) => row.audit.status !== "pass"))
  .filter(([, group]) => [...group.risks].every((risk) => allowedRisks.has(risk)))
  .map(([sourceKey, group]) => {
    const candidate = candidates.get(sourceKey);
    if (!candidate) throw new Error(`Missing candidate: ${sourceKey}`);
    return {
      ...candidate,
      prior_review_feedback: {
        instruction: "행사 종류를 payer나 moment의 정체성으로 쓰지 않는다. payers는 모두 어느 공연에서도 응원 부채를 만드는 제작자 유형으로, moments는 모두 행사 종류가 아니라 인쇄 직전에 생긴 문구 문제로 작성한다. 예: 오늘 출력해야 함, 글자가 멀리서 안 보임, 긴 문구가 부채 폭을 넘음. 세 twist는 굵은 외곽선·두 줄 배치·인쇄 크기 맞춤을 유지하고 모든 payer×moment에 적용한다.",
        permitted_risks: [...allowedRisks],
        previous_rows: group.rows.filter((row) => row.audit.status !== "pass").map((row) => ({
          payer: row.payer,
          moment: row.moment,
          twist: row.twist,
          reason: row.audit.reason,
          risk_flags: row.audit.risk_flags,
        })),
      },
    };
  });

if (selected.length === 0) throw new Error("No axis-only retry candidates found");
fs.writeFileSync(path.resolve(root, outputPath), selected.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ selected: selected.length, keys: selected.map((row) => row.source_key), output: outputPath }, null, 2));
