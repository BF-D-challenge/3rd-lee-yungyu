# Store Rankings Research

Collected and normalized for PRD idea mining alongside `research/trustmrr-acquire/ideas.jsonl`.

Parent index: [../README.md](../README.md)  
Machine-readable catalog: [../MANIFEST.json](../MANIFEST.json)

## Files

- [app-store-rankings.jsonl](app-store-rankings.jsonl): first Apple RSS baseline capture from US/KR free/paid charts.
- [app-store-rss-expanded.jsonl](app-store-rss-expanded.jsonl): Apple RSS charts expanded across 12 storefronts.
- [app-store-category-charts.jsonl](app-store-category-charts.jsonl): Apple App Store iPhone category chart appearances across 4 storefronts.
- [app-store-search-keyword-samples.jsonl](app-store-search-keyword-samples.jsonl): iTunes Search API keyword samples. These are search-order samples, not official chart rankings.
- [app-store-expanded-unique-apps.jsonl](app-store-expanded-unique-apps.jsonl): app-level deduped summary across the three expanded App Store sources.
- [chrome-webstore-rankings.jsonl](chrome-webstore-rankings.jsonl): Chrome Web Store chart/search-result appearances.
- [chrome-webstore-expanded-appearances.jsonl](chrome-webstore-expanded-appearances.jsonl): Chrome Web Store category, top chart, and keyword-search appearances.
- [chrome-webstore-expanded-unique-extensions.jsonl](chrome-webstore-expanded-unique-extensions.jsonl): extension-level deduped summary across the expanded Chrome Web Store sources.
- [trustmrr-store-overlap.jsonl](trustmrr-store-overlap.jsonl): conservative exact normalized-name matches between TrustMRR and the first store capture.

## Codex Entry Points

- Use [app-store-expanded-unique-apps.jsonl](app-store-expanded-unique-apps.jsonl) for a compact App Store app universe.
- Use [chrome-webstore-expanded-unique-extensions.jsonl](chrome-webstore-expanded-unique-extensions.jsonl) for a compact Chrome extension universe.
- Use [app-store-category-charts.jsonl](app-store-category-charts.jsonl), [app-store-rss-expanded.jsonl](app-store-rss-expanded.jsonl), [app-store-search-keyword-samples.jsonl](app-store-search-keyword-samples.jsonl), and [chrome-webstore-expanded-appearances.jsonl](chrome-webstore-expanded-appearances.jsonl) when source/rank context matters.

Raw Firecrawl outputs are under `.firecrawl/store-rankings/` and ignored by git.

## Method Tests

| Method | Test result | Collection decision |
| --- | --- | --- |
| Apple RSS chart limit | `100` works; `200` returned an Apple server error | Expand by storefront, not by larger page size |
| App Store category chart pages | Each category chart returned about 24-25 app links | Collect full category grid for US/KR/JP/GB |
| iTunes Search API | `rawHtml` is parseable JSON and returns about 40-50 apps per keyword | Keep as non-ranking keyword discovery data |
| Chrome Web Store category pages | Each valid category/sort page returned about 30-32 extension links | Collect all discovered category pages with default, highest-rated, and highest-rated featured variants |
| Chrome Web Store search pages | Each keyword page returned about 10 extension links | Use broad keyword samples to supplement category coverage |

## Current Counts

| Dataset | Rows |
| --- | --- |
| TrustMRR Acquire | 1863 |
| Apple App Store baseline RSS | 399 |
| Apple App Store expanded RSS | 1890 |
| Apple App Store category charts | 4949 |
| Apple App Store keyword search samples | 1041 |
| Apple App Store expanded unique apps | 4512 |
| Chrome Web Store baseline appearances | 65 |
| Chrome Web Store expanded appearances | 2452 |
| Chrome Web Store expanded unique extensions | 2031 |

## Expanded RSS

Source pattern: `https://rss.marketingtools.apple.com/api/v2/{country}/apps/{top-free|top-paid}/100/apps.json`

| Country | Chart | Rows |
| --- | --- | --- |
| AU | top-free | 100 |
| AU | top-paid | 100 |
| BR | top-free | 100 |
| BR | top-paid | 100 |
| CA | top-paid | 99 |
| DE | top-paid | 99 |
| FR | top-paid | 99 |
| GB | top-free | 100 |
| GB | top-paid | 97 |
| IN | top-paid | 98 |
| JP | top-free | 100 |
| KR | top-free | 100 |
| KR | top-paid | 99 |
| MX | top-free | 100 |
| MX | top-paid | 100 |
| SG | top-free | 100 |
| SG | top-paid | 100 |
| US | top-free | 100 |
| US | top-paid | 99 |

Key fields: `country`, `chart_type`, `rank`, `name`, `developer`, `app_id`, `release_date`, `url`.

## Category Charts

Source pattern: `https://apps.apple.com/{country}/iphone/charts/{category_id}?chart={top-free|top-paid}`

| Country | Rows |
| --- | --- |
| GB | 1237 |
| JP | 1236 |
| KR | 1232 |
| US | 1244 |

Covered storefronts: `US`, `KR`, `JP`, `GB`.
Covered category ids: `36, 6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011, 6012, 6013, 6015, 6016, 6017, 6018, 6020, 6021, 6023, 6024, 6026, 6027`.

Key fields: `country`, `category_id`, `category`, `chart_type`, `rank`, `name`, `app_id`, `url`.

## Keyword Search Samples

Source pattern: `https://itunes.apple.com/search?term={query}&country={country}&entity=software&limit=50`

| Country | Rows |
| --- | --- |
| KR | 502 |
| US | 539 |

Covered queries: `ai`, `productivity`, `todo`, `notes`, `calendar`, `finance`, `habit`, `fitness`, `scanner`, `email`, `marketing`, `developer tools`.

Key fields: `country`, `query`, `rank`, `name`, `developer`, `category`, `average_user_rating`, `user_rating_count`, `price`, `description`, `url`.

## Chrome Web Store Baseline

Sources include `popular`, `ai`, `productivity`, `developer tools`, and `marketing`.

| Source page | Rows |
| --- | --- |
| popular | 25 |
| search-ai | 10 |
| search-developer-tools | 10 |
| search-marketing | 10 |
| search-productivity | 10 |

Chrome `rank` is the visible order on the captured page/search result, not a separate public numeric ranking API.

## Chrome Web Store Expanded

Category source pattern: `https://chromewebstore.google.com/category/{category_path}`
Search source pattern: `https://chromewebstore.google.com/search/{query}`

| Source type | Rows |
| --- | --- |
| category | 1818 |
| keyword_search | 609 |
| top_chart | 25 |

Variant coverage:

| Variant | Rows |
| --- | --- |
| default | 1240 |
| highest-rated | 606 |
| highest-rated-featured | 606 |

Covered category groups:

- `extensions`
- `productivity/tools`, `productivity/workflow`, `productivity/developer`, `productivity/education`, `productivity/communication`
- `lifestyle/shopping`, `lifestyle/news`, `lifestyle/fun`, `lifestyle/household`, `lifestyle/games`, `lifestyle/well_being`, `lifestyle/art`, `lifestyle/entertainment`, `lifestyle/social`, `lifestyle/travel`
- `make_chrome_yours/privacy`, `make_chrome_yours/functionality`, `make_chrome_yours/accessibility`

Covered keyword searches include `ai`, `automation`, `productivity`, `developer`, `marketing`, `sales`, `crm`, `email`, `gmail`, `calendar`, `notes`, `todo`, `focus`, `timer`, `meeting`, `transcript`, `pdf`, `translator`, `writing`, `seo`, `analytics`, `ads`, `shopping`, `coupon`, `price`, `privacy`, `security`, `vpn`, `password`, `tab`, `bookmark`, `screenshot`, `screen recorder`, `video`, `youtube`, `music`, `language`, `education`, `math`, `design`, `color`, `accessibility`, `weather`, `news`, `finance`, `crypto`, `social`, `twitter`, `linkedin`, `notion`, `slack`, `github`, `jira`, `figma`, `dark mode`, `reader`, `download`, `image`, `form`, `testing`, `json`, `api`.

Key fields: `source_type`, `source_slug`, `variant`, `query`, `rank`, `name`, `extension_id`, `rating`, `description`, `featured`, `established_publisher`, `url`.

## PRD Usage

Use `app-store-expanded-unique-apps.jsonl` and `chrome-webstore-expanded-unique-extensions.jsonl` when you want compact app/extension universes. Use the appearance files when rank/source context matters.
For opportunity mining, join Store signals with TrustMRR by normalized name first, then manually review fuzzy matches; exact matching is intentionally conservative.
