import { assertExistingTab } from './errors.mjs'

const DEFAULT_OPTIONS = {
  maxDataLength: 60_000_000,
  maxTokenViewers: 24,
  maxTokens: 20_000,
  viewerPollIntervalMs: 250,
  viewerStableSamples: 9,
  viewerTimeoutMs: 20_000,
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitForStableTokenViewer(tab, options) {
  const timeoutMs = Number.isFinite(options.viewerTimeoutMs) && options.viewerTimeoutMs > 0
    ? options.viewerTimeoutMs
    : DEFAULT_OPTIONS.viewerTimeoutMs
  const pollIntervalMs = Number.isFinite(options.viewerPollIntervalMs) && options.viewerPollIntervalMs > 0
    ? options.viewerPollIntervalMs
    : DEFAULT_OPTIONS.viewerPollIntervalMs
  const stableSamples = Number.isFinite(options.viewerStableSamples) && options.viewerStableSamples > 0
    ? Math.floor(options.viewerStableSamples)
    : DEFAULT_OPTIONS.viewerStableSamples
  const startedAt = Date.now()
  let previousSignature = null
  let stableCount = 0

  while (Date.now() - startedAt <= timeoutMs) {
    const state = await tab.playwright.evaluate(() => {
      const viewers = Array.from(
        document.querySelectorAll('main token-viewer[design-system-data][display-token-sets]'),
      )
      let readyViewerCount = 0
      let displayTokenSetCount = 0

      for (const viewer of viewers) {
        let displayTokenSets = []
        try {
          const parsed = JSON.parse(viewer.getAttribute('display-token-sets') || '[]')
          if (Array.isArray(parsed)) displayTokenSets = parsed
        } catch {
          // The extraction pass returns the detailed parse error.
        }

        displayTokenSetCount += displayTokenSets.length
        if (
          (viewer.getAttribute('design-system-data') || '').length > 0 &&
          displayTokenSets.length > 0
        ) {
          readyViewerCount += 1
        }
      }

      return {
        viewer_count: viewers.length,
        ready_viewer_count: readyViewerCount,
        display_token_set_count: displayTokenSetCount,
        main_text_length: (
          document.querySelector('main')?.innerText ||
          document.querySelector('main')?.textContent ||
          ''
        ).replace(/\s+/g, ' ').trim().length,
      }
    })
    const ready = state.viewer_count > 0 && state.ready_viewer_count === state.viewer_count
    const signature = JSON.stringify(state)

    if (ready && signature === previousSignature) stableCount += 1
    else stableCount = ready ? 1 : 0

    if (stableCount >= stableSamples) return state
    previousSignature = signature

    const elapsed = Date.now() - startedAt
    if (elapsed >= timeoutMs) break
    await delay(Math.min(pollIntervalMs, timeoutMs - elapsed))
  }

  return null
}

export async function extractSpecTokens(tab, options = {}) {
  assertExistingTab(tab)

  if (options.waitForViewer === true) {
    await waitForStableTokenViewer(tab, options)
  }

  const pageOptions = {
    maxDataLength: Number.isFinite(options.maxDataLength) && options.maxDataLength > 0
      ? Math.floor(options.maxDataLength)
      : DEFAULT_OPTIONS.maxDataLength,
    maxTokenViewers: Number.isFinite(options.maxTokenViewers) && options.maxTokenViewers > 0
      ? Math.floor(options.maxTokenViewers)
      : DEFAULT_OPTIONS.maxTokenViewers,
    maxTokens: Number.isFinite(options.maxTokens) && options.maxTokens > 0
      ? Math.floor(options.maxTokens)
      : DEFAULT_OPTIONS.maxTokens,
  }

  return tab.playwright.evaluate((limits) => {
    const errors = []
    const records = []
    const allViewers = Array.from(
      document.querySelectorAll('main token-viewer[design-system-data][display-token-sets]'),
    )
    const viewers = allViewers.slice(0, limits.maxTokenViewers)

    if (allViewers.length > viewers.length) {
      errors.push({
        code: 'TOKEN_VIEWER_LIMIT_REACHED',
        stage: 'tokens',
        message: 'Token extraction stopped at the configured viewer limit',
        retryable: false,
        details: { total_viewers: allViewers.length, extracted_viewers: viewers.length },
      })
    }

    const parsedDataCache = []
    const metadataKeys = new Set([
      'createTime',
      'name',
      'revisionCreateTime',
      'revisionId',
      'specificityScore',
      'state',
      'version',
    ])

    const messageFromValue = (value) => {
      if (typeof value === 'string' && value.trim()) return value.trim()
      if (!value || typeof value !== 'object') return null
      for (const key of Object.keys(value)) {
        const message = messageFromValue(value[key])
        if (message) return message
      }
      return null
    }

    const cleanValue = (value, depth = 0) => {
      if (typeof value === 'string') return value.slice(0, 2_000)
      if (value == null || typeof value !== 'object') return value
      if (depth >= 4) return '[max-depth]'
      if (Array.isArray(value)) return value.slice(0, 24).map((item) => cleanValue(item, depth + 1))

      const cleaned = {}
      for (const key of Object.keys(value).sort().slice(0, 24)) {
        cleaned[key] = cleanValue(value[key], depth + 1)
      }
      return cleaned
    }

    const numericOrder = (value) => {
      const number = Number(value)
      return Number.isFinite(number) ? number : null
    }

    const tokenSetAliasKey = (value) => String(value || '')
      .trim()
      .replace(/\s+\(baseline\)$/i, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()

    const parseJsonArray = (rawValue, viewerIndex, attributeName) => {
      try {
        const value = JSON.parse(rawValue || '[]')
        if (!Array.isArray(value)) throw new Error('Expected a JSON array')
        return value.filter((item) => typeof item === 'string')
      } catch (error) {
        errors.push({
          code: 'TOKEN_VIEWER_ATTRIBUTE_INVALID',
          stage: 'tokens',
          message: `Could not parse ${attributeName}: ${String(error.message || error).slice(0, 500)}`,
          retryable: false,
          details: { viewer_index: viewerIndex, attribute: attributeName },
        })
        return []
      }
    }

    const parseSystem = (rawData, viewerIndex) => {
      const cached = parsedDataCache.find((item) => item.rawData === rawData)
      if (cached) return cached.system

      if (!rawData) {
        errors.push({
          code: 'DESIGN_SYSTEM_DATA_MISSING',
          stage: 'tokens',
          message: 'A token viewer is missing design-system-data',
          retryable: true,
          details: { viewer_index: viewerIndex },
        })
        return null
      }

      if (rawData.length > limits.maxDataLength) {
        errors.push({
          code: 'DESIGN_SYSTEM_DATA_TOO_LARGE',
          stage: 'tokens',
          message: 'design-system-data exceeds the configured size limit',
          retryable: false,
          details: {
            viewer_index: viewerIndex,
            data_length: rawData.length,
            max_data_length: limits.maxDataLength,
          },
        })
        return null
      }

      try {
        const system = JSON.parse(rawData)?.system
        if (!system || typeof system !== 'object') throw new Error('Missing system object')
        parsedDataCache.push({ rawData, system })
        return system
      } catch (error) {
        errors.push({
          code: 'DESIGN_SYSTEM_DATA_INVALID',
          stage: 'tokens',
          message: `Could not parse design-system-data: ${String(error.message || error).slice(0, 500)}`,
          retryable: true,
          details: { viewer_index: viewerIndex, data_length: rawData.length },
        })
        return null
      }
    }

    const normalizeValue = (rawValue, tagByResource) => {
      const context = Array.from(rawValue.contextTags || [])
        .map((resource) => tagByResource.get(resource) || String(resource).split('/').pop())
        .sort()
      const reference = typeof rawValue.tokenName === 'string' ? rawValue.tokenName : null
      const payload = {}

      for (const key of Object.keys(rawValue).sort()) {
        if (metadataKeys.has(key) || key === 'contextTags' || key === 'tokenName' || key === 'undefined') {
          continue
        }
        payload[key] = cleanValue(rawValue[key])
      }

      return {
        context,
        reference,
        value: Object.keys(payload).length ? payload : null,
        unresolved: rawValue.undefined === true || rawValue.undefined === 'true',
      }
    }

    let displayTokenSetCount = 0

    for (let viewerIndex = 0; viewerIndex < viewers.length; viewerIndex += 1) {
      const viewer = viewers[viewerIndex]
      const displayTokenSets = parseJsonArray(
        viewer.getAttribute('display-token-sets'),
        viewerIndex,
        'display-token-sets',
      )
      displayTokenSetCount += displayTokenSets.length
      const system = parseSystem(viewer.getAttribute('design-system-data'), viewerIndex)
      if (!system) continue

      const tokenSetsByDisplayName = new Map()
      const tokenSetsByAlias = new Map()
      for (const tokenSet of system.tokenSets || []) {
        if (!tokenSetsByDisplayName.has(tokenSet.displayName)) {
          tokenSetsByDisplayName.set(tokenSet.displayName, [])
        }
        tokenSetsByDisplayName.get(tokenSet.displayName).push(tokenSet)

        const aliasKey = tokenSetAliasKey(tokenSet.displayName)
        if (aliasKey) {
          if (!tokenSetsByAlias.has(aliasKey)) tokenSetsByAlias.set(aliasKey, [])
          tokenSetsByAlias.get(aliasKey).push(tokenSet)
        }
      }

      const tokensBySet = new Map()
      for (const token of system.tokens || []) {
        const marker = '/tokens/'
        const markerIndex = String(token.name || '').indexOf(marker)
        if (markerIndex < 0) continue
        const setResource = token.name.slice(0, markerIndex)
        if (!tokensBySet.has(setResource)) tokensBySet.set(setResource, [])
        tokensBySet.get(setResource).push(token)
      }

      const valuesByToken = new Map()
      for (const value of system.values || []) {
        const marker = '/values/'
        const markerIndex = String(value.name || '').indexOf(marker)
        if (markerIndex < 0) continue
        const tokenResource = value.name.slice(0, markerIndex)
        if (!valuesByToken.has(tokenResource)) valuesByToken.set(tokenResource, [])
        valuesByToken.get(tokenResource).push(value)
      }

      const groupByResource = new Map(
        (system.displayGroups || []).map((group) => [group.name, group]),
      )
      const tagByResource = new Map(
        (system.tags || []).map((tag) => [
          tag.name,
          tag.displayName || tag.tagName || String(tag.name || '').split('/').pop(),
        ]),
      )

      for (const displayTokenSet of displayTokenSets) {
        let matchingSets = tokenSetsByDisplayName.get(displayTokenSet) || []
        if (matchingSets.length === 0) {
          const aliasMatches = tokenSetsByAlias.get(tokenSetAliasKey(displayTokenSet)) || []
          if (aliasMatches.length === 1) matchingSets = aliasMatches
        }
        if (matchingSets.length === 0) {
          errors.push({
            code: 'DISPLAY_TOKEN_SET_NOT_FOUND',
            stage: 'tokens',
            message: `display-token-sets references an unknown set: ${displayTokenSet}`,
            retryable: false,
            details: { viewer_index: viewerIndex, display_token_set: displayTokenSet },
          })
          continue
        }

        for (const tokenSet of matchingSets) {
          const setTokens = Array.from(tokensBySet.get(tokenSet.name) || [])
          setTokens.sort((left, right) => {
            const leftGroup = groupByResource.get(left.displayGroup)
            const rightGroup = groupByResource.get(right.displayGroup)
            return (
              (numericOrder(leftGroup?.orderInParentTokenSet) ?? Number.MAX_SAFE_INTEGER) -
                (numericOrder(rightGroup?.orderInParentTokenSet) ?? Number.MAX_SAFE_INTEGER) ||
              (numericOrder(left.orderInDisplayGroup) ?? Number.MAX_SAFE_INTEGER) -
                (numericOrder(right.orderInDisplayGroup) ?? Number.MAX_SAFE_INTEGER) ||
              String(left.tokenName || left.name).localeCompare(String(right.tokenName || right.name))
            )
          })

          for (const token of setTokens) {
            if (records.length >= limits.maxTokens) break
            const group = groupByResource.get(token.displayGroup) || null
            const directValues = Array.from(valuesByToken.get(token.name) || [])
              .sort((left, right) => String(left.name).localeCompare(String(right.name)))
              .map((value) => normalizeValue(value, tagByResource))
            const deprecationMessage = messageFromValue(token.deprecationMessage)

            records.push({
              viewer_index: viewerIndex,
              token_set: tokenSet.displayName || displayTokenSet,
              token_set_name: tokenSet.tokenSetName || null,
              token_set_type: tokenSet.tokenType ? String(tokenSet.tokenType).toLowerCase() : null,
              group: group?.displayName || null,
              group_order: numericOrder(group?.orderInParentTokenSet),
              order: numericOrder(token.orderInDisplayGroup),
              name: token.tokenName || token.name || null,
              display_name: token.displayName || null,
              description: token.description || null,
              type: token.tokenValueType ? String(token.tokenValueType).toLowerCase() : null,
              deprecated: /^\[deprecated\]/i.test(displayTokenSet) || Boolean(token.deprecationMessage),
              deprecation_message: deprecationMessage,
              value: directValues.length ? directValues : [{
                context: [],
                reference: null,
                value: null,
                unresolved: true,
              }],
            })
          }

          if (records.length >= limits.maxTokens) break
        }

        if (records.length >= limits.maxTokens) break
      }

      if (records.length >= limits.maxTokens) break
    }

    if (records.length >= limits.maxTokens) {
      errors.push({
        code: 'TOKEN_LIMIT_REACHED',
        stage: 'tokens',
        message: 'Token extraction stopped at the configured token limit',
        retryable: false,
        details: { extracted_tokens: records.length, max_tokens: limits.maxTokens },
      })
    }

    return {
      viewer_count: allViewers.length,
      display_token_set_count: displayTokenSetCount,
      token_count: records.length,
      tokens: records,
      errors,
    }
  }, pageOptions)
}

export const extractTokenViewerData = extractSpecTokens
