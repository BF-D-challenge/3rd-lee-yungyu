#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {
  INSTAGRAM_SAFE_AREAS,
  assertCriticalBox,
  safeRect,
} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/today-oldbrain-2026-07-28",
);
const SHARED_FONT_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/remaining-four-apps-2026-07-28/assets/fonts",
);
process.env.FONTCONFIG_FILE = path.join(SHARED_FONT_DIR, "fonts.conf");
const {default: sharp} = await import("sharp");

const WIDTH = 1080;
const HEIGHT = 1350;
const PROFILE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const SAFE = safeRect(PROFILE);
const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const FONT = "Pretendard, sans-serif";

const variants = [
  {
    id: "today-oldbrain-a-memo",
    reference: "U17 밈형 상황 + U1 거대 타이포",
    source: "today-a-negative-space-v2.png",
    lead: "그 아이디어,",
    hero: ["또 메모만 하고", "끝낼 거예요?"],
    accent: "#D8B47B",
    heroSize: 150,
    leadColor: "#F2DEC0",
    heroColor: "#F2DEC0",
    backdrop: "#172138",
    paletteReference: {
      source: "U1 CLASS101 거대 타이포",
      transfer: "검정 바탕과 밝은 거대 타이포의 대비 구조만 전이",
      colors: ["#172138", "#F2DEC0", "#D8B47B"],
      colorsSampledFrom: "today-a-negative-space-v2.png",
    },
  },
  {
    id: "today-oldbrain-b-first",
    reference: "U9 전후 비교",
    source: "today-b-negative-space-v2.png",
    lead: "다 만들기 전에,",
    hero: ["사람들이 누를지", "먼저 봐요."],
    accent: "#FFC2A7",
    heroSize: 170,
    leadColor: "#F3DFCF",
    heroColor: "#F3DFCF",
    backdrop: "#383740",
    paletteReference: {
      source: "U9 로켓툴즈 전후 비교표",
      transfer: "어두운 바탕과 두 상태의 명확한 강조 구조만 전이",
      colors: ["#383740", "#F3DFCF", "#FFC2A7"],
      colorsSampledFrom: "today-b-negative-space-v2.png",
    },
  },
  {
    id: "today-oldbrain-c-tomorrow",
    reference: "U1 거대 타이포 + U4 데이터 역설",
    source: "today-c-photoreal-mise-en-scene-v5.png",
    lead: "오늘 아이디어를 보내면,",
    hero: ["하루 뒤", "반응을 확인해요."],
    accent: "#EF9569",
    heroSize: 180,
    leadColor: "#F0CDAD",
    heroColor: "#F0CDAD",
    backdrop: "#192655",
    lightMode: false,
    paletteReference: {
      source: "U4 AppsFlyer 데이터 역설",
      transfer: "한 문장과 한 강조색으로 역설을 읽히는 구조만 전이",
      colors: ["#192655", "#F0CDAD", "#EF9569"],
      colorsSampledFrom: "today-c-photoreal-mise-en-scene-v5.png",
    },
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(body, width = WIDTH, height = HEIGHT) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );
}

function textUnits(text) {
  return [...text].reduce((total, character) => {
    if (/\s/.test(character)) return total + 0.34;
    if (/[,.?!]/.test(character)) return total + 0.46;
    return total + 1;
  }, 0);
}

function fittedSize(lines, requested, width = SAFE.width) {
  const maxUnits = Math.max(...lines.map(textUnits));
  return Math.min(requested, Math.floor(width / (maxUnits * 0.91)));
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function contrastReport(variant) {
  const pairs = [
    {role: "lead", foreground: variant.leadColor},
    {role: "hero", foreground: variant.heroColor},
    {role: "accent", foreground: variant.accent},
  ].map((pair) => ({
    ...pair,
    background: variant.backdrop,
    ratio: Number(
      contrastRatio(pair.foreground, variant.backdrop).toFixed(2),
    ),
  }));
  for (const pair of pairs) {
    if (pair.ratio < 4.5) {
      throw new Error(
        `${variant.id} ${pair.role} contrast ${pair.ratio}:1 is below WCAG AA 4.5:1`,
      );
    }
  }
  return pairs;
}

function snap8(value) {
  return Math.round(value / 8) * 8;
}

function overlayFor(variant) {
  const leadSize = fittedSize([variant.lead], 68);
  const heroSize = fittedSize(variant.hero, variant.heroSize);
  const leadY = snap8(PROFILE.insets.top + leadSize + 16);
  const lineAdvance = snap8(heroSize * 1.25);
  const blockGap = lineAdvance + 32;
  const heroFirstY = leadY + blockGap;
  const heroBottom = heroFirstY + (variant.hero.length - 1) * lineAdvance;
  const criticalBox = {
    x: SAFE.x,
    y: PROFILE.insets.top,
    width: SAFE.width,
    height: heroBottom - PROFILE.insets.top + 36,
  };
  assertCriticalBox(PROFILE, criticalBox, `${variant.id} headline`);

  const heroNodes = variant.hero
    .map((line, index) => {
      const y = heroFirstY + index * lineAdvance;
      const fill =
        index === variant.hero.length - 1
          ? variant.accent
          : variant.heroColor;
      return `<text x="${SAFE.x}" y="${y}"
        fill="${fill}" font-family="${FONT}" font-size="${heroSize}"
        font-weight="900" letter-spacing="${Math.round(heroSize * -0.045)}"
        >${escapeXml(line)}</text>`;
    })
    .join("\n");

  return svg(`
    <text x="${SAFE.x}" y="${leadY}" fill="${variant.leadColor}"
      font-family="${FONT}" font-size="${leadSize}" font-weight="900"
      letter-spacing="${Math.round(leadSize * -0.035)}"
      >${escapeXml(variant.lead)}</text>
    ${heroNodes}
  `);
}

async function renderVariant(variant) {
  const source = path.join(GENERATED_DIR, variant.source);
  const output = path.join(RENDER_DIR, `${variant.id}.png`);
  await sharp(source)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"})
    .composite([{input: overlayFor(variant)}])
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function makeContactSheet(outputs) {
  const cardWidth = 324;
  const cardHeight = 405;
  const gutter = 20;
  const header = 92;
  const captionHeight = 66;
  const width = cardWidth * 3 + gutter * 4;
  const height = header + cardHeight + captionHeight + gutter * 2;
  const composites = [];

  for (let index = 0; index < outputs.length; index += 1) {
    const left = gutter + index * (cardWidth + gutter);
    composites.push({
      input: await sharp(outputs[index])
        .resize(cardWidth, cardHeight, {fit: "cover"})
        .png()
        .toBuffer(),
      left,
      top: header,
    });
    composites.push({
      input: svg(
        `<text x="0" y="27" fill="#171A23" font-family="${FONT}"
          font-size="20" font-weight="900">${String.fromCharCode(65 + index)}안</text>
         <text x="0" y="52" fill="#6D6A66" font-family="${FONT}"
          font-size="15" font-weight="700">${escapeXml(variants[index].reference)}</text>`,
        cardWidth,
        captionHeight,
      ),
      left,
      top: header + cardHeight + 8,
    });
  }

  composites.push({
    input: svg(
      `<text x="${gutter}" y="38" fill="#171A23" font-family="${FONT}"
        font-size="31" font-weight="900">오늘 해볼까 · 구뇌 훅 3안</text>
       <text x="${gutter}" y="68" fill="#6D6A66" font-family="${FONT}"
        font-size="17" font-weight="700">다 만들기 전에, 광고로 먼저 반응을 확인한다</text>`,
      width,
      height,
    ),
  });

  const output = path.join(CAMPAIGN_DIR, "today-oldbrain-contact-sheet.png");
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#F3EEE7",
    },
  })
    .composite(composites)
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function main() {
  await fs.mkdir(RENDER_DIR, {recursive: true});
  const outputs = [];
  for (const variant of variants) {
    outputs.push(await renderVariant(variant));
  }
  const contactSheet = await makeContactSheet(outputs);
  const manifest = {
    generatedAt: new Date().toISOString(),
    product: "오늘 해볼까",
    status: "concept-only",
    publishable: false,
    primaryClaim:
      "다 만들기 전에 광고와 랜딩으로 사람들의 첫 반응을 확인한다.",
    format: PROFILE,
    safeRect: SAFE,
    typography: {
      family: "Pretendard ExtraBold",
      lineHeight: 1.25,
      hierarchyLevels: 2,
      grid: 8,
      smallToHeroGap:
        "각 시안의 큰 제목 줄 간격보다 32px 크게 설정하고 8px 그리드에 스냅",
      effects: {
        shadow: false,
        outline: false,
        glow: false,
        texture: false,
        gradientFill: false,
      },
      textLayer: "SVG code overlay",
    },
    imageLayer:
      "AI-generated scene only; no readable text, UI, screenshots, or metrics",
    variants: variants.map((variant, index) => ({
      id: variant.id,
      reference: variant.reference,
      lead: variant.lead,
      hero: variant.hero,
      paletteReference: variant.paletteReference,
      accessibility: {
        standard: "WCAG 2.x AA normal text threshold",
        minimumContrastRatio: 4.5,
        expectedNaturalNegativeSpaceColor: variant.backdrop,
        opaqueBackdropOverlay: false,
        contrastPairs: contrastReport(variant),
      },
      spacing: {
        gridPx: 8,
        heroLineAdvancePx: snap8(
          fittedSize(variant.hero, variant.heroSize) * 1.25,
        ),
        smallToHeroBaselineGapPx:
          snap8(fittedSize(variant.hero, variant.heroSize) * 1.25) + 32,
      },
      source: path.relative(ROOT, path.join(GENERATED_DIR, variant.source)),
      render: path.relative(ROOT, outputs[index]),
    })),
    contactSheet: path.relative(ROOT, contactSheet),
  };
  await fs.writeFile(
    path.join(CAMPAIGN_DIR, "render-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
