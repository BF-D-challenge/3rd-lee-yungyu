#!/usr/bin/env node

import { constants } from "node:fs";
import { access, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalizeMaterialUrl } from "./lib/catalog.mjs";
import { readJsonl } from "./lib/jsonl.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const COMPLETED_STATUSES = new Set(["complete", "completed", "done", "success"]);
const PAGE_CONTENT_FIELDS = ["markdown", "content", "text", "body", "raw_markdown"];
const PAGE_TYPES = new Set([
  "blog",
  "component_tab",
  "develop",
  "foundation",
  "index",
  "style",
  "utility",
]);

const FILE_DEFINITIONS = [
  {
    name: "urls",
    required: true,
    requiredKeys: [
      "id",
      "url",
      "title",
      "description",
      "category",
      "page_type",
      "component",
      "tab",
      "status",
    ],
    requiredValues: ["id", "url", "category", "page_type", "status"],
  },
  {
    name: "pages",
    required: false,
    requiredKeys: ["id", "url_id", "url", "title", "status"],
    requiredValues: ["id", "url_id", "url", "status"],
  },
  {
    name: "sections",
    required: false,
    requiredKeys: ["id", "page_id"],
    requiredValues: ["id", "page_id"],
  },
  {
    name: "tokens",
    required: false,
    requiredKeys: ["id", "page_id"],
    requiredValues: ["id", "page_id"],
    requiredAny: [
      ["name", "token_name"],
      ["value", "token_value"],
    ],
  },
  {
    name: "examples",
    required: false,
    requiredKeys: ["id", "page_id"],
    requiredValues: ["id", "page_id"],
    requiredAny: [
      [
        "title",
        "name",
        "description",
        "content",
        "text",
        "markdown",
        "code",
        "media_url",
        "image_url",
        "alt",
        "caption",
      ],
    ],
  },
];

const REFERENCES = {
  pages: [
    ["url_id", "urls"],
    ["source_url_id", "urls"],
  ],
  sections: [
    ["page_id", "pages"],
    ["parent_page_id", "pages"],
    ["url_id", "urls"],
  ],
  tokens: [
    ["page_id", "pages"],
    ["section_id", "sections"],
    ["url_id", "urls"],
  ],
  examples: [
    ["page_id", "pages"],
    ["section_id", "sections"],
    ["url_id", "urls"],
  ],
};

const MANIFEST_COUNT_FIELDS = [
  "rows",
  "count",
  "records",
  "record_count",
  "line_count",
  "total",
];

function parseArguments(arguments_) {
  const options = {
    corpus: resolve(REPO_ROOT, "docs/research/material-design-3"),
    manifests: [],
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--help") {
      console.log(
        "Usage: node scripts/material-design-3/validate-corpus.mjs [--corpus DIR] [--manifest PATH]",
      );
      process.exit(0);
    }

    if (!["--corpus", "--manifest"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    const value = arguments_[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}`);
    }

    if (argument === "--corpus") {
      options.corpus = resolve(process.cwd(), value);
    } else {
      options.manifests.push(resolve(process.cwd(), value));
    }
    index += 1;
  }

  return options;
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function displayPath(filePath) {
  const repoRelative = relative(REPO_ROOT, filePath);
  return repoRelative.startsWith("..") ? filePath : repoRelative;
}

function hasOwn(record, field) {
  return Object.prototype.hasOwnProperty.call(record, field);
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function validateRequiredFields(definition, entry, errors) {
  const { line, value } = entry;

  for (const field of definition.requiredKeys) {
    if (!hasOwn(value, field)) {
      errors.push(`${definition.name}.jsonl:${line}: missing required field ${field}`);
    }
  }

  for (const field of definition.requiredValues) {
    if (hasOwn(value, field) && !hasValue(value[field])) {
      errors.push(`${definition.name}.jsonl:${line}: required field ${field} is empty`);
    }
  }

  for (const alternatives of definition.requiredAny ?? []) {
    if (!alternatives.some((field) => hasOwn(value, field) && hasValue(value[field]))) {
      errors.push(
        `${definition.name}.jsonl:${line}: requires one non-empty field from ${alternatives.join(", ")}`,
      );
    }
  }
}

function validateUrlRecord(entry, errors) {
  const { line, value } = entry;
  if (!hasValue(value.url)) return;

  try {
    const canonicalUrl = canonicalizeMaterialUrl(value.url);
    if (canonicalUrl !== value.url) {
      errors.push(`urls.jsonl:${line}: URL is not canonical: ${value.url}`);
    }
  } catch (error) {
    errors.push(`urls.jsonl:${line}: ${error.message}`);
  }

  if (hasValue(value.page_type) && !PAGE_TYPES.has(value.page_type)) {
    errors.push(`urls.jsonl:${line}: unsupported page_type ${value.page_type}`);
  }
}

function validateCompletedPage(entry, errors) {
  const { line, value } = entry;
  const status = typeof value.status === "string" ? value.status.toLowerCase() : "";
  if (!COMPLETED_STATUSES.has(status)) return;

  const hasContent = PAGE_CONTENT_FIELDS.some(
    (field) => hasOwn(value, field) && hasValue(value[field]),
  );
  if (!hasContent) {
    errors.push(`pages.jsonl:${line}: completed page has no content`);
  }
}

function validateDuplicates(recordsByName, errors) {
  const ids = new Map();

  for (const [name, entries] of recordsByName) {
    const urls = new Map();

    for (const entry of entries) {
      const { line, value } = entry;
      if (hasValue(value.id)) {
        const location = `${name}.jsonl:${line}`;
        const firstLocation = ids.get(value.id);
        if (firstLocation) {
          errors.push(`${location}: duplicate id ${value.id}; first seen at ${firstLocation}`);
        } else {
          ids.set(value.id, location);
        }
      }

      if (!hasValue(value.url)) continue;

      let normalizedUrl = value.url.trim();
      if (name === "urls") {
        try {
          normalizedUrl = canonicalizeMaterialUrl(normalizedUrl);
        } catch {
          continue;
        }
      }

      const firstLine = urls.get(normalizedUrl);
      if (firstLine) {
        errors.push(
          `${name}.jsonl:${line}: duplicate URL ${normalizedUrl}; first seen at line ${firstLine}`,
        );
      } else {
        urls.set(normalizedUrl, line);
      }
    }
  }
}

function referenceValues(value) {
  return Array.isArray(value) ? value : [value];
}

function validateReferences(recordsByName, errors) {
  const idsByName = new Map(
    [...recordsByName].map(([name, entries]) => [
      name,
      new Set(entries.map(({ value }) => value.id).filter(hasValue)),
    ]),
  );

  for (const [name, references] of Object.entries(REFERENCES)) {
    for (const entry of recordsByName.get(name) ?? []) {
      for (const [field, targetName] of references) {
        if (!hasOwn(entry.value, field) || !hasValue(entry.value[field])) continue;

        for (const reference of referenceValues(entry.value[field])) {
          if (!hasValue(reference)) continue;
          if (!idsByName.get(targetName)?.has(reference)) {
            errors.push(
              `${name}.jsonl:${entry.line}: orphan ${field} ${reference}; not found in ${targetName}.jsonl`,
            );
          }
        }
      }
    }
  }
}

function validateSectionContent(recordsByName, errors) {
  const referencedSectionIds = new Set();

  for (const name of ["tokens", "examples"]) {
    for (const { value } of recordsByName.get(name) ?? []) {
      if (hasValue(value.section_id)) referencedSectionIds.add(value.section_id);
    }
  }

  for (const entry of recordsByName.get("sections") ?? []) {
    const { line, value } = entry;
    const hasSearchableContent = [
      "heading",
      "title",
      "content",
      "text",
      "markdown",
      "links",
    ].some((field) => hasOwn(value, field) && hasValue(value[field]));
    const groupsExamples = hasValue(value.id) && referencedSectionIds.has(value.id);

    if (!hasSearchableContent && !groupsExamples) {
      errors.push(
        `sections.jsonl:${line}: section has no searchable content or referenced child records`,
      );
    }
  }
}

function matchCorpusFile(pathValue, manifestPath, filesByName) {
  const candidates = isAbsolute(pathValue)
    ? [resolve(pathValue)]
    : [resolve(dirname(manifestPath), pathValue), resolve(REPO_ROOT, pathValue)];

  for (const [name, file] of filesByName) {
    if (candidates.includes(file.path)) return name;
  }

  return null;
}

function numericCountFromObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  for (const field of MANIFEST_COUNT_FIELDS) {
    if (Number.isInteger(value[field]) && value[field] >= 0) return value[field];
  }
  return null;
}

function datasetNameFromKey(key, filesByName) {
  const normalized = key.endsWith(".jsonl") ? key.slice(0, -6) : key;
  return filesByName.has(normalized) ? normalized : null;
}

function datasetNameFromCountField(field, filesByName) {
  if (["canonical_records", "expected_canonical_urls"].includes(field)) return "urls";

  for (const name of filesByName.keys()) {
    if (
      [
        `${name}_count`,
        `${name}_rows`,
        `expected_${name}`,
        `expected_${name}_count`,
        `expected_${name}_rows`,
      ].includes(field)
    ) {
      return name;
    }
  }

  return null;
}

function collectManifestCounts(manifest, manifestPath, filesByName) {
  const expectations = [];
  const seen = new Set();

  function add(name, count, location) {
    const key = `${name}:${count}:${location}`;
    if (seen.has(key)) return;
    seen.add(key);
    expectations.push({ name, count, location });
  }

  function walk(value, location) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${location}[${index}]`));
      return;
    }

    if (!value || typeof value !== "object") return;

    if (typeof value.path === "string") {
      const name = matchCorpusFile(value.path, manifestPath, filesByName);
      const count = numericCountFromObject(value);
      if (name && count !== null) add(name, count, location);
    }

    for (const [key, child] of Object.entries(value)) {
      if (Number.isInteger(child) && child >= 0) {
        const name = datasetNameFromCountField(key, filesByName);
        if (name) add(name, child, `${location}.${key}`);
      }

      if (["counts", "row_counts", "record_counts", "files"].includes(key)) {
        if (child && typeof child === "object" && !Array.isArray(child)) {
          for (const [datasetKey, datasetValue] of Object.entries(child)) {
            const name = datasetNameFromKey(datasetKey, filesByName);
            const count =
              typeof datasetValue === "number"
                ? datasetValue
                : numericCountFromObject(datasetValue);
            if (name && Number.isInteger(count) && count >= 0) {
              add(name, count, `${location}.${key}.${datasetKey}`);
            }
          }
        }
      }
      walk(child, `${location}.${key}`);
    }
  }

  walk(manifest, "manifest");
  return expectations;
}

async function validateManifests(manifestPaths, filesByName, errors, notes) {
  let existingManifestCount = 0;
  let expectationCount = 0;
  const seenManifestPaths = new Set();

  for (const candidatePath of manifestPaths) {
    if (!(await exists(candidatePath))) continue;
    const manifestPath = await realpath(candidatePath);
    if (seenManifestPaths.has(manifestPath)) continue;
    seenManifestPaths.add(manifestPath);
    existingManifestCount += 1;

    let manifest;
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (error) {
      errors.push(`${displayPath(manifestPath)}: invalid manifest JSON: ${error.message}`);
      continue;
    }

    const expectations = collectManifestCounts(manifest, manifestPath, filesByName);
    expectationCount += expectations.length;

    for (const expectation of expectations) {
      const file = filesByName.get(expectation.name);
      const actualCount = file.present ? file.entries.length : 0;
      if (actualCount !== expectation.count) {
        errors.push(
          `${displayPath(manifestPath)}:${expectation.location}: ${expectation.name}.jsonl count is ${expectation.count}, actual ${actualCount}`,
        );
      }
    }
  }

  if (existingManifestCount === 0) {
    notes.push("[missing] manifest (optional)");
  } else if (expectationCount === 0) {
    notes.push("[info] manifest has no counts for Material Design 3 corpus files");
  } else {
    notes.push(`[ok] manifest counts checked: ${expectationCount}`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const errors = [];
  const notes = [];
  const recordsByName = new Map();
  const filesByName = new Map();

  for (const definition of FILE_DEFINITIONS) {
    const path = resolve(options.corpus, `${definition.name}.jsonl`);
    const present = await exists(path);
    const file = { path, present, entries: [] };
    filesByName.set(definition.name, file);

    if (!present) {
      if (definition.required) {
        errors.push(`${displayPath(path)}: required file is missing`);
      } else {
        notes.push(`[missing] ${definition.name}.jsonl (optional)`);
      }
      recordsByName.set(definition.name, []);
      continue;
    }

    const result = await readJsonl(path);
    file.entries = result.entries;
    recordsByName.set(definition.name, result.entries);
    notes.push(`[ok] ${definition.name}.jsonl: ${result.entries.length} records`);

    for (const error of result.errors) {
      errors.push(`${definition.name}.jsonl:${error}`);
    }

    for (const entry of result.entries) {
      validateRequiredFields(definition, entry, errors);
      if (definition.name === "urls") validateUrlRecord(entry, errors);
      if (definition.name === "pages") validateCompletedPage(entry, errors);
    }
  }

  validateDuplicates(recordsByName, errors);
  validateReferences(recordsByName, errors);
  validateSectionContent(recordsByName, errors);

  const defaultManifests = [
    resolve(options.corpus, "manifest.json"),
    resolve(options.corpus, "MANIFEST.json"),
    resolve(REPO_ROOT, "docs/research/MANIFEST.json"),
  ];
  const manifestPaths = [
    ...new Set(options.manifests.length ? options.manifests : defaultManifests),
  ];
  await validateManifests(manifestPaths, filesByName, errors, notes);

  console.log(`Material Design 3 corpus: ${displayPath(options.corpus)}`);
  notes.forEach((note) => console.log(note));

  if (errors.length > 0) {
    errors.forEach((error) => console.error(`[error] ${error}`));
    console.error(`Validation failed with ${errors.length} error(s).`);
    process.exitCode = 1;
    return;
  }

  const totalRecords = [...recordsByName.values()].reduce(
    (total, entries) => total + entries.length,
    0,
  );
  console.log(`Validation passed: ${totalRecords} records, 0 errors.`);
}

main().catch((error) => {
  console.error(`validate-corpus: ${error.message}`);
  process.exitCode = 1;
});
