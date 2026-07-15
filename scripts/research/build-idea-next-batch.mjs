#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const prefix = option("--prefix", "idea-next-batch-060");
const excludeFile = option("--exclude-file", null);
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const ledger = new Map(readJsonl("docs/research/idea-source-final-ledger.jsonl").map((row) => [row.key, row]));
const clusters = new Map(readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl").map((row) => [row.key, row]));
const gate = readJsonl("docs/research/idea-candidate-gate-results-2026-07-14.jsonl")
  .filter((row) => row.audit.status === "pass")
  .sort((a, b) => (clusters.get(b.source_key)?.rank_score ?? 0) - (clusters.get(a.source_key)?.rank_score ?? 0));
const shortlisted = new Set(readJsonl("docs/research/idea-candidate-deep-audit-shortlist-2026-07-14.jsonl").map((row) => row.source_key));
const rerun = new Set(readJsonl("docs/research/idea-candidate-review-rerun-results-2026-07-14.jsonl").map((row) => row.source_key));
const previous = new Set();
for (const file of (excludeFile ? excludeFile.split(",") : [])) {
  for (const row of readJsonl(file)) previous.add(row.source_key);
}
const appText = fs.readFileSync(path.join(root, "src/components/organisms/idea-lab/sample-data.ts"), "utf8");
const inApp = new Set([...appText.matchAll(/(?:["']?key["']?)\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]));
const seen = new Set();
const seenMechanisms = new Set();
const seenNames = new Set();
const categoryCounts = new Map();
const selected = [];
for (const row of gate) {
  const key = row.source_key;
  const cluster = clusters.get(key) ?? {};
  const category = ledger.get(key)?.category ?? row.category ?? "unknown";
  if (shortlisted.has(key) || rerun.has(key) || previous.has(key) || inApp.has(key) || seen.has(key)) continue;
  if (seenMechanisms.has(cluster.cluster_id) || seenNames.has(cluster.name_cluster_id)) continue;
  if ((categoryCounts.get(category) ?? 0) >= 5) continue;
  selected.push({
    ...row,
    source_url: row.url,
    rank_score: cluster.rank_score ?? 0,
    mechanism_cluster_id: cluster.cluster_id ?? key,
    name_cluster_id: cluster.name_cluster_id ?? key,
    batch_rank: selected.length + 1,
    batch_category: category,
  });
  seen.add(key);
  seenMechanisms.add(cluster.cluster_id ?? key);
  seenNames.add(cluster.name_cluster_id ?? key);
  categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  if (selected.length >= 60) break;
}
const output = `docs/research/${prefix}-input-2026-07-14.jsonl`;
fs.writeFileSync(path.join(root, output), selected.map((row) => JSON.stringify(row)).join("\n") + "\n");
const summary = [
  "# 다음 Candidate 배치 60개",
  "",
  `- gate pass 전체: ${gate.length}`,
  `- 제외: 기존 shortlist ${shortlisted.size}개, 현재 앱 ${inApp.size}개, 재검토 큐 ${rerun.size}개, 이전 배치 ${previous.size}개`,
  `- 새 배치: ${selected.length}개`,
  "- 선정 기준: 높은 순위, 이름·메커니즘 중복 제거, 카테고리 최대 5개",
  "- 앱 반영: 아직 하지 않음",
  "",
  "## 카테고리별 수",
  "",
  ...[...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).map(([category, count]) => `- ${category}: ${count}`),
  "",
];
fs.writeFileSync(path.join(root, `docs/dev/experiments/idea-lab/${prefix}-summary-2026-07-14.md`), summary.join("\n"));
console.log(JSON.stringify({ gatePass: gate.length, excludedShortlist: shortlisted.size, excludedApp: inApp.size, excludedRerun: rerun.size, excludedPrevious: previous.size, selected: selected.length, output }, null, 2));
