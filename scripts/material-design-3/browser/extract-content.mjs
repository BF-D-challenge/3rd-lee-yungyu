import { assertExistingTab } from './errors.mjs'

const DEFAULT_OPTIONS = {
  maxBlocks: 12_000,
  maxTextLength: 20_000,
}

export async function extractGenericContent(tab, options = {}) {
  assertExistingTab(tab)

  const pageOptions = {
    maxBlocks: Number.isFinite(options.maxBlocks) && options.maxBlocks > 0
      ? Math.floor(options.maxBlocks)
      : DEFAULT_OPTIONS.maxBlocks,
    maxTextLength: Number.isFinite(options.maxTextLength) && options.maxTextLength > 0
      ? Math.floor(options.maxTextLength)
      : DEFAULT_OPTIONS.maxTextLength,
  }

  return tab.playwright.evaluate((limits) => {
    const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim()
    const pageErrors = []
    let truncatedTextCount = 0

    const boundedText = (value) => {
      const text = normalizeText(value)
      if (text.length <= limits.maxTextLength) return text
      truncatedTextCount += 1
      return text.slice(0, limits.maxTextLength)
    }

    const main = document.querySelector('main')
    const currentUrl = location.href
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null
    const h1 = main?.querySelector('h1')
    const title = boundedText(h1?.textContent || document.title) || null
    const metaDescription =
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      main?.querySelector('mio-header p')?.textContent ||
      null
    const description = boundedText(metaDescription) || null
    const mainText = normalizeText(main?.innerText || main?.textContent || '')

    if (!main) {
      return {
        url: currentUrl,
        canonical_url: canonicalUrl,
        title,
        description,
        main_found: false,
        main_text_length: 0,
        sections: [],
        examples: [],
        errors: [{
          code: 'MAIN_NOT_FOUND',
          stage: 'content',
          message: 'The page does not contain a main element',
          retryable: true,
          details: null,
        }],
      }
    }

    const root = main.querySelector('article') || main.querySelector('.content-container') || main
    const excludedAncestorSelector = [
      'header',
      'nav',
      'mio-toc',
      'token-viewer',
      'script',
      'style',
      'noscript',
    ].join(',')
    const blockSelector = [
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'ul',
      'ol',
      'figure',
      'aside',
      '[role="note"]',
      '[class*="callout"]',
      '[class*="caution"]',
      '[class*="warning"]',
      'a[href]',
    ].join(',')
    const allBlocks = Array.from(root.querySelectorAll(blockSelector))
    const blocks = allBlocks.slice(0, limits.maxBlocks)

    if (allBlocks.length > blocks.length) {
      pageErrors.push({
        code: 'CONTENT_BLOCK_LIMIT_REACHED',
        stage: 'content',
        message: 'Content extraction stopped at the configured block limit',
        retryable: false,
        details: { total_blocks: allBlocks.length, extracted_blocks: blocks.length },
      })
    }

    const headingStack = []
    const sections = []
    const examples = []
    let currentSection = null

    const ensureSection = () => {
      if (currentSection) return currentSection
      currentSection = {
        index: sections.length,
        heading: null,
        level: null,
        heading_path: [],
        paragraphs: [],
        lists: [],
        links: [],
        _linkKeys: {},
      }
      sections.push(currentSection)
      return currentSection
    }

    const addLinks = (container, section) => {
      const anchors = container.matches?.('a[href]')
        ? [container]
        : Array.from(container.querySelectorAll?.('a[href]') || [])

      for (const anchor of anchors) {
        const url = anchor.href || anchor.getAttribute('href') || ''
        if (!url || /^javascript:/i.test(url)) continue
        const text = boundedText(anchor.textContent || anchor.getAttribute('aria-label') || '')
        const key = `${url}\n${text}`
        if (section._linkKeys[key]) continue
        section._linkKeys[key] = true
        section.links.push({ text: text || null, url })
      }
    }

    const isCalloutContainer = (element) => {
      const tagName = element.tagName.toLowerCase()
      if (tagName === 'aside' || element.getAttribute('role') === 'note') return true
      const className = String(element.className || '')
      return /(^|\s)(callout|caution|warning|do-dont|dos-donts)(\s|$)/i.test(className)
    }

    const calloutPrefix = (value) => {
      const text = normalizeText(value)
      const match = text.match(
        /^(?:(?:exclamation|warning|priority[_ ]high|error|pause|check|close)\s+)?(caution|warning|do|don['\u2019]?t)(?:\s*[:.\-\u2013\u2014]\s*|\s+|$)/iu,
      )
      if (!match) return null

      const label = match[1].toLowerCase().replace(/\u2019/g, "'")
      return {
        kind: label === 'do' ? 'do' : label.startsWith('don') ? 'dont' : 'caution',
        length: match[0].length,
      }
    }

    const calloutKind = (value) => calloutPrefix(value)?.kind || null

    const cleanCaption = (value) => {
      const text = boundedText(value)
      const prefix = calloutPrefix(text)
      return prefix ? text.slice(prefix.length).trim() : text
    }

    const mediaFromFigure = (figure) => {
      const media = Array.from(figure.querySelectorAll('img,video'))
      if (media.length === 0) {
        return { media_type: null, media_url: null, alt: null }
      }

      const element = media[0]
      const mediaType = element.tagName.toLowerCase()
      let mediaUrl = element.currentSrc || element.getAttribute('src') || null
      if (!mediaUrl && mediaType === 'video') {
        mediaUrl = element.querySelector('source[src]')?.src || null
      }
      if (mediaUrl && mediaUrl.length > 8_000) mediaUrl = mediaUrl.slice(0, 8_000)

      return {
        media_type: mediaType,
        media_url: mediaUrl,
        alt: boundedText(
          element.getAttribute('alt') ||
          element.getAttribute('aria-label') ||
          figure.getAttribute('aria-label') ||
          '',
        ) || null,
      }
    }

    for (const element of blocks) {
      if (element.closest(excludedAncestorSelector)) continue

      const tagName = element.tagName.toLowerCase()
      const headingMatch = /^h([2-6])$/.exec(tagName)

      if (headingMatch) {
        if (element.closest('figure,aside,[role="note"]')) continue
        const heading = boundedText(element.textContent)
        if (!heading) continue
        const level = Number(headingMatch[1])
        while (headingStack.length && headingStack.at(-1).level >= level) headingStack.pop()
        headingStack.push({ level, heading })
        currentSection = {
          index: sections.length,
          heading,
          level,
          heading_path: headingStack.map((item) => item.heading),
          paragraphs: [],
          lists: [],
          links: [],
          _linkKeys: {},
        }
        sections.push(currentSection)
        continue
      }

      const section = ensureSection()

      if (tagName === 'p') {
        if (element.parentElement?.closest('li,figure,aside,[role="note"]')) continue
        if (element.parentElement && isCalloutContainer(element.parentElement)) continue
        const paragraph = boundedText(element.textContent)
        if (paragraph) section.paragraphs.push(paragraph)
        addLinks(element, section)
        continue
      }

      if (tagName === 'ul' || tagName === 'ol') {
        if (element.parentElement?.closest('ul,ol,figure,aside,[role="note"]')) continue
        const items = Array.from(element.children)
          .filter((child) => child.tagName.toLowerCase() === 'li')
          .map((child) => boundedText(child.textContent))
          .filter(Boolean)
        if (items.length) section.lists.push({ ordered: tagName === 'ol', items })
        addLinks(element, section)
        continue
      }

      if (tagName === 'figure') {
        const captionElement = element.querySelector('figcaption')
        const rawCaption = boundedText(captionElement?.textContent || '')
        const media = mediaFromFigure(element)
        const kind = calloutKind(rawCaption || element.textContent) || 'figure'
        examples.push({
          section_index: section.index,
          index: examples.length,
          kind,
          ...media,
          caption: cleanCaption(rawCaption) || null,
        })
        addLinks(element, section)
        continue
      }

      if (isCalloutContainer(element)) {
        if (element.parentElement && isCalloutContainer(element.parentElement)) continue
        if (element.closest('figure')) continue
        const rawCaption = boundedText(element.textContent)
        const kind = calloutKind(rawCaption)
        const caption = cleanCaption(rawCaption)
        if (caption && kind) {
          examples.push({
            section_index: section.index,
            index: examples.length,
            kind,
            media_type: null,
            media_url: null,
            alt: null,
            caption,
          })
        }
        addLinks(element, section)
        continue
      }

      if (tagName === 'a') {
        if (element.parentElement?.closest('p,li,figure,aside,[role="note"],h2,h3,h4,h5,h6')) {
          continue
        }
        addLinks(element, section)
      }
    }

    for (const section of sections) {
      section.text = [
        ...section.paragraphs,
        ...section.lists.flatMap((list) => list.items),
      ].join('\n')
      delete section._linkKeys
    }

    if (truncatedTextCount > 0) {
      pageErrors.push({
        code: 'CONTENT_TEXT_TRUNCATED',
        stage: 'content',
        message: 'One or more content fields exceeded the configured text limit',
        retryable: false,
        details: { truncated_field_count: truncatedTextCount, max_text_length: limits.maxTextLength },
      })
    }

    return {
      url: currentUrl,
      canonical_url: canonicalUrl,
      title,
      description,
      main_found: true,
      main_text_length: mainText.length,
      sections,
      examples,
      errors: pageErrors,
    }
  }, pageOptions)
}

export const extractMainContent = extractGenericContent
