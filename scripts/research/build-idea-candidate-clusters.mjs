import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const inputPath = path.resolve(ROOT, option("--input", "docs/research/idea-source-final-ledger.jsonl"));
const outputPath = path.resolve(ROOT, option("--output", "docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl"));
const fastLanePath = path.resolve(ROOT, option("--fast-lane", "docs/research/idea-candidate-fastlane-2026-07-14.jsonl"));
const summaryPath = path.resolve(ROOT, option("--summary", "docs/dev/experiments/idea-lab/candidate-cluster-summary-2026-07-14.md"));
const fastLaneSize = Number(option("--fast-lane-size", "100"));
const seedQueuePath = option("--seed-queue", "docs/research/idea-candidate-card-audit-queue-2026-07-14.jsonl");

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^0-9a-z가-힣]+/g, "");
}

function fiveSentences(row) {
  const five = row.five_sentences ?? {};
  return ["input", "process", "immediate_result", "need_moment", "advantage"]
    .map((key) => String(five[key] ?? "").trim());
}

function mechanismFingerprint(row) {
  const [input, process, result] = fiveSentences(row);
  return [normalize(input), normalize(process), normalize(result)].join("|");
}

function nameFingerprint(row) {
  return normalize(row.name);
}

function marketSignalScore(signal = {}) {
  const values = [
    signal.rating,
    signal.average_user_rating,
    signal.user_rating_count,
    signal.revenue_30d_value,
    signal.best_category_rank ? 100 / Math.max(Number(signal.best_category_rank), 1) : null,
    signal.best_search_rank ? 100 / Math.max(Number(signal.best_search_rank), 1) : null,
  ].filter((value) => Number.isFinite(Number(value))).map(Number);
  return values.reduce((sum, value) => sum + value, 0);
}

function candidateRank(row) {
  const five = fiveSentences(row);
  const complete = five.every(Boolean);
  const enrichmentBonus = row.needs_enrichment === false ? 100000 : 0;
  const provisionalPenalty = row.provisional_decision ? -100000 : 0;
  const evidenceBonus = Math.min(String(row.source_text ?? "").length, 2000) / 10;
  return enrichmentBonus + provisionalPenalty + Number(row.priority_score ?? 0) * 100 + evidenceBonus + marketSignalScore(row.market_signal);
}

function chooseRepresentative(rows) {
  return [...rows].sort((left, right) => candidateRank(right) - candidateRank(left))[0];
}

const rows = readJsonl(inputPath);
const candidates = rows.filter((row) => row.decision === "Candidate" && row.review_state === "finalized");
if (candidates.length === 0) throw new Error("No finalized Candidate rows found.");

const clusters = new Map();
const nameClusters = new Map();
for (const row of candidates) {
  const mechanism = mechanismFingerprint(row);
  const name = nameFingerprint(row);
  const clusterKey = mechanism || `name:${name}` || `key:${row.key}`;
  const current = clusters.get(clusterKey) ?? [];
  current.push(row);
  clusters.set(clusterKey, current);
  const sameName = nameClusters.get(name) ?? [];
  sameName.push(row);
  nameClusters.set(name, sameName);
}

const clusterRows = [...clusters.entries()].map(([clusterKey, members], index) => {
  const representative = chooseRepresentative(members);
  const exactNameSet = new Set(members.map(nameFingerprint));
  const clusterType = members.length > 1
    ? (exactNameSet.size === 1 ? "exact_name_mechanism" : "exact_mechanism")
    : "singleton_mechanism";
  return {
    cluster_id: `CAND-${String(index + 1).padStart(4, "0")}`,
    cluster_key: clusterKey,
    cluster_type: clusterType,
    size: members.length,
    representative_key: representative.key,
    representative_name: representative.name,
    member_keys: members.map((member) => member.key),
    member_names: members.map((member) => member.name),
    fast_lane_eligible: representative.needs_enrichment === false
      && !representative.provisional_decision
      && fiveSentences(representative).every(Boolean),
  };
});

const clusterByKey = new Map(clusterRows.flatMap((cluster) => cluster.member_keys.map((key) => [key, cluster])));
const nameClusterRows = [...nameClusters.entries()].map(([nameKey, members], index) => ({
  name_cluster_id: `NAME-${String(index + 1).padStart(4, "0")}`,
  name_cluster_key: nameKey,
  name_cluster_size: members.length,
  name_member_keys: members.map((member) => member.key),
  name_member_names: members.map((member) => member.name),
}));
const nameClusterByKey = new Map(nameClusterRows.flatMap((cluster) => cluster.name_member_keys.map((key) => [key, cluster])));
const enrichedRows = candidates.map((row) => {
  const cluster = clusterByKey.get(row.key);
  const nameCluster = nameClusterByKey.get(row.key);
  return {
    cluster_id: cluster.cluster_id,
    cluster_key: cluster.cluster_key,
    cluster_type: cluster.cluster_type,
    cluster_size: cluster.size,
    representative_key: cluster.representative_key,
    name_cluster_id: nameCluster.name_cluster_id,
    name_cluster_size: nameCluster.name_cluster_size,
    name_cluster_member_keys: nameCluster.name_member_keys,
    key: row.key,
    name: row.name,
    url: row.url,
    dataset: row.dataset,
    decision: row.decision,
    needs_enrichment: row.needs_enrichment,
    provisional_decision: row.provisional_decision ?? null,
    priority_score: row.priority_score ?? null,
    source_text: row.source_text,
    five_sentences: row.five_sentences,
    market_signal: row.market_signal ?? null,
    fast_lane_eligible: cluster.fast_lane_eligible,
    requires_name_cluster_review: nameCluster.name_cluster_size > 1,
    rank_score: candidateRank(row),
  };
});

const seedKeys = new Set();
if (seedQueuePath && fs.existsSync(path.resolve(ROOT, seedQueuePath))) {
  for (const row of readJsonl(path.resolve(ROOT, seedQueuePath))) {
    if (row.key) seedKeys.add(row.key);
  }
}

const representatives = [...clusterRows]
  .filter((cluster) => cluster.representative_key)
  .map((cluster) => enrichedRows.find((row) => row.key === cluster.representative_key))
  .filter((row) => row?.fast_lane_eligible)
  .sort((left, right) => {
    const seedDelta = Number(seedKeys.has(right.key)) - Number(seedKeys.has(left.key));
    return seedDelta || right.rank_score - left.rank_score || left.key.localeCompare(right.key);
  });

const uniqueNameRepresentatives = [];
const seenNameKeys = new Set();
for (const row of representatives) {
  const nameKey = nameFingerprint(row);
  if (seenNameKeys.has(nameKey)) continue;
  seenNameKeys.add(nameKey);
  uniqueNameRepresentatives.push(row);
}

const fastLane = uniqueNameRepresentatives.slice(0, fastLaneSize).map((row, index) => ({
  queue_position: index + 1,
  status: "source_ready",
  ...row,
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.mkdirSync(path.dirname(fastLanePath), { recursive: true });
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(outputPath, `${enrichedRows.map((row) => JSON.stringify(row)).join("\n")}\n`);
fs.writeFileSync(fastLanePath, `${fastLane.map((row) => JSON.stringify(row)).join("\n")}\n`);

const duplicateClusters = clusterRows.filter((cluster) => cluster.size > 1);
const duplicateNameClusters = nameClusterRows.filter((cluster) => cluster.name_cluster_size > 1);
const summary = [
  "# Candidate 메커니즘 클러스터 요약 — 2026-07-14",
  "",
  `- Candidate 원본 행: **${candidates.length}개**`,
  `- 임시 메커니즘 그룹: **${clusterRows.length}개**`,
  `- 2개 이상 행이 묶인 그룹: **${duplicateClusters.length}개**`,
  `- 중복 그룹에 속한 원본 행: **${duplicateClusters.reduce((sum, cluster) => sum + cluster.size, 0)}개**`,
  `- 같은 이름 provisional 그룹: **${duplicateNameClusters.length}개**`,
  `- 같은 이름 그룹에 속한 원본 행: **${duplicateNameClusters.reduce((sum, cluster) => sum + cluster.name_cluster_size, 0)}개**`,
  `- 빠른 레인 가능 메커니즘 대표: **${representatives.length}개**`,
  `- 이름 중복을 한 번만 세어 본 빠른 레인 대표: **${uniqueNameRepresentatives.length}개**`,
  `- 이번 빠른 레인 고정 수: **${fastLane.length}개**`,
  "",
  "## 주의",
  "",
  "이 파일의 클러스터는 원본 행을 삭제하지 않는 provisional grouping이다. 의미 기반 embedding 유사도는 별도 경계 목록으로 기록하고, 유사도 숫자만으로 최종 Merge하지 않는다.",
  "",
  "## 출력",
  "",
  `- 전체 클러스터 행: \`${path.relative(ROOT, outputPath)}\``,
  `- 빠른 레인: \`${path.relative(ROOT, fastLanePath)}\``,
  "",
].join("\n");
fs.writeFileSync(summaryPath, `${summary}\n`);

process.stdout.write(`${JSON.stringify({
  candidates: candidates.length,
  clusters: clusterRows.length,
  duplicateClusters: duplicateClusters.length,
  duplicateRows: duplicateClusters.reduce((sum, cluster) => sum + cluster.size, 0),
  duplicateNameClusters: duplicateNameClusters.length,
  duplicateNameRows: duplicateNameClusters.reduce((sum, cluster) => sum + cluster.name_cluster_size, 0),
  fastLaneEligibleRepresentatives: representatives.length,
  uniqueNameRepresentatives: uniqueNameRepresentatives.length,
  fastLane: fastLane.length,
  output: path.relative(ROOT, outputPath),
  fastLaneOutput: path.relative(ROOT, fastLanePath),
  summary: path.relative(ROOT, summaryPath),
  status: "ok",
}, null, 2)}\n`);
