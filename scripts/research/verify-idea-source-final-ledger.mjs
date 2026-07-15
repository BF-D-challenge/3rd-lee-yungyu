import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LEDGER_PATH = path.join(
  ROOT,
  "docs/research/idea-source-final-ledger.jsonl",
);
const DECISION_DIR = path.join(
  ROOT,
  "docs/research/idea-source-batch-decisions",
);
const AUDIT_DIR = path.join(ROOT, "docs/research/idea-source-batch-audits");
const rows = fs
  .readFileSync(LEDGER_PATH, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const validDecisions = new Set([
  "Existing",
  "Candidate",
  "Merge",
  "Reserve",
  "Fail",
]);
const validStates = new Set([
  "pending",
  "imported_needs_normalization",
  "finalized",
]);
const expectedBatchIds = Array.from(
  { length: 85 },
  (_, index) => `EXH-${String(index + 1).padStart(3, "0")}`,
);
const keys = rows.map((row) => row.key);
const duplicateKeys = [
  ...new Set(keys.filter((key, index) => keys.indexOf(key) !== index)),
];
const invalidStates = rows
  .filter((row) => !validStates.has(row.review_state))
  .map((row) => row.key);
const invalidFinalDecisions = rows
  .filter(
    (row) =>
      row.review_state === "finalized" && !validDecisions.has(row.decision),
  )
  .map((row) => row.key);

function substantiveSentence(value) {
  const text = String(value || "")
    .replace(/^\s*[^:]+:\s*/, "")
    .replace(/[.。!?\s]/g, "");
  return (
    text.length >= 4 && !/^(없음|미상|불명|n\/a|null|unknown)$/i.test(text)
  );
}

function readJsonl(file) {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function countsByDecision(decisions) {
  return decisions.reduce((counts, row) => {
    counts[row.decision] = (counts[row.decision] || 0) + 1;
    return counts;
  }, {});
}

function normalizedCounts(counts) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(counts || {}).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
}

const auditByBatch = new Map(
  fs.existsSync(AUDIT_DIR)
    ? fs
        .readdirSync(AUDIT_DIR)
        .filter((name) => name.endsWith(".json"))
        .map((name) =>
          JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, name), "utf8")),
        )
        .map((audit) => [audit.batch_id, audit])
    : [],
);
const decisionRowsByBatch = new Map();
if (fs.existsSync(DECISION_DIR)) {
  for (const name of fs
    .readdirSync(DECISION_DIR)
    .filter((file) => file.endsWith(".jsonl"))) {
    const batchId = path.basename(name, ".jsonl");
    const decisions = readJsonl(path.join(DECISION_DIR, name));
    if (decisions.some((row) => row.batch_id !== batchId)) {
      throw new Error(`${name}: a row batch_id does not match its filename`);
    }
    decisionRowsByBatch.set(batchId, decisions);
  }
}
const incompleteBatchDecisionRows = [...decisionRowsByBatch.values()]
  .flat()
  .filter((row) => {
    const sentences = row.five_sentences || {};
    return (
      !row.decision_reason ||
      !row.reviewed_at ||
      ["input", "process", "immediate_result", "need_moment", "advantage"].some(
        (field) => !substantiveSentence(sentences[field]),
      )
    );
  })
  .map((row) => row.key);

const incompleteFinalRows = rows
  .filter((row) => {
    if (row.review_state !== "finalized") return false;
    const sentences = row.five_sentences || {};
    return (
      !row.decision_reason ||
      !row.reviewed_at ||
      ["input", "process", "immediate_result", "need_moment", "advantage"].some(
        (field) => !substantiveSentence(sentences[field]),
      )
    );
  })
  .map((row) => row.key);
const finalizedCounts = rows
  .filter((row) => row.review_state === "finalized")
  .reduce((counts, row) => {
    counts[row.decision] = (counts[row.decision] || 0) + 1;
    return counts;
  }, {});

const errors = [];
if (rows.length !== 8406) errors.push(`expected 8406 rows, got ${rows.length}`);
if (duplicateKeys.length)
  errors.push(`duplicate keys: ${duplicateKeys.slice(0, 10).join(", ")}`);
if (invalidStates.length)
  errors.push(
    `invalid review states: ${invalidStates.slice(0, 10).join(", ")}`,
  );
if (invalidFinalDecisions.length)
  errors.push(
    `invalid final decisions: ${invalidFinalDecisions.slice(0, 10).join(", ")}`,
  );
if (incompleteFinalRows.length)
  errors.push(
    `incomplete finalized rows: ${incompleteFinalRows.slice(0, 10).join(", ")}`,
  );
if (incompleteBatchDecisionRows.length)
  errors.push(
    `incomplete batch decision evidence: ${incompleteBatchDecisionRows.slice(0, 10).join(", ")}`,
  );
const ledgerBatchIds = [...new Set(rows.map((row) => row.batch_id))].sort();
const missingLedgerBatches = expectedBatchIds.filter(
  (batchId) => !ledgerBatchIds.includes(batchId),
);
const unexpectedLedgerBatches = ledgerBatchIds.filter(
  (batchId) => !expectedBatchIds.includes(batchId),
);
const missingAudits = expectedBatchIds.filter(
  (batchId) => !auditByBatch.has(batchId),
);
const unexpectedAudits = [...auditByBatch.keys()].filter(
  (batchId) => !expectedBatchIds.includes(batchId),
);
if (missingLedgerBatches.length)
  errors.push(`missing ledger batches: ${missingLedgerBatches.join(", ")}`);
if (unexpectedLedgerBatches.length)
  errors.push(
    `unexpected ledger batches: ${unexpectedLedgerBatches.join(", ")}`,
  );
if (missingAudits.length)
  errors.push(`missing batch audits: ${missingAudits.join(", ")}`);
if (unexpectedAudits.length)
  errors.push(`unexpected batch audits: ${unexpectedAudits.join(", ")}`);

const shadowAuditSummary = [];
for (const batchId of expectedBatchIds) {
  const audit = auditByBatch.get(batchId);
  if (!audit) continue;
  if (audit.status !== "passed") {
    errors.push(`${batchId}: audit status must be passed`);
    continue;
  }

  const rounds = Array.isArray(audit.rounds) ? audit.rounds : [];
  const finalRound = rounds.at(-1);
  if (!finalRound) {
    errors.push(`${batchId}: missing Fail shadow-audit round`);
    continue;
  }

  const failCount = Number(finalRound.fail_count);
  const sampleCount = Number(
    finalRound.sample_count ??
      (Array.isArray(finalRound.sample) ? finalRound.sample.length : NaN),
  );
  const falseRejectRate = Number(
    audit.final_false_reject_rate ?? finalRound.false_reject_rate,
  );
  if (!Number.isFinite(failCount) || failCount < 0) {
    errors.push(`${batchId}: invalid final Fail count`);
    continue;
  }
  const requiredSampleCount = failCount > 0 ? Math.ceil(failCount * 0.1) : 0;
  if (!Number.isFinite(sampleCount) || sampleCount < requiredSampleCount) {
    errors.push(
      `${batchId}: Fail shadow sample ${sampleCount} is below required 10% sample ${requiredSampleCount}`,
    );
  }
  if (!Number.isFinite(falseRejectRate) || falseRejectRate >= 0.05) {
    errors.push(
      `${batchId}: final false-reject rate must be below 5%, got ${falseRejectRate}`,
    );
  }

  const batchRowCount = rows.filter((row) => row.batch_id === batchId).length;
  if (
    audit.source_rows !== undefined &&
    Number(audit.source_rows) !== batchRowCount
  ) {
    errors.push(`${batchId}: audit source_rows mismatch`);
  }
  shadowAuditSummary.push({
    batchId,
    failCount,
    sampleCount,
    requiredSampleCount,
    falseRejectRate,
  });
}
for (const [batchId, decisions] of decisionRowsByBatch) {
  const audit = auditByBatch.get(batchId);
  if (!audit || audit.status !== "passed") {
    errors.push(`${batchId}: decision file exists without a passed audit`);
    continue;
  }
  const batchRows = rows.filter((row) => row.batch_id === batchId);
  const batchKeys = new Set(batchRows.map((row) => row.key));
  const decisionKeys = new Set(decisions.map((row) => row.key));
  const unexpected = [...decisionKeys].filter((key) => !batchKeys.has(key));
  const appCoveredKeys = new Set(
    batchRows
      .filter(
        (row) =>
          Array.isArray(row.matched_scenario_ids) &&
          row.matched_scenario_ids.length > 0,
      )
      .map((row) => row.key),
  );
  const missing = [...batchKeys].filter(
    (key) => !appCoveredKeys.has(key) && !decisionKeys.has(key),
  );
  if (unexpected.length)
    errors.push(
      `${batchId}: decisions outside batch: ${unexpected.slice(0, 5).join(", ")}`,
    );
  if (missing.length)
    errors.push(
      `${batchId}: non-app sources missing decisions: ${missing.slice(0, 5).join(", ")}`,
    );
  if (
    audit.source_rows !== undefined &&
    Number(audit.source_rows) !== batchRows.length
  )
    errors.push(`${batchId}: audit source_rows mismatch`);
  if (
    audit.decision_rows !== undefined &&
    Number(audit.decision_rows) !== decisions.length
  )
    errors.push(`${batchId}: audit decision_rows mismatch`);
  if (
    audit.decision_counts !== undefined &&
    normalizedCounts(audit.decision_counts) !==
      normalizedCounts(countsByDecision(decisions))
  ) {
    errors.push(`${batchId}: audit decision_counts mismatch`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      rows: rows.length,
      uniqueKeys: new Set(keys).size,
      finalized: rows.filter((row) => row.review_state === "finalized").length,
      importedNeedsNormalization: rows.filter(
        (row) => row.review_state === "imported_needs_normalization",
      ).length,
      pending: rows.filter((row) => row.review_state === "pending").length,
      finalizedCounts,
      batchAudits: shadowAuditSummary.length,
      shadowSampled: shadowAuditSummary.reduce(
        (total, audit) => total + audit.sampleCount,
        0,
      ),
      maxFinalFalseRejectRate: Math.max(
        ...shadowAuditSummary.map((audit) => audit.falseRejectRate),
      ),
      status: "ok",
    },
    null,
    2,
  )}\n`,
);
