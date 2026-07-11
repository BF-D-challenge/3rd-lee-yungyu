import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "../..");
const sourcePath = path.join(
  rootDir,
  "docs/research/trustmrr-acquire/ideas.jsonl",
);
const outputPath = path.join(rootDir, "docs/dev/trustmrr-original-top-100.html");

const source = await readFile(sourcePath, "utf8");
const rows = source
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const seen = new Set();
const rankedTop100 = rows
  .sort(
    (a, b) =>
      (b.revenue_30d_value ?? 0) - (a.revenue_30d_value ?? 0) ||
      (b.asking_price_value ?? 0) - (a.asking_price_value ?? 0),
  )
  .filter((row) => {
    const key = row.slug || row.url || row.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .slice(0, 100)
  .map((row, index) => ({ ...row, source_rank: index + 1 }));

const translationPaths = [
  "top-100-ko-001-025.json",
  "top-100-ko-026-050.json",
  "top-100-ko-051-075.json",
  "top-100-ko-076-100.json",
].map((name) =>
  path.join(rootDir, "docs/research/trustmrr-acquire/translations", name),
);

const translationFiles = await Promise.all(
  translationPaths.map(async (translationPath) =>
    JSON.parse(await readFile(translationPath, "utf8")),
  ),
);
const translations = new Map(
  translationFiles
    .flatMap((file) => file.translations)
    .map((translation) => [translation.id, translation]),
);
const auditDir = path.join(rootDir, "docs/research/trustmrr-acquire/audits");
const auditFiles = (await readdir(auditDir))
  .filter((name) => /^top100-idea-audit-\d{3}-\d{3}\.json$/.test(name))
  .sort();
const auditEntries = (
  await Promise.all(
    auditFiles.map(async (name) => JSON.parse(await readFile(path.join(auditDir, name), "utf8"))),
  )
).flatMap((file) => file.audits);
const detailOverrides = JSON.parse(
  await readFile(path.join(auditDir, "top100-detail-overrides.json"), "utf8"),
).audits;
const audits = new Map(
  [...auditEntries, ...detailOverrides].map((audit) => [audit.id, audit]),
);
const top100 = rankedTop100.map((row) => {
  const translation = translations.get(row.id);
  if (!translation || translation.source_rank !== row.source_rank) {
    throw new Error(`Missing or mismatched Korean translation for ${row.id}`);
  }
  const audit = audits.get(row.id);
  if (!audit || audit.source_rank !== row.source_rank) {
    throw new Error(`Missing or mismatched idea audit for ${row.id}`);
  }
  return {
    ...row,
    ko_description: localizeKoreanTerms(translation.ko_description),
    idea_status: audit.status,
    audit_reason: audit.reason,
    concrete_summary: audit.concreteSummary,
    concrete_mechanism: audit.mechanism,
    evidence_basis: audit.evidenceBasis,
  };
});

if (translations.size !== top100.length) {
  throw new Error(
    `Expected ${top100.length} Korean translations, found ${translations.size}`,
  );
}
if (audits.size !== top100.length) {
  throw new Error(`Expected ${top100.length} idea audits, found ${audits.size}`);
}

const embeddedData = JSON.stringify(top100).replaceAll("<", "\\u003c");
const collectedAt = top100[0]?.collected_at ?? "";
const generatedAt = new Date().toISOString();

const html = String.raw`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TrustMRR 구체적 원본 아이디어</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1f2422;
      --muted: #68706c;
      --paper: #f5f6f2;
      --surface: #ffffff;
      --line: #d9ded9;
      --line-strong: #bac3bd;
      --forest: #175d50;
      --forest-soft: #dcece7;
      --amber: #9a5a0b;
      --amber-soft: #f7e6c7;
      --header: #202523;
      --header-muted: #b9c1bd;
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
      max-width: 760px;
      margin: 14px 0 0;
      color: var(--header-muted);
      font-size: 15px;
      line-height: 1.7;
    }

    .source-stamp {
      min-width: 250px;
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
      grid-template-columns: minmax(260px, 1.6fr) minmax(180px, 0.8fr) minmax(190px, 0.8fr) auto;
      gap: 10px;
      margin-top: 20px;
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
      border-color: var(--forest);
      box-shadow: 0 0 0 3px rgba(23, 93, 80, 0.13);
    }

    .privacy-filter {
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

    .privacy-filter input {
      width: 18px;
      height: 18px;
      margin: 0 9px 0 0;
      accent-color: var(--forest);
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

    col.rank { width: 68px; }
    col.product { width: 190px; }
    col.description { width: auto; }
    col.category { width: 150px; }
    col.revenue { width: 138px; }
    col.growth { width: 96px; }
    col.ask { width: 148px; }
    col.multiple { width: 86px; }

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

    .product-link {
      display: inline;
      color: var(--ink);
      font-size: 14px;
      font-weight: 780;
      text-decoration-color: #8fa59c;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
    }

    .product-link:hover {
      color: var(--forest);
    }

    .record-id {
      display: block;
      margin-top: 7px;
      color: #909793;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }

    .description-copy {
      margin: 0;
      color: #333936;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
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
      color: var(--forest);
      font-size: 11px;
      font-weight: 750;
      cursor: pointer;
    }

    .raw-capture {
      max-height: 240px;
      overflow: auto;
      margin: 8px 0 0;
      padding: 10px;
      border-left: 3px solid var(--amber);
      background: #f3f4f0;
      color: #535a56;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .category-label {
      display: inline-block;
      padding: 4px 7px;
      border: 1px solid #b9d1c8;
      border-radius: 5px;
      background: var(--forest-soft);
      color: #225f52;
      font-size: 11px;
      font-weight: 720;
    }

    .masked-label {
      border-color: #e8c78c;
      background: var(--amber-soft);
      color: var(--amber);
    }

    .money {
      font-size: 14px;
      font-weight: 780;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .growth-positive {
      color: var(--forest);
    }

    .growth-extreme {
      color: var(--amber);
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
        grid-template-columns: 74px minmax(0, 1fr);
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
        grid-template-columns: 74px minmax(0, 1fr);
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
        <p class="eyebrow">TrustMRR 원본 검증</p>
        <h1>상위 100개 아이디어 검증</h1>
        <p class="dek">대상·문제·입력·처리·출력 중 네 가지 이상을 근거 있게 복원할 수 있는 원본만 보여줍니다. 목록 문구가 모호하면 상세 페이지에서 보강하고, 그래도 기능을 알 수 없으면 제외합니다.</p>
      </div>
      <dl class="source-stamp">
        <div>
          <dt>원본</dt>
          <dd>수집 데이터 · 1,863건</dd>
        </div>
        <div>
          <dt>수집 시각</dt>
          <dd>${escapeMarkup(formatDate(collectedAt))}</dd>
        </div>
        <div>
          <dt>기본 정렬</dt>
          <dd>30일 매출 내림차순</dd>
        </div>
        <div>
          <dt>중복 기준</dt>
          <dd>고유 주소</dd>
        </div>
      </dl>
    </div>
  </header>

  <main>
    <section class="summary-grid" aria-label="원본 데이터 요약">
      <div class="summary-item">
        <span class="summary-label">추천 가능 원본</span>
        <strong class="summary-value" id="metric-records">100</strong>
        <span class="summary-detail">네 개 축 이상 복원</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">추천 후보 30일 매출</span>
        <strong class="summary-value" id="metric-revenue">-</strong>
        <span class="summary-detail">원본 표기값 합산</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">추천 후보 최저 매출</span>
        <strong class="summary-value" id="metric-cutoff">-</strong>
        <span class="summary-detail">추천 가능 원본 중 최저값</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">아이디어 제외</span>
        <strong class="summary-value" id="metric-excluded">-</strong>
        <span class="summary-detail">기능을 복원할 근거 부족</span>
      </div>
    </section>

    <div class="category-strip" id="category-strip" aria-label="상위 카테고리 분포"></div>

    <section class="toolbar" aria-label="원본 아이디어 필터">
      <div class="field">
        <label for="search">검색</label>
        <input id="search" type="search" autocomplete="off" placeholder="제품명 또는 구체 기능" />
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
          <option value="source-rank">월매출 순</option>
          <option value="growth-desc">성장률 높은 순</option>
          <option value="ask-asc">매각가 낮은 순</option>
          <option value="ask-desc">매각가 높은 순</option>
        </select>
      </div>
      <label class="privacy-filter">
        <input id="show-excluded" type="checkbox" />
        제외 항목 함께 보기
      </label>
    </section>

    <div class="result-line">
      <p class="result-count"><span id="result-count">0</span><span id="result-label">개 추천 가능한 원본</span></p>
      <p class="result-note">제외 항목은 추천과 카드 추출에 사용되지 않습니다.</p>
    </div>

    <div class="table-shell">
      <table>
        <colgroup>
          <col class="rank" />
          <col class="product" />
          <col class="description" />
          <col class="category" />
          <col class="revenue" />
          <col class="growth" />
          <col class="ask" />
          <col class="multiple" />
        </colgroup>
        <thead>
          <tr>
            <th>순위</th>
            <th>제품</th>
            <th>검증된 구체 설명</th>
            <th>카테고리</th>
            <th class="metric-cell">30일 매출</th>
            <th class="metric-cell">30일 성장</th>
            <th class="metric-cell">매각가</th>
            <th class="metric-cell">배수</th>
          </tr>
        </thead>
        <tbody id="ideas-body"></tbody>
      </table>
    </div>
  </main>

  <footer>
    <div class="footer-inner">
      <p><strong>해석 범위</strong><br />매출은 시장 신호이고, 구체성 판정은 제품 동작을 복원할 수 있는지만 봅니다. 제품 품질이나 성공 가능성을 보장하지 않습니다.</p>
      <p><strong>생성 정보</strong><br />${escapeMarkup(formatDate(generatedAt))} · 원본 수집 데이터에서 자동 생성</p>
    </div>
  </footer>

  <script id="source-data" type="application/json">${embeddedData}</script>
  <script>
    const ideas = JSON.parse(document.getElementById("source-data").textContent);
    const maskedCategories = new Set([
      "Stealth Venture",
      "Stealth Company",
      "Private Enterprise",
      "Private Venture",
      "Hidden Business",
      "Confidential Startup",
    ]);
    const categoryTranslations = {
      "Artificial Intelligence": "인공지능",
      "SaaS": "구독형 소프트웨어",
      "Mobile Apps": "모바일 앱",
      "Content Creation": "콘텐츠 제작",
      "Marketing": "마케팅",
      "Education": "교육",
      "Hidden Business": "비공개 사업",
      "Uncategorized": "미분류",
      "E-commerce": "전자상거래",
      "Health & Fitness": "건강·피트니스",
      "Private Enterprise": "비공개 기업",
      "Stealth Venture": "스텔스 벤처",
      "Developer Tools": "개발자 도구",
      "Games": "게임",
      "Sales": "영업",
      "Social Media": "소셜 미디어",
      "Community": "커뮤니티",
      "Confidential Startup": "기밀 스타트업",
      "Design Tools": "디자인 도구",
      "Entertainment": "엔터테인먼트",
      "Fintech": "핀테크",
      "Marketplace": "마켓플레이스",
      "News & Magazines": "뉴스·매거진",
      "Photo Sharing": "사진 공유",
      "Private Venture": "비공개 벤처",
      "Productivity": "생산성",
      "Recruiting & HR": "채용·인사",
      "Stealth Company": "스텔스 기업",
    };

    const searchInput = document.getElementById("search");
    const categorySelect = document.getElementById("category");
    const sortSelect = document.getElementById("sort");
    const showExcludedInput = document.getElementById("show-excluded");
    const tableBody = document.getElementById("ideas-body");
    const resultCount = document.getElementById("result-count");
    const resultLabel = document.getElementById("result-label");

    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const growthValue = (idea) => {
      const parsed = Number(String(idea.growth_30d_text || "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
    };

    const isMasked = (idea) => maskedCategories.has(idea.category);
    const isUsable = (idea) => idea.idea_status === "usable";
    const categoryKo = (category) =>
      categoryTranslations[category || "Uncategorized"] || category || "미분류";
    const formatUsd = (value) =>
      Number.isFinite(value)
        ? "약 " + value.toLocaleString("ko-KR") + "달러"
        : "-";
    const formatMultiple = (value) => {
      const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(parsed) ? parsed.toLocaleString("ko-KR") + "배" : "-";
    };

    const buildKoreanCapture = (idea) => {
      const lines = [
        "제품명: " + idea.name,
        "판정: " + (isUsable(idea) ? "추천 가능" : "제외"),
        "판정 근거: " + idea.audit_reason,
        "근거 위치: " + (idea.evidence_basis === "detail-page" ? "상세 페이지" : "목록 설명"),
      ];
      if (isUsable(idea) && idea.concrete_mechanism) {
        lines.push(
          "입력: " + idea.concrete_mechanism.input,
          "처리: " + idea.concrete_mechanism.process,
          "결과: " + idea.concrete_mechanism.output,
        );
      } else {
        lines.push("목록 설명: " + (idea.ko_description || "설명 없음"));
      }
      lines.push(
        "30일 매출: " + formatUsd(idea.revenue_30d_value),
        "30일 성장: " + (idea.growth_30d_text || "정보 없음"),
        "매각가: " + formatUsd(idea.asking_price_value),
        "매출 배수: " + formatMultiple(idea.multiple_text),
      );
      return lines.join("\n");
    };

    function fillSummary() {
      const usableIdeas = ideas.filter(isUsable);
      const totalRevenue = usableIdeas.reduce(
        (sum, idea) => sum + (idea.revenue_30d_value || 0),
        0,
      );
      const excludedCount = ideas.length - usableIdeas.length;

      document.getElementById("metric-records").textContent =
        usableIdeas.length.toLocaleString("ko-KR");
      document.getElementById("metric-revenue").textContent =
        formatUsd(totalRevenue);
      document.getElementById("metric-cutoff").textContent =
        formatUsd(usableIdeas.at(-1)?.revenue_30d_value);
      document.getElementById("metric-excluded").textContent =
        excludedCount.toLocaleString("ko-KR") + "건";

      const counts = new Map();
      usableIdeas.forEach((idea) => {
        const category = idea.category || "Uncategorized";
        counts.set(category, (counts.get(category) || 0) + 1);
      });

      const categories = [...counts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      );

      categorySelect.insertAdjacentHTML(
        "beforeend",
        categories
          .map(
            ([category, count]) =>
              '<option value="' + escapeHtml(category) + '">' +
              escapeHtml(categoryKo(category)) + " (" + count + ")</option>",
          )
          .join(""),
      );

      document.getElementById("category-strip").innerHTML = categories
        .slice(0, 10)
        .map(
          ([category, count]) =>
            '<span class="category-chip">' + escapeHtml(categoryKo(category)) +
            "<strong>" + count + "</strong></span>",
        )
        .join("");
    }

    function render() {
      const query = searchInput.value.trim().toLocaleLowerCase("ko-KR");
      const category = categorySelect.value;

      const visibleIdeas = ideas
        .filter((idea) => {
          const haystack = [
            idea.name,
            idea.ko_description,
            idea.concrete_summary,
            idea.audit_reason,
            categoryKo(idea.category),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("ko-KR");
          return (
            (!query || haystack.includes(query)) &&
            (!category || (idea.category || "Uncategorized") === category) &&
            (showExcludedInput.checked || isUsable(idea))
          );
        })
        .sort((a, b) => {
          if (sortSelect.value === "growth-desc") {
            return growthValue(b) - growthValue(a) || a.source_rank - b.source_rank;
          }
          if (sortSelect.value === "ask-asc") {
            return (a.asking_price_value ?? Infinity) -
              (b.asking_price_value ?? Infinity) || a.source_rank - b.source_rank;
          }
          if (sortSelect.value === "ask-desc") {
            return (b.asking_price_value ?? -1) -
              (a.asking_price_value ?? -1) || a.source_rank - b.source_rank;
          }
          return a.source_rank - b.source_rank;
        });

      resultCount.textContent = visibleIdeas.length.toLocaleString("ko-KR");
      resultLabel.textContent = showExcludedInput.checked ? "개 전체 감사 항목" : "개 추천 가능한 원본";
      tableBody.innerHTML = visibleIdeas
        .map((idea) => {
          const growth = growthValue(idea);
          const growthClass = growth >= 100
            ? "growth-extreme"
            : growth > 0
              ? "growth-positive"
              : "";
          const usable = isUsable(idea);
          const description = usable
            ? escapeHtml(idea.concrete_summary || idea.ko_description || "설명 없음")
            : '<span class="empty-copy">제외 · ' + escapeHtml(idea.audit_reason) + "</span>";
          const mechanism = usable && idea.concrete_mechanism
            ? '<p class="record-id">입력: ' + escapeHtml(idea.concrete_mechanism.input) +
              " → 결과: " + escapeHtml(idea.concrete_mechanism.output) + "</p>"
            : "";
          const statusClass = usable ? "category-label" : "category-label masked-label";
          const statusLabel = usable ? "추천 가능" : "제외";
          const categoryName = categoryKo(idea.category);
          const categoryClass = isMasked(idea)
            ? "category-label masked-label"
            : "category-label";

          return (
            "<tr>" +
              '<td data-label="순위"><span class="rank-number">#' +
                idea.source_rank + "</span></td>" +
              '<td data-label="제품">' +
                '<a class="product-link" href="' + escapeHtml(idea.url) +
                  '" target="_blank" rel="noreferrer">' + escapeHtml(idea.name) + "</a>" +
                '<span class="record-id">' + escapeHtml(idea.id) + "</span>" +
              "</td>" +
              '<td class="description-cell" data-label="검증된 구체 설명">' +
                '<span class="' + statusClass + '">' + statusLabel + "</span>" +
                '<p class="description-copy" style="margin-top:8px">' + description + "</p>" +
                mechanism +
                "<details><summary>전체 항목 보기</summary>" +
                  '<pre class="raw-capture">' + escapeHtml(buildKoreanCapture(idea)) + "</pre>" +
                "</details>" +
              "</td>" +
              '<td data-label="카테고리"><span class="' + categoryClass + '">' +
                escapeHtml(categoryName) + "</span></td>" +
              '<td class="metric-cell" data-label="30일 매출"><span class="money">' +
                escapeHtml(formatUsd(idea.revenue_30d_value)) + "</span></td>" +
              '<td class="metric-cell" data-label="30일 성장"><span class="money ' +
                growthClass + '">' + escapeHtml(idea.growth_30d_text || "-") + "</span></td>" +
              '<td class="metric-cell" data-label="매각가"><span class="money">' +
                escapeHtml(formatUsd(idea.asking_price_value)) + "</span></td>" +
              '<td class="metric-cell" data-label="배수"><span class="money">' +
                escapeHtml(formatMultiple(idea.multiple_text)) + "</span></td>" +
            "</tr>"
          );
        })
        .join("");
    }

    [searchInput, categorySelect, sortSelect, showExcludedInput].forEach((control) => {
      control.addEventListener("input", render);
      control.addEventListener("change", render);
    });

    fillSummary();
    render();
  </script>
</body>
</html>
`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, html);

console.log(
  `Wrote ${path.relative(rootDir, outputPath)} with ${top100.length} records.`,
);

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function escapeMarkup(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function localizeKoreanTerms(value) {
  return String(value ?? "")
    .replace(/\$(\d+(?:\.\d+)?)k\b/gi, (_, amount) =>
      `${Math.round(Number(amount) * 1000).toLocaleString("ko-KR")}달러`,
    )
    .replace(/Model Context Protocol\s*\(MCP\)/gi, "인공지능 도구 연결 규격")
    .replace(/\bIPTV\b/g, "인터넷 TV")
    .replace(/\bVPN\b/g, "보안 가상망")
    .replace(/\bSaaS\b/g, "구독형 소프트웨어")
    .replace(/\bB2B\b/g, "기업 대상")
    .replace(/\bB2C\b/g, "개인 소비자 대상")
    .replace(/\bUGC\b/g, "사용자 제작 콘텐츠")
    .replace(/\bMRR\b/g, "월 반복 매출")
    .replace(/\bSEO\b/g, "검색 노출 최적화")
    .replace(/\bLLM\b/g, "대규모 언어 모델")
    .replace(/\bMCP\b/g, "인공지능 도구 연결 규격")
    .replace(/\bAPI\b/g, "외부 연동 기능")
    .replace(/\biOS\b/g, "아이폰")
    .replace(/\bAndroid\b/g, "안드로이드")
    .replace(/\bSMS\b/g, "문자 메시지")
    .replace(/\bDMs?\b/g, "개인 메시지")
    .replace(/\bISP\b/g, "인터넷 서비스 제공업체")
    .replace(/\bSMM\b/g, "소셜 미디어 마케팅")
    .replace(/\bAI\b/g, "인공지능")
    .replace(/\bIP\b/g, "인터넷 주소")
    .replace(/인공지능로/g, "인공지능으로")
    .replace(/인공지능가/g, "인공지능이")
    .replace(/인공지능는/g, "인공지능은")
    .replace(/인공지능를/g, "인공지능을")
    .replace(/인공지능와/g, "인공지능과")
    .replace(/외부 연동 기능로/g, "외부 연동 기능으로")
    .replace(/외부 연동 기능가/g, "외부 연동 기능이")
    .replace(/외부 연동 기능는/g, "외부 연동 기능은")
    .replace(/외부 연동 기능를/g, "외부 연동 기능을")
    .replace(/외부 연동 기능와/g, "외부 연동 기능과")
    .replace(/\s*\(PR\)/g, "")
    .replace(/\s*\(TTM\)/g, "");
}
