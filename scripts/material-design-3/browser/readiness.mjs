import { assertExistingTab, toStructuredError } from './errors.mjs'

const DEFAULT_OPTIONS = {
  timeoutMs: 20_000,
  pollIntervalMs: 250,
  minMainTextLength: 120,
  requireH1: true,
}

function positiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function waitForMaterialPage(tab, options = {}) {
  assertExistingTab(tab)

  const timeoutMs = positiveNumber(options.timeoutMs, DEFAULT_OPTIONS.timeoutMs)
  const pollIntervalMs = positiveNumber(options.pollIntervalMs, DEFAULT_OPTIONS.pollIntervalMs)
  const minMainTextLength = positiveNumber(
    options.minMainTextLength,
    DEFAULT_OPTIONS.minMainTextLength,
  )
  const requireH1 = options.requireH1 ?? DEFAULT_OPTIONS.requireH1
  const startedAt = Date.now()
  let attempts = 0
  let lastState = null
  let lastEvaluationError = null

  while (Date.now() - startedAt <= timeoutMs) {
    attempts += 1

    try {
      lastState = await tab.playwright.evaluate(() => {
        const main = document.querySelector('main')
        const h1 = main?.querySelector('h1')
        const mainText = (main?.innerText || main?.textContent || '').replace(/\s+/g, ' ').trim()
        const tokenViewers = Array.from(
          main?.querySelectorAll('token-viewer[design-system-data][display-token-sets]') || [],
        )
        let readyTokenViewerCount = 0

        for (const viewer of tokenViewers) {
          const dataLength = (viewer.getAttribute('design-system-data') || '').length
          let displayTokenSetCount = 0

          try {
            const displayTokenSets = JSON.parse(viewer.getAttribute('display-token-sets') || '[]')
            if (Array.isArray(displayTokenSets)) displayTokenSetCount = displayTokenSets.length
          } catch {
            // Invalid token-viewer JSON is handled by the token extraction stage.
          }

          if (dataLength > 0 && displayTokenSetCount > 0) readyTokenViewerCount += 1
        }

        return {
          url: location.href,
          main_found: Boolean(main),
          h1: (h1?.textContent || '').replace(/\s+/g, ' ').trim(),
          main_text_length: mainText.length,
          token_viewer_count: tokenViewers.length,
          ready_token_viewer_count: readyTokenViewerCount,
        }
      })
      lastEvaluationError = null

      const hasRequiredHeading = !requireH1 || Boolean(lastState.h1)
      const mainContentReady = (
        lastState.main_found &&
        hasRequiredHeading &&
        lastState.main_text_length >= minMainTextLength
      )
      const tokenViewerReady = lastState.ready_token_viewer_count > 0

      if (mainContentReady || tokenViewerReady) {
        return {
          ready: true,
          ready_via: tokenViewerReady && !mainContentReady ? 'token_viewer' : 'main_content',
          attempts,
          elapsed_ms: Date.now() - startedAt,
          ...lastState,
          error: null,
        }
      }
    } catch (error) {
      lastEvaluationError = toStructuredError(error, {
        code: 'READINESS_EVALUATION_FAILED',
        stage: 'readiness',
        retryable: true,
      })
    }

    const elapsed = Date.now() - startedAt
    if (elapsed >= timeoutMs) break

    const remaining = timeoutMs - elapsed
    await delay(Math.min(pollIntervalMs, remaining))
  }

  const details = {
    timeout_ms: timeoutMs,
    min_main_text_length: minMainTextLength,
    require_h1: Boolean(requireH1),
    last_state: lastState,
    evaluation_error: lastEvaluationError,
  }

  return {
    ready: false,
    attempts,
    elapsed_ms: Date.now() - startedAt,
    url: lastState?.url || null,
    main_found: Boolean(lastState?.main_found),
    h1: lastState?.h1 || '',
    main_text_length: lastState?.main_text_length || 0,
    token_viewer_count: lastState?.token_viewer_count || 0,
    ready_token_viewer_count: lastState?.ready_token_viewer_count || 0,
    error: toStructuredError(null, {
      code: 'PAGE_READINESS_TIMEOUT',
      stage: 'readiness',
      message: 'Material page did not expose ready main content or a populated token-viewer',
      retryable: true,
      details,
    }),
  }
}

export const pollMaterialReadiness = waitForMaterialPage
