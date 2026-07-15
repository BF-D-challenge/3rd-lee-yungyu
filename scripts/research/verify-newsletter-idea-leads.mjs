import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LEADS_PATH = path.join(ROOT, "docs/research/newsletter-leads/newsletter-leads.jsonl");
const LEDGER_PATH = path.join(ROOT, "docs/research/idea-source-final-ledger.jsonl");

function readJsonl(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${path.relative(ROOT, file)}:${index + 1} is not valid JSON: ${error.message}`);
      }
    });
}

const leads = readJsonl(LEADS_PATH);
const sourceKeys = new Set(readJsonl(LEDGER_PATH).map((row) => row.key));
const allowedDispositions = new Set(["Hold", "Merge", "Fail"]);
const allowedRelations = new Set([
  "exact_8406_match",
  "related_8406_mechanism",
  "portfolio_merge",
  "unmatched",
  "non_product",
]);
const allowedEvidence = new Set([
  "newsletter_only",
  "listing_only",
  "primary_source_linked",
  "primary_source_verified",
  "non_product",
]);
const ids = new Set();
const errors = [];

for (const [index, lead] of leads.entries()) {
  const label = `lead ${index + 1}`;
  if (!/^newsletter:[a-z0-9-]+:[a-z0-9-]+$/.test(lead.lead_id || "")) {
    errors.push(`${label}: invalid lead_id`);
  }
  if (ids.has(lead.lead_id)) errors.push(`${label}: duplicate lead_id ${lead.lead_id}`);
  ids.add(lead.lead_id);
  if (lead.queue_scope !== "external_newsletter_lead") errors.push(`${label}: queue_scope must stay external`);
  if (lead.denominator_effect !== 0) errors.push(`${label}: denominator_effect must be 0`);
  if (!allowedDispositions.has(lead.preliminary?.disposition)) {
    errors.push(`${label}: Candidate or an unknown disposition is not allowed in newsletter intake`);
  }
  if (!lead.preliminary?.next_action) errors.push(`${label}: missing next_action`);
  if (!allowedRelations.has(lead.corpus_link?.relation)) errors.push(`${label}: invalid corpus relation`);
  if (!allowedEvidence.has(lead.evidence_status)) errors.push(`${label}: invalid evidence_status`);
  if (!lead.newsletter?.article_url || !lead.newsletter?.publisher_url) errors.push(`${label}: missing newsletter source URL`);

  const canonical = lead.corpus_link?.canonical_source_key;
  const comparison = lead.corpus_link?.comparison_source_key;
  if (canonical && !sourceKeys.has(canonical)) errors.push(`${label}: unknown canonical_source_key ${canonical}`);
  if (comparison && !sourceKeys.has(comparison)) errors.push(`${label}: unknown comparison_source_key ${comparison}`);
  if (canonical && lead.corpus_link?.relation !== "exact_8406_match") {
    errors.push(`${label}: canonical_source_key requires exact_8406_match`);
  }
  if (lead.corpus_link?.relation === "exact_8406_match" && !canonical) {
    errors.push(`${label}: exact_8406_match requires canonical_source_key`);
  }
  if (lead.corpus_link?.relation === "portfolio_merge" && !lead.corpus_link?.portfolio_target_id) {
    errors.push(`${label}: portfolio_merge requires portfolio_target_id`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

const counts = Object.fromEntries([...allowedDispositions]
  .map((disposition) => [disposition, leads.filter((lead) => lead.preliminary.disposition === disposition).length]));
process.stdout.write(`${JSON.stringify({
  leads: leads.length,
  denominatorEffect: leads.reduce((sum, lead) => sum + lead.denominator_effect, 0),
  dispositions: counts,
  status: "ok",
}, null, 2)}\n`);
