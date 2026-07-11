import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "../..");
const sourceDir = path.join(rootDir, ".firecrawl/store-rankings/current");
const outputPath = path.join(rootDir, "docs/dev/app-store-trending-top-100.html");

const countries = [
  { code: "kr", label: "한국", locale: "ko-KR" },
  { code: "us", label: "미국", locale: "en-US" },
  { code: "jp", label: "일본", locale: "ja-JP" },
  { code: "gb", label: "영국", locale: "en-GB" },
];

const chartType = "top-free";
const generatedAt = new Date().toISOString();

const charts = [];
for (const country of countries) {
  const rss = await readFirecrawlJson(
    path.join(sourceDir, `${country.code}-top-free-rss.json`),
  );
  const lookup = await readFirecrawlJson(
    path.join(sourceDir, `${country.code}-lookup.json`),
  );
  const lookupById = new Map(
    (lookup.results ?? []).map((result) => [String(result.trackId), result]),
  );
  const feed = rss.feed;
  const apps = (feed.results ?? []).slice(0, 100).map((app, index) => {
    const detail = lookupById.get(String(app.id)) ?? {};
    const genres = (app.genres?.length ? app.genres : [])
      .map((genre) => genre.name)
      .filter(Boolean);
    const category =
      detail.primaryGenreName || genres[0] || detail.genres?.[0] || "미분류";

    return {
      appId: String(app.id),
      rank: index + 1,
      name: detail.trackName || app.name,
      developer: detail.artistName || app.artistName,
      category,
      genres,
      releaseDate: detail.releaseDate || app.releaseDate || null,
      currentVersionReleaseDate: detail.currentVersionReleaseDate || null,
      artworkUrl: detail.artworkUrl100 || app.artworkUrl100,
      url: detail.trackViewUrl || app.url,
      description: normalizeDescription(detail.description || ""),
      averageUserRating: roundNumber(detail.averageUserRating, 2),
      userRatingCount: detail.userRatingCount ?? null,
      formattedPrice: detail.formattedPrice || "무료",
      contentAdvisoryRating: detail.contentAdvisoryRating || "",
      sellerName: detail.sellerName || detail.artistName || app.artistName,
      minimumOsVersion: detail.minimumOsVersion || "",
      screenshotUrls: detail.screenshotUrls?.slice(0, 3) ?? [],
    };
  });

  charts.push({
    country: country.code,
    label: country.label,
    locale: country.locale,
    title: feed.title,
    sourceUrl: feed.id,
    feedUpdated: parseAppleFeedDate(feed.updated),
    apps,
  });
}

const rankIndex = new Map();
for (const chart of charts) {
  for (const app of chart.apps) {
    if (!rankIndex.has(app.appId)) rankIndex.set(app.appId, {});
    rankIndex.get(app.appId)[chart.country] = app.rank;
  }
}

for (const chart of charts) {
  for (const app of chart.apps) {
    app.countryRanks = rankIndex.get(app.appId) ?? {};
    app.countryAppearances = Object.keys(app.countryRanks).length;
  }
}

const payload = {
  generatedAt,
  chartType,
  sourceNote: "Apple Marketing Tools RSS top-free chart + iTunes Lookup API",
  countries,
  charts,
};

const embeddedData = JSON.stringify(payload).replaceAll("<", "\\u003c");
const defaultChart = charts.find((chart) => chart.country === "kr") ?? charts[0];
const newestFeedUpdated = charts
  .map((chart) => chart.feedUpdated)
  .filter(Boolean)
  .sort()
  .at(-1);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, buildHtml(), "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);

async function readFirecrawlJson(filePath) {
  const wrapped = JSON.parse(await readFile(filePath, "utf8"));
  return JSON.parse(wrapped.rawHtml);
}

function normalizeDescription(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function roundNumber(value, digits) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const multiplier = 10 ** digits;
  return Math.round(number * multiplier) / multiplier;
}

function parseAppleFeedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function escapeMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value, locale = "ko-KR") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function buildHtml() {
  return String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>App Store 무료 앱 Top 100</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #202522;
      --muted: #69716d;
      --paper: #f5f6f2;
      --surface: #ffffff;
      --line: #d9ded8;
      --line-strong: #bac3bc;
      --green: #145e52;
      --green-soft: #dcece7;
      --gold: #9a640d;
      --gold-soft: #f7e7c9;
      --blue: #245c9e;
      --blue-soft: #dfeafa;
      --header: #202523;
      --header-muted: #b8c1bc;
      --shadow: 0 8px 24px rgba(28, 40, 35, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
        "Noto Sans KR", "Segoe UI", sans-serif;
      letter-spacing: 0;
    }

    button,
    input,
    select {
      font: inherit;
      letter-spacing: 0;
    }

    button {
      cursor: pointer;
    }

    a {
      color: inherit;
    }

    .masthead {
      background: var(--header);
      color: #f8faf8;
      border-bottom: 4px solid #d99b3f;
    }

    .masthead-inner,
    main,
    .footer-inner {
      width: min(1440px, calc(100% - 48px));
      margin: 0 auto;
    }

    .masthead-inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 40px;
      align-items: end;
      padding: 44px 0 38px;
    }

    .eyebrow {
      margin: 0 0 12px;
      color: #78c6b2;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 40px;
      line-height: 1.12;
      font-weight: 760;
    }

    .dek {
      max-width: 820px;
      margin: 14px 0 0;
      color: var(--header-muted);
      font-size: 15px;
      line-height: 1.7;
    }

    .source-stamp {
      min-width: 280px;
      padding-left: 24px;
      border-left: 1px solid #4c5551;
    }

    .source-stamp dt {
      color: var(--header-muted);
      font-size: 12px;
    }

    .source-stamp dd {
      margin: 5px 0 14px;
      font-size: 14px;
      font-weight: 700;
    }

    main {
      padding: 28px 0 64px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--line);
      box-shadow: var(--shadow);
    }

    .summary-item {
      min-height: 112px;
      padding: 22px;
      background: var(--surface);
    }

    .summary-label {
      display: block;
      margin-bottom: 12px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }

    .summary-value {
      display: block;
      font-size: 26px;
      line-height: 1;
      font-weight: 780;
      font-variant-numeric: tabular-nums;
    }

    .summary-detail {
      display: block;
      margin-top: 9px;
      color: var(--muted);
      font-size: 12px;
    }

    .country-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .country-tab {
      min-width: 82px;
      padding: 10px 12px;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      background: var(--surface);
      color: var(--ink);
      font-size: 13px;
      font-weight: 760;
    }

    .country-tab[aria-selected="true"] {
      border-color: #92b8ae;
      background: var(--green-soft);
      color: var(--green);
    }

    .category-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 18px 0 8px;
      scrollbar-width: thin;
    }

    .category-chip {
      flex: 0 0 auto;
      padding: 7px 9px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .category-chip strong {
      margin-left: 5px;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
    }

    .toolbar {
      position: sticky;
      z-index: 5;
      top: 0;
      display: grid;
      grid-template-columns: minmax(240px, 1.4fr) minmax(180px, 0.8fr) minmax(190px, 0.8fr) auto;
      gap: 10px;
      margin-top: 12px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(245, 246, 242, 0.96);
      box-shadow: 0 5px 16px rgba(28, 40, 35, 0.07);
      backdrop-filter: blur(12px);
    }

    .field {
      position: relative;
    }

    .field label {
      position: absolute;
      top: 7px;
      left: 12px;
      z-index: 1;
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      pointer-events: none;
    }

    .field input,
    .field select {
      width: 100%;
      height: 54px;
      padding: 22px 12px 7px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      outline: 0;
      background: var(--surface);
      color: var(--ink);
    }

    .field input:focus,
    .field select:focus {
      border-color: var(--green);
      box-shadow: 0 0 0 3px rgba(23, 93, 80, 0.13);
    }

    .global-filter {
      display: flex;
      align-items: center;
      min-height: 54px;
      padding: 0 12px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      background: var(--surface);
      color: var(--ink);
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
    }

    .global-filter input {
      width: 18px;
      height: 18px;
      margin: 0 9px 0 0;
      accent-color: var(--green);
    }

    .result-line {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: center;
      margin: 22px 2px 10px;
    }

    .result-count {
      margin: 0;
      font-size: 16px;
      font-weight: 780;
    }

    .result-note {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      text-align: right;
    }

    .table-shell {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    table {
      width: 100%;
      min-width: 1180px;
      border-collapse: collapse;
      table-layout: fixed;
    }

    col.rank { width: 72px; }
    col.app { width: 260px; }
    col.description { width: auto; }
    col.category { width: 150px; }
    col.rating { width: 132px; }
    col.release { width: 120px; }
    col.global { width: 170px; }

    thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 13px 12px;
      border-bottom: 1px solid var(--line-strong);
      background: #edf0ec;
      color: #515955;
      font-size: 11px;
      font-weight: 800;
      text-align: left;
    }

    thead th.metric-cell,
    tbody td.metric-cell {
      text-align: right;
    }

    tbody tr {
      border-bottom: 1px solid var(--line);
    }

    tbody tr:last-child {
      border-bottom: 0;
    }

    tbody tr:hover {
      background: #f7faf8;
    }

    td {
      padding: 17px 12px;
      vertical-align: top;
      font-size: 13px;
      line-height: 1.55;
    }

    .rank-number {
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .app-cell {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }

    .app-icon {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #f0f2ef;
      object-fit: cover;
    }

    .app-link {
      display: inline;
      color: var(--ink);
      font-size: 14px;
      font-weight: 780;
      text-decoration-color: #8fa59c;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
      overflow-wrap: anywhere;
    }

    .app-link:hover {
      color: var(--green);
    }

    .developer {
      display: block;
      margin-top: 5px;
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .record-id {
      display: block;
      margin-top: 7px;
      color: #909793;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }

    .description-copy {
      display: -webkit-box;
      margin: 0;
      overflow: hidden;
      color: #333936;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      white-space: pre-wrap;
    }

    .empty-copy {
      color: #9b6a2c;
      font-style: italic;
    }

    details {
      margin-top: 9px;
    }

    summary {
      width: fit-content;
      color: var(--green);
      font-size: 11px;
      font-weight: 750;
      cursor: pointer;
    }

    .full-description {
      max-height: 260px;
      overflow: auto;
      margin: 8px 0 0;
      padding: 10px;
      border-left: 3px solid var(--gold);
      background: #f3f4f0;
      color: #535a56;
      font-size: 12px;
      line-height: 1.55;
      white-space: pre-wrap;
    }

    .category-label,
    .country-rank,
    .fresh-label {
      display: inline-block;
      padding: 4px 7px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 720;
      white-space: nowrap;
    }

    .category-label {
      border: 1px solid #b9d1c8;
      background: var(--green-soft);
      color: #225f52;
    }

    .fresh-label {
      margin-top: 7px;
      border: 1px solid #e8c78c;
      background: var(--gold-soft);
      color: var(--gold);
    }

    .rating-line,
    .date-line {
      display: block;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .subtle-line {
      display: block;
      margin-top: 5px;
      color: var(--muted);
      font-size: 11px;
      white-space: nowrap;
    }

    .country-rank-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 5px;
    }

    .country-rank {
      border: 1px solid #bfd0e8;
      background: var(--blue-soft);
      color: var(--blue);
    }

    footer {
      border-top: 1px solid var(--line);
      background: #e9ece8;
    }

    .footer-inner {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      padding: 28px 0 36px;
      color: #5d6561;
      font-size: 12px;
      line-height: 1.7;
    }

    .footer-inner p {
      margin: 0;
    }

    @media (max-width: 980px) {
      .masthead-inner {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .source-stamp {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px 24px;
        min-width: 0;
        padding: 18px 0 0;
        border-top: 1px solid #4c5551;
        border-left: 0;
      }

      .source-stamp dd {
        margin-bottom: 8px;
      }

      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .toolbar {
        position: static;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 720px) {
      .masthead-inner,
      main,
      .footer-inner {
        width: min(100% - 28px, 1440px);
      }

      .masthead-inner {
        padding: 30px 0 28px;
      }

      h1 {
        font-size: 30px;
      }

      .summary-item {
        min-height: 104px;
        padding: 17px;
      }

      .summary-value {
        font-size: 22px;
      }

      .toolbar {
        grid-template-columns: 1fr;
      }

      .result-line {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
      }

      .result-note {
        text-align: left;
      }

      .table-shell {
        overflow: visible;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      table,
      tbody,
      tr,
      td {
        display: block;
        width: 100%;
      }

      table {
        min-width: 0;
      }

      thead,
      colgroup {
        display: none;
      }

      tbody {
        display: grid;
        gap: 10px;
      }

      tbody tr {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: 0 5px 14px rgba(28, 40, 35, 0.06);
      }

      tbody tr:hover {
        background: var(--surface);
      }

      td {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: 72px minmax(0, 1fr);
        gap: 10px;
        padding: 10px 13px;
        border-bottom: 1px solid #ecefeb;
        text-align: left !important;
      }

      td:last-child {
        border-bottom: 0;
      }

      td::before {
        content: attr(data-label);
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
      }

      td.description-cell {
        padding-top: 14px;
        padding-bottom: 14px;
      }

      .country-rank-list {
        justify-content: flex-start;
      }

      .record-id {
        overflow-wrap: anywhere;
      }

      .footer-inner {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <header class="masthead">
    <div class="masthead-inner">
      <div>
        <p class="eyebrow">Apple App Store 시장 신호</p>
        <h1>무료 앱 Top 100</h1>
        <p class="dek">Apple Marketing Tools RSS의 현재 무료 앱 차트를 가져와 iTunes Lookup 메타데이터와 합쳤습니다. 한국 차트를 기본으로 보되, 미국·일본·영국 차트에 함께 뜨는 앱은 별도 배지로 표시합니다.</p>
      </div>
      <dl class="source-stamp">
        <div>
          <dt>기본 화면</dt>
          <dd>${escapeMarkup(defaultChart.label)} · Top Free 100</dd>
        </div>
        <div>
          <dt>피드 업데이트</dt>
          <dd>${escapeMarkup(formatDate(newestFeedUpdated))}</dd>
        </div>
        <div>
          <dt>보강 원본</dt>
          <dd>iTunes Lookup API</dd>
        </div>
        <div>
          <dt>생성 시각</dt>
          <dd>${escapeMarkup(formatDate(generatedAt))}</dd>
        </div>
      </dl>
    </div>
  </header>

  <main>
    <section class="summary-grid" aria-label="차트 요약">
      <div class="summary-item">
        <span class="summary-label">표시 앱</span>
        <strong class="summary-value" id="metric-records">100</strong>
        <span class="summary-detail" id="metric-records-detail">현재 선택 국가</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">상위 카테고리</span>
        <strong class="summary-value" id="metric-top-category">-</strong>
        <span class="summary-detail" id="metric-top-category-detail">-</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">평점 4.5+</span>
        <strong class="summary-value" id="metric-high-rating">-</strong>
        <span class="summary-detail">사용자 평점 기준</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">4개국 공통 노출</span>
        <strong class="summary-value" id="metric-global">-</strong>
        <span class="summary-detail">KR/US/JP/GB 모두 Top 100</span>
      </div>
    </section>

    <nav class="country-tabs" id="country-tabs" aria-label="국가 선택"></nav>
    <div class="category-strip" id="category-strip" aria-label="상위 카테고리 분포"></div>

    <section class="toolbar" aria-label="앱 차트 필터">
      <div class="field">
        <label for="search">검색</label>
        <input id="search" type="search" autocomplete="off" placeholder="앱 이름, 개발사, 설명" />
      </div>
      <div class="field">
        <label for="category">카테고리</label>
        <select id="category">
          <option value="">전체 카테고리</option>
        </select>
      </div>
      <div class="field">
        <label for="sort">정렬</label>
        <select id="sort">
          <option value="rank">차트 순위</option>
          <option value="rating-count">평가 수 많은 순</option>
          <option value="rating">평점 높은 순</option>
          <option value="newest">최신 출시 순</option>
        </select>
      </div>
      <label class="global-filter">
        <input id="only-global" type="checkbox" />
        2개국 이상 노출
      </label>
    </section>

    <div class="result-line">
      <p class="result-count"><span id="result-count">100</span>개 앱</p>
      <p class="result-note" id="result-note">Apple RSS Top Free 100 기준</p>
    </div>

    <div class="table-shell">
      <table>
        <colgroup>
          <col class="rank" />
          <col class="app" />
          <col class="description" />
          <col class="category" />
          <col class="rating" />
          <col class="release" />
          <col class="global" />
        </colgroup>
        <thead>
          <tr>
            <th>순위</th>
            <th>앱</th>
            <th>설명</th>
            <th>카테고리</th>
            <th class="metric-cell">평점</th>
            <th>출시일</th>
            <th class="metric-cell">다른 국가 순위</th>
          </tr>
        </thead>
        <tbody id="apps-body"></tbody>
      </table>
    </div>
  </main>

  <footer>
    <div class="footer-inner">
      <p><strong>해석 범위</strong><br />이 목록은 무료 앱 차트의 현재 노출 순위입니다. 다운로드 수, 매출, 리텐션, 광고 집행 여부를 직접 의미하지는 않습니다.</p>
      <p><strong>생성 정보</strong><br />${escapeMarkup(formatDate(generatedAt))} · Apple Marketing Tools RSS와 iTunes Lookup API에서 자동 생성</p>
    </div>
  </footer>

  <script id="source-data" type="application/json">${embeddedData}</script>
  <script>
    const payload = JSON.parse(document.getElementById("source-data").textContent);
    const chartByCountry = new Map(payload.charts.map((chart) => [chart.country, chart]));
    const countryLabels = new Map(payload.countries.map((country) => [country.code, country.label]));
    const state = {
      country: "kr",
      search: "",
      category: "",
      sort: "rank",
      onlyGlobal: false,
    };

    const searchInput = document.getElementById("search");
    const categorySelect = document.getElementById("category");
    const sortSelect = document.getElementById("sort");
    const onlyGlobalInput = document.getElementById("only-global");
    const tableBody = document.getElementById("apps-body");
    const resultCount = document.getElementById("result-count");
    const resultNote = document.getElementById("result-note");

    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const numberFormat = new Intl.NumberFormat("ko-KR");
    const formatCount = (value) =>
      Number.isFinite(Number(value)) ? numberFormat.format(Number(value)) : "-";

    const formatRating = (value) =>
      Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "-";

    const formatDate = (value) => {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "-";
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    };

    const daysSince = (value) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
      return (Date.now() - date.getTime()) / 86400000;
    };

    const compareNullableNumbers = (a, b) => {
      const aa = Number.isFinite(Number(a)) ? Number(a) : Number.NEGATIVE_INFINITY;
      const bb = Number.isFinite(Number(b)) ? Number(b) : Number.NEGATIVE_INFINITY;
      return bb - aa;
    };

    function currentChart() {
      return chartByCountry.get(state.country) || payload.charts[0];
    }

    function renderTabs() {
      const tabs = document.getElementById("country-tabs");
      tabs.innerHTML = payload.countries
        .map((country) => {
          const chart = chartByCountry.get(country.code);
          return '<button class="country-tab" type="button" data-country="' +
            escapeHtml(country.code) +
            '" aria-selected="' +
            String(country.code === state.country) +
            '">' +
            escapeHtml(country.label) +
            ' <span>(' +
            escapeHtml(String(chart?.apps.length ?? 0)) +
            ')</span></button>';
        })
        .join("");

      tabs.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          state.country = button.dataset.country;
          state.category = "";
          categorySelect.value = "";
          render();
        });
      });
    }

    function categoryCounts(apps) {
      const counts = new Map();
      for (const app of apps) {
        counts.set(app.category, (counts.get(app.category) || 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }

    function renderCategories(apps) {
      const counts = categoryCounts(apps);
      const options = ['<option value="">전체 카테고리</option>']
        .concat(
          counts.map(
            ([category, count]) =>
              '<option value="' +
              escapeHtml(category) +
              '">' +
              escapeHtml(category) +
              " (" +
              count +
              ")</option>",
          ),
        )
        .join("");
      categorySelect.innerHTML = options;
      categorySelect.value = state.category;

      document.getElementById("category-strip").innerHTML = counts
        .slice(0, 12)
        .map(
          ([category, count]) =>
            '<span class="category-chip">' +
            escapeHtml(category) +
            "<strong>" +
            count +
            "</strong></span>",
        )
        .join("");

      const [topCategory, topCategoryCount] = counts[0] || ["-", 0];
      document.getElementById("metric-top-category").textContent = topCategory;
      document.getElementById("metric-top-category-detail").textContent =
        topCategoryCount ? topCategoryCount + "개 앱" : "-";
    }

    function filteredApps() {
      const query = state.search.trim().toLowerCase();
      let apps = [...currentChart().apps];
      if (query) {
        apps = apps.filter((app) =>
          [app.name, app.developer, app.description, app.category]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );
      }
      if (state.category) {
        apps = apps.filter((app) => app.category === state.category);
      }
      if (state.onlyGlobal) {
        apps = apps.filter((app) => app.countryAppearances >= 2);
      }

      apps.sort((a, b) => {
        if (state.sort === "rating-count") {
          return compareNullableNumbers(a.userRatingCount, b.userRatingCount) || a.rank - b.rank;
        }
        if (state.sort === "rating") {
          return compareNullableNumbers(a.averageUserRating, b.averageUserRating) || a.rank - b.rank;
        }
        if (state.sort === "newest") {
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0) || a.rank - b.rank;
        }
        return a.rank - b.rank;
      });

      return apps;
    }

    function renderSummary(apps) {
      const chart = currentChart();
      const highRating = chart.apps.filter((app) => Number(app.averageUserRating) >= 4.5).length;
      const allCountryCount = chart.apps.filter((app) => app.countryAppearances === payload.countries.length).length;
      document.getElementById("metric-records").textContent = chart.apps.length;
      document.getElementById("metric-records-detail").textContent = chart.label + " 무료 앱 차트";
      document.getElementById("metric-high-rating").textContent = highRating;
      document.getElementById("metric-global").textContent = allCountryCount;
      resultCount.textContent = apps.length;
      resultNote.textContent =
        chart.label +
        " · 피드 업데이트 " +
        new Intl.DateTimeFormat("ko-KR", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Seoul",
        }).format(new Date(chart.feedUpdated));
    }

    function renderTable(apps) {
      tableBody.innerHTML = apps
        .map((app) => {
          const fullDescription = app.description || "Lookup API에 설명이 없습니다.";
          const countryRanks = Object.entries(app.countryRanks)
            .filter(([country]) => country !== state.country)
            .sort((a, b) => a[1] - b[1])
            .map(
              ([country, rank]) =>
                '<span class="country-rank">' +
                escapeHtml(countryLabels.get(country) || country.toUpperCase()) +
                " #" +
                escapeHtml(rank) +
                "</span>",
            )
            .join("");
          const isFresh = daysSince(app.releaseDate) <= 180;
          return '<tr>' +
            '<td data-label="순위"><span class="rank-number">#' +
            escapeHtml(app.rank) +
            "</span></td>" +
            '<td data-label="앱"><div class="app-cell">' +
            '<img class="app-icon" src="' +
            escapeHtml(app.artworkUrl) +
            '" alt="" loading="lazy" />' +
            "<div>" +
            '<a class="app-link" href="' +
            escapeHtml(app.url) +
            '" target="_blank" rel="noreferrer">' +
            escapeHtml(app.name) +
            "</a>" +
            '<span class="developer">' +
            escapeHtml(app.developer) +
            "</span>" +
            '<span class="record-id">id ' +
            escapeHtml(app.appId) +
            "</span>" +
            "</div></div></td>" +
            '<td class="description-cell" data-label="설명">' +
            '<p class="description-copy' +
            (app.description ? "" : " empty-copy") +
            '">' +
            escapeHtml(fullDescription) +
            "</p>" +
            "<details><summary>전체 설명</summary>" +
            '<div class="full-description">' +
            escapeHtml(fullDescription) +
            "</div></details>" +
            "</td>" +
            '<td data-label="카테고리">' +
            '<span class="category-label">' +
            escapeHtml(app.category) +
            "</span>" +
            (isFresh ? '<br /><span class="fresh-label">최근 180일 출시</span>' : "") +
            "</td>" +
            '<td class="metric-cell" data-label="평점">' +
            '<span class="rating-line">★ ' +
            escapeHtml(formatRating(app.averageUserRating)) +
            "</span>" +
            '<span class="subtle-line">' +
            escapeHtml(formatCount(app.userRatingCount)) +
            "개 평가</span>" +
            "</td>" +
            '<td data-label="출시일">' +
            '<span class="date-line">' +
            escapeHtml(formatDate(app.releaseDate)) +
            "</span>" +
            '<span class="subtle-line">' +
            escapeHtml(app.formattedPrice || "무료") +
            "</span>" +
            "</td>" +
            '<td class="metric-cell" data-label="다른 국가 순위">' +
            '<div class="country-rank-list">' +
            (countryRanks || '<span class="subtle-line">-</span>') +
            "</div>" +
            "</td>" +
            "</tr>";
        })
        .join("");
    }

    function render() {
      renderTabs();
      const chart = currentChart();
      renderCategories(chart.apps);
      const apps = filteredApps();
      renderSummary(apps);
      renderTable(apps);
    }

    searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      render();
    });
    categorySelect.addEventListener("change", (event) => {
      state.category = event.target.value;
      render();
    });
    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      render();
    });
    onlyGlobalInput.addEventListener("change", (event) => {
      state.onlyGlobal = event.target.checked;
      render();
    });

    render();
  </script>
</body>
</html>`;
}
