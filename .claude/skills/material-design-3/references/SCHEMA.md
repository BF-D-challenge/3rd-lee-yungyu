# Material Design 3 Local Corpus Schema

The corpus is a UTF-8 JSONL dataset stored at
`docs/research/material-design-3`. Each non-empty line must be one JSON object.
The query tool ignores unknown fields, skips invalid rows with a warning, and
searches these files in this fixed order:

1. `pages.jsonl`
2. `sections.jsonl`
3. `tokens.jsonl`
4. `examples.jsonl`

The exact extractor contract, hash input, and integrity rules for the current
capture are documented in `docs/research/material-design-3/SCHEMA.md`. This
skill reference describes the fields relevant to retrieval.

## Common Fields

| Field | Type | Requirement | Meaning |
| --- | --- | --- | --- |
| `id` | string | Recommended | Stable record identifier. |
| `title` | string | Recommended | Human-readable title, heading, or token name. |
| `source_url` | string | Recommended | Canonical source page URL. |
| `captured_at` | string | Recommended | ISO 8601 capture timestamp or date. |
| `source_kind` | string | Recommended | Source authority, normally `official`. |
| `component` / `components` | string or string[] | Optional | Component names used by `--component`. |
| `page_type` / `page_types` | string or string[] | Optional | Pattern or page classification used by `--page-type`. |
| `keywords` / `tags` | string[] | Optional | Search aliases and related concepts. |
| `summary` / `description` | string | Optional | Short paraphrase suitable for search results. |
| `text` / `content` | string | Optional | Captured source text. Output is always truncated to a short snippet. |

Camel-case aliases such as `sourceUrl`, `capturedAt`, `pageId`, and `pageType`
are accepted. Nested `source.url` and `source.captured_at` are also accepted.
Canonical snake-case fields are preferred for newly captured data.

## File Contracts

### `pages.jsonl`

One object per captured page. A page is the metadata parent for sections,
tokens, and examples that refer to it with `page_id`.

The current corpus uses `status` values `completed` and `error`. Confirmed stale
redirects and non-document utilities remain as explicit error rows with
`resolution_type`, `resolution_reason`, and optionally `observed_final_url`.
Their `content` and child counts are zero so destination text cannot be
misattributed to the stale source URL.

Recommended fields:

```json
{"id":"components-button","title":"Buttons","page_type":"component","components":["button"],"summary":"Buttons help people take actions.","source_kind":"official","source_url":"https://m3.material.io/components/buttons/overview","captured_at":"2026-07-10T00:00:00Z"}
```

### `sections.jsonl`

One object per meaningful page section. Keep sections small enough to represent
one guidance claim but large enough to preserve its qualifications.

Recommended fields: `id`, `page_id`, `heading`, `text`, `component`, and
`keywords`.

```json
{"id":"buttons-accessibility-touch-target","page_id":"components-button","heading":"Touch target","component":"button","keywords":["accessibility","touch target"],"text":"Provide an adequately sized target around the visible button."}
```

When a child record omits `source_url`, `captured_at`, `source_kind`,
`page_type`, or `components`, the query tool inherits the field from the matching
page. Child values always win.

### `tokens.jsonl`

One object per design token or closely related token group.

Recommended fields: `id`, `page_id`, `token`, `category`, `value`,
`description`, `platform`, and `component` when component-specific.

The current extractor stores the canonical token identifier in `name`, with
`token_set`, `token_set_name`, `type`, `value`, and deprecation metadata.

```json
{"id":"md-sys-color-primary","page_id":"styles-color","token":"md.sys.color.primary","category":"color","description":"Primary brand and key action color role.","platform":["android","web"]}
```

Token `value` is optional because semantic values can vary by generated scheme,
theme, platform, or implementation.

### `examples.jsonl`

One object per concise example. Store only the context needed to understand the
guidance; do not use this file as a mirror of long source pages.

Recommended fields: `id`, `page_id`, `title`, `component`, `page_type`,
`description`, and optionally short `code`, `do`, or `dont` values.

The current extractor stores `kind` as `figure`, `do`, `dont`, or `caution`,
plus `caption`, `alt`, `text`, and optional media fields. `media_only: true`
means no textual description was available; do not infer one from the image
URL or surrounding topic.

```json
{"id":"adaptive-navigation-example","page_id":"adaptive-layouts","title":"Swap navigation by window size","page_type":"adaptive","components":["navigation bar","navigation rail"],"description":"Use navigation patterns that fit the available window size instead of device labels."}
```

## Provenance

- Capture `source_url` and `captured_at` on every page record.
- Add them directly to standalone records that do not have a resolvable
  `page_id`.
- Use `source_kind: "official"` only for official source material.
- Record implementation notes as examples or separate project documentation,
  not as official guidance in the corpus.
- A capture timestamp describes when content was collected. It does not prove
  that the source is still unchanged.

## Deterministic Search Contract

The query tool normalizes Unicode with NFKC, compares case-insensitively, and
scores exact phrases and term matches with these field priorities:

1. title or token name
2. component
3. page type
4. keywords and categories
5. summary or description
6. body text
7. other non-provenance fields

All query terms receive a coverage bonus. English question stopwords are ignored
for term coverage. Prefix matching is allowed for terms of four or more
characters, which handles common singular/plural variants.

Ties are resolved by score, fixed file order, normalized title, normalized ID,
and source line. The output order therefore does not depend on hash iteration,
locale, or filesystem enumeration.

Filters use normalized exact, contained, or token-prefix matching. Repeating a
filter is an OR operation; using both component and page-type filters is an AND
operation.
