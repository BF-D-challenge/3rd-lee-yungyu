#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const fullSummary = path.join(root, "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-015-full-summary-2026-07-15.md");
if (!fs.existsSync(fullSummary)) throw new Error("Full-27 report must exist before promotion output");
const full = readJsonl("docs/research/idea-strong-mechanism-batch-015-full-results-2026-07-15.jsonl");
const passingKeys = [...new Set(full.map((row) => row.source_key))].filter((key) => {
  const rows = full.filter((row) => row.source_key === key);
  return rows.length === 27 && rows.every((row) => row.audit.status === "pass");
});
if (passingKeys.length !== 0) throw new Error(`Unexpected Full-27 winner without definition: ${passingKeys.join(", ")}`);

const output = "docs/research/idea-strong-mechanism-batch-015-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), "[]\n");
console.log(JSON.stringify({ candidates: 0, passingKeys, fidelityAudit: "skipped-no-candidates", portfolioAudit: "skipped-no-candidates", output }, null, 2));
