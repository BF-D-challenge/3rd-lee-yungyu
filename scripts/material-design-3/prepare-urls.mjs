#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildUrlCatalog, summarizeUrlCatalog } from "./lib/catalog.mjs";
import { writeJson, writeJsonl } from "./lib/jsonl.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");

function parseArguments(arguments_) {
  const options = {
    input: resolve(REPO_ROOT, ".firecrawl/m3-material-map.json"),
    output: resolve(REPO_ROOT, "docs/research/material-design-3/urls.jsonl"),
    summary: resolve(REPO_ROOT, "docs/research/material-design-3/url-summary.json"),
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--help") {
      console.log(
        "Usage: node scripts/material-design-3/prepare-urls.mjs [--input PATH] [--output PATH] [--summary PATH]",
      );
      process.exit(0);
    }

    if (!["--input", "--output", "--summary"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}`);
    }
    options[argument.slice(2)] = resolve(process.cwd(), value);
    index += 1;
  }

  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const source = JSON.parse(await readFile(options.input, "utf8"));

  if (source?.success !== true || !Array.isArray(source?.data?.links)) {
    throw new Error("Expected a successful map response with data.links");
  }

  const records = buildUrlCatalog(source.data.links);
  if (source.data.links.length === 405 && records.length !== 403) {
    throw new Error(
      `Expected 403 canonical records from 405 links, received ${records.length}`,
    );
  }

  const summary = summarizeUrlCatalog(source.data.links.length, records);
  await writeJsonl(options.output, records);
  await writeJson(options.summary, summary);

  console.log(
    `Prepared ${summary.canonical_records} canonical URLs from ${summary.input_links} links (${summary.duplicates_removed} duplicates removed).`,
  );
  console.log(`Catalog: ${options.output}`);
  console.log(`Summary: ${options.summary}`);
}

main().catch((error) => {
  console.error(`prepare-urls: ${error.message}`);
  process.exitCode = 1;
});
