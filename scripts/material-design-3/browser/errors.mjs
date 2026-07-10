export class ExtractionError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'ExtractionError'
    this.code = options.code || 'EXTRACTION_ERROR'
    this.stage = options.stage || 'unknown'
    this.retryable = Boolean(options.retryable)
    this.details = options.details ?? null
  }
}

function safeDetails(value) {
  if (value == null) return null

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return { value: String(value) }
  }
}

export function toStructuredError(error, defaults = {}) {
  const source = error && typeof error === 'object' ? error : {}
  const message = source.message || defaults.message || String(error || 'Unknown extraction error')

  return {
    code: source.code || defaults.code || 'EXTRACTION_ERROR',
    stage: source.stage || defaults.stage || 'unknown',
    message: String(message).slice(0, 1000),
    retryable: source.retryable ?? Boolean(defaults.retryable),
    details: safeDetails(source.details ?? defaults.details ?? null),
  }
}

export function aggregateErrors(errors, options = {}) {
  const normalized = errors.filter(Boolean).map((error) => toStructuredError(error))
  if (normalized.length === 0) return null
  if (normalized.length === 1) return normalized[0]

  return {
    code: options.code || 'MULTIPLE_EXTRACTION_ERRORS',
    stage: options.stage || 'extract_page',
    message: options.message || `${normalized.length} extraction stages reported errors`,
    retryable: normalized.some((error) => error.retryable),
    details: { errors: normalized },
  }
}

export function assertExistingTab(tab) {
  if (!tab || typeof tab !== 'object') {
    throw new ExtractionError('An existing Browser Use tab is required', {
      code: 'TAB_REQUIRED',
      stage: 'input',
      retryable: false,
    })
  }

  if (!tab.playwright || typeof tab.playwright.evaluate !== 'function') {
    throw new ExtractionError('The tab must expose tab.playwright.evaluate', {
      code: 'TAB_PLAYWRIGHT_REQUIRED',
      stage: 'input',
      retryable: false,
    })
  }
}
