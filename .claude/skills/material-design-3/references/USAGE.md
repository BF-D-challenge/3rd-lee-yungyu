# Material Design 3 Query Tool Usage

`query_m3.py` searches a local corpus with Python's standard library only. It
does not access the network or modify the corpus.

## Synopsis

```text
python3 scripts/query_m3.py [QUERY ...]
    [--component NAME]
    [--page-type TYPE]
    [--limit 1..100]
    [--json]
    [--corpus DIRECTORY]
```

Free text can be quoted or passed as several positional words. At least one of
free text, `--component`, or `--page-type` is required.

## Corpus Resolution

Resolution uses this precedence:

1. `--corpus DIRECTORY`
2. `M3_CORPUS_DIR`
3. `docs/research/material-design-3` derived from the repository skill path
4. `docs/research/material-design-3` under the current directory or an ancestor

Step 4 allows the runtime-synced script at
`/Users/yungyulee/.agents/skills/material-design-3/scripts/query_m3.py` to find
the active repository corpus when the command runs anywhere inside that
repository.

Examples:

```bash
M3_CORPUS_DIR=/tmp/m3-corpus \
  python3 .claude/skills/material-design-3/scripts/query_m3.py "motion easing"

python3 /Users/yungyulee/.agents/skills/material-design-3/scripts/query_m3.py \
  "navigation rail" --corpus "$PWD/docs/research/material-design-3"
```

An explicit but missing `--corpus` or `M3_CORPUS_DIR` is reported rather than
silently replaced with another corpus.

## Search Examples

```bash
# Natural-language lookup
python3 .claude/skills/material-design-3/scripts/query_m3.py \
  "How should a button communicate a disabled state?"

# Component and page-type filters
python3 .claude/skills/material-design-3/scripts/query_m3.py \
  "selection indicator" --component "navigation rail" --page-type component

# Filter-only inventory query
python3 .claude/skills/material-design-3/scripts/query_m3.py \
  --component button --limit 20

# Repeated values use OR within the same filter
python3 .claude/skills/material-design-3/scripts/query_m3.py \
  "window size" --page-type adaptive --page-type responsive

# Machine-readable output
python3 .claude/skills/material-design-3/scripts/query_m3.py \
  "md sys color primary" --json --limit 3
```

## Text Output

Text output includes the corpus path, warnings, deterministic score, bounded
snippet, component and page-type metadata, source URL, capture time, and local
JSONL line. Missing provenance is printed explicitly.

Example shape:

```text
1. [section] Touch target (score 154)
   Provide an adequately sized target around the visible button.
   Components: button
   Page types: component
   Source: https://m3.material.io/components/buttons/accessibility
   Captured: 2026-07-10T00:00:00Z
   Local record: sections.jsonl:12
```

The snippet is at most 280 characters. Use the source metadata to support a
short paraphrase; do not concatenate snippets into a reproduction of the page.

## JSON Output

`--json` emits a stable object with:

- `status`: `ok`, `corpus_incomplete`, `corpus_empty`, or `corpus_missing`.
- `query`, `filters`, `limit`, and corpus resolution metadata.
- `searched_files`, `missing_files`, `unreadable_files`, `invalid_records`, and
  `warnings`.
- `records_scanned` and `matched_records`.
- `results`, each containing rank, score, record identity, short snippet,
  filters, provenance, and local file/line metadata.

Every result includes `source_url` and `captured_at`; either value can be `null`
when the corpus lacks it. Child records inherit available page provenance through
`page_id`.

## Failure And Partial Data Behavior

- Missing corpus directory: prints a structured message with no traceback and
  exits with status 2.
- Existing but incomplete corpus: searches available files, warns, and exits 0.
- Empty corpus: reports `corpus_empty` with no traceback and exits 0.
- Unreadable JSONL file: searches other files, reports the filename, and exits 0.
- Invalid JSONL row: skips the row, counts it, warns, and exits 0.
- No matches: returns an empty result list and exits 0.
- Invalid arguments or an out-of-range limit: `argparse` explains the problem and
  exits with status 2.

Do not interpret zero matches as proof that official M3 guidance does not exist.
It means only that the available local records did not match.

## Miniature Corpus Example

The following records are enough to exercise inheritance, ranking, filters, and
missing-file warnings:

```jsonl
{"id":"buttons","title":"Buttons","page_type":"component","components":["button"],"summary":"Buttons let people take action.","source_kind":"official","source_url":"https://m3.material.io/components/buttons/overview","captured_at":"2026-07-10T00:00:00Z"}
{"id":"button-touch","page_id":"buttons","heading":"Touch target accessibility","component":"button","keywords":["touch target","accessibility"],"text":"Keep the interactive target large enough to operate reliably."}
{"id":"primary-token","page_id":"buttons","token":"md.sys.color.primary","category":"color","description":"A semantic color role used for prominent actions."}
```

Place the first object in `pages.jsonl`, the second in `sections.jsonl`, and the
third in `tokens.jsonl`, then run:

```bash
python3 scripts/query_m3.py \
  "touch target accessibility" --component button --corpus /tmp/m3-mini --json
```

Because `examples.jsonl` is absent, the result remains usable with
`status: "corpus_incomplete"` and a warning.
