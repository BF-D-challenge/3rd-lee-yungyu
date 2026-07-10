# Project Structure

This repository keeps runtime code, product documents, research corpora, and generated data in separate top-level folders.

## Runtime

- `src/app/` - Next.js routes.
- `src/components/` - UI components grouped by atoms, layouts, molecules, and organisms.
- `src/lib/` - app logic, storage, sharing, drawing, and backend helpers.
- `src/data/combos.json` - compact combo source data only. Do not put golden cards here.
- `public/data/golden.json` - runtime-fetched v7 golden cards.
- `public/cards/` - card visual assets.
- `supabase/` - SQL setup and backend schema notes.

## Documents

- `docs/prd/` - active PRDs and rollout specs.
- `docs/prd/archive/` - older PRDs and superseded planning documents.
- `docs/research/` - research corpus and dataset guides. This is the canonical home for research documents.
- `docs/dev/` - implementation notes, experiments, setup guides, and local tooling notes.
- `docs/dev/archive/` - superseded implementation guides kept for traceability.

## Scripts

- `scripts/rollout/` - golden-card rollout helpers.
- `scripts/experiments/` - one-off experiment scripts that are still useful to rerun.
- `scripts/check-supabase.mjs` - Supabase connectivity check.

## Local Or Ignored

- `.claude/skills/` - local agent skills. Research documents should not live under `.claude/knowledge`; they have been moved to `docs/research/`.
- `.firecrawl/` - ignored raw crawl/cache data.
- `.next/`, `node_modules/`, `scratchpad/`, `tmp/` - generated local working directories.
