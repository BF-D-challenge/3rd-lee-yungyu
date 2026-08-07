import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { renderStackedCreative } from "./lib/render-stacked-creative.mjs";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "outputs/ad-reference-tests/2026-07-26");
const CALL_AI = path.join(ROOT, "public/images/ad-ai/v4/story-call-guide.png");
const COMIC_AI = path.join(
  ROOT,
  "public/images/ad-ai/v4/story-conductor-diptych.png",
);
const REF_CALL = path.join(OUT, "ref-a-media-crop.png");
const REF_PHONE = path.join(OUT, "ref-c-media-crop.png");
const REF_COMIC = path.join(OUT, "ref-b-media-crop.png");

const FONT =
  "'Pretendard','SUIT','Noto Sans KR','Apple SD Gothic Neo',sans-serif";

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svg(width, height, body) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text { font-family:${FONT}; }
        .heavy { font-weight:900; letter-spacing:-0.045em; }
        .bold { font-weight:800; letter-spacing:-0.035em; }
        .medium { font-weight:650; letter-spacing:-0.02em; }
      </style>
      ${body}
    </svg>`,
  );
}

function textLines({
  lines,
  x,
  y,
  size,
  lineHeight = 1.16,
  fill = "#fff",
  anchor = "start",
  className = "heavy",
  stroke = "none",
  strokeWidth = 0,
}) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" class="${className}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke fill">
    ${lines
      .map(
        (line, index) =>
          `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${xml(line)}</tspan>`,
      )
      .join("")}
  </text>`;
}

async function fullBleed(source, width, height, position = "centre") {
  return sharp(source)
    .resize(width, height, { fit: "cover", position })
    .jpeg({ quality: 94 })
    .toBuffer();
}

async function writeCallHybrid() {
  const width = 1080;
  const height = 1920;
  const base = await fullBleed(CALL_AI, width, height, "centre");
  const overlay = svg(
    width,
    height,
    `
      <defs>
        <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#071016" stop-opacity=".94"/>
          <stop offset="78%" stop-color="#071016" stop-opacity=".7"/>
          <stop offset="100%" stop-color="#071016" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="bottomFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#071016" stop-opacity=".94"/>
          <stop offset="68%" stop-color="#071016" stop-opacity=".55"/>
          <stop offset="100%" stop-color="#071016" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="510" fill="url(#topFade)"/>
      <rect y="1430" width="1080" height="490" fill="url(#bottomFade)"/>
      <rect x="374" y="112" width="332" height="54" rx="27" fill="#34D6C8"/>
      <text x="540" y="149" font-size="25" fill="#071016" text-anchor="middle" class="bold">STORY CARDS · 첫 질문</text>
      ${textLines({
        lines: ["카드를 연 순간,", "그가 먼저 질문했다"],
        x: 540,
        y: 252,
        size: 74,
        lineHeight: 1.12,
        anchor: "middle",
      })}
      <rect x="130" y="1548" width="820" height="112" rx="56" fill="#0B151C" fill-opacity=".9" stroke="#FFFFFF" stroke-opacity=".32"/>
      <text x="540" y="1618" font-size="35" fill="#FFFFFF" text-anchor="middle" class="bold">“다시 가보고 싶은 순간이 있나요?”</text>
      <text x="540" y="1752" font-size="27" fill="#FFFFFF" fill-opacity=".78" text-anchor="middle" class="medium">로그인 없이 카드 열기 →</text>
      <text x="540" y="1836" font-size="18" fill="#FFFFFF" fill-opacity=".58" text-anchor="middle" class="medium">통화 화면 연출 · 실제 제품은 텍스트 카드 대화입니다</text>
    `,
  );

  await sharp(base)
    .composite([{ input: overlay }])
    .png()
    .toFile(path.join(OUT, "call-b-phone-editorial.png"));
}

async function writeCallFaithful() {
  const width = 1080;
  const height = 1920;
  const base = await fullBleed(CALL_AI, width, height, "centre");
  const overlay = svg(
    width,
    height,
    `
      <defs>
        <linearGradient id="captionFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#061016" stop-opacity="0"/>
          <stop offset="100%" stop-color="#061016" stop-opacity=".82"/>
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".8"/></filter>
      </defs>
      <rect y="960" width="1080" height="960" fill="url(#captionFade)"/>
      <rect x="42" y="64" width="306" height="50" rx="25" fill="#08151C" fill-opacity=".76"/>
      <text x="195" y="98" font-size="22" fill="#FFFFFF" text-anchor="middle" class="bold">STORY CARDS · 연출 장면</text>
      ${textLines({
        lines: ["진짜… 먼저", "질문했어"],
        x: 540,
        y: 1260,
        size: 92,
        lineHeight: 1.04,
        anchor: "middle",
        stroke: "#071016",
        strokeWidth: 14,
      })}
      <text x="540" y="1477" font-size="36" fill="#FFFFFF" text-anchor="middle" class="bold" filter="url(#shadow)">00:12</text>
      <g transform="translate(0 1540)">
        <circle cx="334" cy="92" r="62" fill="#FFFFFF"/>
        <path d="M334 56a20 20 0 0 0-20 20v23a20 20 0 0 0 40 0V76a20 20 0 0 0-20-20zm-36 40v5a36 36 0 0 0 72 0v-5h-12v5a24 24 0 0 1-48 0v-5h-12zm30 47h12v23h-12z" fill="#0B151C"/>
        <circle cx="540" cy="92" r="62" fill="#111A20" fill-opacity=".9" stroke="#FFFFFF" stroke-opacity=".5"/>
        <path d="M501 64l79 56M504 78v51h72V78l-17 13V79a18 18 0 0 0-18-18h-9a18 18 0 0 0-18 18v13z" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="746" cy="92" r="62" fill="#F65D51"/>
        <path d="M716 79c20 23 40 23 60 0M715 80l8-13M777 80l-8-13" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
        <text x="334" y="194" font-size="21" fill="#FFFFFF" text-anchor="middle" class="medium">마이크</text>
        <text x="540" y="194" font-size="21" fill="#FFFFFF" text-anchor="middle" class="medium">카메라</text>
        <text x="746" y="194" font-size="21" fill="#FFFFFF" text-anchor="middle" class="medium">종료</text>
      </g>
      <text x="540" y="1870" font-size="18" fill="#FFFFFF" fill-opacity=".65" text-anchor="middle" class="medium">통화 UI는 광고 연출 · 실제 제품은 텍스트 카드 대화입니다</text>
    `,
  );

  await sharp(base)
    .composite([{ input: overlay }])
    .png()
    .toFile(path.join(OUT, "call-c-reference-faithful.png"));
}

async function writeComicHybrid() {
  const width = 1080;
  const height = 1350;
  const base = await fullBleed(COMIC_AI, width, height, "centre");
  const overlay = svg(
    width,
    height,
    `
      <defs>
        <linearGradient id="softFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F4E8D8" stop-opacity=".97"/>
          <stop offset="100%" stop-color="#F4E8D8" stop-opacity=".7"/>
        </linearGradient>
        <linearGradient id="lowFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#06131A" stop-opacity=".96"/>
          <stop offset="100%" stop-color="#06131A" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="360" fill="url(#softFade)"/>
      <rect y="930" width="1080" height="420" fill="url(#lowFade)"/>
      <rect x="66" y="58" width="352" height="50" rx="25" fill="#12232C"/>
      <text x="242" y="92" font-size="22" fill="#F4E8D8" text-anchor="middle" class="bold">STORY CARDS · 가이드 복귀</text>
      ${textLines({
        lines: ["마지막 열차의", "기관사가 돌아왔다"],
        x: 68,
        y: 190,
        size: 72,
        lineHeight: 1.1,
        fill: "#13222B",
      })}
      <rect x="80" y="1045" width="920" height="120" rx="24" fill="#F8EEDF" fill-opacity=".94"/>
      <text x="540" y="1118" font-size="34" fill="#13222B" text-anchor="middle" class="bold">다시 가보고 싶은 순간이 있나요?</text>
      <text x="540" y="1265" font-size="22" fill="#FFFFFF" fill-opacity=".74" text-anchor="middle" class="medium">로그인 없이 카드 열기 →</text>
    `,
  );

  await sharp(base)
    .composite([{ input: overlay }])
    .png()
    .toFile(path.join(OUT, "comic-b-fullbleed-hybrid.png"));
}

async function writeComicFaithful() {
  const width = 1080;
  const height = 1350;
  const base = await fullBleed(COMIC_AI, width, height, "centre");
  const overlay = svg(
    width,
    height,
    `
      <defs>
        <linearGradient id="titleFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#06131A" stop-opacity=".98"/>
          <stop offset="100%" stop-color="#06131A" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="28" y="28" width="336" height="42" rx="21" fill="#07141A" fill-opacity=".74"/>
      <text x="196" y="57" font-size="19" fill="#FFFFFF" text-anchor="middle" class="bold">AI 생성 장면 · STORY CARDS</text>
      ${textLines({
        lines: ["다시 가보고 싶은", "순간이 있나요?"],
        x: 185,
        y: 150,
        size: 28,
        lineHeight: 1.26,
        fill: "#17242B",
        anchor: "middle",
        className: "medium",
      })}
      ${textLines({
        lines: ["이번엔,", "끝까지 들어줄게요."],
        x: 855,
        y: 865,
        size: 27,
        lineHeight: 1.24,
        fill: "#F8EFE1",
        anchor: "middle",
        className: "medium",
      })}
      <rect y="1080" width="1080" height="270" fill="url(#titleFade)"/>
      ${textLines({
        lines: ["마지막 열차의", "기관사가 돌아왔다"],
        x: 540,
        y: 1172,
        size: 70,
        lineHeight: 1.08,
        fill: "#FFFFFF",
        anchor: "middle",
      })}
      <rect x="803" y="1251" width="196" height="9" rx="4.5" fill="#52D3C8"/>
    `,
  );

  await sharp(base)
    .composite([{ input: overlay }])
    .png()
    .toFile(path.join(OUT, "comic-c-reference-faithful.png"));
}

async function normalizeBaseline(source, output, width, height) {
  await sharp(source)
    .resize(width, height, { fit: "cover" })
    .png()
    .toFile(path.join(OUT, output));
}

async function writeLegacyBaselines() {
  const placements = JSON.parse(
    await fs.readFile(
      path.join(ROOT, "config/ad-image/placement-profiles.v3.json"),
      "utf8",
    ),
  );
  const palette = {
    bg: "#F1E6D8",
    surface: "#FFF3E5",
    ink: "#1D242C",
    accent: "#59CFC5",
    shooting: "#D5C8B8",
    backgroundGradient: ["#F4EBDD", "#DCE9E3"],
  };
  const legacyOutput = path.join(OUT, "legacy-render");
  const [call, comic] = await Promise.all([
    renderStackedCreative({
      creative: {
        id: "legacy-call",
        route: "/story-cards",
        style: "making",
        eyebrow: "MAKING STORY CARD",
        headline: "그림보다 먼저,\n첫 질문을 검수합니다",
        support: "스케치 → AI 카드 → 실제 화면 → 첫 대화를 한 장면에 쌓아요.",
        cta: "로그인 없이 카드 열기 →",
        disclaimer: "촬영 교체 전 draft · AI 생성 전후와 실제 제품 화면을 구분합니다.",
        evidenceSource: "public/images/experiment-gallery/story-cards.jpg",
        aiAsset: "public/images/ad-ai/v3/story-making.png",
        shootingLabel: "스케치·검수표·휴대폰 실행 촬영",
        palette,
        approval: { status: "draft" },
      },
      profileId: "ig_reels",
      profile: placements.profiles.ig_reels,
      composition: placements.composition,
      cwd: ROOT,
      outputDir: legacyOutput,
      debugSafeArea: false,
    }),
    renderStackedCreative({
      creative: {
        id: "legacy-comic",
        route: "/story-cards",
        style: "character-return",
        eyebrow: "STORY CARDS · 가이드 복귀",
        headline: "마지막 열차의\n기관사가 돌아왔다",
        support: "다시 가보고 싶은 순간이 있나요?",
        cta: "로그인 없이 카드 열기 →",
        disclaimer: "상황 제목과 첫 질문은 실제 Story Cards API 데이터에서 가져옵니다.",
        evidenceSource: "public/images/experiment-gallery/story-cards.jpg",
        aiAsset: "public/images/ad-ai/v3/story-guide-return.png",
        palette,
        approval: { status: "draft" },
      },
      profileId: "ig_feed_portrait",
      profile: placements.profiles.ig_feed_portrait,
      composition: placements.composition,
      cwd: ROOT,
      outputDir: legacyOutput,
      debugSafeArea: false,
    }),
  ]);
  return {
    call: path.resolve(ROOT, call.output),
    comic: path.resolve(ROOT, comic.output),
  };
}

async function blurredStructuralDistance(candidate, reference) {
  const size = 32;
  const [a, b] = await Promise.all(
    [candidate, reference].map((source) =>
      sharp(source)
        .resize(size, size, { fit: "fill" })
        .greyscale()
        .blur(2.4)
        .raw()
        .toBuffer(),
    ),
  );
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference += Math.abs(a[index] - b[index]);
  }
  return Number((difference / (a.length * 255)).toFixed(4));
}

async function contactSheet(output, title, entries, cellWidth, cellHeight) {
  const gap = 22;
  const labelHeight = 72;
  const margin = 28;
  const width = margin * 2 + entries.length * cellWidth + (entries.length - 1) * gap;
  const height = margin * 2 + 72 + labelHeight + cellHeight;
  const composites = [];

  for (let index = 0; index < entries.length; index += 1) {
    const left = margin + index * (cellWidth + gap);
    const top = margin + 72 + labelHeight;
    const image = await sharp(entries[index].path)
      .resize(cellWidth, cellHeight, { fit: "cover" })
      .toBuffer();
    composites.push({ input: image, left, top });
    composites.push({
      input: svg(
        cellWidth,
        labelHeight,
        `<rect width="${cellWidth}" height="${labelHeight}" fill="#11171D"/>
         <text x="${cellWidth / 2}" y="46" font-size="25" fill="#FFFFFF" text-anchor="middle" class="bold">${xml(entries[index].label)}</text>`,
      ),
      left,
      top: margin + 72,
    });
  }

  composites.push({
    input: svg(
      width - margin * 2,
      72,
      `<text x="0" y="48" font-size="36" fill="#11171D" class="heavy">${xml(title)}</text>`,
    ),
    left: margin,
    top: margin,
  });

  await sharp({
    create: { width, height, channels: 3, background: "#E9E6E0" },
  })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toFile(path.join(OUT, output));
}

async function makeBlurSheet(source, output) {
  await sharp(source).resize({ width: 1200 }).blur(12).jpeg({ quality: 88 }).toFile(output);
}

await fs.mkdir(OUT, { recursive: true });
const legacyBaselines = await writeLegacyBaselines();
await Promise.all([
  normalizeBaseline(
    legacyBaselines.call,
    "call-a-baseline.png",
    1080,
    1920,
  ),
  normalizeBaseline(
    legacyBaselines.comic,
    "comic-a-baseline.png",
    1080,
    1350,
  ),
  writeCallHybrid(),
  writeCallFaithful(),
  writeComicHybrid(),
  writeComicFaithful(),
]);

const callEntries = [
  { label: "REF 1 · 영상통화", path: REF_CALL },
  { label: "REF 2 · 전화형 훅", path: REF_PHONE },
  { label: "A · 현재 v3", path: path.join(OUT, "call-a-baseline.png") },
  { label: "B · 전화형 절충", path: path.join(OUT, "call-b-phone-editorial.png") },
  { label: "C · 통화 UI 충실", path: path.join(OUT, "call-c-reference-faithful.png") },
];
const comicEntries = [
  { label: "REF · 2패널 캐릭터", path: REF_COMIC },
  { label: "A · 현재 v3", path: path.join(OUT, "comic-a-baseline.png") },
  { label: "B · 풀블리드 절충", path: path.join(OUT, "comic-b-fullbleed-hybrid.png") },
  { label: "C · 2패널 충실", path: path.join(OUT, "comic-c-reference-faithful.png") },
];

await contactSheet(
  "comparison-call.jpg",
  "소규모 테스트 1 · 전화형 Story Cards",
  callEntries,
  270,
  480,
);
await contactSheet(
  "comparison-comic.jpg",
  "소규모 테스트 2 · 캐릭터 복귀 Story Cards",
  comicEntries,
  324,
  405,
);
await makeBlurSheet(
  path.join(OUT, "comparison-call.jpg"),
  path.join(OUT, "comparison-call-blur.jpg"),
);
await makeBlurSheet(
  path.join(OUT, "comparison-comic.jpg"),
  path.join(OUT, "comparison-comic-blur.jpg"),
);

const metrics = {
  method:
    "32×32 grayscale + strong blur structural distance. Lower is closer. Content identity differs, so this is a pre-check, not user validation.",
  call: {
    baseline: {
      toVideoCallReference: await blurredStructuralDistance(
        path.join(OUT, "call-a-baseline.png"),
        REF_CALL,
      ),
      toPhoneHookReference: await blurredStructuralDistance(
        path.join(OUT, "call-a-baseline.png"),
        REF_PHONE,
      ),
      mediaCoverage: 0.36,
      floatingSurfaceCount: 4,
    },
    hybrid: {
      toVideoCallReference: await blurredStructuralDistance(
        path.join(OUT, "call-b-phone-editorial.png"),
        REF_CALL,
      ),
      toPhoneHookReference: await blurredStructuralDistance(
        path.join(OUT, "call-b-phone-editorial.png"),
        REF_PHONE,
      ),
      mediaCoverage: 1,
      floatingSurfaceCount: 1,
    },
    faithful: {
      toVideoCallReference: await blurredStructuralDistance(
        path.join(OUT, "call-c-reference-faithful.png"),
        REF_CALL,
      ),
      toPhoneHookReference: await blurredStructuralDistance(
        path.join(OUT, "call-c-reference-faithful.png"),
        REF_PHONE,
      ),
      mediaCoverage: 1,
      floatingSurfaceCount: 0,
    },
  },
  comic: {
    baseline: {
      toReference: await blurredStructuralDistance(
        path.join(OUT, "comic-a-baseline.png"),
        REF_COMIC,
      ),
      mediaCoverage: 0.69,
      floatingSurfaceCount: 4,
    },
    hybrid: {
      toReference: await blurredStructuralDistance(
        path.join(OUT, "comic-b-fullbleed-hybrid.png"),
        REF_COMIC,
      ),
      mediaCoverage: 1,
      floatingSurfaceCount: 1,
    },
    faithful: {
      toReference: await blurredStructuralDistance(
        path.join(OUT, "comic-c-reference-faithful.png"),
        REF_COMIC,
      ),
      mediaCoverage: 1,
      floatingSurfaceCount: 0,
    },
  },
};

await fs.writeFile(
  path.join(OUT, "metrics.json"),
  `${JSON.stringify(metrics, null, 2)}\n`,
);

console.log(JSON.stringify({ outputDir: OUT, metrics }, null, 2));
