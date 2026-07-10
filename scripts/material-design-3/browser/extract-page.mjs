import {
  ExtractionError,
  aggregateErrors,
  assertExistingTab,
  toStructuredError,
} from './errors.mjs'
import { extractGenericContent } from './extract-content.mjs'
import { extractSpecTokens } from './extract-tokens.mjs'
import {
  canonicalizeUrl,
  createContentHash,
  createDeterministicId,
  inferMaterialRoute,
  stableStringify,
} from './identity.mjs'
import { waitForMaterialPage } from './readiness.mjs'

const GENERIC_LINK_TEXT = new Set([
  'click here',
  'here',
  'learn more',
  'link',
  'menu',
  'more',
  'read more',
])

const NON_SEARCHABLE_RESOLUTION_TYPES = new Set(['redirect', 'utility'])

const CALLOUT_PREFIX_PATTERN = /^(?:exclamation|warning|priority[_ ]high|error|pause|check|close)\s+(caution|warning|do|don['\u2019]?t)(?:\s*[:.\-\u2013\u2014]\s*|\s+|$)/iu
const BARE_CALLOUT_PREFIX_PATTERN = /^(caution|warning|do|don['\u2019]?t)(?:\s*[:.\-\u2013\u2014]\s*|\s+|$)/iu

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function calloutPrefix(value, allowBarePrefix) {
  if (!hasText(value)) return null
  const text = value.trim()
  const match = text.match(CALLOUT_PREFIX_PATTERN) || (
    allowBarePrefix ? text.match(BARE_CALLOUT_PREFIX_PATTERN) : null
  )
  if (!match) return null

  const label = match[1].toLowerCase().replace(/\u2019/g, "'")
  return {
    kind: label === 'do' ? 'do' : label.startsWith('don') ? 'dont' : 'caution',
    text: text.slice(match[0].length).trim(),
  }
}

export function normalizeExampleRecord(record, options = {}) {
  const captionPrefix = calloutPrefix(record.caption, options.cleanBarePrefix === true)
  const textPrefix = calloutPrefix(record.text, options.cleanBarePrefix === true)
  const normalized = {
    ...record,
    kind: captionPrefix?.kind || textPrefix?.kind || record.kind || 'figure',
  }

  if (captionPrefix) normalized.caption = captionPrefix.text || null
  if (textPrefix) normalized.text = textPrefix.text

  const mediaUrl = hasText(normalized.media_url)
    ? normalized.media_url.trim()
    : hasText(normalized.image_url) ? normalized.image_url.trim() : ''
  const mediaOnly = Boolean(mediaUrl) && ![
    normalized.alt,
    normalized.caption,
    normalized.text,
  ].some(hasText)

  if (mediaOnly) normalized.media_only = true
  else delete normalized.media_only

  if (/=w40$/u.test(mediaUrl)) normalized.media_variant = 'thumbnail'
  else if (normalized.media_variant === 'thumbnail') delete normalized.media_variant

  return normalized
}

function searchableTextKey(value) {
  return String(value || '').replace(/\s+/gu, ' ').trim()
}

export function isMeaningfulSectionLinkText(value) {
  const text = searchableTextKey(value)
  if (!text || !/[\p{L}\p{N}]/u.test(text)) return false
  if (/^(?:https?:\/\/|www\.)\S+$/iu.test(text)) return false
  return !GENERIC_LINK_TEXT.has(text.toLowerCase())
}

export function buildPageContent(page, sections = [], tokens = [], examples = []) {
  if (NON_SEARCHABLE_RESOLUTION_TYPES.has(page.resolution_type)) return ''

  const parts = []
  const seen = new Set()
  const add = (value) => {
    if (!hasText(value)) return
    const text = value.trim()
    const key = searchableTextKey(text)
    if (!key || seen.has(key)) return
    seen.add(key)
    parts.push(text)
  }

  add(page.title)
  add(page.description)

  for (const section of sections) {
    add(section.heading)

    if (hasText(section.text)) {
      add(section.text)
    } else {
      for (const paragraph of section.paragraphs || []) add(paragraph)
      for (const list of section.lists || []) {
        for (const item of list.items || []) add(item)
      }
    }

    for (const link of section.links || []) {
      if (isMeaningfulSectionLinkText(link?.text)) add(link.text)
    }
  }

  for (const example of examples) {
    add(example.caption || example.alt || example.text)
  }

  if (parts.length === 0) {
    for (const token of tokens) add(token.name)
  }

  return parts.join('\n\n')
}

function recordForHash(record) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => (
    key !== 'id' &&
    !key.endsWith('_id') &&
    !['captured_at', 'content_hash', 'error'].includes(key)
  )))
}

function childRecordsForHash(records) {
  return records
    .map(recordForHash)
    .map((record) => ({ record, serialized: stableStringify(record) }))
    .sort((left, right) => (
      left.serialized < right.serialized ? -1 : left.serialized > right.serialized ? 1 : 0
    ))
    .map(({ record }) => record)
}

export function createPageContentHash(page, sections = [], tokens = [], examples = []) {
  return createContentHash({
    page: recordForHash(page),
    sections: childRecordsForHash(sections),
    tokens: childRecordsForHash(tokens),
    examples: childRecordsForHash(examples),
  })
}

export function sectionHasPayload(section, exampleCount = 0) {
  if (hasText(section.text)) return true
  if ((section.paragraphs || []).some(hasText)) return true
  if ((section.lists || []).some((list) => (list.items || []).some(hasText))) return true
  if ((section.links || []).some((link) => isMeaningfulSectionLinkText(link?.text))) return true
  return exampleCount > 0
}

function normalizeCapturedAt(value) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export function assertUrlRecord(urlRecord) {
  if (!urlRecord || typeof urlRecord !== 'object' || Array.isArray(urlRecord)) {
    throw new ExtractionError('A URL catalog record is required', {
      code: 'URL_RECORD_REQUIRED',
      stage: 'input',
      retryable: false,
    })
  }

  if (typeof urlRecord.id !== 'string' || !urlRecord.id.trim()) {
    throw new ExtractionError('urlRecord.id must be a non-empty string', {
      code: 'URL_RECORD_ID_REQUIRED',
      stage: 'input',
      retryable: false,
    })
  }

  if (typeof urlRecord.url !== 'string' || !canonicalizeUrl(urlRecord.url)) {
    throw new ExtractionError('urlRecord.url must be a non-empty URL', {
      code: 'URL_RECORD_URL_REQUIRED',
      stage: 'input',
      retryable: false,
    })
  }
}

function routeOverrides(urlRecord, options) {
  const overrides = {}

  for (const key of ['category', 'page_type', 'component', 'tab']) {
    if (urlRecord[key] !== undefined) overrides[key] = urlRecord[key]
  }

  return { ...overrides, ...(options.route || {}) }
}

export async function extractMaterialPage(tab, urlRecord, options = {}) {
  assertExistingTab(tab)
  assertUrlRecord(urlRecord)

  const capturedAt = normalizeCapturedAt(options.capturedAt || options.captured_at)
  const stageErrors = []
  const sourceUrl = canonicalizeUrl(urlRecord.url)
  let readiness

  try {
    readiness = await waitForMaterialPage(tab, options.readiness)
    if (readiness.error) stageErrors.push(readiness.error)
  } catch (error) {
    const structured = toStructuredError(error, {
      code: 'READINESS_FAILED',
      stage: 'readiness',
      retryable: true,
    })
    stageErrors.push(structured)
    readiness = {
      ready: false,
      attempts: 0,
      elapsed_ms: 0,
      url: sourceUrl,
      main_found: false,
      h1: '',
      main_text_length: 0,
      token_viewer_count: 0,
      ready_token_viewer_count: 0,
      error: structured,
    }
  }

  let content
  try {
    content = await extractGenericContent(tab, options.content)
    stageErrors.push(...(content.errors || []))
  } catch (error) {
    const structured = toStructuredError(error, {
      code: 'CONTENT_EXTRACTION_FAILED',
      stage: 'content',
      retryable: true,
    })
    stageErrors.push(structured)
    content = {
      url: sourceUrl,
      canonical_url: null,
      title: readiness.h1 || urlRecord.title || null,
      description: urlRecord.description || null,
      main_found: false,
      main_text_length: readiness.main_text_length || 0,
      sections: [],
      examples: [],
      errors: [structured],
    }
  }

  const renderedUrls = [content.url, readiness.url]
    .map(canonicalizeUrl)
    .filter(Boolean)
  const observedUrl = (
    renderedUrls.find((url) => url !== sourceUrl) ||
    renderedUrls[0] ||
    canonicalizeUrl(content.canonical_url)
  )
  const route = inferMaterialRoute(sourceUrl, routeOverrides(urlRecord, options))
  const urlMismatch = Boolean(observedUrl && observedUrl !== sourceUrl)
  const pageId = createDeterministicId('page', sourceUrl)

  if (urlMismatch && options.allowUrlMismatch !== true) {
    const error = toStructuredError(null, {
      code: 'PAGE_URL_MISMATCH',
      stage: 'readiness',
      message: 'The rendered page URL does not match urlRecord.url',
      retryable: true,
      details: { expected_url: sourceUrl, observed_url: observedUrl },
    })
    const page = {
      id: pageId,
      url_id: urlRecord.id,
      url: sourceUrl,
      source_url: sourceUrl,
      title: urlRecord.title ?? null,
      description: urlRecord.description ?? null,
      content: '',
      category: route.category,
      page_type: route.page_type,
      component: route.component,
      tab: route.tab,
      status: 'error',
      captured_at: capturedAt,
      content_hash: null,
      main_text_length: 0,
      section_count: 0,
      token_count: 0,
      example_count: 0,
      error,
    }
    page.content_hash = createPageContentHash(page)

    return { page, sections: [], tokens: [], examples: [], readiness }
  }

  let tokenResult = { viewer_count: 0, token_count: 0, tokens: [], errors: [] }

  if (options.includeTokens !== false) {
    try {
      tokenResult = await extractSpecTokens(tab, {
        ...(options.tokens || {}),
        waitForViewer: options.tokens?.waitForViewer ?? route.tab === 'specs',
      })
      stageErrors.push(...(tokenResult.errors || []))
    } catch (error) {
      const structured = toStructuredError(error, {
        code: 'TOKEN_EXTRACTION_FAILED',
        stage: 'tokens',
        retryable: true,
      })
      stageErrors.push(structured)
      tokenResult = { viewer_count: 0, token_count: 0, tokens: [], errors: [structured] }
    }

    if (route.tab === 'specs' && tokenResult.viewer_count === 0) {
      stageErrors.push(toStructuredError(null, {
        code: 'TOKEN_VIEWER_NOT_FOUND',
        stage: 'tokens',
        message: 'A specs page was ready, but no token-viewer was found in main',
        retryable: true,
      }))
    }
  }

  const sections = (content.sections || []).map((section, arrayIndex) => ({
    id: createDeterministicId(
      'section',
      pageId,
      section.index ?? arrayIndex,
      ...(section.heading_path || []),
    ),
    page_id: pageId,
    source_url: sourceUrl,
    index: section.index ?? arrayIndex,
    heading: section.heading ?? null,
    level: section.level ?? null,
    heading_path: section.heading_path || [],
    text: section.text || '',
    paragraphs: section.paragraphs || [],
    lists: section.lists || [],
    links: section.links || [],
  }))
  const sectionIdByIndex = new Map(sections.map((section) => [section.index, section.id]))
  const examples = (content.examples || []).map((example, arrayIndex) => {
    const normalized = normalizeExampleRecord({
      page_id: pageId,
      source_url: sourceUrl,
      section_id: sectionIdByIndex.get(example.section_index) || null,
      index: example.index ?? arrayIndex,
      kind: example.kind || 'figure',
      media_type: example.media_type || null,
      media_url: example.media_url || null,
      image_url: example.media_type === 'img' ? example.media_url || null : null,
      alt: example.alt || null,
      caption: example.caption || null,
      text: example.caption || example.alt || '',
    })

    return {
      id: createDeterministicId(
        'example',
        pageId,
        normalized.index,
        normalized.kind,
        normalized.caption,
        normalized.media_url,
      ),
      ...normalized,
    }
  })
  const exampleCountBySectionId = new Map()
  for (const example of examples) {
    if (!example.section_id) continue
    exampleCountBySectionId.set(
      example.section_id,
      (exampleCountBySectionId.get(example.section_id) || 0) + 1,
    )
  }
  for (const section of sections) {
    section.example_count = exampleCountBySectionId.get(section.id) || 0
    section.has_payload = sectionHasPayload(section, section.example_count)
  }
  const tokens = (tokenResult.tokens || []).map((token, arrayIndex) => ({
    ...token,
    id: createDeterministicId(
      'token',
      pageId,
      token.viewer_index,
      token.token_set_name,
      token.name,
      arrayIndex,
    ),
    page_id: pageId,
    source_url: sourceUrl,
  }))

  const pageCore = {
    url: sourceUrl,
    source_url: sourceUrl,
    title: content.title || urlRecord.title || readiness.h1 || null,
    description: content.description || urlRecord.description || null,
    ...route,
  }
  const pageContent = buildPageContent(pageCore, sections, tokens, examples)
  if (!pageContent) {
    stageErrors.push(toStructuredError(null, {
      code: 'PAGE_CONTENT_EMPTY',
      stage: 'content',
      message: 'The rendered page did not produce non-empty page content',
      retryable: true,
    }))
  }
  pageCore.content = pageContent
  const criticalFailure = (
    !content.main_found ||
    !pageContent ||
    (urlMismatch && options.allowUrlMismatch !== true)
  )
  const status = criticalFailure ? 'error' : stageErrors.length ? 'partial' : 'completed'
  const error = aggregateErrors(stageErrors)
  const page = {
    id: pageId,
    url_id: urlRecord.id,
    url: sourceUrl,
    source_url: sourceUrl,
    title: pageCore.title,
    description: pageCore.description,
    content: pageContent,
    category: route.category,
    page_type: route.page_type,
    component: route.component,
    tab: route.tab,
    status,
    captured_at: capturedAt,
    content_hash: null,
    main_text_length: content.main_text_length || 0,
    section_count: sections.length,
    token_count: tokens.length,
    example_count: examples.length,
    error,
  }
  page.content_hash = createPageContentHash(page, sections, tokens, examples)

  return { page, sections, tokens, examples, readiness }
}

export const extractPage = extractMaterialPage
