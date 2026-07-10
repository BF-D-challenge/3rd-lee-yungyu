#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const TYPES = ["pages", "sections", "tokens", "examples"];

function parseArgs(argv) {
  const options = {
    corpus: "docs/research/material-design-3",
    retry: "docs/research/material-design-3/retry",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--corpus") options.corpus = argv[++index];
    else if (argument === "--retry") options.retry = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function parseJsonl(contents, filePath) {
  return contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1}: ${error.message}`);
      }
    });
}

async function readJsonl(filePath) {
  return parseJsonl(await readFile(filePath, "utf8"), filePath);
}

async function writeJsonlAtomic(filePath, records) {
  const temporaryPath = `${filePath}.tmp`;
  const contents = records.length
    ? `${records.map((record) => JSON.stringify(record)).join("\n")}\n`
    : "";
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, filePath);
}

function compareRecords(left, right) {
  const leftKey = [left.url, left.page_id, left.source_url, left.index, left.id]
    .filter((value) => value !== null && value !== undefined)
    .join("\u0000");
  const rightKey = [right.url, right.page_id, right.source_url, right.index, right.id]
    .filter((value) => value !== null && value !== undefined)
    .join("\u0000");
  return leftKey.localeCompare(rightKey, "en");
}

function assertUniqueIds(records, label) {
  const ids = new Set();
  for (const record of records) {
    if (!record.id) throw new Error(`${label}: record is missing id`);
    if (ids.has(record.id)) throw new Error(`${label}: duplicate id ${record.id}`);
    ids.add(record.id);
  }
}

export async function applyRetry({ corpus, retry }) {
  const retryByType = new Map();
  for (const type of TYPES) {
    retryByType.set(type, await readJsonl(path.join(retry, `${type}.jsonl`)));
  }

  const retryPages = retryByType.get("pages");
  if (retryPages.length === 0) throw new Error("Retry corpus contains no pages");
  const retryPageIds = new Set(retryPages.map((page) => page.id));

  const summary = { replaced_page_ids: [...retryPageIds], datasets: [] };

  for (const type of TYPES) {
    const targetPath = path.join(corpus, `${type}.jsonl`);
    const target = await readJsonl(targetPath);
    const retryRecords = retryByType.get(type);
    const retained = type === "pages"
      ? target.filter((record) => !retryPageIds.has(record.id))
      : target.filter((record) => !retryPageIds.has(record.page_id));
    const merged = [...retained, ...retryRecords].sort(compareRecords);

    assertUniqueIds(merged, type);
    await writeJsonlAtomic(targetPath, merged);
    summary.datasets.push({
      type,
      before: target.length,
      removed: target.length - retained.length,
      added: retryRecords.length,
      after: merged.length,
    });
  }

  return summary;
}

try {
  const summary = await applyRetry(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
}
