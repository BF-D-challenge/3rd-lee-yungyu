---
name: design-google
description: >
  Local-first Material Design 3 (M3, Material You) guidance for components,
  design tokens, color, typography, shape, elevation, motion, accessibility,
  interaction states, and adaptive or responsive layouts. Trigger when a user
  asks what M3 recommends, how an M3 component should behave, which M3 token to
  use, or how to apply M3 guidance to an interface or implementation.
---

# Material Design 3 Local Knowledge

Use the captured Material Design 3 corpus before relying on general knowledge.
The default corpus is `docs/research/material-design-3` in the active repository.
The query tool reads only local files and performs no network requests.

## Trigger Boundary

Use this skill for:

- Material Design 3, M3, or Material You guidance.
- Components, interaction states, layout, navigation, and page patterns.
- Color, typography, shape, elevation, spacing, and other design tokens.
- Motion, transitions, gestures, and state changes.
- Accessibility, touch targets, semantics, contrast, focus, and input methods.
- Adaptive or responsive behavior across window sizes, devices, and postures.
- Applying official M3 guidance to product design or implementation code.

Do not trigger for an unrelated visual-design question that does not ask for an
M3 perspective.

## Required Workflow

1. Turn the request into one or more narrow local searches. Search the main
   concept first, then use `--component` or `--page-type` when the corpus has
   suitable metadata.
2. Run `scripts/query_m3.py`. From the repository root:

   ```bash
   python3 .claude/skills/design-google/scripts/query_m3.py \
     "navigation rail selection indicator" --component "navigation rail"
   ```

   From the runtime-synced skill:

   ```bash
   python3 /Users/yungyulee/.agents/skills/design-google/scripts/query_m3.py \
     "compact window navigation" --page-type "adaptive"
   ```

3. For a complex request, run separate searches for component behavior,
   tokens, motion, accessibility, and adaptation. Do not treat one broad hit as
   sufficient evidence for every part of the answer.
4. If a filter produces no results, retry once with a synonym or without the
   filter. Read warnings before concluding that guidance is absent.
5. Paraphrase the relevant records. Do not reproduce a page or long passage.
6. Present sourced M3 guidance separately from implementation advice or
   inference. Never make an implementation preference sound like an official
   M3 requirement.

See [references/USAGE.md](references/USAGE.md) for CLI examples and
[references/SCHEMA.md](references/SCHEMA.md) for the corpus contract.

## Evidence Rules

- Treat a claim as official guidance only when a matching local record identifies
  an official source through `source_kind: "official"` or an official Material or
  Android design URL.
- Include each record's `source_url` and `captured_at` next to the claim when
  available. If either is absent, say that the local record lacks that metadata.
- Use the local source file and line reported by the tool to distinguish records
  when source metadata is incomplete.
- Prefer several short paraphrases over a long quotation. Quote only when exact
  wording is essential, and keep the excerpt short.
- Do not claim that the corpus is current. `captured_at` is evidence of capture
  time, not a promise that the page has not changed.
- Do not fill an evidence gap from memory without labeling it as inference.

Use this response structure whenever recommendations are included:

```markdown
## Official M3 guidance

- [Paraphrased guidance.] Source: [title](source_url), captured `captured_at`.

## Implementation recommendation (inference)

- [Stack- and product-specific recommendation derived from the guidance.]

## Evidence gaps

- [Missing corpus file, metadata, or unverified topic, only when relevant.]
```

If there is no verified local evidence, say so under `Official M3 guidance` and
offer only clearly labeled inference. Do not manufacture an official answer.

## Missing Or Incomplete Corpus

The query tool reports a missing corpus without a traceback and continues over
available files when only part of the corpus exists.

- Missing directory: report the checked location and suggest `--corpus` or
  `M3_CORPUS_DIR`.
- Missing JSONL files: use the available records and disclose the warning.
- Invalid JSONL rows: use valid rows and disclose the skipped-row count.
- No relevant result: state that the local corpus did not verify the claim. This
  is not proof that M3 has no guidance on the topic.

## Live Refresh Boundary

Never crawl, browse, or fetch live M3 pages during ordinary guidance requests.
Only refresh when the user explicitly asks to refresh, re-capture, or update the
local M3 corpus. A request for M3 guidance by itself is not refresh permission.

For an explicit refresh:

1. Use Firecrawl **map only** to discover candidate URLs from official M3 seed
   URLs. Do not use Firecrawl scrape, crawl, extract, or search for page content.
2. Restrict and deterministically sort the mapped URLs to official Material or
   Android design domains.
3. Use Browser Use `tab.playwright` to open each page and capture rendered page
   content and metadata. Do not substitute a generic HTTP fetcher.
4. Normalize captures into the JSONL schema, preserving `source_url` and an ISO
   8601 `captured_at` value on every record that can carry them.
5. Report unavailable tooling or blocked pages instead of silently switching to
   a different live acquisition method.

The refresh process is separate from answering. After refresh, query the local
files again and base the answer on those records.

## Query Examples

```bash
# Free-text component guidance
python3 .claude/skills/design-google/scripts/query_m3.py \
  "button disabled state accessibility" --component button --limit 5

# Token lookup as machine-readable output
python3 .claude/skills/design-google/scripts/query_m3.py \
  "md sys color primary" --json

# Page-pattern filter
python3 .claude/skills/design-google/scripts/query_m3.py \
  "navigation changes across window sizes" --page-type adaptive

# Explicit corpus override
python3 .claude/skills/design-google/scripts/query_m3.py \
  "emphasized easing" --corpus /path/to/material-design-3
```
