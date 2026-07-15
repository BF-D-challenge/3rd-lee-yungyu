import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readJsonl(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const screening = readJsonl("docs/research/idea-source-screening-ledger.jsonl");
const manifest = readJsonl("docs/research/idea-source-experiment-manifest.jsonl");
const pilot = readJsonl("docs/research/idea-source-experiment-pilot-60.jsonl");

function unique(rows, field) {
  return new Set(rows.map((row) => row[field]));
}

const screeningKeys = unique(screening, "key");
const manifestKeys = unique(manifest, "key");
const pilotKeys = unique(pilot, "key");
if (screening.length !== 8406 || screeningKeys.size !== 8406) throw new Error("Screening ledger must contain 8406 unique rows");
if (manifest.length !== 8406 || manifestKeys.size !== 8406) throw new Error("Experiment manifest must contain 8406 unique rows");
if (pilot.length !== 60 || pilotKeys.size !== 60) throw new Error("Pilot must contain 60 unique rows");
for (const key of screeningKeys) if (!manifestKeys.has(key)) throw new Error(`Manifest missing ${key}`);
for (const key of pilotKeys) if (!manifestKeys.has(key)) throw new Error(`Pilot key missing from manifest: ${key}`);

const expectedExperiments = [
  "X01_source_integrity",
  "X02_keyword_lenses",
  "X03_market_signal",
  "X04_embedding_baseline",
  "X05_mechanism_normalization",
  "X06_owner_triangle",
  "X07_moment_counterfactual",
  "X08_default_ai_counterfactual",
  "X09_case_law_pairwise",
  "X10_portfolio_cluster",
  "X11_independent_jury",
  "X12_rejection_shadow_audit",
  "X13_nine_cell_preflight",
  "X14_full_27_audit",
];
for (const row of manifest) {
  const keys = Object.keys(row.experiments);
  if (JSON.stringify(keys) !== JSON.stringify(expectedExperiments)) {
    throw new Error(`${row.key}: experiment registry mismatch`);
  }
}

const batches = new Map();
for (const row of manifest) {
  const batch = batches.get(row.batch_id) || [];
  batch.push(row);
  batches.set(row.batch_id, batch);
}
if (batches.size !== 85) throw new Error(`Expected 85 batches, got ${batches.size}`);
const orderedBatches = [...batches].sort(([left], [right]) => left.localeCompare(right));
orderedBatches.forEach(([batchId, rows], index) => {
  const expected = index === orderedBatches.length - 1 ? 6 : 100;
  if (rows.length !== expected) throw new Error(`${batchId}: expected ${expected}, got ${rows.length}`);
  const positions = [...rows].map((row) => row.batch_position).sort((a, b) => a - b);
  if (positions.some((position, positionIndex) => position !== positionIndex + 1)) {
    throw new Error(`${batchId}: non-contiguous positions`);
  }
});

const datasetCounts = Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => [
  dataset,
  manifest.filter((row) => row.dataset === dataset).length,
]));
if (datasetCounts.trustmrr !== 1863 || datasetCounts.app_store !== 4512 || datasetCounts.chrome_web_store !== 2031) {
  throw new Error(`Dataset counts mismatch: ${JSON.stringify(datasetCounts)}`);
}

const pilotDatasetCounts = Object.fromEntries(["trustmrr", "app_store", "chrome_web_store"].map((dataset) => [
  dataset,
  pilot.filter((row) => row.dataset === dataset).length,
]));
if (Object.values(pilotDatasetCounts).some((count) => count !== 20)) throw new Error(`Pilot dataset balance mismatch: ${JSON.stringify(pilotDatasetCounts)}`);

console.log(JSON.stringify({
  screeningRows: screening.length,
  manifestRows: manifest.length,
  pilotRows: pilot.length,
  batches: batches.size,
  datasetCounts,
  pilotDatasetCounts,
  status: "ok",
}, null, 2));
