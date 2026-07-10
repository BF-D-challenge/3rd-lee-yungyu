export {
  ExtractionError,
  aggregateErrors,
  assertExistingTab,
  toStructuredError,
} from './errors.mjs'
export { crawlShard } from './crawl-shard.mjs'
export { extractGenericContent, extractMainContent } from './extract-content.mjs'
export { assertUrlRecord, extractMaterialPage, extractPage } from './extract-page.mjs'
export { extractSpecTokens, extractTokenViewerData } from './extract-tokens.mjs'
export {
  canonicalizeUrl,
  createContentHash,
  createDeterministicId,
  createUrlId,
  inferMaterialRoute,
  stableStringify,
} from './identity.mjs'
export { pollMaterialReadiness, waitForMaterialPage } from './readiness.mjs'

export function toJsonl(records) {
  return records.map((record) => JSON.stringify(record)).join('\n')
}
