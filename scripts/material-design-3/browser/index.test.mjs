import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPageContent, extractMaterialPage } from './extract-page.mjs'
import { extractSpecTokens } from './extract-tokens.mjs'
import {
  canonicalizeUrl,
  createContentHash,
  createDeterministicId,
  createUrlId,
  inferMaterialRoute,
} from './identity.mjs'
import { waitForMaterialPage } from './readiness.mjs'

test('identity helpers are deterministic', () => {
  assert.equal(
    canonicalizeUrl('https://M3.Material.io/components/buttons/specs/?b=2&a=1#tokens'),
    'https://m3.material.io/components/buttons/specs',
  )
  assert.equal(createContentHash({ b: 2, a: 1 }), createContentHash({ a: 1, b: 2 }))
  assert.equal(
    createDeterministicId('page', 'https://m3.material.io/components/buttons/specs'),
    createDeterministicId('page', 'https://m3.material.io/components/buttons/specs'),
  )
  assert.equal(
    createUrlId('https://m3.material.io/components/buttons/specs'),
    'm3-url-3965c6af06c47dbf',
  )
})

test('Material routes separate component type and tab', () => {
  assert.deepEqual(
    inferMaterialRoute('https://m3.material.io/components/buttons/guidelines'),
    {
      category: 'components',
      page_type: 'component_tab',
      component: 'buttons',
      tab: 'guidelines',
    },
  )
})

test('readiness polls until main h1 and text satisfy thresholds', async () => {
  const states = [
    { url: 'https://example.test', main_found: true, h1: '', main_text_length: 10 },
    { url: 'https://example.test', main_found: true, h1: 'Ready', main_text_length: 250 },
  ]
  const tab = {
    playwright: {
      evaluate: async () => states.shift(),
      waitForTimeout: async () => {},
    },
  }

  const result = await waitForMaterialPage(tab, {
    timeoutMs: 100,
    pollIntervalMs: 1,
    minMainTextLength: 100,
  })

  assert.equal(result.ready, true)
  assert.equal(result.attempts, 2)
  assert.equal(result.h1, 'Ready')
})

test('page extraction wires deterministic references and counts', async () => {
  const responses = [
    {
      url: 'https://m3.material.io/components/buttons/specs',
      main_found: true,
      h1: 'Buttons',
      main_text_length: 500,
    },
    {
      url: 'https://m3.material.io/components/buttons/specs',
      title: 'Buttons',
      description: 'Buttons prompt actions.',
      main_found: true,
      main_text_length: 500,
      sections: [{
        index: 0,
        heading: 'Tokens & specs',
        level: 2,
        heading_path: ['Tokens & specs'],
        text: 'Token details',
        paragraphs: ['Token details'],
        lists: [],
        links: [],
      }],
      examples: [{
        section_index: 0,
        index: 0,
        kind: 'do',
        media_type: 'img',
        media_url: 'https://example.test/do.png',
        alt: 'Good button example',
        caption: 'Do Use a clear label',
      }],
      errors: [],
    },
    {
      viewer_count: 1,
      token_count: 1,
      tokens: [{
        viewer_index: 0,
        token_set: 'Button - Color - Filled',
        token_set_name: 'md.comp.button.filled',
        token_set_type: 'component',
        group: 'Enabled',
        group_order: 1,
        order: 1,
        name: 'md.comp.button.filled.container.color',
        display_name: 'Button filled container color',
        description: null,
        type: 'color',
        deprecated: false,
        deprecation_message: null,
        value: [{ context: [], reference: 'md.sys.color.primary', value: null, unresolved: false }],
      }],
      errors: [],
    },
  ]
  const tab = {
    url: async () => 'https://m3.material.io/components/buttons/specs',
    playwright: {
      evaluate: async () => responses.shift(),
      waitForTimeout: async () => {},
    },
  }

  const result = await extractMaterialPage(
    tab,
    {
      id: 'm3-url-3965c6af06c47dbf',
      url: 'https://m3.material.io/components/buttons/specs',
      title: 'Buttons',
      description: 'Buttons prompt actions.',
      category: 'components',
      page_type: 'component_tab',
      component: 'buttons',
      tab: 'specs',
      status: 'pending',
    },
    {
      capturedAt: '2026-07-10T00:00:00.000Z',
      tokens: { waitForViewer: false },
    },
  )

  assert.equal(result.page.status, 'completed')
  assert.equal(result.page.url_id, 'm3-url-3965c6af06c47dbf')
  assert.ok(result.page.content.length > 0)
  assert.equal(result.page.section_count, 1)
  assert.equal(result.page.token_count, 1)
  assert.equal(result.sections[0].page_id, result.page.id)
  assert.equal(result.examples[0].section_id, result.sections[0].id)
  assert.equal(result.tokens[0].source_url, result.page.url)
  assert.match(result.page.content_hash, /^[a-f0-9]{64}$/)
})

test('page extraction redacts destination content after a URL mismatch', async () => {
  const sourceUrl = 'https://m3.material.io/components/icon-button'
  const destinationUrl = 'https://m3.material.io/components/icon-buttons/overview'
  const responses = [
    {
      url: destinationUrl,
      main_found: true,
      h1: 'Icon buttons',
      main_text_length: 800,
    },
    {
      url: destinationUrl,
      canonical_url: 'https://m3.material.io/',
      title: 'Destination title',
      description: 'Destination description',
      main_found: true,
      main_text_length: 800,
      sections: [{
        index: 0,
        heading: 'Destination section',
        text: 'Destination text',
        paragraphs: ['Destination text'],
        lists: [],
        links: [],
      }],
      examples: [{
        section_index: 0,
        index: 0,
        kind: 'figure',
        media_type: 'img',
        media_url: 'https://example.test/destination.png',
        alt: 'Destination example',
        caption: null,
      }],
      errors: [],
    },
    { viewer_count: 0, token_count: 0, tokens: [], errors: [] },
  ]
  let evaluationCount = 0
  const tab = {
    playwright: {
      evaluate: async () => {
        evaluationCount += 1
        return responses.shift()
      },
      waitForTimeout: async () => {},
    },
  }

  const result = await extractMaterialPage(
    tab,
    {
      id: 'source-url-id',
      url: sourceUrl,
      title: 'Catalog title',
      description: 'Catalog description',
      category: 'components',
      page_type: 'component_tab',
      component: 'icon-button',
      tab: null,
      status: 'pending',
    },
    { capturedAt: '2026-07-10T00:00:00.000Z' },
  )

  assert.equal(evaluationCount, 2)
  assert.equal(result.page.status, 'error')
  assert.equal(result.page.title, 'Catalog title')
  assert.equal(result.page.description, 'Catalog description')
  assert.equal(result.page.content, '')
  assert.equal(result.page.main_text_length, 0)
  assert.equal(result.page.section_count, 0)
  assert.equal(result.page.token_count, 0)
  assert.equal(result.page.example_count, 0)
  assert.deepEqual(result.sections, [])
  assert.deepEqual(result.tokens, [])
  assert.deepEqual(result.examples, [])
  assert.equal(result.page.error.code, 'PAGE_URL_MISMATCH')
  assert.equal(result.page.error.retryable, true)
  assert.deepEqual(result.page.error.details, {
    expected_url: sourceUrl,
    observed_url: destinationUrl,
  })
})

test('classified redirect and utility pages have no searchable content', () => {
  const section = { heading: 'Destination heading', text: 'Destination text' }
  const token = { name: 'md.comp.destination.token' }
  const example = { caption: 'Destination example' }

  for (const resolution_type of ['redirect', 'utility']) {
    assert.equal(buildPageContent(
      { title: 'Destination title', description: 'Destination description', resolution_type },
      [section],
      [token],
      [example],
    ), '')
  }
})

test('token extraction resolves a unique baseline display-name alias', async () => {
  const tokenSetName = 'systems/material/tokenSets/icon-button'
  const tokenName = `${tokenSetName}/tokens/container-size`
  const viewer = {
    getAttribute(name) {
      if (name === 'display-token-sets') return JSON.stringify(['Icon button'])
      if (name !== 'design-system-data') return null

      return JSON.stringify({
        system: {
          tokenSets: [{
            name: tokenSetName,
            displayName: 'Icon button (baseline)',
            tokenSetName: 'md.comp.icon-button',
            tokenType: 'COMPONENT',
          }],
          tokens: [{
            name: tokenName,
            tokenName: 'md.comp.icon-button.container.size',
            displayName: 'Icon button container size',
            displayGroup: 'systems/material/displayGroups/common',
            orderInDisplayGroup: 1,
            tokenValueType: 'DIMENSION',
          }],
          values: [{
            name: `${tokenName}/values/default`,
            dimensionValue: { unit: 'DP', value: 40 },
          }],
          displayGroups: [{
            name: 'systems/material/displayGroups/common',
            displayName: 'Common',
            orderInParentTokenSet: 1,
          }],
          tags: [],
        },
      })
    },
  }
  const previousDocument = globalThis.document
  const tab = {
    playwright: {
      evaluate: async (pageFunction, argument) => {
        globalThis.document = { querySelectorAll: () => [viewer] }
        try {
          return await pageFunction(argument)
        } finally {
          if (previousDocument === undefined) delete globalThis.document
          else globalThis.document = previousDocument
        }
      },
    },
  }

  const result = await extractSpecTokens(tab, { waitForViewer: false })

  assert.equal(result.token_count, 1)
  assert.deepEqual(result.errors, [])
  assert.equal(result.tokens[0].token_set, 'Icon button (baseline)')
  assert.equal(result.tokens[0].token_set_name, 'md.comp.icon-button')
})
