import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const outputPath = path.join(repoRoot, "docs/dev/idea-lab-100-review.html");
const runtimeOutputPath = path.join(
  repoRoot,
  "docs/research/idea-runtime-combinations-2026-07-15.jsonl",
);
const sourceData = await fs.readFile(
  path.join(repoRoot, "src/components/organisms/idea-lab/sample-data.ts"),
  "utf8",
);
const javascript = ts.transpileModule(sourceData, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluatedModule = { exports: {} };
new Function("exports", "module", "require", javascript)(
  evaluatedModule.exports,
  evaluatedModule,
  () => ({}),
);
const { IDEA_LAB_SCENARIOS } = evaluatedModule.exports;

const platformLabels = {
  web: "웹",
  app: "앱",
  plugin: "확장 프로그램",
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[char]));
const renderList = (items, render) => items.map((item) => `<li>${render(item)}</li>`).join("");

const scenarios = IDEA_LAB_SCENARIOS.map((scenario, index) => ({
  number: index + 1,
  id: scenario.id,
  source: {
    name: scenario.source.sourceName,
    platform: platformLabels[scenario.source.platform] ?? scenario.source.platform,
    value: scenario.source.value,
    detail: scenario.source.detail,
    evidence: scenario.source.evidence,
    flow: scenario.source.preservedFlow,
    researchKey: scenario.source.research.key,
    researchUrl: scenario.source.research.url,
  },
  payers: scenario.payers.map(({ value, detail }) => ({ value, detail })),
  moments: scenario.moments.map(({ value, detail }) => ({ value, detail })),
  twists: scenario.twists.map(({ value, detail, resultTitle, smallestBuild, platform }) => ({
    value,
    detail,
    resultTitle,
    smallestBuild,
    platform: platformLabels[platform] ?? platform,
  })),
}));

if (scenarios.length !== 100) {
  throw new Error(`Expected 100 scenarios, received ${scenarios.length}`);
}

const runtimeRows = IDEA_LAB_SCENARIOS.flatMap((scenario) =>
  scenario.payers.flatMap((payer) =>
    scenario.moments.flatMap((moment) =>
      scenario.twists.map((twist) => {
        const id = [scenario.id, payer.id, moment.id, twist.id].join("__");
        const text = [
          `조합 요약: ${payer.value}가 ${moment.value}에 쓰는 ${twist.resultTitle}.`,
          `타겟: ${payer.value}.`,
          `반복 행동: ${payer.detail}`,
          `필요한 순간: ${moment.value}.`,
          `통증: ${moment.detail}.`,
          `변화: ${twist.resultTitle}. ${twist.value}. ${twist.detail}`,
          `오늘 만들 결과: ${twist.smallestBuild}.`,
          `제품 핵심: ${scenario.source.value}.`,
          `검증된 흐름: ${scenario.source.preservedFlow}.`,
        ].join(" ");
        const sourceText = [
          `해외 원본: ${scenario.source.sourceName}.`,
          `제품 핵심: ${scenario.source.value}.`,
          `상세 작동: ${scenario.source.detail}.`,
          `검증된 흐름: ${scenario.source.preservedFlow}.`,
        ].join(" ");
        return {
          id,
          scenarioId: scenario.id,
          sourceName: scenario.source.sourceName,
          source_key: scenario.source.research.key,
          source_url: scenario.source.research.url,
          payerId: payer.id,
          payer: payer.value,
          momentId: moment.id,
          moment: moment.value,
          twistIds: [twist.id],
          twistTitles: [twist.resultTitle],
          twistCount: 1,
          text,
          sourceText,
          fidelityText: `${sourceText} MVP에서 적용할 한 끗: ${twist.resultTitle}.`,
        };
      }),
    ),
  ),
);
if (runtimeRows.length !== 2700) {
  throw new Error(`Expected 2,700 runtime rows, received ${runtimeRows.length}`);
}

const json = JSON.stringify(scenarios).replaceAll("<", "\\u003c");
const initialCardsHtml = scenarios.map((item) => `
      <article data-search="${escapeHtml(JSON.stringify(item).toLowerCase())}" data-platform="${escapeHtml(item.source.platform)}">
        <div class="card-head"><div><div class="number">#${String(item.number).padStart(3, "0")} · ${escapeHtml(item.id)}</div><h2>${escapeHtml(item.source.name)}</h2></div>
          <span class="platform">${escapeHtml(item.source.platform)}</span></div>
        <div class="source"><p class="label">검증된 원본</p><p class="value">${escapeHtml(item.source.value)}</p><p class="detail">${escapeHtml(item.source.detail)}</p>
          <div class="flow"><strong>보존한 흐름</strong><br>${escapeHtml(item.source.flow)}</div>
          <div class="evidence"><strong>근거</strong><br>${escapeHtml(item.source.evidence)}</div>
          <a class="source-link" href="${escapeHtml(item.source.researchUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.source.researchKey)} ↗</a></div>
        <div class="sections"><section class="section payer"><h3>돈 낼 사람 · 3</h3><ol>${renderList(item.payers, (entry) => `<strong>${escapeHtml(entry.value)}</strong><span>${escapeHtml(entry.detail)}</span>`)}</ol></section>
          <section class="section moment"><h3>필요한 순간 · 3</h3><ol>${renderList(item.moments, (entry) => `<strong>${escapeHtml(entry.value)}</strong><span>${escapeHtml(entry.detail)}</span>`)}</ol></section>
          <section class="section twist"><h3>한 끗 변화 · 3</h3><ol>${renderList(item.twists, (entry) => `<strong>${escapeHtml(entry.resultTitle)}</strong><span>${escapeHtml(entry.value)}<br>${escapeHtml(entry.smallestBuild)}</span>`)}</ol></section></div>
      </article>`).join("");

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>오늘 해볼까 · 원본 아이디어 100개 점검</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d1118;
      --panel: #151c27;
      --panel-strong: #1b2532;
      --line: rgba(197, 213, 233, .16);
      --text: #f2f5f8;
      --muted: #9eacbd;
      --blue: #78b9ff;
      --mint: #78e2b7;
      --gold: #e8c56a;
      --rose: #ff8b9c;
    }
    * { box-sizing: border-box; }
    html { background: var(--bg); }
    body {
      margin: 0;
      color: var(--text);
      background:
        radial-gradient(circle at 12% -10%, rgba(120, 185, 255, .17), transparent 32rem),
        radial-gradient(circle at 92% 0%, rgba(120, 226, 183, .11), transparent 28rem),
        var(--bg);
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
      line-height: 1.5;
    }
    main { width: min(1440px, calc(100% - 40px)); margin: 0 auto; padding: 48px 0 80px; }
    header { margin-bottom: 28px; }
    .eyebrow { margin: 0 0 10px; color: var(--blue); font-size: 13px; font-weight: 800; letter-spacing: .08em; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); line-height: 1.15; letter-spacing: -.04em; }
    .lede { max-width: 760px; margin: 15px 0 0; color: var(--muted); font-size: 16px; }
    .scope-note { max-width: 980px; margin: 14px 0 0; padding: 12px 14px; border: 1px solid rgba(232, 197, 106, .26); border-radius: 12px; background: rgba(232, 197, 106, .08); color: #f3e6bb; font-size: 13px; }
    .principle { max-width: 1120px; margin: 14px 0 0; padding: 15px 16px; border: 1px solid rgba(120, 226, 183, .2); border-radius: 14px; background: rgba(120, 226, 183, .06); }
    .principle strong { color: var(--mint); }
    .principle ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 22px; margin-top: 9px; padding-left: 20px; color: var(--muted); font-size: 13px; }
    .principle li { padding-left: 2px; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 26px 0; }
    .stat { padding: 18px; border: 1px solid var(--line); border-radius: 16px; background: rgba(21, 28, 39, .84); }
    .stat strong { display: block; font-size: 28px; line-height: 1; }
    .stat span { display: block; margin-top: 8px; color: var(--muted); font-size: 13px; }
    .controls { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 0; background: rgba(13, 17, 24, .92); backdrop-filter: blur(14px); }
    input, select, button { font: inherit; }
    input, select { min-height: 44px; border: 1px solid var(--line); border-radius: 10px; color: var(--text); background: var(--panel); padding: 0 13px; }
    input { flex: 1 1 360px; min-width: 240px; }
    select { flex: 0 0 150px; }
    .result-count { align-self: center; color: var(--muted); font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    article { min-width: 0; border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(145deg, rgba(27, 37, 50, .96), rgba(21, 28, 39, .94)); overflow: hidden; }
    .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 20px 14px; }
    .number { color: var(--blue); font-size: 13px; font-weight: 900; }
    h2 { margin: 4px 0 0; font-size: 21px; line-height: 1.25; letter-spacing: -.025em; }
    .platform { flex: 0 0 auto; padding: 5px 9px; border: 1px solid rgba(120, 185, 255, .28); border-radius: 999px; color: var(--blue); font-size: 12px; font-weight: 800; }
    .source { padding: 0 20px 18px; }
    .label { margin: 0 0 6px; color: var(--blue); font-size: 12px; font-weight: 900; letter-spacing: .04em; }
    .value { margin: 0; font-size: 16px; font-weight: 800; }
    .detail { margin: 7px 0 0; color: var(--muted); font-size: 14px; }
    .flow, .evidence { margin-top: 12px; padding: 11px 13px; border-radius: 10px; background: rgba(120, 185, 255, .08); color: #d8e8fb; font-size: 13px; }
    .evidence { background: rgba(120, 226, 183, .07); color: #d7f4e8; }
    .source-link { display: inline-block; margin-top: 10px; color: var(--blue); font-size: 12px; word-break: break-all; }
    .sections { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--line); }
    .section { min-width: 0; padding: 16px; border-right: 1px solid var(--line); }
    .section:last-child { border-right: 0; }
    .section h3 { margin: 0 0 10px; font-size: 13px; }
    .section.payer h3 { color: var(--mint); }
    .section.moment h3 { color: var(--gold); }
    .section.twist h3 { color: var(--rose); }
    ol { margin: 0; padding-left: 20px; }
    li { padding-left: 3px; font-size: 13px; }
    li + li { margin-top: 11px; }
    li strong { display: block; font-size: 13px; }
    li span { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; }
    .empty { display: none; padding: 40px; border: 1px dashed var(--line); border-radius: 16px; color: var(--muted); text-align: center; }
    footer { margin-top: 32px; color: var(--muted); font-size: 12px; }
    @media (max-width: 980px) {
      .grid { grid-template-columns: 1fr; }
      .principle ol { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 620px) {
      main { width: min(100% - 24px, 560px); padding-top: 28px; }
      .stats { gap: 8px; }
      .stat { padding: 14px; }
      .stat strong { font-size: 23px; }
      .sections { grid-template-columns: 1fr; }
      .principle ol { grid-template-columns: 1fr; }
      .section { border-right: 0; border-bottom: 1px solid var(--line); }
      .section:last-child { border-bottom: 0; }
    }
    @media print {
      :root { color-scheme: light; }
      body { color: #111; background: #fff; }
      .controls { position: static; background: #fff; }
      input, select { display: none; }
      .result-count { color: #333; }
      article, .stat { border-color: #bbb; background: #fff; break-inside: avoid; }
      .detail, li span, footer, .lede, .stat span { color: #444; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">오늘 해볼까 · IDEA LAB REVIEW</p>
      <h1>최종 원본 아이디어 100개</h1>
      <p class="lede">앱에 실제 적용된 원본 아이디어만 모았습니다. 원본 제품의 작동 흐름, 돈 낼 사람, 필요한 순간, 한국 사용자용 한 끗 변화를 하나씩 점검해보세요.</p>
      <p class="scope-note"><strong>읽는 법:</strong> 2,700개는 100개 원본에서 만든 검토 조합 수이지 독립 원본 수가 아닙니다. 캐릭터 챗처럼 넓은 카테고리도 자동 제외하지 않고, 기억·상태·의식처럼 한 번의 입력→처리→결과로 설명되는 검증 가능한 메커니즘만 같은 기준으로 편입합니다.</p>
      <div class="principle"><strong>이번 100개를 만드는 근본 순서</strong><ol><li>실제 사용·결제 근거가 있는 원본을 고릅니다.</li><li>이미 행동 중인 돈 낼 사람을 정합니다.</li><li>문제가 터지는 시간·장면을 한 문장으로 잡습니다.</li><li>원본 입력→처리→결과는 보존하고 한 끗 하나만 바꿉니다.</li><li>결과가 저장·재사용·공유될지와 결제 이유를 검증 가설로 표시합니다.</li><li>오늘 만들 화면은 입력 1개→처리 1회→결과 1개로 줄입니다.</li></ol></div>
    </header>
    <section class="stats" aria-label="요약">
      <div class="stat"><strong>100</strong><span>적용된 원본 아이디어</span></div>
      <div class="stat"><strong>300</strong><span>결제자 시나리오 (100 × 3)</span></div>
      <div class="stat"><strong>300</strong><span>필요한 순간 (100 × 3)</span></div>
      <div class="stat"><strong>2,700</strong><span>전체 런타임 조합 (100 × 27)</span></div>
    </section>
    <section class="controls" aria-label="아이디어 검색 및 필터">
      <input id="search" type="search" placeholder="아이디어명·설명·결제자·순간·한 끗 검색" aria-label="아이디어 검색" />
      <select id="platform" aria-label="플랫폼 필터">
        <option value="">플랫폼 전체</option>
        <option value="웹">웹</option>
        <option value="앱">앱</option>
        <option value="확장 프로그램">확장 프로그램</option>
      </select>
      <span id="result-count" class="result-count" aria-live="polite"></span>
    </section>
    <section id="grid" class="grid" aria-label="원본 아이디어 목록">${initialCardsHtml}</section>
    <p id="empty" class="empty">검색 조건에 맞는 원본 아이디어가 없습니다.</p>
    <footer>데이터 기준: <code>src/components/organisms/idea-lab/sample-data.ts</code> · 생성 시점: 2026-07-18 · 원본 100개는 각각 결제자 3개·순간 3개·한 끗 3개로 확장됩니다.</footer>
  </main>
  <script id="idea-data" type="application/json">${json}</script>
  <script>
    const data = JSON.parse(document.getElementById("idea-data").textContent);
    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty");
    const count = document.getElementById("result-count");
    const search = document.getElementById("search");
    const platform = document.getElementById("platform");
    const cards = [...grid.children];
    function filter() {
      const query = search.value.trim().toLowerCase();
      const selectedPlatform = platform.value;
      let visible = 0;
      cards.forEach((card) => {
        const matchQuery = !query || card.dataset.search.includes(query);
        const matchPlatform = !selectedPlatform || card.dataset.platform === selectedPlatform;
        const show = matchQuery && matchPlatform;
        card.hidden = !show;
        if (show) visible += 1;
      });
      count.textContent = visible + "개 표시 중 · 전체 " + data.length + "개";
      empty.style.display = visible ? "none" : "block";
    }
    search.addEventListener("input", filter);
    platform.addEventListener("change", filter);
    filter();
  </script>
</body>
</html>
`;

await Promise.all([
  fs.writeFile(outputPath, html, "utf8"),
  fs.writeFile(
    runtimeOutputPath,
    `${runtimeRows.map((row) => JSON.stringify(row)).join("\n")}\n`,
    "utf8",
  ),
]);
console.log(JSON.stringify({
  outputPath,
  runtimeOutputPath,
  scenarios: scenarios.length,
  runtimeRows: runtimeRows.length,
  bytes: Buffer.byteLength(html),
}, null, 2));
