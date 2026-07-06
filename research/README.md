# Research Index

This folder is the local research corpus for PRD idea mining. Start here when Codex needs to inspect TrustMRR acquisition signals, Apple App Store demand signals, or Chrome Web Store extension signals.

## Start Here

- Machine-readable catalog: [MANIFEST.json](MANIFEST.json)
- TrustMRR acquisition ideas: [trustmrr-acquire/ideas.jsonl](trustmrr-acquire/ideas.jsonl)
- App Store compact universe: [store-rankings/app-store-expanded-unique-apps.jsonl](store-rankings/app-store-expanded-unique-apps.jsonl)
- Chrome Web Store compact universe: [store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](store-rankings/chrome-webstore-expanded-unique-extensions.jsonl)
- Store collection details: [store-rankings/README.md](store-rankings/README.md)
- TrustMRR collection details: [trustmrr-acquire/README.md](trustmrr-acquire/README.md)

## File Map

| File | Rows | Unique entities | Use when |
| --- | ---: | ---: | --- |
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

For PRD ideation:

1. Start with [trustmrr-acquire/ideas.jsonl](trustmrr-acquire/ideas.jsonl) to find monetized acquisition-market problems.
2. Compare demand patterns in [store-rankings/app-store-expanded-unique-apps.jsonl](store-rankings/app-store-expanded-unique-apps.jsonl) and [store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](store-rankings/chrome-webstore-expanded-unique-extensions.jsonl).
3. Drill into appearance files only when rank/source context matters:
   - [store-rankings/app-store-category-charts.jsonl](store-rankings/app-store-category-charts.jsonl)
   - [store-rankings/app-store-rss-expanded.jsonl](store-rankings/app-store-rss-expanded.jsonl)
   - [store-rankings/app-store-search-keyword-samples.jsonl](store-rankings/app-store-search-keyword-samples.jsonl)
   - [store-rankings/chrome-webstore-expanded-appearances.jsonl](store-rankings/chrome-webstore-expanded-appearances.jsonl)

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
for path in sorted(pathlib.Path("research").glob("**/*.jsonl")):
    rows = sum(1 for line in path.open(encoding="utf-8") if line.strip())
    print(f"{path}: {rows}")
PY
```

Preview high-revenue TrustMRR ideas:

```bash
jq -r 'select(.revenue_30d_value != null) | [.name, .category, .revenue_30d_value, .asking_price_value, .url] | @tsv' \
  research/trustmrr-acquire/ideas.jsonl | sort -k3,3nr | head -20
```

Find App Store apps seen in Korea:

```bash
jq -r 'select((.countries // []) | index("kr")) | [.name, .developer, .appearances_count, (.categories | join(","))] | @tsv' \
  research/store-rankings/app-store-expanded-unique-apps.jsonl | head -30
```

Find Chrome extensions related to a keyword:

```bash
jq -r 'select((.queries // []) | index("ai")) | [.name, .rating, .appearances_count, .url] | @tsv' \
  research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl | head -30
```

## Raw Sources And Scripts

Raw Firecrawl/browser captures are intentionally ignored by Git:

- `.firecrawl/trustmrr-acquire/browser-cards-all.json`
- `.firecrawl/store-rankings/`

Normalization and collection scripts live in `.firecrawl/scratchpad/`:

- `.firecrawl/scratchpad/normalize_store_rankings.py`
- `.firecrawl/scratchpad/collect_app_store_expanded.py`
- `.firecrawl/scratchpad/normalize_app_store_expanded.py`
- `.firecrawl/scratchpad/collect_chrome_webstore_expanded.py`
- `.firecrawl/scratchpad/normalize_chrome_webstore_expanded.py`
