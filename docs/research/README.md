---
name: research--datasets-readme
description: docs/research의 JSONL 데이터셋 전용 사람용 가이드 — 최종 아이디어 결정 장부·Mobbin 앱 액션 패턴·TrustMRR 인수시장·앱스토어·크롬 웹스토어 수요 신호 데이터의 파일 맵, 추천 탐색 경로, 조인 키, 검증 명령을 담는다. 문서 코퍼스를 포함한 전체 지도는 INDEX.md.
metadata:
  type: dataset
  topic: research-datasets
  category: readme
  date: 2026-07-13
---

# Research Datasets Guide

This file is the guide for the **JSONL datasets** in this folder (TrustMRR acquisition signals, Apple App Store demand signals, Chrome Web Store extension signals). For the full map of `docs/research/` including the markdown research corpora, start at [INDEX.md](INDEX.md).

## Start Here

- Machine-readable catalog: [MANIFEST.json](MANIFEST.json)
- Final 62-candidate decision ledger: [idea-final-decisions-62.jsonl](idea-final-decisions-62.jsonl)
- Idea-source coverage summary: [idea-source-coverage-summary.md](idea-source-coverage-summary.md)
- Idea-source coverage ledger: [idea-source-coverage.jsonl](idea-source-coverage.jsonl)
- Newsletter discovery queue: [newsletter-leads/README.md](newsletter-leads/README.md)
- Tinder/Gas card action cache: [mobbin/mobile-card-action-patterns.jsonl](mobbin/mobile-card-action-patterns.jsonl)
- Material Design 3 local corpus: [material-design-3/README.md](material-design-3/README.md)
- TrustMRR acquisition ideas: [trustmrr-acquire/ideas.jsonl](trustmrr-acquire/ideas.jsonl)
- App Store compact universe: [store-rankings/app-store-expanded-unique-apps.jsonl](store-rankings/app-store-expanded-unique-apps.jsonl)
- Chrome Web Store compact universe: [store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](store-rankings/chrome-webstore-expanded-unique-extensions.jsonl)
- Store collection details: [store-rankings/README.md](store-rankings/README.md)
- TrustMRR collection details: [trustmrr-acquire/README.md](trustmrr-acquire/README.md)

## File Map

| File | Rows | Unique entities | Use when |
| --- | ---: | ---: | --- |
| [idea-final-decisions-62.jsonl](idea-final-decisions-62.jsonl) | 62 | 62 candidates | You need the final Experiment Pass/Merge/Custom Reserve/Fail decision, UX consensus, gate, reason, or merge target without reopening deprecated queues. |
| [idea-source-coverage.jsonl](idea-source-coverage.jsonl) | 8,406 | 8,406 dataset-scoped sources | You need to select only unseen idea sources, preserve review status, or avoid repeating a prior source. |
| [newsletter-leads/newsletter-leads.jsonl](newsletter-leads/newsletter-leads.jsonl) | 7 | 7 external newsletter leads | You need to retain newsletter-discovered cases without changing the 8,406-source denominator or promoting any case to app cards. |
| [mobbin/mobile-card-action-patterns.jsonl](mobbin/mobile-card-action-patterns.jsonl) | 6 | 6 patterns/decisions | You need Tinder/Gas card actions, Gas invite mechanics, the two-card decision, or the K=1 round loop without re-querying Mobbin. |
| [material-design-3/](material-design-3/) | 10,836 | 403 official URLs | You need locally searchable M3 component, foundation, style, accessibility, motion, example, or design-token guidance without re-crawling the site. |
| [trustmrr-acquire/ideas.jsonl](trustmrr-acquire/ideas.jsonl) | 1,863 | 1,863 startups | You need acquisition-market idea seeds with revenue, asking price, problem, opportunity, and MVP angle. |
| [store-rankings/app-store-expanded-unique-apps.jsonl](store-rankings/app-store-expanded-unique-apps.jsonl) | 4,512 | 4,512 apps | You need a compact deduped App Store universe. |
| [store-rankings/app-store-rss-expanded.jsonl](store-rankings/app-store-rss-expanded.jsonl) | 1,890 | 1,083 apps | You need App Store country-level free/paid chart appearances. |
| [store-rankings/app-store-category-charts.jsonl](store-rankings/app-store-category-charts.jsonl) | 4,949 | 3,473 apps | You need category, country, chart, and rank context. |
| [store-rankings/app-store-search-keyword-samples.jsonl](store-rankings/app-store-search-keyword-samples.jsonl) | 1,041 | 749 apps | You need keyword discovery samples with rating, review count, price, and descriptions. |
| [store-rankings/app-store-rankings.jsonl](store-rankings/app-store-rankings.jsonl) | 399 | 357 apps | You need the first US/KR free/paid App Store baseline capture. |
| [store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](store-rankings/chrome-webstore-expanded-unique-extensions.jsonl) | 2,031 | 2,031 extensions | You need a compact deduped Chrome Web Store universe. |
| [store-rankings/chrome-webstore-expanded-appearances.jsonl](store-rankings/chrome-webstore-expanded-appearances.jsonl) | 2,452 | 2,031 extensions | You need Chrome source, category, query, variant, and rank context. |
| [store-rankings/chrome-webstore-rankings.jsonl](store-rankings/chrome-webstore-rankings.jsonl) | 65 | 65 extensions | You need the first small Chrome baseline capture. |
| [store-rankings/trustmrr-store-overlap.jsonl](store-rankings/trustmrr-store-overlap.jsonl) | 0 | 0 matches | Placeholder for conservative exact normalized-name matches. |

## Recommended Exploration Paths

For Material Design 3 implementation:

1. Start with [material-design-3/README.md](material-design-3/README.md) and [material-design-3/MANIFEST.json](material-design-3/MANIFEST.json).
2. Search page and section guidance in `pages.jsonl` and `sections.jsonl`.
3. Use `tokens.jsonl` for component Specs and `examples.jsonl` for Do/Don't/Caution evidence.
4. Prefer the local `material-design-3` skill instead of reading the JSONL manually.

For PRD ideation:

1. Check [idea-final-decisions-62.jsonl](idea-final-decisions-62.jsonl) first so Fail ideas and Merge variants do not re-enter review.
2. Start new exploration with [idea-source-coverage-summary.md](idea-source-coverage-summary.md) and select only `unseen` rows from [idea-source-coverage.jsonl](idea-source-coverage.jsonl).
3. Use the linked TrustMRR/App Store/Chrome record to inspect the original market signal.
4. Compare demand patterns in [store-rankings/app-store-expanded-unique-apps.jsonl](store-rankings/app-store-expanded-unique-apps.jsonl) and [store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](store-rankings/chrome-webstore-expanded-unique-extensions.jsonl).
5. Drill into appearance files only when rank/source context matters:
   - [store-rankings/app-store-category-charts.jsonl](store-rankings/app-store-category-charts.jsonl)
   - [store-rankings/app-store-rss-expanded.jsonl](store-rankings/app-store-rss-expanded.jsonl)
   - [store-rankings/app-store-search-keyword-samples.jsonl](store-rankings/app-store-search-keyword-samples.jsonl)
   - [store-rankings/chrome-webstore-expanded-appearances.jsonl](store-rankings/chrome-webstore-expanded-appearances.jsonl)

For newsletter discovery:

1. Add a case to [newsletter-leads/newsletter-leads.jsonl](newsletter-leads/newsletter-leads.jsonl) with `denominator_effect: 0`.
2. Treat the newsletter as discovery/context only; find a product's official source before considering it a candidate.
3. Send only verified, distinct candidates to a separate 27-combination audit after the exhaustive 8,406 review; do not add them to EXH batches.

For market validation:

1. Use TrustMRR fields `revenue_30d_value`, `asking_price_value`, `multiple_text`, `category`, `problem`, and `mvp_angle`.
2. Use App Store fields `countries`, `categories`, `appearances_count`, `best_category_rank`, `average_user_rating`, `user_rating_count`, and `description`.
3. Use Chrome fields `source_types`, `source_slugs`, `queries`, `appearances_count`, `rating`, `featured_anywhere`, and `description`.

## Identity And Joins

- TrustMRR identity: `slug`
- App Store identity: `app_id`
- Chrome Web Store identity: `extension_id`
- Candidate cross-dataset matching: `normalized_name`

Treat `normalized_name` matches as candidates, not proof. Manually review fuzzy or exact name matches before using them as PRD evidence.

## Quick Commands

Count all JSONL rows:

```bash
python3 - <<'PY'
import json, pathlib
for path in sorted(pathlib.Path("docs/research").glob("**/*.jsonl")):
    rows = sum(1 for line in path.open(encoding="utf-8") if line.strip())
    print(f"{path}: {rows}")
PY
```

Preview high-revenue TrustMRR ideas:

```bash
jq -r 'select(.revenue_30d_value != null) | [.name, .category, .revenue_30d_value, .asking_price_value, .url] | @tsv' \
  docs/research/trustmrr-acquire/ideas.jsonl | sort -k3,3nr | head -20
```

Find App Store apps seen in Korea:

```bash
jq -r 'select((.countries // []) | index("kr")) | [.name, .developer, .appearances_count, (.categories | join(","))] | @tsv' \
  docs/research/store-rankings/app-store-expanded-unique-apps.jsonl | head -30
```

Find Chrome extensions related to a keyword:

```bash
jq -r 'select((.queries // []) | index("ai")) | [.name, .rating, .appearances_count, .url] | @tsv' \
  docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl | head -30
```

Count the idea-source review states:

```bash
jq -r '.review_status' docs/research/idea-source-coverage.jsonl | sort | uniq -c
```

Verify the final 62 decisions and empty pending queue:

```bash
node scripts/research/build-idea-user-validation-queue.mjs
node scripts/research/verify-idea-final-decisions.mjs
```

## Raw Sources And Scripts

Raw Firecrawl/browser captures are intentionally ignored by Git:

- `.firecrawl/m3-material-map.json` (URL discovery only; page content came from Browser Use)
- `.firecrawl/trustmrr-acquire/browser-cards-all.json`
- `.firecrawl/store-rankings/`

Normalization and collection scripts live in `.firecrawl/scratchpad/`:

- `.firecrawl/scratchpad/normalize_store_rankings.py`
- `.firecrawl/scratchpad/collect_app_store_expanded.py`
- `.firecrawl/scratchpad/normalize_app_store_expanded.py`
- `.firecrawl/scratchpad/collect_chrome_webstore_expanded.py`
- `.firecrawl/scratchpad/normalize_chrome_webstore_expanded.py`
