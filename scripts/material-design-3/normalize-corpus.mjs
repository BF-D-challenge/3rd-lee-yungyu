#!/usr/bin/env node

import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildPageContent,
  createPageContentHash,
  normalizeExampleRecord,
  sectionHasPayload,
} from './browser/extract-page.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '../..')
const RECORD_TYPES = ['pages', 'sections', 'tokens', 'examples']

function parseArguments(argv) {
  const options = {
    corpus: resolve(REPO_ROOT, 'docs/research/material-design-3'),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      options.help = true
      continue
    }
    if (!['--corpus', '--corpus-dir'].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`)
    }

    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`)
    }
    options.corpus = resolve(process.cwd(), value)
    index += 1
  }

  return options
}

function usage() {
  return [
    'Usage: node scripts/material-design-3/normalize-corpus.mjs [options]',
    '',
    'Options:',
    '  --corpus <path>      Final corpus directory',
    '  --corpus-dir <path>  Alias for --corpus',
  ].join('\n')
}

function parseJsonl(source, filePath) {
  return source
    .split(/\r?\n/u)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.trim())
    .map(({ line, lineNumber }) => {
      try {
        const record = JSON.parse(line)
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          throw new Error('expected a JSON object')
        }
        return record
      } catch (error) {
        throw new Error(`${filePath}:${lineNumber}: ${error.message}`)
      }
    })
}

async function readCorpus(corpusDir) {
  const entries = await Promise.all(RECORD_TYPES.map(async (type) => {
    const filePath = resolve(corpusDir, `${type}.jsonl`)
    await access(filePath)
    return [type, parseJsonl(await readFile(filePath, 'utf8'), filePath)]
  }))
  return Object.fromEntries(entries)
}

function jsonl(records) {
  return records.length ? `${records.map((record) => JSON.stringify(record)).join('\n')}\n` : ''
}

async function writeCorpusAtomic(corpusDir, recordsByType) {
  await mkdir(corpusDir, { recursive: true })
  const staged = []

  try {
    for (const type of RECORD_TYPES) {
      const destination = resolve(corpusDir, `${type}.jsonl`)
      const temporary = `${destination}.tmp-${process.pid}`
      await writeFile(temporary, jsonl(recordsByType[type]), 'utf8')
      staged.push({ destination, temporary })
    }

    for (const { destination, temporary } of staged) {
      await rename(temporary, destination)
    }
  } catch (error) {
    await Promise.all(staged.map(async ({ temporary }) => {
      try {
        await access(temporary)
        await unlink(temporary)
      } catch {
        // A staged file may already have been renamed or removed.
      }
    }))
    throw error
  }
}

function groupBy(records, key) {
  const grouped = new Map()
  for (const record of records) {
    const value = record[key]
    if (!grouped.has(value)) grouped.set(value, [])
    grouped.get(value).push(record)
  }
  return grouped
}

function compareOptionalNumber(left, right, field) {
  const leftValue = Number.isFinite(left[field]) ? left[field] : Number.MAX_SAFE_INTEGER
  const rightValue = Number.isFinite(right[field]) ? right[field] : Number.MAX_SAFE_INTEGER
  return leftValue - rightValue
}

function orderedSections(records) {
  return [...records].sort((left, right) => compareOptionalNumber(left, right, 'index'))
}

function orderedExamples(records) {
  return [...records].sort((left, right) => compareOptionalNumber(left, right, 'index'))
}

function orderedTokens(records) {
  return [...records].sort((left, right) => (
    compareOptionalNumber(left, right, 'viewer_index') ||
    compareOptionalNumber(left, right, 'group_order') ||
    compareOptionalNumber(left, right, 'order') ||
    (String(left.name || '') < String(right.name || '')
      ? -1
      : String(left.name || '') > String(right.name || '') ? 1 : 0)
  ))
}

function countBy(records, key) {
  const counts = new Map()
  for (const record of records) {
    const value = record[key]
    if (value == null) continue
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return counts
}

function summarizeKindChange(before, after, changes) {
  if (before.kind === after.kind) return
  const key = `${before.kind || 'null'}->${after.kind}`
  changes[key] = (changes[key] || 0) + 1
}

function normalizeExamples(examples, metrics, cleanBarePrefix) {
  return examples.map((example) => {
    const normalized = normalizeExampleRecord(example, { cleanBarePrefix })
    summarizeKindChange(example, normalized, metrics.example_kind_changes)

    let prefixCleaned = false
    for (const field of ['caption', 'text']) {
      if (example[field] !== normalized[field]) {
        metrics.cleaned_prefix_fields += 1
        prefixCleaned = true
      }
    }
    if (prefixCleaned) metrics.cleaned_prefix_examples += 1
    if (normalized.media_only === true) metrics.media_only_count += 1
    if (normalized.media_variant === 'thumbnail') metrics.thumbnail_count += 1
    if (example.media_only !== true && normalized.media_only === true) {
      metrics.media_only_added += 1
    }
    if (example.media_variant !== 'thumbnail' && normalized.media_variant === 'thumbnail') {
      metrics.thumbnail_added += 1
    }

    return normalized
  })
}

function normalizeSections(sections, examples) {
  const exampleCountBySection = countBy(examples, 'section_id')
  return sections.map((section) => {
    const exampleCount = exampleCountBySection.get(section.id) || 0
    return {
      ...section,
      example_count: exampleCount,
      has_payload: sectionHasPayload(section, exampleCount),
    }
  })
}

function normalizePages(pages, sections, tokens, examples, metrics) {
  const sectionsByPage = groupBy(sections, 'page_id')
  const tokensByPage = groupBy(tokens, 'page_id')
  const examplesByPage = groupBy(examples, 'page_id')

  return pages.map((page) => {
    const pageSections = orderedSections(sectionsByPage.get(page.id) || [])
    const pageTokens = orderedTokens(tokensByPage.get(page.id) || [])
    const pageExamples = orderedExamples(examplesByPage.get(page.id) || [])
    const content = buildPageContent(page, pageSections, pageTokens, pageExamples)
    const normalized = {
      ...page,
      content,
      example_count: pageExamples.length,
    }
    normalized.content_hash = createPageContentHash(
      normalized,
      pageSections,
      pageTokens,
      pageExamples,
    )

    const beforeLength = typeof page.content === 'string' ? page.content.length : 0
    const afterLength = content.length
    metrics.page_content.before_chars += beforeLength
    metrics.page_content.after_chars += afterLength
    if (afterLength > beforeLength) metrics.page_content.increased_pages += 1
    else if (afterLength < beforeLength) metrics.page_content.decreased_pages += 1
    else metrics.page_content.unchanged_pages += 1
    if (page.content !== content) metrics.page_content.changed_pages += 1
    if (page.content_hash !== normalized.content_hash) metrics.changed_hashes += 1

    return normalized
  })
}

export async function normalizeCorpus({ corpus }) {
  const input = await readCorpus(corpus)
  const cleanBarePrefix = (
    input.pages.some((page) => !Object.hasOwn(page, 'example_count')) ||
    input.sections.some((section) => (
      !Object.hasOwn(section, 'example_count') || !Object.hasOwn(section, 'has_payload')
    ))
  )
  const metrics = {
    legacy_bare_prefix_cleanup: cleanBarePrefix,
    example_kind_changes: {},
    cleaned_prefix_examples: 0,
    cleaned_prefix_fields: 0,
    media_only_count: 0,
    media_only_added: 0,
    thumbnail_count: 0,
    thumbnail_added: 0,
    changed_hashes: 0,
    page_content: {
      before_chars: 0,
      after_chars: 0,
      changed_pages: 0,
      increased_pages: 0,
      decreased_pages: 0,
      unchanged_pages: 0,
    },
  }

  const examples = normalizeExamples(input.examples, metrics, cleanBarePrefix)
  const sections = normalizeSections(input.sections, examples)
  const pages = normalizePages(input.pages, sections, input.tokens, examples, metrics)
  const output = { pages, sections, tokens: input.tokens, examples }

  await writeCorpusAtomic(corpus, output)

  return {
    corpus,
    rows: Object.fromEntries(RECORD_TYPES.map((type) => [type, output[type].length])),
    ...metrics,
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) {
      process.stdout.write(`${usage()}\n`)
      process.exit(0)
    }
    const summary = await normalizeCorpus(options)
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`)
    process.exit(1)
  }
}
