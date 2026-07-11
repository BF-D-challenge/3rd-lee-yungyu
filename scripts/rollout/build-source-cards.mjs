import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "../..");
const batchDir = path.join(scriptDir, "source-card-batches");
const outputPath = path.join(rootDir, "public/data/source-cards.json");

const combos = JSON.parse(await readFile(path.join(rootDir, "src/data/combos.json"), "utf8"));
const sourceRows = (await readFile(
  path.join(rootDir, "docs/research/trustmrr-acquire/ideas.jsonl"),
  "utf8",
))
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
const sourceById = new Map(sourceRows.map((row) => [row.id, row]));
const auditDir = path.join(rootDir, "docs/research/trustmrr-acquire/audits");
const auditFiles = (await readdir(auditDir))
  .filter((file) => /^top100-idea-audit-\d{3}-\d{3}\.json$/.test(file))
  .sort();
const auditEntries = (
  await Promise.all(
    auditFiles.map(async (file) => JSON.parse(await readFile(path.join(auditDir, file), "utf8"))),
  )
).flatMap((file) => file.audits);
const detailOverrides = JSON.parse(
  await readFile(path.join(auditDir, "top100-detail-overrides.json"), "utf8"),
).audits;
const sourceAuditById = new Map(
  [...auditEntries, ...detailOverrides].map((audit) => [audit.id, audit]),
);

const batchFiles = (await readdir(batchDir))
  .filter((file) => /^batch-[a-z]\.json$/.test(file))
  .sort();
const cards = (
  await Promise.all(
    batchFiles.map(async (file) => JSON.parse(await readFile(path.join(batchDir, file), "utf8"))),
  )
).flat();

const errors = [];
const cardKeys = new Set();
const sourceIds = new Set();
const allowedAudiences = new Set(["b2b", "b2c"]);
const allowedPlatforms = new Set(["web", "app", "plugin"]);
const allowedProductTypes = new Set(["ai-agent", "automation", "dashboard", "analyzer", "utility"]);
const allowedPreserved = new Set(["target", "problem", "input", "process", "output"]);
const vagueTitle = /^(?:AI|인공지능|모바일|건강|피트니스|업무)?\s*(?:앱|도구|서비스|플랫폼)$/i;

for (const [index, card] of cards.entries()) {
  const label = `card ${index + 1} (${card.appName ?? card.title ?? "untitled"})`;
  const key = `${card.seed}|${card.pain}|${card.format}`;
  if (cardKeys.has(key)) errors.push(`${label}: duplicate card key ${key}`);
  cardKeys.add(key);

  const allow = combos.allow[card.seed];
  if (!allow) {
    errors.push(`${label}: seed is not in combos.allow`);
  } else {
    const pairAllowed = Array.isArray(allow.pairs) && allow.pairs.length
      ? allow.pairs.some((pair) => pair.pain === card.pain && pair.format === card.format)
      : allow.pains.includes(card.pain) && allow.formats.includes(card.format);
    if (!pairAllowed) errors.push(`${label}: disallowed pain/format pair ${card.pain}|${card.format}`);
  }

  const source = sourceById.get(card.sourceRecordId);
  if (!source) {
    errors.push(`${label}: unknown sourceRecordId ${card.sourceRecordId}`);
  } else {
    if (sourceIds.has(source.id)) errors.push(`${label}: duplicate source ${source.id}`);
    sourceIds.add(source.id);
    if (source.name !== card.anchorName) errors.push(`${label}: anchorName does not match source`);
    if (source.url !== card.sourceUrl) errors.push(`${label}: sourceUrl does not match source`);
    if (source.raw_description !== card.sourceDescription) {
      errors.push(`${label}: sourceDescription must preserve raw_description exactly`);
    }
    if (!source.raw_description || source.raw_description.trim().length < 40) {
      errors.push(`${label}: source description is too vague`);
    }
    if ((source.revenue_30d_value ?? 0) <= 0) errors.push(`${label}: source has no positive revenue signal`);
  }
  const sourceAudit = sourceAuditById.get(card.sourceRecordId);
  if (!sourceAudit) {
    errors.push(`${label}: source has no idea-utility audit`);
  } else if (sourceAudit.status !== "usable") {
    errors.push(`${label}: source was excluded by idea-utility audit (${sourceAudit.reason})`);
  }

  if (card.source !== "source-fidelity-v1") errors.push(`${label}: wrong source version`);
  if (card.needSource !== "direct") errors.push(`${label}: needSource must be direct`);
  if (!Number.isInteger(card.sourceFidelityScore) || card.sourceFidelityScore <= 80 || card.sourceFidelityScore >= 100) {
    errors.push(`${label}: sourceFidelityScore must be an integer from 81 to 99`);
  }
  if (![4, 5].includes(card.specificityScore)) errors.push(`${label}: specificityScore must be 4 or 5`);
  if (!Array.isArray(card.sourcePreserved) || card.sourcePreserved.length < 4 || card.sourcePreserved.length > 5) {
    errors.push(`${label}: sourcePreserved must contain 4 or 5 axes`);
  } else if (
    new Set(card.sourcePreserved).size !== card.sourcePreserved.length ||
    card.sourcePreserved.some((axis) => !allowedPreserved.has(axis))
  ) {
    errors.push(`${label}: sourcePreserved contains duplicates or unknown axes`);
  }
  if (typeof card.adaptationChange !== "string" || card.adaptationChange.trim().length < 10) {
    errors.push(`${label}: adaptationChange is not concrete`);
  }

  for (const [field, allowed] of [
    ["audiences", allowedAudiences],
    ["platforms", allowedPlatforms],
    ["productTypes", allowedProductTypes],
  ]) {
    if (!Array.isArray(card[field]) || !card[field].length || card[field].some((value) => !allowed.has(value))) {
      errors.push(`${label}: invalid ${field}`);
    }
  }

  if (!card.mechanism || ["input", "process", "output"].some((field) => String(card.mechanism[field] ?? "").trim().length < 6)) {
    errors.push(`${label}: mechanism input/process/output must be concrete`);
  }
  if (vagueTitle.test(String(card.appName ?? "").trim())) errors.push(`${label}: vague appName`);
  if (String(card.oneliner ?? "").trim().length < 35) errors.push(`${label}: oneliner is too short`);
  if (!Array.isArray(card.mvp) || card.mvp.length !== 4) errors.push(`${label}: MVP must have exactly 4 steps`);
  if (!card.frontStory || !Array.isArray(card.frontStory.timeline) || card.frontStory.timeline.length !== 3) {
    errors.push(`${label}: frontStory must have exactly 3 timeline steps`);
  }
}

const coverage = {
  audiences: countCoverage(cards, "audiences", [...allowedAudiences]),
  platforms: countCoverage(cards, "platforms", [...allowedPlatforms]),
  productTypes: countCoverage(cards, "productTypes", [...allowedProductTypes]),
};

if (cards.length !== 20) errors.push(`expected 20 cards, found ${cards.length}`);
for (const [value, count] of Object.entries(coverage.audiences)) {
  if (count < 5) errors.push(`audience ${value} has only ${count} cards`);
}
for (const [value, count] of Object.entries(coverage.platforms)) {
  if (count < 3) errors.push(`platform ${value} has only ${count} cards`);
}
for (const [value, count] of Object.entries(coverage.productTypes)) {
  if (count < 2) errors.push(`product type ${value} has only ${count} cards`);
}
for (const audience of allowedAudiences) {
  for (const platform of allowedPlatforms) {
    for (const productType of allowedProductTypes) {
      const exactMatches = cards.filter(
        (card) =>
          card.audiences.includes(audience) &&
          card.platforms.includes(platform) &&
          card.productTypes.includes(productType),
      ).length;
      if (exactMatches < 2) {
        errors.push(`${audience}/${platform}/${productType} has only ${exactMatches} exact matches`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  await writeFile(outputPath, `${JSON.stringify(cards, null, 2)}\n`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} with ${cards.length} cards.`);
  console.log(JSON.stringify(coverage, null, 2));
}

function countCoverage(items, field, values) {
  return Object.fromEntries(
    values.map((value) => [value, items.filter((item) => item[field]?.includes(value)).length]),
  );
}
