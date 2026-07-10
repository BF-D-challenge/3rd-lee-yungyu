#!/usr/bin/env node

import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RECORD_TYPES = ["pages", "sections", "tokens", "examples"];

function parseArgs(argv) {
  const args = {
    inputDir: "docs/research/material-design-3/shards",
    outputDir: "docs/research/material-design-3",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input-dir") args.inputDir = argv[++index];
    else if (value === "--output-dir") args.outputDir = argv[++index];
    else if (value === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${value}`);
  }

  return args;
}

function usage() {
  return [
    "Usage: node scripts/material-design-3/merge-shards.mjs [options]",
    "",
    "Options:",
    "  --input-dir <path>   Shard directory",
    "  --output-dir <path>  Corpus output directory",
  ].join("\n");
}

function parseJsonl(contents, sourcePath) {
  return contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${sourcePath}:${index + 1}: ${error.message}`);
      }
    });
}

function stableRecord(record) {
  return JSON.stringify(record);
}

function compareRecords(left, right) {
  const leftKey = [left.url, left.page_id, left.source_url, left.id]
    .filter(Boolean)
    .join("\u0000");
  const rightKey = [right.url, right.page_id, right.source_url, right.id]
    .filter(Boolean)
    .join("\u0000");
  return leftKey.localeCompare(rightKey, "en");
}

async function writeAtomic(filePath, contents) {
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, filePath);
}

async function mergeType(inputDir, outputDir, type, fileNames) {
  const suffixPattern = new RegExp(`^${type}-.+\\.jsonl$`, "u");
  const shardNames = fileNames.filter((name) => suffixPattern.test(name)).sort();
  const recordsById = new Map();
  const provenanceById = new Map();

  for (const shardName of shardNames) {
    const shardPath = path.join(inputDir, shardName);
    const records = parseJsonl(await readFile(shardPath, "utf8"), shardPath);

    for (const record of records) {
      if (!record.id || typeof record.id !== "string") {
        throw new Error(`${shardPath}: record is missing a string id`);
      }

      const existing = recordsById.get(record.id);
      if (existing && stableRecord(existing) !== stableRecord(record)) {
        throw new Error(
          `Conflicting id ${record.id} in ${provenanceById.get(record.id)} and ${shardPath}`,
        );
      }

      recordsById.set(record.id, record);
      provenanceById.set(record.id, shardPath);
    }
  }

  const records = [...recordsById.values()].sort(compareRecords);
  const outputPath = path.join(outputDir, `${type}.jsonl`);
  const contents = records.length > 0 ? `${records.map(stableRecord).join("\n")}\n` : "";
  await writeAtomic(outputPath, contents);

  return {
    type,
    shard_count: shardNames.length,
    row_count: records.length,
    output_path: outputPath,
  };
}

export async function mergeShards({ inputDir, outputDir }) {
  await mkdir(outputDir, { recursive: true });
  const fileNames = await readdir(inputDir);
  const datasets = [];

  for (const type of RECORD_TYPES) {
    datasets.push(await mergeType(inputDir, outputDir, type, fileNames));
  }

  const summary = {
    generated_at: new Date().toISOString(),
    input_dir: inputDir,
    output_dir: outputDir,
    datasets,
  };
  await writeAtomic(
    path.join(outputDir, "crawl-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  return summary;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    const summary = await mergeShards(args);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exit(1);
  }
}
