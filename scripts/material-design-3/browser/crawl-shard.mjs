import {
  ExtractionError,
  assertExistingTab,
  toStructuredError,
} from './errors.mjs'
import { assertUrlRecord, extractMaterialPage } from './extract-page.mjs'
import {
  canonicalizeUrl,
  createContentHash,
  createDeterministicId,
  inferMaterialRoute,
} from './identity.mjs'

const DEFAULT_RETRIES = 1
const DEFAULT_RETRY_DELAY_MS = 500

function nonNegativeInteger(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback
}

function normalizeCapturedAt(value) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function delay(milliseconds) {
  return milliseconds > 0
    ? new Promise((resolve) => setTimeout(resolve, milliseconds))
    : Promise.resolve()
}

function shardMetadata(options) {
  if (options.shard !== undefined) return options.shard
  if (options.shardMetadata !== undefined) return options.shardMetadata

  const metadata = {
    id: options.shardId ?? null,
    index: options.shardIndex ?? null,
    count: options.shardCount ?? null,
  }
  return Object.values(metadata).some((value) => value !== null) ? metadata : null
}

function routeForRecord(urlRecord) {
  const overrides = {}
  for (const key of ['category', 'page_type', 'component', 'tab']) {
    if (urlRecord[key] !== undefined) overrides[key] = urlRecord[key]
  }
  return inferMaterialRoute(urlRecord.url, overrides)
}

function failureResult(urlRecord, error, extractOptions) {
  const sourceUrl = canonicalizeUrl(urlRecord.url)
  const route = routeForRecord(urlRecord)
  const structuredError = toStructuredError(error, {
    code: 'CRAWL_PAGE_FAILED',
    stage: 'crawl',
    retryable: true,
  })
  const content = ''
  const pageCore = {
    url: sourceUrl,
    source_url: sourceUrl,
    title: urlRecord.title || null,
    description: urlRecord.description || null,
    content,
    ...route,
  }

  return {
    page: {
      id: createDeterministicId('page', sourceUrl),
      url_id: urlRecord.id,
      url: sourceUrl,
      source_url: sourceUrl,
      title: pageCore.title,
      description: pageCore.description,
      content,
      category: route.category,
      page_type: route.page_type,
      component: route.component,
      tab: route.tab,
      status: 'error',
      captured_at: normalizeCapturedAt(
        extractOptions.capturedAt || extractOptions.captured_at,
      ),
      content_hash: createContentHash({ ...pageCore, error: structuredError }),
      main_text_length: 0,
      section_count: 0,
      token_count: 0,
      error: structuredError,
    },
    sections: [],
    tokens: [],
    examples: [],
    readiness: null,
  }
}

async function navigateToRecord(tab, urlRecord, options, context) {
  if (typeof options.navigate === 'function') {
    await options.navigate(tab, urlRecord, context)
    return
  }

  if (typeof tab.goto !== 'function') {
    throw new ExtractionError('crawlShard requires an existing tab.goto or options.navigate', {
      code: 'TAB_NAVIGATION_REQUIRED',
      stage: 'navigation',
      retryable: false,
    })
  }

  await tab.goto(urlRecord.url)
}

async function reportProgress(callback, event) {
  if (typeof callback === 'function') await callback(event)
}

function canRetry(result, error, options) {
  if (error) return error.retryable !== false
  if (result?.page?.status === 'error') return result.page.error?.retryable !== false
  return options.retryPartial === true && result?.page?.status === 'partial'
}

export async function crawlShard(tab, urlRecords, options = {}) {
  assertExistingTab(tab)

  if (!Array.isArray(urlRecords)) {
    throw new ExtractionError('urlRecords must be an array', {
      code: 'URL_RECORDS_ARRAY_REQUIRED',
      stage: 'input',
      retryable: false,
    })
  }

  for (const urlRecord of urlRecords) assertUrlRecord(urlRecord)

  const retries = nonNegativeInteger(
    options.retries ?? options.maxRetries ?? options.retryCount,
    DEFAULT_RETRIES,
  )
  const maxAttempts = retries + 1
  const retryDelayMs = nonNegativeInteger(options.retryDelayMs, DEFAULT_RETRY_DELAY_MS)
  const extractOptions = options.extractOptions || options.pageOptions || {}
  const shard = shardMetadata(options)
  const output = { shard, pages: [], sections: [], tokens: [], examples: [] }

  for (let index = 0; index < urlRecords.length; index += 1) {
    const urlRecord = urlRecords[index]
    const baseProgress = {
      shard,
      index,
      position: index + 1,
      total: urlRecords.length,
      url_record: urlRecord,
    }
    let finalResult = null
    let finalError = null
    let attemptsUsed = 0

    await reportProgress(options.onProgress, {
      ...baseProgress,
      phase: 'start',
      completed: index,
      attempt: 0,
      max_attempts: maxAttempts,
    })

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsUsed = attempt
      try {
        await navigateToRecord(tab, urlRecord, options, {
          ...baseProgress,
          attempt,
          max_attempts: maxAttempts,
        })
        finalResult = await extractMaterialPage(tab, urlRecord, extractOptions)
        finalError = null

        if (!canRetry(finalResult, null, options) || attempt >= maxAttempts) break
        finalError = finalResult.page.error
      } catch (error) {
        finalResult = null
        finalError = toStructuredError(error, {
          code: 'CRAWL_PAGE_ATTEMPT_FAILED',
          stage: 'crawl',
          retryable: true,
        })

        if (!canRetry(null, finalError, options) || attempt >= maxAttempts) break
      }

      await reportProgress(options.onProgress, {
        ...baseProgress,
        phase: 'retry',
        completed: index,
        attempt,
        max_attempts: maxAttempts,
        error: finalError,
      })
      await delay(retryDelayMs)
    }

    if (!finalResult) {
      finalResult = failureResult(urlRecord, finalError, extractOptions)
    }

    output.pages.push(finalResult.page)
    output.sections.push(...finalResult.sections)
    output.tokens.push(...finalResult.tokens)
    output.examples.push(...finalResult.examples)

    await reportProgress(options.onProgress, {
      ...baseProgress,
      phase: 'complete',
      completed: index + 1,
      attempt: attemptsUsed,
      max_attempts: maxAttempts,
      page: finalResult.page,
    })
  }

  return output
}
