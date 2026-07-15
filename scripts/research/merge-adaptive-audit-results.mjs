#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (token.startsWith("--")) args.set(token.slice(2), process.argv[i + 1]);
}

const required = ["inputs", "judges", "output", "summary"];
for (const key of required) {
  if (!args.get(key)) throw new Error("Missing --" + key);
}

const readJsonl = (file) =>
  fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(file + " line " + (index + 1) + ": " + error.message);
      }
    });

const inputRows = readJsonl(path.resolve(repoRoot, args.get("inputs")));
const judgeFiles = args
  .get("judges")
  .split(",")
  .map((file) => path.resolve(file));
const positional = args.get("positional") === "true";
let cursor = 0;
const results = judgeFiles.flatMap((file) => {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(parsed.results)) throw new Error(file + ": expected results array");
  if (!positional) return parsed.results;
  const expected = inputRows.slice(cursor, cursor + parsed.results.length);
  if (expected.length !== parsed.results.length) {
    throw new Error(file + ": positional rows exceed input rows");
  }
  cursor += parsed.results.length;
  return parsed.results.map((result, index) => ({
    ...result,
    judge_id: result.id,
    id_repaired: result.id !== expected[index].id,
    id: expected[index].id,
  }));
});
if (positional && cursor !== inputRows.length) {
  throw new Error("Positional judge rows cover " + cursor + " of " + inputRows.length + " input rows");
}

const expectedIds = new Set(inputRows.map((row) => row.id));
const seen = new Set();
for (const result of results) {
  if (seen.has(result.id)) throw new Error("Duplicate judge id: " + result.id);
  seen.add(result.id);
  if (!expectedIds.has(result.id)) throw new Error("Unexpected judge id: " + result.id);
  if (!["pass", "review", "fail"].includes(result.status)) {
    throw new Error("Invalid status for " + result.id);
  }
}
const missing = inputRows.filter((row) => !seen.has(row.id)).map((row) => row.id);
if (missing.length) throw new Error("Missing " + missing.length + " judge rows: " + missing.slice(0, 5).join(", "));

const byId = new Map(results.map((result) => [result.id, result]));
const merged = inputRows.map((input) => ({ ...input, audit: byId.get(input.id) }));
const counts = Object.fromEntries(["pass", "review", "fail"].map((status) => [
  status,
  merged.filter((row) => row.audit.status === status).length,
]));
const repairedIds = merged.filter((row) => row.audit.id_repaired).length;
const candidateCounts = {};
for (const row of merged) {
  const candidateKey = row.scenario_id ?? row.source_key;
  candidateCounts[candidateKey] ??= { pass: 0, review: 0, fail: 0, total: 0 };
  candidateCounts[candidateKey][row.audit.status] += 1;
  candidateCounts[candidateKey].total += 1;
}

const outputPath = path.resolve(repoRoot, args.get("output"));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, merged.map((row) => JSON.stringify(row)).join("\n") + "\n");

const lines = [
  "# Adaptive Batch 001 — 적응형 감사 결과",
  "",
  "- 검사 행: " + merged.length,
  "- pass: " + counts.pass,
  "- review: " + counts.review,
  "- fail: " + counts.fail,
  "- 입력 ID 순서로 복구한 판정 행: " + repairedIds + " (judge_id를 함께 보존)",
  "- 범위: " + (args.get("scope") ?? "입력 행 감사"),
  "- 앱 반영: 아직 하지 않음",
  "",
  "## 원본별 결과",
  "",
  "| 원본 | pass | review | fail | 다음 조치 |",
  "|---|---:|---:|---:|---|",
];
for (const [candidateId, candidate] of Object.entries(candidateCounts)) {
  const next = args.get("mode") === "gate"
    ? (candidate.fail > 0 ? "자동 승격 금지 · 실패 원인만 기록" :
      candidate.review > 0 ? "Latin-9 확대 감사" :
      "Latin-9 확대 감사 후보")
    : (candidate.fail > 0 ? "18/27 확장 감사 및 실패 원인 확인" :
      candidate.review > 0 ? "18 확장 감사" :
      "9개 통과 유지 + 10% shadow 27 감사");
  lines.push("| " + candidateId + " | " + candidate.pass + " | " + candidate.review + " | " + candidate.fail + " | " + next + " |");
}
lines.push("", "## 판정 원칙", "", "- Latin-9는 세 축의 모든 쌍을 한 번씩 확인하는 최소 조합입니다.", "- review/fail이 나온 원본은 즉시 앱에 넣지 않고 18 또는 27조합으로 넓혀 확인합니다.", "- 이 보고서를 먼저 확인한 뒤에만 sample-data.ts 승격 여부를 결정합니다.", "");

const summaryPath = path.resolve(repoRoot, args.get("summary"));
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.writeFileSync(summaryPath, lines.join("\n"));
console.log(JSON.stringify({ inputRows: inputRows.length, results: results.length, counts, outputPath, summaryPath }, null, 2));
