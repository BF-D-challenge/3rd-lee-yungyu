import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const rawInputPath = option("--input");
const rawOutputPath = option("--output");
const inputPath = rawInputPath ? path.resolve(ROOT, rawInputPath) : null;
const outputPath = rawOutputPath ? path.resolve(ROOT, rawOutputPath) : null;
const rotationStart = Number(option("--rotation-start", "0"));
const rotationCount = Number(option("--rotation-count", "1"));

if (!inputPath || !fs.existsSync(inputPath)) throw new Error("--input candidate draft JSON is required.");
if (!outputPath) throw new Error("--output JSONL is required.");

const candidates = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (!Array.isArray(candidates) || candidates.length === 0) throw new Error("Candidate draft must be a non-empty array.");

for (const candidate of candidates) {
  if (candidate.payers?.length !== 3 || candidate.moments?.length !== 3 || candidate.twists?.length !== 3) {
    throw new Error(`${candidate.id}: expected payer 3 × moment 3 × twist 3.`);
  }
}

const rows = [];
for (const candidate of candidates) {
  for (let rotation = rotationStart; rotation < rotationStart + rotationCount; rotation += 1) {
    for (let payerIndex = 0; payerIndex < 3; payerIndex += 1) {
      for (let momentIndex = 0; momentIndex < 3; momentIndex += 1) {
        const twistIndex = (payerIndex + momentIndex + rotation) % 3;
        const payer = candidate.payers[payerIndex];
        const moment = candidate.moments[momentIndex];
        const twist = candidate.twists[twistIndex];
        rows.push({
          id: `${candidate.id}__${payer.id}__${moment.id}__${twist.id}`,
          scenario_id: candidate.id,
          rotation,
          payer_index: payerIndex,
          moment_index: momentIndex,
          twist_index: twistIndex,
          payer_id: payer.id,
          moment_id: moment.id,
          twist_id: twist.id,
          payer: payer.value,
          moment: moment.value,
          twist: twist.value,
          result_title: twist.resultTitle,
          smallest_build: twist.smallestBuild,
          sentence: `${payer.value}가 ${moment.value}에 쓰는 ${twist.resultTitle}`,
          status: "unjudged",
        });
      }
    }
  }
}

const expectedPerCandidate = rotationCount * 9;
if (rows.length !== candidates.length * expectedPerCandidate) {
  throw new Error(`Generated ${rows.length} rows; expected ${candidates.length * expectedPerCandidate}.`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
process.stdout.write(`${JSON.stringify({
  candidates: candidates.length,
  rotations: rotationCount,
  combinations: rows.length,
  output: path.relative(ROOT, outputPath),
  status: "ok",
}, null, 2)}\n`);
