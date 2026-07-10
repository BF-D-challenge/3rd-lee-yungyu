#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultCandidates = "docs/dev/experiments/card-quality/qa/appeal-first-candidates-2026-07-10.json";
const candidateArg = process.argv.find((arg) => arg.endsWith(".json")) ?? defaultCandidates;
const candidatePath = path.resolve(repoRoot, candidateArg);
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const apply = process.argv.includes("--apply");
const forbiddenNames = /현황판|후보집|결정표|계산기|진단|AI 추천/;
const scoreKeys = ["scene", "emotionalLoss", "realism", "shareRevisit", "differentiation"];

const candidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const goldenByKey = new Map(golden.map((card) => [`${card.seed}|${card.pain}|${card.format}`, card]));
const errors = [];
const seenKeys = new Set();
const seenNames = new Set();

if (!Array.isArray(candidates) || candidates.length !== 10) {
  errors.push(`후보는 정확히 10장이어야 합니다: ${Array.isArray(candidates) ? candidates.length : "not-array"}`);
}

for (const candidate of Array.isArray(candidates) ? candidates : []) {
  if (!goldenByKey.has(candidate.key)) errors.push(`운영 데이터에 없는 key: ${candidate.key}`);
  if (seenKeys.has(candidate.key)) errors.push(`중복 key: ${candidate.key}`);
  seenKeys.add(candidate.key);

  const after = candidate.after ?? {};
  for (const field of ["appName", "title", "oneliner", "target"]) {
    const minimumLength = field === "appName" ? 2 : 4;
    if (typeof after[field] !== "string" || after[field].trim().length < minimumLength) {
      errors.push(`${candidate.key}: after.${field}가 비어 있거나 너무 짧습니다`);
    }
  }
  if (forbiddenNames.test(after.appName ?? "")) errors.push(`${candidate.key}: 금지 형식어가 포함된 appName`);
  if (seenNames.has(after.appName)) errors.push(`${candidate.key}: 중복 appName ${after.appName}`);
  seenNames.add(after.appName);

  const scores = scoreKeys.map((key) => Number(candidate.appealScores?.[key]));
  const average = scores.reduce((sum, score) => sum + score, 0) / scoreKeys.length;
  if (scores.some((score) => !Number.isFinite(score) || score < 0 || score > 5) || average < 4) {
    errors.push(`${candidate.key}: appeal 평균 ${Number.isFinite(average) ? average.toFixed(2) : "invalid"}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

const changes = candidates.map((candidate) => ({
  key: candidate.key,
  before: candidate.before.appName,
  after: candidate.after.appName,
  average: Number(
    (scoreKeys.reduce((sum, key) => sum + Number(candidate.appealScores[key]), 0) / scoreKeys.length).toFixed(2),
  ),
}));

if (apply) {
  for (const candidate of candidates) Object.assign(goldenByKey.get(candidate.key), candidate.after);
  fs.writeFileSync(goldenPath, `${JSON.stringify(golden, null, 2)}\n`);
}

console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", cards: changes }, null, 2));
