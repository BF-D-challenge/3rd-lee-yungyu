#!/usr/bin/env node
// Validate the four 250-card rewrite lane outputs against their exact inputs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const baseDir = path.join(repoRoot, "scripts/rollout/manual-batches/rewrite-1000");

const lanes = [
  ["B", "001-250"],
  ["C", "251-500"],
  ["D", "501-750"],
  ["E", "751-1000"],
];

const requiredAxis = ["psychology", "socialContext", "outputShape", "emotionalResolution", "anchorMechanism"];
const banned = [
  /[0-9,]+개 뒤지다/,
  /식은땀/,
  /하다가 .*에 막히는 사람/,
  /스트릭/,
  /\b(PB|PR|KPI|MAU|DAU|ROI|CTR|CRUD|API)\b/,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function textOf(card) {
  return [
    card.title,
    card.oneliner,
    card.target,
    ...(card.mvp ?? []),
    card.evidence,
    card.todayAction,
    card.buildPrompt,
    card.frontStory?.persona,
    ...(card.frontStory?.timeline ?? []).flatMap((t) => [t.t, t.act, t.emo]),
  ].filter(Boolean).join(" ");
}

function key(card) {
  return `${card.seed}|${card.pain}|${card.format}`;
}

function validateCard(card, item, index) {
  const errors = [];
  const expectedKey = item.key;
  if (key(card) !== expectedKey) errors.push(`key changed: expected ${expectedKey}, got ${key(card)}`);
  if (card.title === item.current.title) errors.push("title unchanged");
  if (card.oneliner === item.current.oneliner) errors.push("oneliner unchanged");
  if (!["direct", "adjacent", "inferred", "external"].includes(card.needSource)) errors.push("invalid needSource");
  if (!card.psychologyPrinciple) errors.push("psychologyPrinciple missing");
  if (!card.whyItMatters || card.whyItMatters.length < 12) errors.push("whyItMatters missing or too short");
  if (!card.differentiationAxis || typeof card.differentiationAxis !== "object") {
    errors.push("differentiationAxis missing");
  } else {
    for (const axis of requiredAxis) {
      if (!card.differentiationAxis[axis]) errors.push(`differentiationAxis.${axis} missing`);
    }
  }
  const allText = textOf(card);
  for (const pattern of banned) {
    if (pattern.test(allText)) errors.push(`banned pattern: ${pattern}`);
  }
  if (!/약\s*[\d,]+\s*만원/.test(card.evidence ?? "")) errors.push("evidence missing 약 N만원");
  if (!String(card.todayAction ?? "").startsWith("오늘 반나절")) errors.push("todayAction prefix invalid");
  if (!Array.isArray(card.mvp) || card.mvp.length !== 4) errors.push("mvp length invalid");
  if (!card.frontStory || !Array.isArray(card.frontStory.timeline) || card.frontStory.timeline.length !== 3) {
    errors.push("frontStory timeline invalid");
  }
  return errors.length ? { index, key: expectedKey, errors } : null;
}

const report = [];
let total = 0;
let failed = 0;
let missing = 0;

for (const [lane, range] of lanes) {
  const inputPath = path.join(baseDir, "inputs", `lane-${lane}-${range}.input.json`);
  const outputPath = path.join(baseDir, "outputs", `lane-${lane}-${range}.json`);
  const input = readJson(inputPath);
  const laneReport = { lane, range, expected: input.items.length, output: 0, failed: [], missingOutput: false };

  if (!fs.existsSync(outputPath)) {
    laneReport.missingOutput = true;
    missing++;
    report.push(laneReport);
    continue;
  }

  const output = readJson(outputPath);
  laneReport.output = Array.isArray(output) ? output.length : -1;
  if (!Array.isArray(output)) {
    laneReport.failed.push({ index: -1, key: lane, errors: ["output must be a JSON array"] });
  } else {
    if (output.length !== input.items.length) {
      laneReport.failed.push({ index: -1, key: lane, errors: [`expected ${input.items.length} cards, got ${output.length}`] });
    }
    for (let i = 0; i < Math.min(output.length, input.items.length); i++) {
      const result = validateCard(output[i], input.items[i], i);
      if (result) laneReport.failed.push(result);
    }
  }
  total += laneReport.output > 0 ? laneReport.output : 0;
  failed += laneReport.failed.length;
  report.push(laneReport);
}

const summary = {
  ok: missing === 0 && failed === 0 && total === 1000,
  totalOutput: total,
  missingOutputs: missing,
  failedCount: failed,
  lanes: report.map((r) => ({
    lane: r.lane,
    range: r.range,
    expected: r.expected,
    output: r.output,
    missingOutput: r.missingOutput,
    failedCount: r.failed.length,
    failedSamples: r.failed.slice(0, 5),
  })),
};

console.log(JSON.stringify(summary, null, 2));
process.exit(summary.ok ? 0 : 1);
