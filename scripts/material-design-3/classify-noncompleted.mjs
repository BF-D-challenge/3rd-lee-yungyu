#!/usr/bin/env node

import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '../..')
const RECORD_TYPES = ['pages', 'sections', 'tokens', 'examples']
const RETAINED_RESOLUTION_TYPES = new Set(['redirect', 'utility'])

function parseArguments(argv) {
  const options = {
    corpus: resolve(REPO_ROOT, 'docs/research/material-design-3'),
    report: resolve(
      REPO_ROOT,
      'docs/research/material-design-3/retry/noncompleted-report.json',
    ),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      options.help = true
      continue
    }
    if (!['--corpus', '--corpus-dir', '--report'].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`)
    }

    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`)
    }
    if (argument === '--report') options.report = resolve(process.cwd(), value)
    else options.corpus = resolve(process.cwd(), value)
    index += 1
  }

  return options
}

function usage() {
  return [
    'Usage: node scripts/material-design-3/classify-noncompleted.mjs [options]',
    '',
    'Options:',
    '  --corpus <path>      Final corpus directory',
    '  --corpus-dir <path>  Alias for --corpus',
    '  --report <path>      Retry classification report',
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
    return [type, parseJsonl(await readFile(filePath, 'utf8'), filePath)]
  }))
  return Object.fromEntries(entries)
}

function jsonl(records) {
  return records.length ? `${records.map((record) => JSON.stringify(record)).join('\n')}\n` : ''
}

async function writeCorpusAtomic(corpusDir, recordsByType) {
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
        await unlink(temporary)
      } catch {
        // A staged file may already have been renamed or removed.
      }
    }))
    throw error
  }
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function retainedDecisions(report, reportPath) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.decisions)) {
    throw new Error(`${reportPath}: decisions must be an array`)
  }

  const decisions = report.decisions.filter((decision) => (
    decision?.retain_source_failure === true &&
    RETAINED_RESOLUTION_TYPES.has(decision.decision)
  ))
  if (decisions.length === 0) {
    throw new Error(`${reportPath}: no retained redirect or utility decisions found`)
  }

  const byUrl = new Map()
  for (const decision of decisions) {
    if (!hasText(decision.expected_url)) {
      throw new Error(`${reportPath}: retained decision is missing expected_url`)
    }
    if (!hasText(decision.reason)) {
      throw new Error(`${reportPath}: ${decision.expected_url} is missing reason`)
    }
    if (byUrl.has(decision.expected_url)) {
      throw new Error(`${reportPath}: duplicate retained decision for ${decision.expected_url}`)
    }
    byUrl.set(decision.expected_url, decision)
  }

  return byUrl
}

function assertRetainedPages(pages, decisionsByUrl) {
  const pagesByUrl = new Map()
  for (const page of pages) {
    if (!pagesByUrl.has(page.url)) pagesByUrl.set(page.url, [])
    pagesByUrl.get(page.url).push(page)
  }

  for (const expectedUrl of decisionsByUrl.keys()) {
    const matches = pagesByUrl.get(expectedUrl) || []
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one final page for ${expectedUrl}; found ${matches.length}`,
      )
    }
    if (!matches[0].error || typeof matches[0].error !== 'object') {
      throw new Error(`Retained page ${expectedUrl} does not have a structured error`)
    }
  }
}

function classifyPage(page, decision) {
  const classified = {
    ...page,
    content: '',
    main_text_length: 0,
    section_count: 0,
    token_count: 0,
    example_count: 0,
    error: { ...page.error, retryable: false },
    resolution_type: decision.decision,
    resolution_reason: decision.reason,
    official_destination: decision.official_destination ?? null,
  }

  if (hasText(decision.observed_final_url)) {
    classified.observed_final_url = decision.observed_final_url
  } else {
    delete classified.observed_final_url
  }

  return classified
}

function emptyRemovalCounts() {
  return {
    redirect: { sections: 0, tokens: 0, examples: 0 },
    utility: { sections: 0, tokens: 0, examples: 0 },
  }
}

function countStatuses(pages) {
  const counts = {}
  for (const page of pages) {
    counts[page.status] = (counts[page.status] || 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => (
    left.localeCompare(right, 'en')
  )))
}

export async function classifyNoncompleted({ corpus, report }) {
  const [input, reportDocument] = await Promise.all([
    readCorpus(corpus),
    readFile(report, 'utf8').then((source) => {
      try {
        return JSON.parse(source)
      } catch (error) {
        throw new Error(`${report}: ${error.message}`)
      }
    }),
  ])
  const decisionsByUrl = retainedDecisions(reportDocument, report)
  assertRetainedPages(input.pages, decisionsByUrl)

  const resolutionByPageId = new Map()
  let updatedPages = 0
  const pages = input.pages.map((page) => {
    const decision = decisionsByUrl.get(page.url)
    if (!decision) return page

    resolutionByPageId.set(page.id, decision.decision)
    const classified = classifyPage(page, decision)
    if (JSON.stringify(classified) !== JSON.stringify(page)) updatedPages += 1
    return classified
  })

  const removedChildren = emptyRemovalCounts()
  const output = { pages }
  for (const type of RECORD_TYPES.slice(1)) {
    output[type] = input[type].filter((record) => {
      const resolutionType = resolutionByPageId.get(record.page_id)
      if (!resolutionType) return true
      removedChildren[resolutionType][type] += 1
      return false
    })
  }

  await writeCorpusAtomic(corpus, output)

  const classifiedPages = { redirect: 0, utility: 0 }
  for (const decision of decisionsByUrl.values()) {
    classifiedPages[decision.decision] += 1
  }

  return {
    corpus,
    report,
    classified_pages: {
      total: decisionsByUrl.size,
      ...classifiedPages,
      updated: updatedPages,
    },
    removed_children: removedChildren,
    rows: Object.fromEntries(RECORD_TYPES.map((type) => [type, output[type].length])),
    status_counts: countStatuses(pages),
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
    const summary = await classifyNoncompleted(options)
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`)
    process.exit(1)
  }
}
