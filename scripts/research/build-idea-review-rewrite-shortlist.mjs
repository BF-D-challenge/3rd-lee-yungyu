#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const readJsonl = (file) => fs.readFileSync(path.resolve(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const batches = option("--batches", "061,062,063,064,065,066,067,068,069").split(",");
const limit = Number(option("--limit", "24"));
const output = option("--output", "docs/research/idea-review-rewrite-shortlist-2026-07-15.jsonl");
const summary = option("--summary", "docs/dev/experiments/idea-lab/idea-review-rewrite-shortlist-2026-07-15.md");
const disqualifying = /(generic|os_|os-|basic|builtin|native|default|prior|pre_|pre-|tracking|record|external|recipient|other_party|multi.?input|multiple.?input|input_not|unsupported_input|mechanism|scope|safety|regulation|상대방|사전|기본기능|범용)/i;
const titleRisk = /title|opaque|제목/i;

const metadata = new Map();
for (const batch of batches) {
  const file = `docs/research/idea-next-batch-${batch}-input-2026-07-14.jsonl`;
  if (!fs.existsSync(path.resolve(root, file))) continue;
  for (const row of readJsonl(file)) metadata.set(row.source_key, { ...row, audit_batch: batch });
}

const stats = new Map();
for (const batch of batches) {
  const file = `docs/research/idea-next-batch-${batch}-latin-results-2026-07-14.jsonl`;
  if (!fs.existsSync(path.resolve(root, file))) continue;
  for (const row of readJsonl(file)) {
    const item = stats.get(row.source_key) ?? { source_key: row.source_key, pass: 0, review: 0, fail: 0, hard_fail: 0, title_rows: 0, disqualifying_rows: 0 };
    item[row.audit.status] += 1;
    if (row.audit.hard_gate === "fail") item.hard_fail += 1;
    const flags = (row.audit.risk_flags ?? []).join(" ");
    if (titleRisk.test(flags)) item.title_rows += 1;
    if (disqualifying.test(flags)) item.disqualifying_rows += 1;
    stats.set(row.source_key, item);
  }
}

const failedFullAudit = new Set();
for (const batch of batches) {
  const file = `docs/research/idea-next-batch-${batch}-full-results-2026-07-14.jsonl`;
  if (!fs.existsSync(path.resolve(root, file))) continue;
  const grouped = new Map();
  for (const row of readJsonl(file)) {
    const item = grouped.get(row.source_key) ?? { pass: 0, total: 0 };
    item.total += 1;
    if (row.audit.status === "pass") item.pass += 1;
    grouped.set(row.source_key, item);
  }
  for (const [key, item] of grouped) if (item.total !== 27 || item.pass !== 27) failedFullAudit.add(key);
}

const eligible = [...stats.values()]
  .filter((item) => item.pass + item.review + item.fail === 9)
  .filter((item) => item.fail === 0 && item.hard_fail === 0 && item.disqualifying_rows === 0)
  .filter((item) => !failedFullAudit.has(item.source_key))
  .map((item) => ({
    ...metadata.get(item.source_key),
    prior_audit: item,
    rewrite_reason: item.title_rows > 0
      ? `Latin-9 fail 0개이며 ${item.title_rows}개 행이 해외 원본명 기반 제목 문제에 집중됨`
      : `Latin-9 ${item.pass} pass / ${item.review} review / 0 fail로 비제목 구조 위험이 발견되지 않음`,
    rewrite_score: item.pass * 5 + item.review * 2 + item.title_rows * 2 + (metadata.get(item.source_key)?.rank_score ?? 0),
  }))
  .sort((a, b) => b.rewrite_score - a.rewrite_score || b.prior_audit.pass - a.prior_audit.pass)
  .slice(0, limit)
  .map((row, index) => ({ ...row, rewrite_rank: index + 1 }));

if (eligible.length !== limit) throw new Error(`Expected ${limit} eligible candidates, found ${eligible.length}`);
fs.mkdirSync(path.dirname(path.resolve(root, output)), { recursive: true });
fs.writeFileSync(path.resolve(root, output), eligible.map((row) => JSON.stringify(row)).join("\n") + "\n");

const lines = [
  "# Review 카드 재작성 후보",
  "",
  `- 대상 배치: ${batches.join(", ")}`,
  `- 선별 원본: ${eligible.length}개`,
  "- 조건: Latin-9 fail 0, hard fail 0, 비제목 하드 위험 0, 과거 full-27 실패 원본 제외",
  "- 목적: 해외 제품명을 제목으로 검사한 오류를 제거하고 앱형 카드 구조로 재작성",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순위 | 원본 | 기존 Latin | 제목 문제 행 | 선별 이유 |",
  "|---:|---|---:|---:|---|",
  ...eligible.map((row) => `| ${row.rewrite_rank} | ${row.name} (${row.source_key}) | ${row.prior_audit.pass}/${row.prior_audit.review}/${row.prior_audit.fail} | ${row.prior_audit.title_rows} | ${row.rewrite_reason} |`),
  "",
];
fs.mkdirSync(path.dirname(path.resolve(root, summary)), { recursive: true });
fs.writeFileSync(path.resolve(root, summary), lines.join("\n"));
console.log(JSON.stringify({ selected: eligible.length, output, summary, keys: eligible.map((row) => row.source_key) }, null, 2));
