import { createHash } from 'node:crypto'

import {
  canonicalizeMaterialUrl,
  classifyMaterialUrl,
} from '../lib/catalog.mjs'

export function canonicalizeUrl(rawUrl) {
  const input = String(rawUrl || '').trim()
  if (!input) return ''

  try {
    return canonicalizeMaterialUrl(input)
  } catch {
    // Keep errors structured at the extraction boundary, including malformed redirects.
  }

  try {
    const url = new URL(input)
    url.hash = ''
    url.hostname = url.hostname.toLowerCase()
    url.searchParams.sort()

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }

    return url.toString()
  } catch {
    return input.replace(/#.*$/, '').replace(/\/+$/, '')
  }
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) return 'null'
    if (value === undefined) return 'null'
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const entries = Object.keys(value)
    .filter((key) => value[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)

  return `{${entries.join(',')}}`
}

export function createContentHash(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

export function createDeterministicId(kind, ...parts) {
  const safeKind = String(kind || 'record').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const digest = createContentHash(parts.map((part) => String(part ?? ''))).slice(0, 24)
  return `m3-${safeKind}-${digest}`
}

export function createUrlId(rawUrl) {
  const canonicalUrl = canonicalizeUrl(rawUrl)
  const digest = createHash('sha256').update(canonicalUrl).digest('hex').slice(0, 16)
  return `m3-url-${digest}`
}

function decodePathSegment(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function overrideValue(overrides, camelName, snakeName, fallback) {
  if (Object.prototype.hasOwnProperty.call(overrides, camelName)) return overrides[camelName]
  if (Object.prototype.hasOwnProperty.call(overrides, snakeName)) return overrides[snakeName]
  return fallback
}

export function inferMaterialRoute(rawUrl, overrides = {}) {
  let segments = []
  let catalogRoute = null

  try {
    const canonicalUrl = canonicalizeMaterialUrl(rawUrl)
    catalogRoute = classifyMaterialUrl(canonicalUrl)
    segments = new URL(canonicalUrl).pathname.split('/').filter(Boolean).map(decodePathSegment)
  } catch {
    segments = String(rawUrl || '').split(/[?#]/, 1)[0].split('/').filter(Boolean).map(decodePathSegment)
  }

  const inferredCategory = catalogRoute?.category || segments[0] || 'home'
  const category = overrideValue(overrides, 'category', 'category', inferredCategory)
  const component = overrideValue(
    overrides,
    'component',
    'component',
    catalogRoute?.component ?? (category === 'components' ? segments[1] || null : null),
  )
  const tab = overrideValue(
    overrides,
    'tab',
    'tab',
    catalogRoute?.tab ?? (category === 'components' && segments.length >= 3 ? segments.at(-1) : null),
  )

  const pageTypeByCategory = {
    blog: 'blog',
    components: 'component_tab',
    develop: 'develop',
    foundations: 'foundation',
    'get-started': 'get_started',
    home: 'home',
    styles: 'style',
  }
  const inferredPageType = catalogRoute?.page_type || pageTypeByCategory[category] || 'utility'
  const pageType = overrideValue(overrides, 'pageType', 'page_type', inferredPageType)

  return {
    category: category == null ? null : String(category),
    page_type: pageType == null ? null : String(pageType),
    component: component == null ? null : String(component),
    tab: tab == null ? null : String(tab),
  }
}
