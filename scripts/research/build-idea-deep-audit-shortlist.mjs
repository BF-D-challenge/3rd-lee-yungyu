#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const ledger = new Map(readJsonl("docs/research/idea-source-final-ledger.jsonl").map((row) => [row.key, row]));
const clusters = new Map(readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl").map((row) => [row.key, row]));
const gateRows = readJsonl("docs/research/idea-candidate-gate-results-2026-07-14.jsonl")
  .filter((row) => row.audit.status === "pass")
  .map((row) => {
    const source = ledger.get(row.source_key);
    const cluster = clusters.get(row.source_key);
    return {
      ...row,
      priority_score: source?.priority_score ?? 0,
      rank_score: cluster?.rank_score ?? source?.priority_score ?? 0,
      name_cluster_id: cluster?.name_cluster_id ?? row.source_key,
      mechanism_cluster_id: cluster?.cluster_id ?? row.source_key,
    };
  })
  .sort((a, b) => b.rank_score - a.rank_score);

const selected = [];
const seenNameClusters = new Set();
const categoryCounts = new Map();
for (const row of gateRows) {
  const category = ledger.get(row.source_key)?.category ?? row.category ?? "unknown";
  const count = categoryCounts.get(category) ?? 0;
  if (seenNameClusters.has(row.name_cluster_id) || count >= 5) continue;
  selected.push({ ...row, shortlist_rank: selected.length + 1, shortlist_category: category });
  seenNameClusters.add(row.name_cluster_id);
  categoryCounts.set(category, count + 1);
  if (selected.length >= 150) break;
}

const output = "docs/research/idea-candidate-deep-audit-shortlist-2026-07-14.jsonl";
fs.writeFileSync(path.join(root, output), selected.map((row) => JSON.stringify(row)).join("\n") + "\n");
const summary = [
  "# Candidate 심층 감사 후보",
  "",
  "- 1차 게이트 pass: " + gateRows.length,
  "- 심층 감사 shortlist: " + selected.length,
  "- 기준: 시장 신호 순위가 높은 원본 우선, 같은 이름 클러스터 중복 제거, 카테고리별 최대 5개",
  "- 앱 반영: 아직 하지 않음",
  "",
  "## 카테고리별 수",
  "",
  ...[...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).map(([category, count]) => "- " + category + ": " + count),
  "",
];
fs.writeFileSync(path.join(root, "docs/dev/experiments/idea-lab/idea-candidate-deep-audit-shortlist-summary-2026-07-14.md"), summary.join("\n"));
console.log(JSON.stringify({ gatePass: gateRows.length, shortlist: selected.length, categories: Object.fromEntries(categoryCounts) }, null, 2));
